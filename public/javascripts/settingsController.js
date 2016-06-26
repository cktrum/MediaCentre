app.factory('keysFactory', ['$http', function ($http) {
	return {
		getKeys: function () {
			return $http.get('/api/keys')
		},

		saveKey: function (key, source) {
			return $http.post('/api/key', {source: source, key: key})
		}
	}
}])

app.controller('settingsController', ['$scope', 'keysFactory', function ($scope, keysFactory) {
	$scope.categories = {
		Youtube: {
			key: null
		},
		GoogleBooks: {
			key: null
		},
		Twitter:  {
			key: null
		}
	}

	keysFactory.getKeys().success(function (data) {
		for (var i = 0; i < data.length; i++) {
			$scope.categories[data[i]._id].key = data[i].key
		}
	})

	$scope.saveKeys = function () {
		for (var source in $scope.categories) {
			keysFactory.saveKey($scope.categories[source].key, source)
		}
	}
}])