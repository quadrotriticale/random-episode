var app = angular.module('RandomEpisodeApp', ['ngAnimate', 'angular-loading-bar', 'cfp.loadingBar']);


app.controller('MainCtrl', function ($scope, $http, cfpLoadingBar) {

	$scope.seriesString = "";
	$scope.result_series = {};
	$scope.result_episode = {};

	$scope.showAlert = false;
	$scope.showSeries = false;
	$scope.showEpisode = false;


	$scope.searchShow = function(seriesString) {

		$scope.showAlert = false;
		$scope.showSeries = false;
		$scope.showEpisode = false;

		var request = { series_string: seriesString };

		$http.post('/episodes', request)
	        .success(function(data) {

	        	if (data) {

		            $scope.seriesString = "";
		            $scope.result_series = data;
		            $scope.showSeries = true;

		            $scope.searchEpisode(data.series_id, data.series_seasons);
		            
		        } else {
		        	$scope.showAlert = true;
		        }

	        })
	        .error(function(data) {
	            $scope.showAlert = true;
	        });

	}


	$scope.searchEpisode = function(series_id, series_seasons) {

		var request = { series_seasons: series_seasons };

		$http.post('/episodes/' + series_id, request)
	        .success(function(data) {

	        	if (data) {

	        		$scope.result_episode = data;
	            	$scope.showEpisode = true;

	        	} else {
	        		$scope.showSeries = false;
	        		$scope.showAlert = true;
	        	}

	        })

	}

})