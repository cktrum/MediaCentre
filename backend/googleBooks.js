var request 	= require('request'),
	q			= require('q'),
	_			= require('lodash'),
	database	= require('./database.js')

var baseUrl = 'https://www.googleapis.com/books/v1/',
	authKey = null

function getAuthKey() {
	var deferred = q.defer()

	database.getAPIKey('GoogleBooks')
		.then(function (key) {
			authKey = key.key
			deferred.resolve()
		})
		.catch(deferred.reject)

	return deferred.promise
}

function searchByAuthor (author, result, page) {
	var deferred = q.defer()
	var perPage = 40

	getAuthKey()
		.then(function () {
			var parameters = {
				url: baseUrl + 'volumes',
				qs: {
					q: author,
					orderBy: 'relevance',
					key: authKey,
					langRestrict: 'en',
					maxResults: perPage,
					startIndex: page,
					fields: 'items(id,volumeInfo(authors,description,imageLinks,industryIdentifiers/identifier,language,publishedDate,title))',
					showPreorders: true
				}
			}

			request(parameters, function (error, response, body) {
				if (response.statusCode == 200) {
					body = JSON.parse(body)
					if (body.items && body.items.length > 0) {
						var items = _.map(body.items, function (item) {
							var thumbnail = undefined
							if (item.volumeInfo.imageLinks && item.volumeInfo.imageLinks.smallThumbnail) {
								thumbnail = item.volumeInfo.imageLinks.smallThumbnail
							} else if (item.volumeInfo.imageLinks && item.volumeInfo.imageLinks.thumbnail) {
								thumbnail = item.volumeInfo.imageLinks.thumbnail
							}

							var pubDate = undefined
							if (item.volumeInfo.publishedDate)
								pubDate = new Date(item.volumeInfo.publishedDate).toISOString()

							return {
								id: item.id,
								title: item.volumeInfo.title,
								authors: item.volumeInfo.authors,
								pubDate: pubDate,
								description: item.volumeInfo.description,
								isbn: item.volumeInfo.industryIdentifiers && item.volumeInfo.industryIdentifiers.length > 0 ? item.volumeInfo.industryIdentifiers[0].identifier : undefined,
								thumbnail: thumbnail,
								language: item.volumeInfo.language,
								preorder: pubDate && new Date(pubDate).getTime() > Date.now() ? true: false
							}
						})

						result = result.concat(items)

						searchByAuthor(author, result, page + perPage)
							.then(deferred.resolve)
							.catch(deferred.reject)
					} else {
						deferred.resolve(result)
					}
				} else {
					deferred.reject(error)
				}
			})
		})

	return deferred.promise
}

function booksForAuthor(author) {
	var deferred = q.defer()

	searchByAuthor(author, [], 0)
		.then(function (books) {
			database.saveBooks(author, books)
				.then(function () {
					deferred.resolve({author: author, books: books})
				})
				.catch(deferred.reject)
		})
		.catch(deferred.reject)

	return deferred.promise
}

exports.getByAuthor = function (req, res) {
	var offset = 0, preorder = true, published = true, limit = Infinity
	if (req.query.offset)
		offset = req.query.offset
	if (req.query.preorder)
		preorder = req.query.preorder
	if (req.query.published)
		published = req.query.published
	if (req.query.limit)
		limit = req.query.limit
	var author = req.query.author
	
	database.getBooksForAuthor(author, offset, limit, preorder, published)
		.then(function (books) {
			res.json(books).send()
		})
		.catch(function (err) {
			res.json(err).sendStatus(500)
		})
}

exports.getAllBooks = function (req, res) {
	var offset = 0, preorder = true, published = true, limit = Infinity
	if (req.query.offset)
		offset = req.query.offset
	if (req.query.preorder)
		preorder = req.query.preorder
	if (req.query.published)
		published = req.query.published
	if (req.query.limit)
		limit = req.query.limit

	database.getAllBooks(offset, limit, preorder, published)
		.then(function (allBooks) {
			res.json(allBooks).send()
		})
		.catch(function (err) {
			res.json(err).sendStatus(500)
		})
}

exports.refresh = function (req, res) {
	database.getAllSearchedAuthors()
		.then(function (authors) {
			var promises = []
			for (var i = 0; i < authors.length; i++) {
				promises.push(booksForAuthor(authors[i]))
			}

			q.allSettled(promises)
				.then(function (results) {
					var preorder = {}
					var published = {}
					for (var i = 0; i < results.length; i++) {
						var item = results[i].value
						for (var j = 0; j < item.books.length; j++) {
							if (item.books[j].preorder) {
								if (!preorder[item.author])
									preorder[item.author] = []
								preorder[item.author] = preorder[item.author].concat(item.books[j])
							} else {
								if (!published[item.author])
									published[item.author] = []
								published[item.author] = published[item.author].concat(item.books[j])
							}
						}
					}
					res.json({preorder: preorder, published: published}).send()
				})
				.catch(function (err) {
					res.json(err).sendStatus(500)
				})
		})
}

exports.addNewAuthor = function (req, res) {
	var author = req.body.author

	database.saveAuthor(author)
		.then(function () {
			res.sendStatus(200)
		})
		.catch(function (err) {
			res.json(err).sendStatus(500)
		})
}

exports.deleteAuthorAndAllBooks = function (req, res) {
	var author = req.query.author

	database.deleteAuthorAndBooks(author)
		.then(function () {
			res.sendStatus(200)
		})
		.catch(function (err) {
			res.json(err).sendStatus(500)
		})
}