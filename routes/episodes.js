var express = require('express');
var router = express.Router();
var api = require('./tvdb');


router.post('/', function(req, res, next) {

	var series_string = req.body.series_string;
	
	api.getSeriesInfo(series_string, function(data) {
		res.send(data);
	})


});


router.post('/:seriesId', function(req, res, next) {

	var series_seasons = req.body.series_seasons;
	
	api.getRandomEpisode(req.params.seriesId, series_seasons, function(data) {
		res.send(data);
	})


});


module.exports = router;