var database = require('./database.js'),
	q 		 = require('q'),
	btoa	 = require('btoa'),
	request  = require('request')

exports.saveKey = function(req, res) {
	var key = req.body.key
	var source = req.body.source

	if (source == 'Twitter') {
		if (key.bearer.key) {
			database.saveAPIKey(source, key.bearer, key.key, key.secret)
				.then(function (response) {
					res.json(response).send()
				})
				.catch(function (err) {
					res.json(err).sendStatus(500)
				})
		} else {
			obtainBearerToken(key.key, key.secret)
				.then(function (response) {
					res.json(response).send()
				})
				.catch(function (err) {
					res.json(err).sendStatus(500)
				})
		}
	} else {
		database.saveAPIKey(source, key)
			.then(function (response) {
				res.json(response).send()
			})
			.catch(function (err) {
				res.json(err).sendStatus(500)
			})
	}
}

exports.getKeys = function(req, res) {
	database.getKeys()
		.then(function (keys) {
			res.json(keys).send()
		})
		.catch(function (err) {
			res.json(err).sendStatus(500)
		})
}

/* -------------------------------------------------------------
 *			TWITTER APPLICATION-ONLY AUTHENTICATION
 * ------------------------------------------------------------- */

function obtainBearerToken (consumerKey, consumerSecret) {
	var deferred = q.defer()

	var credentials = encode(consumerKey, consumerSecret)
	issueBearerToken(credentials)
		.then(function (bearerToken) {
			saveBearerToken(bearerToken, consumerKey.key, consumerSecret.key)
				.then(function (bearerToken) {
					deferred.resolve(bearerToken)
				})
				.catch(deferred.reject)
		})
			
	return deferred.promise
}

function encode(consumerKey, consumerSecret) {
	consumerKey = encodeURIComponent(consumerKey.key)
	consumerSecret = encodeURIComponent(consumerSecret.key)
	var credentials = consumerKey + ':' + consumerSecret
	credentials = btoa(credentials)
	
	return credentials
}

function issueBearerToken (credentials) {
	var deferred = q.defer()

	var params = {
		'url': 'https://api.twitter.com/oauth2/token',
		'method': 'POST',
		'headers': {
			'Authorization': 'Basic ' + credentials,
			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
		},
		'body': 'grant_type=client_credentials'
	}

	request.post(params, function (err, response, body) {
		if (err || response.statusCode != 200) {
			console.log("error", err)
			deferred.reject(err)
		} else {
			body = JSON.parse(body)
			if (body.token_type == 'bearer') {
				var token = body.access_token
				deferred.resolve(token)
			} else {
				console.log('wrong token type')
				deferred.reject('wrong token type')
			}
		}
	})

	return deferred.promise
}

function saveBearerToken (access_token, consumerKey, consumerSecret) {
	var deferred = q.defer()

	database.saveAPIKey('Twitter', access_token, consumerKey, consumerSecret)
		.then(function () {
			deferred.resolve(access_token)
		})
		.catch(deferred.reject)

	return deferred.promise
}
