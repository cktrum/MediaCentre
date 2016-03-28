var q	= require('q')

var youtubeVideoModel,
	channelModel,
	initialRetrievalInterval = 1000 * 60 * 60 * 24 * 7 * 4

/**
 ** Init all necessary database models for youtube
 ** @param: 	database 	- database connection
 **/ 
exports.init = function(database) {
	var youtubeVideoSchema = new database.Schema({
		_id: String,
		title: String,
		publishedAt: Date,
		thumbnail: String,
		url: String,
		channel: String,
		channelName: String,
		seen: { type: Boolean, default: false },
		crawled: { type: Date, default: Date.now }
	})
	youtubeVideoModel = database.model('youtubeVideo', youtubeVideoSchema)

	var channelSchema = new database.Schema({
		_id: String,
		username: String,
		lastChecked: Date
	})
	channelModel = database.model('channel', channelSchema)
}

/**
 **	Save a youtube channel
 ** @param: 	id 			- String
 ** 			username	- String
 **/
exports.saveYoutubeChannel = function (id, username) {
	var deferred = q.defer()
	var data = {
		username: username,
		lastChecked: Date.now() - initialRetrievalInterval
	}

	channelModel.findByIdAndUpdate(id, data, { upsert: true }, function (err, affectedRows, raw) {
		if (err) {
			deferred.reject(err)
		} else {
			deferred.resolve(raw)
		}
	})

	return deferred.promise
}

/**
 **	Remove a channel from the database with all videos of that channel
 ** @param: 	name 	- String
 **/
exports.removeYoutubeChannel = function (id) {
	var deferred = q.defer()
	var promises = [
		channelModel.findOneAndRemove({_id: id}, function (err, resp) {
			if (err) {
				deferred.reject(err)
			} else {
				deferred.resolve(resp)
			}
		}),

		youtubeVideoModel.remove({channel: id}, function (err, resp) {
			if (err) {
				deferred.reject(err)
			} else {
				deferred.resolve(resp)
			}
		})
	]

	q.allSettled(promises)
		.then(deferred.resolve)
		.catch(deferred.reject)

	return deferred.promise
}

/**
 ** Get all saved youtube channels
 **/
exports.getYoutubeChannels = function(ids) {
	var deferred = q.defer()
	if (ids && ids.length > 0) {
		console.log(ids)
		channelModel.find()
			.where('_id').in(ids).ne(null)
			.exec(function (err, result) {
			if (err) {
				deferred.reject(err)
			} else {
				deferred.resolve(result)
			}
		})
	} else {
		channelModel.find()
			.where('_id').ne(null)
			.exec(function (err, result) {
			if (err) {
				deferred.reject(err)
			} else {
				deferred.resolve(result)
			}
		})
	}


	return deferred.promise
}

/**
 ** Update the timestamp the channel was last checked
 ** @param: 	channelID	- String
 **/
exports.updateLastChecked = function (channelID) {
	var deferred = q.defer()

	channelModel.findByIdAndUpdate(channelID, { lastChecked: Date.now() }, function (err, affectedRows, raw) {
		if (err) {
			deferred.reject(err)
		} else {
			deferred.resolve(raw)
		}
	})

	return deferred.promise
}

/**
 **	Get all saved youtube videos sorted by channel and publishing date
 ** Each channel has the same limit and offset
 **/ 
exports.getYoutubeVideosForChannel = function(channel, limit, offset) {
	var deferred = q.defer()

	channelModel.findById(channel, function (err, resp) {
		if (err || !resp) {
			deferred.reject(err)
		}

		if (!resp.username) {
			deferred.reject('channel ID ' + channel + 'not found')
			return
		}

		var channelName = resp.username
		limit = parseInt(limit)
		offset = parseInt(offset)

		youtubeVideoModel.find({channel: channel})
			.skip(offset)
			.limit(limit)
			.sort({publishedAt: -1})
			.exec(function (err, result) {
			if (err) {
				deferred.reject(err)
			} else {
				var response = {
					name: channelName,
					videos: result
				}
				deferred.resolve(response)
			}
		})
	})


	return deferred.promise
}

function saveSingleVideo(video) {
	var deferred = q.defer()
	var id = video._id
	delete video['_id']

	youtubeVideoModel.findByIdAndUpdate(id, video, {upsert: true}, function(err, post) {
		if (err) {
			deferred.reject(err)
		} else {
			deferred.resolve(post)
		}
	})
	
	return deferred.promise
}

/**
 ** Save newly retrieved youtube videos
 ** @param: 	videos 	- Array
 **/
exports.saveYoutubeVideos = function(videos) {
	var deferred = q.defer()
	var promises = []

	for (index in videos) {
		var video = videos[index]
		promises.push(saveSingleVideo(video))
	}

	q.allSettled(promises)
		.then(deferred.resolve)
		.catch(deferred.reject)

	return deferred.promise
}