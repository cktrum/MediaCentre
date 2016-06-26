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

	$scope.showUser = function (user) {
		$scope.twitter.tweets = [{name: 'user1tweet'}]
	}

	$scope.showTopic = function (topic) {
		$scope.twitter.tweets = [{name: 'topic1tweet'}, {name: 'topic2tweet'}]
	}
}])