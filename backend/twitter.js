var request 	= require('request'),
	q 			= require('q'),
	qs			= require('qs'),
	database 	= require('./database.js')

var searchTweetsBaseUrl = 'https://api.twitter.com/1.1/search/tweets.json',
	searchUsersBaseUrl = 'https://api.twitter.com/1.1/users/search.json',
	bearerToken = null,
	consumerKey = null,
	consumerSecret = null,
	oauthToken = null,
	oauthSecret = null

/* -------------------------------------------------------------
 *							OAUTH
 * ------------------------------------------------------------- */
exports.requestToken = function(req, res) {
	authenticate()
		.then(function () {
			params = {
				url: 'https://api.twitter.com/oauth/request_token',
				oauth: {
					callback: 'http://localhost:3000/api/twitter/auth/authenticate',
					consumer_key: consumerKey,
					consumer_secret: consumerSecret
				}
			}

			request.post(params, function (err, response, body) {
				body = qs.parse(body)

				if (err || response.statusCode != 200) {
					console.log("error", err)
				} else if (body.oauth_callback_confirmed != "true") {
					console.log("callback not confirmed")
				} else {
					var token = body.oauth_token
					oauthSecret = body.token_secret

					path = 'https://api.twitter.com/oauth/authenticate?oauth_token=' + token
					
					res.writeHead(302, {'Location': path})
					res.end()
				}
			})
		})	
}

exports.authCallback = function (req, res) {
	var token = req.query.oauth_token
	var verifier = req.query.oauth_verifier
	
	var params = {
		url: 'https://api.twitter.com/oauth/access_token',
		oauth: {
			token: token,
			token_secret: oauthSecret,
			verifier: verifier
		}
	}

	request.post(params, function (err, response, body) {
		if (err || response.statusCode != 200)
		{
			console.log(err)
		} else {
			body = qs.parse(body)
			oauthToken = body.oauth_token
			oauthSecret = body.oauth_token_secret
		}
		res.redirect('http://localhost:3000/#/settings')
	})
}


function authenticate() {
	var deferred = q.defer()
	if (!bearerToken) {
		database.getAPIKey('Twitter')
			.then(function (result) {
				bearerToken = result.key
				consumerKey = result.consumerKey
				consumerSecret = result.consumerSecret
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
				url: searchTweetsBaseUrl + '?q=' + encodeURIComponent(query),
				oauth: {
					consumer_key: consumerKey,
					consumer_secret: consumerSecret,
					token: oauthToken,
					token_secret: oauthSecret
				}
			}

			request(params, function (err, response, body) {
				if (err) {
					deferred.reject(err)
				} else {
					body = JSON.parse(body)
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
				oauth: {
					consumer_key: consumerKey,
					consumer_secret: consumerSecret,
					token: oauthToken,
					token_secret: oauthSecret
				}
			}

			request(params, function (err, response, body) {
				if (err) {
					deferred.reject(err)
				} else {
					body = JSON.parse(body)
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
	query = 'from:' + query

	database.addTwitterQuery(query, 'user')
		.then(function (id) {
			res.json(id).send()
		})
		.catch(function (err) {
			res.json(err).send()
		})
}

exports.addQuery = function (req, res) {
	var query = req.body.query

	database.addTwitterQuery(query, 'topic')
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

exports.getUsers = function (req, res) {
	database.getSavedTwitterQueries('user')
		.then(function (result) {
			res.json(result).send()
		})
		.catch(function (err) {
			res.json(err).send()
		})
}

exports.getTopics = function (req, res) {
	database.getSavedTwitterQueries('topic')
		.then(function (result) {
			res.json(result).send()
		})
		.catch(function (err) {
			res.json(err).send()
		})
}

exports.removeUser = function (req, res) {
	var id = req.query.id

	database.removeTwitterQuery(id, 'user')
		.then(function (resp) {
			res.sendStatus(200)
		})
		.catch(function (err) {
			res.json(err).send()
		})
}

exports.removeTopic = function (req, res) {
	var id = req.query.id

	database.removeTwitterQuery(id, 'topic')
		.then(function (resp) {
			res.sendStatus(200)
		})
		.catch(function (err) {
			res.json(err).send()
		})
}