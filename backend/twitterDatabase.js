var q	= require('q')

var twitterQueryModel

exports.init = function(database) {
	var twitterQuerySchema = new database.Schema({
		_id: Number,
		query: String,
		type: String,
		addedAt: { type: Date, default: Date.now }
	})
	twitterQueryModel = database.model('twitterQuery', twitterQuerySchema)
}

exports.addQuery = function (query, type) {
	var deferred = q.defer()
	var data = {
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

		deferred.resolve(resp.query)
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
				console.log(JSON.stringify(result, null, 2))
				var queries = result.map(function (item) {
					return {
						'id': item['_id'],
						'type': item.type,
						'query': item.query
					}
				})
				console.log(JSON.stringify(queries, null, 2))
				deferred.resolve(queries)
			}
		})

	return deferred.promise
}

exports.removeQuery = function (id, type) {
	var deferred = q.defer()

	twitterQueryModel.findOneAndRemove({_id: id, type: type}, function (err, resp) {
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