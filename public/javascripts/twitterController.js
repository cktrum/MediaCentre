app.factory('twitterFactory', ['$http', function ($http) {
	return {
		getUsers: function () {
			return $http.get('/api/twitter/users')
		},
		getTopics: function () {
			return $http.get('/api/twitter/topics')
		},
		getTweets: function (type, id) {
			return $http.get('/api/twitter/tweets?type=' + type + '&id=' + id)
		},
		addUser: function (username) {
			return $http.put('/api/twitter/add/user')
		}
	}
}])

app.controller('twitterController', ['$scope', 'twitterFactory', function ($scope, twitterFactory) {
	$scope.twitter = {
		users: [
			{
				name: 'Chris Stark',
				id: 'chris_stark'
			}, 
			{
				name: 'BBC Radio 1',
				id: 'bbcr1'
			}
		], 
		topics: [
			{
				name: 'News',
				id: 'news'
			}
		],
		tweets: []
	}
	$scope.addUserShown = false

	$scope.openSearchUserDialog = function (ev) {
		$scope.addUserShown = !$scope.addUserShown
	}

	$scope.openAddQueryDialog = function (ev) {
		$scope.addQueryShown = !$scope.addQueryShown
	}

	$scope.searchForUsers = function () {
		$scope.twitter.suggestedUsers = ['Test1', 'Test2']
		$scope.twitter.userMapping = {Test1: 'test1', Test2: 'test2'}
	}

	$scope.addNewUser = function () {
		var username = $scope.twitter.newUser
		twitterFactory.addUser(username)
		$scope.addUserShown = !$scope.addUserShown
		$scope.twitter.newUser = ""
		$scope.twitter.users.push({name: username, id: $scope.twitter.userMapping[username]})
	}

	$scope.addNewQuery = function () {
		
	}

	$scope.showUser = function (user) {
		$scope.twitter.tweets = [{name: 'user1tweet'}]
	}

	$scope.showTopic = function (topic) {
		$scope.twitter.tweets = [{name: 'topic1tweet'}, {name: 'topic2tweet'}]
	}
}])