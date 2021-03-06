app.factory('httpFactory', ['$http', function ($http) {
	return {
		getKeys: function () {
			return $http.get('/api/keys')
		},

		saveKey: function (key, source) {
			return $http.post('/api/key', {source: source, key: key})
		},

		signIn: function () {
			return $http.get('/api/twitter/auth/initiate')
		}
	}
}])

app.controller('settingsController', ['$scope', 'httpFactory', function ($scope,  httpFactory) {
	$scope.settings = {}
	$scope.settings.keys = {
		Youtube: {
			name: 'Youtube',
			key: null
		},
		GoogleBooks: {
			name: 'Google Books',
			key: null
		}
	}

	$scope.settings.twitter = {
		Bearer: {
			name: 'Bearer Token',
			key: null,
			readonly: true
		},
		ConsumerKey: {
			name: 'Consumer Key',
			key: null,
			readonly: false
		},
		ConsumerSecret: {
			name: 'Consumer Secret',
			key: null,
			readonly: false
		}
	}

	httpFactory.getKeys().success(function (data) {
		for (var i = 0; i < data.length; i++) {
			if (data[i]._id == 'Twitter') {
				$scope.settings.twitter.Bearer.key = data[i].key
				$scope.settings.twitter.ConsumerKey.key = data[i].consumerKey
				$scope.settings.twitter.ConsumerSecret.key = data[i].consumerSecret
			} else {
				$scope.settings.keys[data[i]._id].key = data[i].key
			}
		}
	})

	$scope.saveKeys = function () {
		for (var source in $scope.settings.keys) {
			httpFactory.saveKey($scope.settings.keys[source].key, source)
		}

		var twitterKey = {
			bearer: $scope.settings.twitter.Bearer,
			key: $scope.settings.twitter.ConsumerKey,
			secret: $scope.settings.twitter.ConsumerSecret
		}
		httpFactory.saveKey(twitterKey, 'Twitter')
	}

	$scope.signInWithTwitter = function() {
		httpFactory.signIn()
	}
}])