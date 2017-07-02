var express 			= require('express'),
	request				= require('request'),
	q 					= require('q')
var twitterManagement 	= require('./../backend/twitter.js')
var router 				= express.Router()

/* GET home page. */
router.get('/', function(req, res, next) {
	var params = {
		url: 'http://localhost:3000/api/twitter/auth/check'
	}

	request.get(params, function (err, response, body) {
		console.log(JSON.stringify(response.request, null, 2))
		if (response.request.headers.referer) {
			res.writeHead(302, {'Location': response.request.headers.referer})
			res.send()
		} else {
			res.render('mainpage', { title: 'One Blog' })
		}
	})
})

module.exports = router