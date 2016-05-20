var request = require('request'),
	q		= require('q'),
	_		= require('lodash')

var searchURL = 'http://openlibrary.org/search.json',
	booksURL  = 'https://openlibrary.org/api/books'

function makeSearchAPICall(parameters, page, result) {
	var deferred = q.defer()

	parameters.qs['page'] = page

	request(parameters, function (error, response, body) {
		if (error || response.statusCode != 200) {
			deferred.reject(error)
		}

		body = JSON.parse(body)
		result = result.concat(body.docs)

		if (body.num_found > result.length) {
			makeAPICall(parameters, page + 1, result)
				.then(deferred.resolve)
				.catch(deferred.reject)
		} else {
			deferred.resolve(result)
		}
	})

	return deferred.promise
}

function makeBookAPICall(parameters) {
	var deferred = q.defer()

	request(parameters, function (error, response, body) {
		if (error || response.statusCode != 200) {
			deferred.reject(error)
		}

		body = JSON.parse(body)
		deferred.resolve(body)
	})

	return deferred.promise
}

function searchBooksByAuthor(author) {
	var deferred = q.defer()
	var parameters = {
		url: searchURL,
		qs: {
			author: author
		}
	}

	makeSearchAPICall(parameters, 1, [])
		.then(function (result) {
			var books = _.map(result, function (book) {
				return {
					authors: book.author_name,
					title: book.title,
					publish_year: book.first_publish_year
				}
			})

			deferred.resolve(books)
			
		})
		.catch(deferred.reject)

	return deferred.promise
}

function getBookDetails(isbn) {
	var deferred = q.defer()

	var parameters = {
		url: booksURL,
		qs: {
			bibkeys: 'ISBN:' + isbn,
			jscmd: 'data',
			format: 'json'
		}
	}

	makeBookAPICall(parameters)
		.then(function (result) {
			var books = []
			for (book in result) {
				var details = {
					title: result[book].title,
					authors: _.map(result[book].authors, function (author) {return author.name}),
					url: result[book].url,
					cover: result[book].cover.medium
				}
				books.push(details)
			}
			deferred.resolve(books)
		})
		.catch(deferred.reject)

	return deferred.promise
}

//searchBooksByAuthor('Janet Evanovich')
getBookDetails(9780375432033)
	.then(console.log)