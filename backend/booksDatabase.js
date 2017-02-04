var q	= require('q'),
	_ 	= require('lodash')

var bookModel,
	authorModel

exports.init = function(database) {
	var authorSchema = new database.Schema({
		_id: String,
		lastChecked: { type: Date, default: Date.now }
	})
	authorModel = database.model('author', authorSchema)

	var bookSchema = new database.Schema({
		_id: String,
		searchedAuthor: String,
		title: String,
		authors: [String],
		pubDate: Date,
		description: String,
		isbn: String,
		thumbnail: String,
		language: String,
		preorder: Boolean,
		seen: { type: Boolean, default: false },
		crawled: { type: Date, default: Date.now }
	})
	bookModel = database.model('book', bookSchema)

}

function bookExists(id) {
	var deferred = q.defer()

	bookModel.count({ _id: id }, function (err, count) {
		if (err) {
			deferred.reject(err)
		} else {
			deferred.resolve(count > 0 ? true : false)
		}
	})

	return deferred.promise
}

function saveBook(book, authorObject) {
	var deferred = q.defer()
	bookExists(book.id)
		.then(function (exists) {
			if (!exists) {
				var bookItem = new bookModel({
					_id: book.id,
					searchedAuthor: authorObject._id,
					title: book.title,
					authors: book.authors,
					pubDate: book.pubDate,
					description: book.description,
					isbn: book.isbn,
					thumbnail: book.thumbnail,
					language: book.language,
					preorder: book.preorder,
				})

				bookItem.save(function (err) {
					if (err) {
						deferred.reject(err)
					} else {
						deferred.resolve()
					}
				})
			} else {
				bookModel.findByIdAndUpdate(book.id, {seen: true}, function (err, post) {
					if (err) {
						deferred.reject(err)
					} else {
						deferred.resolve()
					}
				})
			}
		})

	return deferred.promise
}

exports.saveBooks = function (searchTerm, books) {
	var deferred = q.defer()
	var promises = []

	getAuthor(searchTerm)
		.then(function (authorObject) {
			for (var i = 0; i < books.length; i++) {
				var book = books[i]
				promises.push(saveBook(book, authorObject))
			}

			q.allSettled(promises)
				.then(function () {
					deferred.resolve()
				})
				.catch(deferred.reject)
		})
		.catch(deferred.reject)


	return deferred.promise
}

exports.saveAuthor = function (author) {
	var deferred = q.defer()

	author = author.toLowerCase()
	authorModel.count({_id: author}, function(err, count) {
		if (err) {
			deferred.reject(err)
		} else if (count == 0) {
			var newAuthor = new authorModel({
				_id: author,
				lastChecked: Date.now()
			})

			newAuthor.save(function (err) {
				if (err) {
					deferred.reject(err)
				} else {
					deferred.resolve()
				}
			})
		} else {
			deferred.resolve()
		}
	})

	return deferred.promise
}

function getAuthor(author) {
	var deferred = q.defer()

	author = author.toLowerCase()
	authorModel.findOne({_id: author}, function (err, result) {
		if (err) {
			deferred.reject(err)
		} else {
			deferred.resolve(result)
		}
	})

	return deferred.promise
}

exports.getAllBooks = function (offset, limit, preorder, published) {
	var deferred = q.defer()
	var promises = []

	exports.getAllSearchedAuthors()
		.then(function (authors) {
			for (var i = 0; i < authors.length; i++) {
				var author = authors[i]
				promises.push(exports.getBooksForAuthor(author, offset, limit, preorder, published))
			}

			q.allSettled(promises)
				.then(function (results) {
					var allBooks = {}
					for (var i = 0; i < results.length; i++) {
						var books = results[i].value
						if (books.length > 0) {
							var author = books[0].searchedAuthor
							allBooks[author] = books
						}
					}
					deferred.resolve(allBooks)
				})
				.catch(deferred.reject)
		})
		.catch(deferred.reject)

	return deferred.promise
}

exports.deleteAuthorAndBooks = function (author) {
	var deferred = q.defer()

	getAuthor(author)
		.then(function (authorObject) {
			bookModel.remove({searchedAuthor: authorObject._id}, function (err, res) {
				if (err) {
					deferred.reject(err)
				} else {
					authorModel.remove({_id: authorObject._id}, function (err, res) {
						if (err) {
							deferred.reject(err)
						} else {
							deferred.resolve()
						}
					})
				}
			})
		})
		.catch(deferred.reject)

	return deferred.promise
}

exports.getBooksForAuthor = function (author, offset, limit, preorder, published) {	
	var deferred = q.defer()
	getAuthor(author)
		.then(function (authorObject) {
			if (preorder == false && published == false) {
				deferred.resolve([])
			} else if (preorder == true && published == true){
				bookModel.find()
					.where('searchedAuthor').equals(authorObject._id)
					.skip(offset)
					.limit(limit)
					.sort({'pubDate': -1})
					.exec(function (err, result) {
						if (err) {
							deferred.reject(err)
						} else {
							deferred.resolve(result)
						}
					})
			} else {
				bookModel.find()
					bookModel.find()
						.where('searchedAuthor').equals(authorObject._id)
						.where('preorder').equals(preorder)
						.skip(offset)
						.limit(limit)
						.sort({'pubDate': -1})
						.exec(function (err, result) {
							if (err) {
								deferred.reject(err)
							} else {
								deferred.resolve(result)
							}
						})
					}
			
		})

	return deferred.promise
}

exports.getAllSearchedAuthors = function () {
	var deferred = q.defer()

	authorModel.find()
		.exec(function (err, result) {
			if (err) {
				deferred.reject(err)
			} else {
				var names = _.map(result, function (item) {
					return item._id
				})
				deferred.resolve(names)
			}
		})

	return deferred.promise
}