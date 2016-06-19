app.factory('googleBooks', ['$http', function ($http) {
	return {
		allSavedBooks: function (limit, offset, preorder, published) {
			return $http.get('/api/books/all?limit=' + limit + '&offset=' + offset + '&preorder=' + preorder + '&published=' + published)
		},

		allBooksForAuthor: function (author, limit, offset) {
			return $http.get('/api/books/author?author=' + author + '&limit=' + limit + '&offset=' + offset)
		},

		booksForAuthor: function (author, preorder, published, limit, offset) {
			return $http.get('/api/books/author?author=' + author + '&limit=' + limit + '&offset=' + offset + '&preorder=' + preorder + '&published=' + published)
		},

		removeAuthor: function (author) {
			return $http.delete('/api/books/author?author=' + author)
		}
	}
}])

app.controller('bookController', ['$scope', 'googleBooks', function ($scope, googleBooks) {
	$scope.books = {
		published: {},
		preorder: {}
	}

	var loadBooks = function () {
		googleBooks.allSavedBooks(6, 0, true, false).success(function (data) {
			for (author in data) {
				$scope.books.preorder[author] = {}
				$scope.books.preorder[author].books = data[author]
				$scope.books.preorder[author].offset = 6
				$scope.books.preorder[author].limit = 6
			}
		})

		googleBooks.allSavedBooks(6, 0, false, true).success(function (data) {
			for (author in data) {
				$scope.books.published[author] = {}
				$scope.books.published[author].books = data[author]
				$scope.books.published[author].offset = 6
				$scope.books.published[author].limit = 6
			}
		})
	}

	loadBooks()

	$scope.removeAuthor = function (author) {
		googleBooks.removeAuthor(author)
	}

	$scope.carouselPrev = function(author, category) {	
		var move_for = 3
		var new_offset = $scope.books[category][author].offset - 3*move_for
		var preorder = category == 'preorder' ? true : false

		if (new_offset >= 0) {
			googleBooks.booksForAuthor(author, preorder, !preorder, move_for, new_offset).success(function (data) {
				$scope.books[category][author].books.splice(-move_for, move_for)
				$scope.books[category][author].books = data.concat($scope.books[category][author].books)
				$scope.books[category][author].offset -= move_for
			})
		}
	}

	$scope.carouselNext = function(author, category) {
		var move_for = 3
		var preorder = category == 'preorder' ? true : false

		googleBooks.booksForAuthor(author, preorder, !preorder, move_for, $scope.books[category][author].offset).success(function (data) {
			if (data.length > 0) {
				$scope.books[category][author].books.splice(0, Math.min(move_for, data.length))
				$scope.books[category][author].books = $scope.books[category][author].books.concat(data)
				$scope.books[category][author].offset += move_for
			}
		})
	}
}])