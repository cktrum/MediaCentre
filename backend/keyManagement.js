var database = require('./database.js')

exports.saveKey = function(req, res) {
	var key = req.body.key
	var source = req.body.source
	database.saveAPIKey(source, key)
		.then(function (response) {
			res.json(response).send()
		})
}