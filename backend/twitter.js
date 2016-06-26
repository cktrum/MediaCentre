var request 	= require('request'),
	q 			= require('q'),
	database 	= require('./database.js')

var searchBaseUrl = 'https://api.twitter.com/1.1/search/tweets.json'

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

function tweetsByUser(username) {
	
	var params = {
		url: searchBaseUrl + 'q=@' + username
	}
}