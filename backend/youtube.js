var request 	= require('request'),
	q 			= require('q'),
	_ 			= require('lodash'),
	database	= require('./database.js')

var serverkey = null

/**
 ** Retrieve the channel ID given a channel name and save it to the database
 **/
function getChannelIdToUsername(username) {
	var deferred = q.defer()
	var parameters = {
		url: 'https://www.googleapis.com/youtube/v3/channels',
		qs: {
			part: 'id',
			forUsername: username,
			key: serverkey
		}
	}

	request(parameters, function (error, response, body) {
		if (response.statusCode == 200) {
			body = JSON.parse(body)
			if (body.pageInfo.totalResults > 1) {
				console.log('more than one channel found')
				deferred.reject('more than one channel found')
			}
			if (body.items && body.items.length > 0) {
				var id = body.items[0].id
				database.saveYoutubeChannel(id, username)
					.then(function (res) {
						deferred.resolve(id)
					})
					.catch(deferred.reject)
			} else {
				deferred.reject('no matches found')
			}
		} else {
			console.log('failed to get channel ID for ' + username, error)
			deferred.reject(error)
		}
	})

	return deferred.promise
}

/**
 ** Get all videos of a channel published after a given timestamp and page through the results
 ** @param: 	channelID 	- String
 **				date 		- Date in ISO Format
 ** 			resultSet 	- Array
 **				pageToken 	- String (initially set to 'null')
 **/
function getNewVideosOfChannel(channelId, date, limit, offset, resultSet, pageNumber, pageToken) {
	var deferred = q.defer()
	var resultsPerPage = 10
	var parameters = {
		url: 'https://www.googleapis.com/youtube/v3/search',
		qs: {
			part: 'id',
			channelId: channelId,
			order: 'date',
			publishedAfter: date,
			key: serverkey,
			maxResults: resultsPerPage
		}
	}

	if (pageToken) {
		parameters.qs.pageToken = pageToken
	}

	request(parameters, function (error, response, body) {
		if (response.statusCode == 200 || error) {
			body = JSON.parse(body)
			var ids = body.items.map(function (item) {
				return item.id.videoId
			})

			// check if current page has overlap with desired offset
			if (offset > pageNumber*resultsPerPage) {
				var left = offset - pageNumber*resultsPerPage
				// the whole page can be skipped
				if (left > resultsPerPage) {
					ids = []
				} else {
					// only parts of this page are relevant
					for (var i = 0; i < offset - pageNumber*resultsPerPage; i++) {
						ids.shift()
					}
				}
			}
			// page contains more result than wanted --> cut of the rest
			if (resultSet.length + ids.length > limit) {
				ids.splice(0, limit - resultSet.length)
			}
			resultSet = resultSet.concat(ids)

			if (body.items.length == body.pageInfo.resultsPerPage && resultSet.length < limit) {
				var pageToken = body.nextPageToken
				getNewVideosOfChannel(channelId, date, limit, offset, resultSet, pageNumber+1, pageToken)
					.then(deferred.resolve)
					.catch(deferred.reject)
			} else {
				deferred.resolve(resultSet)
			}
		} else {
			console.log("retrieving channel videos failed", response.statusCode, error)
		}
	})

	return deferred.promise
}

/**
 ** Retrieves all new videos from the channel
 ** @param: 	username 	- String
 **/
function getVideosOfChannelByUsername(username)
{
	var deferred = q.defer()

	getChannelIdToUsername(username)
	.then(function (channelId) {
		if (channelId) {
			var today = new Date()
			var lastWeek = today - 1000 * 60 * 60 * 24 * 7 * 2
			var isoDate = (new Date(lastWeek)).toISOString()
			getNewVideosOfChannel(channelId, isoDate, [], 1)
			.then(function (ids) {
				getVideosById(ids)
				.then (deferred.resolve)
			})
		} else {
			deferred.resolve({})
		}
	})

	return deferred.promise
}

/**
 ** Get all video details given their IDs
 ** @param: 	ids 	- Array
 **/
function getVideosById(ids)
{
	var deferred = q.defer()

	idString = ids.join(',')
	var parameters = {
		url: 'https://www.googleapis.com/youtube/v3/videos',
		qs: {
			part: 'id,snippet',
			id: idString,
			key: serverkey
		}
	}

	request(parameters, function (error, response, body) {
		if (response.statusCode == 200) {
			body = JSON.parse(body)
			var items = body.items.map(function (item) {
				return {
					id: item.id,
					title: item.snippet.title,
					publishedAt: item.snippet.publishedAt,
					thumbnail: item.snippet.thumbnails.default.url,
					url: 'https://youtube.com/watch?v=' + item.id,
					channel: item.snippet.channelId,
					channelName: item.channelTitle
				}
			})
			deferred.resolve(items)
		} else {
			deferred.reject(error)
		}
	})

	return deferred.promise
}

/**
 **	Save videos for a certain channel
 ** @param: 	videos 	- Array
 **				channel - String
 **/
function saveVideos(videos, channel) {
	var deferred = q.defer()

	var formattedVideos = videos.map(function (video) {
		return {
			_id: video.id,
			title: video.title,
			publishedAt: video.publishedAt,
			thumbnail: video.thumbnail,
			url: video.url,
			channel: channel._id,
			channelName: channel.username
		}
	})

	if (formattedVideos.length > 0) {
		database.saveYoutubeVideos(formattedVideos)
			.then(function (res) {
				
				database.updateLastChecked('youtube')
					.then(deferred.resolve)
					.catch(deferred.reject)
			})
			.catch(deferred.reject)
	} else {
		deferred.resolve()
	}

	return deferred.promise
}

function getVideoForChannel(channel, limit, offset) {
	var deferred = q.defer()

	var timestamp = Date.now() - 1000 * 60 * 60 * 24 * 7 * 4
	if (channel.lastChecked)
		timestamp = channel.lastChecked

	timestamp = new Date(timestamp).toISOString()

	getNewVideosOfChannel(channel._id, timestamp, limit, offset, [], 1)
		.then(getVideosById)
		.then(function (videos) {
			database.updateLastChecked('youtube', channel._id)
				.then(function () {
					saveVideos(videos, channel)
						.then(function (result) {
							deferred.resolve({
								videos: videos,
								channel: channel.username
							})
						})
						.catch(function (err) {
							deferred.reject(err)
						})
				})
				.catch(function (err) {
					deferred.reject(err)
				})
			})
		.catch(deferred.reject)

	return deferred.promise
}

/**
 ** Get all newly published videos for the specified channels
 ** @param: 	channels 	- Array
 **/
function getVideosOfChannels(channels, limit, offset) {
	var deferred = q.defer()
	var promises = []
	var videos = {}

	for (index in channels) {
		var channel = channels[index]
		promises.push(
			getVideoForChannel(channel, limit, offset)
				.then(function (result) {
					videos[result.channel] = result.videos
				})
				.catch(function (err) {})
		)
	}

	q.allSettled(promises)
		.then(function () {
			deferred.resolve(videos)
		})
		.catch(function (err) {
			deferred.reject(err)
		})

	return deferred.promise
}

function channelsForQuery(query) {
	var deferred = q.defer()

	var parameters = {
		url: 'https://www.googleapis.com/youtube/v3/search',
		qs: {
			part: 'id,snippet',
			q: query,
			type: 'channel',
			key: serverkey
		}
	}

	request(parameters, function (error, response, body) {
		if (response.statusCode == 200) {
			body = JSON.parse(body)
			var channels = body.items.map(function (item) {
				if (item.id.kind == 'youtube#channel')
					return {
						id: item.id.channelId,
						name: item.snippet.channelTitle
					}
			})
			deferred.resolve(channels)
		} else {
			console.log("error", response.statusCode, error)
			deferred.reject(error)
		}
	})

	return deferred.promise
}

exports.getNewVideos = function(req, res) {
	var limit = req.query.limit
	var offset = req.query.offset
	var channelID = req.query.channelID

	database.getAPIKey('youtube')
		.then(function (result) {
			serverkey = result.key

			database.getYoutubeChannels([channelID])
				.then(function (result) {
					getVideosOfChannels(result, limit, offset)
						.then(function (videos) {
							res.json(videos).send()
						})
						.catch(function (err) {
							res.json(err).sendStatus(500)
						})
				})
		})
}

function retrieveVideosForChannel(id, limit, offset) {
	var deferred = q.defer()

	database.getYoutubeVideosForChannel(id, limit, offset)
		.then(deferred.resolve)
		.catch(deferred.reject)

	return deferred.promise
}

function promisesToRetrieveVideosForChannels(limit, offset, channel) {
	var deferred = q.defer()
	var promises = []

	if (!channel) {
		database.getYoutubeChannels()
			.then(function (channels) {
				var allVideos = {}
				for (var channel in channels) {
					var id = channels[channel]._id
					promises.push(retrieveVideosForChannel(id, limit, offset))
				}
				deferred.resolve(promises)
			})
			.catch(function (err) {
				deferred.reject(err)
			})
	} else {
		promises.push(retrieveVideosForChannel(channel, limit, offset))
		deferred.resolve(promises)
	}

	return deferred.promise
}

exports.getOldVideos = function(req, res) {
	var limit = req.query.limit
	var offset = req.query.offset
	var channelID = req.query.channelID

	promisesToRetrieveVideosForChannels(limit, offset, channelID)
		.then(function (promises) {
			q.allSettled(promises)
				.then(function (result) {
					var videos = {}
					for (var index in result) {
						var channel = result[index].value
						videos[channel.name] = channel.videos
					}
					res.json(videos).send()
				})
				.catch(function (err) {
					res.json(err).sendStatus(500)
				})
		})
		.catch(function (err) {
			res.json(err).sendStatus(500)
		})	
}

exports.addChannel = function(req, res) {
	var id = req.body.id
	var name = req.body.name
	console.log(id, name)
	database.saveYoutubeChannel(id, name)
		.then(function (response) {
			res.sendStatus(200)
		})
		.catch(function (err) {
			res.json(err).sendStatus(500)
		})
}

exports.removeChannel = function(req, res) {
	var channel = req.query.id
	database.removeYoutubeChannel(channel)
		.then(function (response) {
			res.sendStatus(200)
		})
		.catch(function (err) {
			res.json(err).sendStatus(500)
		})
}

exports.saveKey = function(req, res) {
	var key = req.body.key
	var source = 'youtube'
	database.saveAPIKey(source, key)
		.then(function (response) {
			res.json(response).send()
		})
}

exports.searchChannel = function(req, res) {
	if (!serverkey) {
		database.getAPIKey('youtube')
		.then(function (result) {
			serverkey = result.key

			var query = req.query.query
			channelsForQuery(query)
				.then(function (response) {
					res.json(response).send()
				})
				.catch(function (err) {
					res.json(err).sendStatus(500)
				})
		})
	} else {
		var query = req.query.query
		channelsForQuery(query)
			.then(function (response) {
				res.json(response).send()
			})
			.catch(function (err) {
				res.json(err).sendStatus(500)
			})
	}
	
}