var request 	= require('request'),
	q 			= require('q'),
	database 	= require('./database.js')

var searchTweetsBaseUrl = 'https://api.twitter.com/1.1/search/tweets.json',
	searchUsersBaseUrl = 'https://api.twitter.com/1.1/users/search.json',
	bearerToken = null

/* -------------------------------------------------------------
 *							OAUTH
 * ------------------------------------------------------------- */
exports.requestToken = function(req, res) {
	request.post({
		url: 'https://api.twitter.com/oauth/request_token',
		form: {
			oauth_callback: 'localhost:3000/api/twitter/auth/authenticate'
		}
	})
}

exports.authCallback = function (req, res) {
	if (req.statusCode == 200 && req.body.oauth_callback_confirmed) {
		var oauth_token = req.body.oauth_token
		var oauth_token_secret = req.body.oauth_token_secret

		path = 'https://api.twitter.com/oauth/authenticate?oauth_token=' + oauth_token

		res.set('Content-Type', 'application/json')
		res.send(JSON.stringify({ redirect: path }))
		res.end()
	}
}

exports.verifiedCallback = function (req, res) {

}

function authenticate() {
	var deferred = q.defer()
	if (!bearerToken) {
		database.getAPIKey('Twitter')
			.then(function (result) {
				bearerToken = result.key
				deferred.resolve()
			})
	} else {
		deferred.resolve()
	}

	return deferred.promise
}

function searchTweets(query) {
	var deferred = q.defer()

	authenticate()
		.then(function () {
			var params = {
				url: searchTweetsBaseUrl + 'q=' + query,
				headers: {
					'Authentication': 'Basic ' + bearerToken
				}
			}

			request(params, function (err, response, body) {
				if (err) {
					deferred.reject(err)
				} else {
					deferred.resolve(body)
				}
			})
		})

	return deferred.promise
}

function searchUsers(query) {
	var deferred = q.defer()

	authenticate()
		.then(function () {
			var params = {
				url: searchUsersBaseUrl,
				qs: {
					q: query,
					count: 10,
					page: 1
				},
				headers: {
					'Authentication': 'Basic ' + bearerToken
				}
			}

			request(params, function (err, response, body) {
				if (err) {
					deferred.reject(err)
				} else {
					deferred.resolve(body)
				}
			})
		})

	return deferred.promise
}

function searchTweetsById(id) {
	var deferred = q.defer()

	database.getTwitterQueryByID(id)
		.then(searchTweets)
		.then(function (result) {
			deferred.resolve(result)
		})
		.catch(function (err) {
			deferred.reject(err)
		})

	return deferred.promise
}

exports.searchTweetsForUser = function (req, res) {
	var queryID = req.query.id
	searchTweetsById(queryID)
		.then(function (result) {
			res.json(result).send()
		})
		.catch(function (err) {
			res.json(err).sendStatus(500)
		})
}

exports.searchTweetsForQuery = function (req, res) {
	var queryID = req.query.id
	searchTweetsById(queryID)
		.then(function (result) {
			res.json(result).send()
		})
		.catch(function (err) {
			res.json(err).sendStatus(500)
		})
}

exports.addUser = function (req, res) {
	var query = req.body.username

	database.addTwitterQuery(query)
		.then(function (id) {
			res.json(id).send()
		})
		.catch(function (err) {
			res.json(err).send()
		})
}

exports.addQuery = function (req, res) {
	var query = req.body.query

	database.addTwitterQuery(query)
		.then(function (id) {
			res.json(id).send()
		})
		.catch(function (err) {
			res.json(err).send()
		})
}

exports.searchUser = function (req, res) {
	var query = req.query.username

	searchUsers(query)
		.then(function (result) {
			var users = result.map(function (user) {
				return {
					name: user.name,
					screen_name: user.screen_name,
					id: user.id
				}
			})

			res.json(users).send()
		})
		.catch(function (err) {
			res.json(err).sendStatus(500)
		})
}