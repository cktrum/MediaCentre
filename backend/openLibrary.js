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
			makeSearchAPICall(parameters, page + 1, result)
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
					publish_year: book.first_publish_year,
					isbns: book.isbn
				}
			})
			
			getBookDetails(books, 0, [])
				.then(function (result) {
					deferred.resolve(result)
				})
				.catch(function (error) {
					console.log(error)
					deferred.reject(error)
				})
		})
		.catch(deferred.reject)

	return deferred.promise
}

function getBookDetails(books, index, collectedBooks) {
	var deferred = q.defer()

	if (index >= books.length) {
		deferred.resolve(collectedBooks)
		return deferred.promise
	}

	if (!books[index].isbns) {
		getBookDetails(books, index+1, collectedBooks)
			.then(deferred.resolve)
			.catch(deferred.reject)
		return deferred.promise
	}

	var parameters = {
		url: booksURL,
		qs: {
			bibkeys: 'ISBN:' + books[index].isbns[0],
			jscmd: 'data',
			format: 'json'
		}
	}

	makeBookAPICall(parameters)
		.then(function (result) {
			for (book in result) {
				var details = {
					title: result[book].title ? result[book].title : null,
					authors: result[book].authors ? _.map(result[book].authors, function (author) {return author.name}) : null,
					url: result[book].url ? result[book].url : null,
					cover: result[book].cover ? result[book].cover.medium : null,
					publish_year: books[index].publish_year
				}
				collectedBooks.push(details)
			}

			getBookDetails(books, index+1, collectedBooks)
				.then(deferred.resolve)
				.catch(deferred.reject)
		})
		.catch(deferred.reject)

	return deferred.promise
}

searchBooksByAuthor('Janet Evanovich')
	.then(console.log)
//getBookDetails(9780375432033)
//	.then(console.log)