var app = angular.module('app', ['ngRoute', 'autocomplete'])

app.config(['$routeProvider', function ($routeProvider) {
		$routeProvider
			.when('/youtube', {
				templateUrl: 'templates/youtube.ejs',
				controller: 'youtubeController'
			})
			.when('/books', {
				templateUrl: 'templates/books.ejs',
				controller: 'bookController'
			})
			.when('/twitter', {
				templateUrl: 'templates/twitter.ejs',
				controller: 'twitterController'
			})
			.when('/settings', {
				templateUrl: 'templates/settings.ejs',
				controller: 'settingsController'
			})
	}])