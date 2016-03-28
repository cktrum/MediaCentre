var database 	= require('mongoose'),
	q			= require('q')

var youtubeDB	= require('./youtubeDatabase.js')

var keyModel,
	lastCheckedModel,
	initialRetrievalInterval = 1000 * 60 * 60 * 24 * 7 * 4

/* 
 * Connect to the database
 */
console.log('Connecting to database...')
database.connect('mongodb://localhost/test3')
var db = database.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() {
  	console.log('database connected')
  	init()
  	youtubeDB.init(database)
})

/**
 ** Init all database models 
 **/
function init () {
	var keySchema = new database.Schema({
		_id: String,
		key: String,
		addedAt: { type: Date, default: Date.now },
	})
	keyModel = database.model('key', keySchema)
}

/**
 ** Update the timestamp when a certain channel was last checked
 ** @params: 	source 		- String
 **				channelID 	- String
 **/
exports.updateLastChecked = function (source, channelID) {
	if (source == 'youtube') {
		return youtubeDB.updateLastChecked(channelID)
	}
	else
		console.log('wrong source')
}

/**
 ** Save an API key to access an external API
 ** @params: 	souce 	- String
 **				key 	- String
 **/
exports.saveAPIKey = function (source, key) {
	var deferred = q.defer()

	keyModel.findByIdAndUpdate(source, { key: key }, {upsert: true}, function (err, affectedRows, raw) {
		if (err) {
			deferred.reject(err)
		} else {
			deferred.resolve(raw)
		}
	})

	return deferred.promise
}

/**
 ** Retrieve the API key for an external API
 ** @param: 	source	- String
 **/
exports.getAPIKey = function (source) {
	var deferred = q.defer()
	keyModel.findOne({_id: source} , function (err, result) {
		if (err) {
			deferred.reject(err)
		} else {
			deferred.resolve(result)
		}
	})

	return deferred.promise
}

/* #####################################################################
 * 								YOUTUBE
   ##################################################################### */

exports.getYoutubeChannels = function() {
	return youtubeDB.getYoutubeChannels()
}

exports.saveYoutubeChannel = function (id, username) {
	return youtubeDB.saveYoutubeChannel(id, username)
}

exports.removeYoutubeChannel = function (id) {
	return youtubeDB.removeYoutubeChannel(id)
}

exports.getYoutubeVideosForChannel = function (channel, limit, offset) {
	return youtubeDB.getYoutubeVideosForChannel(channel, limit, offset)
}

exports.saveYoutubeVideos = function (videos) {
	return youtubeDB.saveYoutubeVideos(videos)
}