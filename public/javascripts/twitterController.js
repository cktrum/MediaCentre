app.factory('twitterFactory', ['$http', function ($http) {
	return {
		getUsers: function () {
			return $http.get('/api/twitter/users')
		},
		getTopics: function () {
			return $http.get('/api/twitter/topics')
		},
		getTweets: function (type, id) {
			if (type == 'user') {
				return $http.get('/api/twitter/user?id=' + id)
			} else if (type == 'topic') {
				return $http.get('/api/twitter/query?id=' + id)
			}
		},
		addUser: function (userName, screenName) {
			return $http.put('/api/twitter/add/user', {title: userName, username: screenName})
		},
		addTopic: function (title, query) {
			return $http.put('/api/twitter/add/query', {title: title, query: query})
		},
		searchUser: function (searchString) {
			return $http.get('/api/twitter/search/user?username=' + searchString)
		},
		removeUser: function (id) {
			return $http.delete('/api/twitter/user?id=' + id)
		},
		removeTopic: function (id) {
			return $http.delete('/api/twitter/topic?id=' + id)	
		}
	}
}])

app.controller('twitterController', ['$scope', 'twitterFactory', function ($scope, twitterFactory) {
	$scope.twitter = {
		users: [], 
		topics: [],
		tweets: []
	}

	$scope.addUserShown = false
	$scope.twitter.newTopic = {}

	var loadData = function () {
		twitterFactory.getUsers().success(function (users) {
			$scope.twitter.users = users	
		})
		twitterFactory.getTopics().success(function (topics) {
			$scope.twitter.topics = topics
		})
	}

	loadData()

	$scope.openSearchUserDialog = function (ev) {
		$scope.addUserShown = !$scope.addUserShown
	}

	$scope.openAddQueryDialog = function (ev) {
		$scope.addQueryShown = !$scope.addQueryShown
	}

	$scope.searchForUsers = function () {
		var searchString = $scope.twitter.newUser
		twitterFactory.searchUser(searchString).success(function (res) {
			if (res.length) {
				$scope.twitter.suggestedUsers = res.map(function (item) {
					return item.name + ' (' + item.screen_name + ')'
				})
				
				$scope.twitter.userMapping = {}
				res.forEach(function (item) {
					var displayName = item.name + ' (' + item.screen_name + ')'
					var key = displayName.replace(/ /g, '')
					$scope.twitter.userMapping[key] = item.screen_name
				})
			}
		})
	}

	$scope.addNewUser = function () {
		var username = $scope.twitter.newUser
		var key = username.replace(/ /g, '')
		var screenName = $scope.twitter.userMapping[key]
		twitterFactory.addUser(username, screenName).success(function (user_id) {
			$scope.addUserShown = !$scope.addUserShown
			$scope.twitter.newUser = ""
			loadData()
		})
	}

	$scope.addNewQuery = function () {
		if (!$scope.twitter.newTopic.Title) {
			return
		} else {
			var title = $scope.twitter.newTopic.Title
		}

		var query = ""
		if ($scope.twitter.newTopic.Included) {
			var includedArray = $scope.twitter.newTopic.Included.split(", ")
			for (var i = 0; i < includedArray.length; i++) {
				query = query + '"' + includedArray[i] + '" '
			}
		}
		if ($scope.twitter.newTopic.Excluded) {
			var excludedArray = $scope.twitter.newTopic.Excluded.split(", ")
			
			for (var i = 0; i < excludedArray.length; i++) {
				query = query + '-' + excludedArray[i] + ' '
			}
		}
		if ($scope.twitter.newTopic.Hashtag) {
			$scope.twitter.newTopic.Hashtag = $scope.twitter.newTopic.Hashtag.replace(/#/g, '')
			var hashtagArray = $scope.twitter.newTopic.Hashtag.split(", ")
			for (var i = 0; i < hashtagArray.length; i++) {
				query = query + '#' + hashtagArray[i] + ' '
			}
		}
		if ($scope.twitter.newTopic.Mention) {
			$scope.twitter.newTopic.Mention = $scope.twitter.newTopic.Mention.replace(/@/g, '')
			var mentionArray = $scope.twitter.newTopic.Mention.split(", ")
			for (var i = 0; i < mentionArray.length; i++) {
				query = query + '@' + mentionArray[i] + ' '
			}
		}
		if ($scope.twitter.newTopic.inputDateFrom) {
			var date = new Date($scope.twitter.newTopic.inputDateFrom)
			date = date.toISOString().split("T")[0]
			query = query + 'since:' + date + ' '
		}
		if ($scope.twitter.newTopic.inputDateTo) {
			var date = new Date($scope.twitter.newTopic.inputDateTo)
			date = date.toISOString().split("T")[0]
			query = query + 'until:' + date + ' '
		}
		
		twitterFactory.addTopic(title, query).success(function (id) {
			loadData()
		})
		$scope.addQueryShown = !$scope.addQueryShown
	}

	$scope.showUser = function (user) {
		twitterFactory.getTweets(user.type, user.id).success(function (data) {
			$scope.twitter.tweets = data
		})
	}

	$scope.showTopic = function (topic) {
		twitterFactory.getTweets(topic.type, topic.id).success(function (data) {
			$scope.twitter.tweets = data
		})
	}

	$scope.removeUser = function (user) {
		twitterFactory.removeUser(user.id)
		loadData()
	}

	$scope.removeTopic = function (query) {
		twitterFactory.removeTopic(query.id)
		loadData()
	}
}])