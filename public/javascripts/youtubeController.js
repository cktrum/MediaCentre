// Service
app.factory('youtube', ['$http', function($http){
		return {
			newVideos: function (limit, offset) {
				return $http.get('/api/youtube/new?limit=' + limit + '&offset=' + offset)
			},

			oldVideos: function (limit, offset) {
				return $http.get('/api/youtube/old?limit=' + limit + '&offset=' + offset)
			},

			oldVideosOfChannel: function (channelID, limit, offset) {
				return $http.get('/api/youtube/old?channelID=' + channelID + '&limit=' + limit + '&offset=' + offset)
			},

			addChannel: function (id, name) {
				return $http.post('/api/youtube/channel/new', {id: id, name: name})
			},

			searchChannel: function (query) {
				return $http.get('/api/youtube/channel?query='+query)
			},

			removeChannel: function (id) {
				return $http.delete('/api/youtube/channel/delete?id='+id)
			}
		}
	}])

	// Controller
app.controller('youtubeController', ['$scope', 'youtube', function ($scope, youtube) {
		
		$scope.youtube = {
			old: {},
			old_total: 0,
			new: {},
			new_total: 0
		}
		$scope.channelMapping = {}

		var loadNewVideos = function () {
			youtube.newVideos(10, 0).success(function (data) {
				var number = 0
				for (channel in data) {
					number += data[channel].length
					$scope.youtube.new[channel] = {}
					$scope.youtube.new[channel].videos = data[channel]
					$scope.youtube.new[channel].offset = 6
					$scope.youtube.new[channel].limit = 10
					for (var i = 0; i < data[channel].length; i++) {
						$scope.youtube.new[channel].videos[i].isActive = (i < 6)
					}
				}
				$scope.youtube.new_total = number
			})
		}

		var loadOldVideos = function () {
			youtube.oldVideos(6, 0).success(function (data) {
				var number = 0
				for (channel in data) {
					number += data[channel].length
					$scope.youtube.old[channel] = {}
					$scope.youtube.old[channel].videos = data[channel]
					$scope.youtube.old[channel].offset = 6
					$scope.youtube.old[channel].limit = 6
				}
				$scope.youtube.old_total = number
			})
		}

		loadNewVideos()
		loadOldVideos()

		$scope.addNewChannel = function () {
			var name = $scope.channelInput
			var id = $scope.channelMapping[name]
			youtube.addChannel(id, name).success(function (data) {
				$scope.channelInput = ""
				loadNewVideos()
			})
		}

		$scope.searchForChannel = function() {
			var query = $scope.channelInput
			youtube.searchChannel(query).success(function (data) {
				var channels = data.map(function (item) {
					$scope.channelMapping[item.name] = item.id
					return item.name
				})
				$scope.suggestedChannels = channels
			})
		}

		$scope.removeChannel = function(name, id) {
			youtube.removeChannel(id).success(function (data) {
				delete $scope.youtube.new[name]
				delete $scope.youtube.old[name]
			})
		}

		$scope.carouselPrev = function(name, channel, category) {	
			var move_for = 3
			var new_offset = $scope.youtube[category][name].offset - 3*move_for
			if (category == 'old') {
				if (new_offset >= 0) {
		  		var channel_id = channel.channel
		  		youtube.oldVideosOfChannel(channel_id, move_for, new_offset).success(function (data) {
	  				$scope.youtube[category][name].videos.splice(-move_for, move_for)
		  			$scope.youtube[category][name].videos = data[name].concat($scope.youtube[category][name].videos)
		  			$scope.youtube[category][name].offset -= move_for
		  		})
				}
			}	else {
				if ($scope.youtube[category][name].offset > 2 * move_for) {
					for (var i = 0; i < $scope.youtube[category][name].videos.length; i++) {
						$scope.youtube[category][name].videos[i].isActive = (i >= new_offset && i < new_offset+2*move_for)
					}
					$scope.youtube[category][name].offset -= move_for
				}
			}	
			
		}

		$scope.carouselNext = function(name, channel, category) {
			var channel_id = channel.channel
			var move_for = 3
			if (category == 'old') {

				youtube.oldVideosOfChannel(channel_id, move_for, $scope.youtube[category][name].offset).success(function (data) {
					if (data[name].length > 0) {
						$scope.youtube[category][name].videos.splice(0, Math.min(move_for, data[name].length))
		  			$scope.youtube[category][name].videos = $scope.youtube[category][name].videos.concat(data[name])
						$scope.youtube[category][name].offset += move_for
					}
				})
			} else {
				if ($scope.youtube[category][name].offset + move_for < $scope.youtube[category][name].videos.length) {
					var available = Math.max($scope.youtube[category][name].videos.length - $scope.youtube[category][name].offset, 0)
					$scope.youtube[category][name].offset += Math.min(move_for, available)
					for (var i = 0; i < $scope.youtube[category][name].videos.length; i++) {
						$scope.youtube[category][name].videos[i].isActive = (i >= $scope.youtube[category][name].offset - Math.min(move_for, available) && i <= $scope.youtube[category][name].offset)
					}
				}
			}
		}
	}])