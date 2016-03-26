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
exports.removeYoutubeChannel = function (name) {
	var deferred = q.defer()
	var promises = [
		channelModel.findOneAndRemove({username: name}, function (err, resp) {
			if (err) {
				deferred.reject(err)
			} else {
				deferred.resolve(resp)
			}
		}),

		youtubeVideoModel.remove({channelName: name}, function (err, resp) {
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
exports.getYoutubeChannels = function() {
	var deferred = q.defer()

	channelModel.find(function (err, result) {
		if (err) {
			deferred.reject(err)
		} else {
			deferred.resolve(result)
		}
	})

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
 **/ 
exports.getYoutubeVideos = function() {
	var deferred = q.defer()

	youtubeVideoModel.find()
		.sort({channelName: 1, publishedAt: -1})
		.exec(function (err, result) {
		if (err) {
			deferred.reject(err)
		} else {
			deferred.resolve(result)
		}
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
			console.log(JSON.stringify(post, null, 2))
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