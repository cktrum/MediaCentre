var q	= require('q')

var twitterQueryModel

exports.init = function(database) {
	var twitterQuerySchema = new database.Schema({
		_id: Number,
		title: String,
		query: String,
		type: String,
		addedAt: { type: Date, default: Date.now }
	})
	twitterQueryModel = database.model('twitterQuery', twitterQuerySchema)
}

exports.addQuery = function (title, query, type) {
	var deferred = q.defer()
	
	var data = {
		title: title,
		query: query,
		type: type
	}

	var id = hashCode(type + query)

	twitterQueryModel.findByIdAndUpdate(id, data, {upsert: true}, function(err, post) {
		if (err) {
			deferred.reject(err)
		} else {
			deferred.resolve(id)
		}
	})

	return deferred.promise
}

exports.getQueryByID = function (queryID) {
	var deferred = q.defer()

	twitterQueryModel.findById(queryID, function (err, resp) {
		if (err || !resp) {
			deferred.reject(err)
		}

		var query = resp.query
		if (resp.type == 'user') {
			query = 'from:' + query
		}

		deferred.resolve(query)
	})

	return deferred.promise
}

exports.getSavedQueries = function (type) {
	var deferred = q.defer()

	twitterQueryModel.find({type: type})
		.exec(function (err, result) {
			if (err) {
				deferred.reject(err)
			} else {
				var queries = result.map(function (item) {
					return {
						'id': item['_id'],
						'title': item.title,
						'type': item.type,
						'query': item.query
					}
				})
				deferred.resolve(queries)
			}
		})

	return deferred.promise
}

exports.removeQuery = function (id, type) {
	var deferred = q.defer()

	twitterQueryModel.remove({_id: id}, function (err, resp) {
		if (err) {
			deferred.reject(err)
		} else {
			deferred.resolve(resp)
		}
	})
	
	return deferred.promise
}

function hashCode (str) {
    var hash = 0
    if (str.length == 0) 
    	return hash

    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i)
        hash = ((hash<<5)-hash) + char
        hash = hash & hash
    }
    
    return hash
}