var database = require('./database.js')

exports.saveKey = function(req, res) {
	var key = req.body.key
	var source = req.body.source
	database.saveAPIKey(source, key)
		.then(function (response) {
			res.json(response).send()
		})
		.catch(function (err) {
			res.json(err).sendStatus(500)
		})
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