var request = require('request');
var fs = require('fs');


var token = "Bearer ";
var img_path = "http://thetvdb.com/banners/";



/* GET TOKEN FROM TXT FILE */
fs.readFile('token.txt', 'utf8', function (err, data) {

    if (err) {
    	console.log("Can't read the txt file. " + err);
    } else {
    	console.log("Read token from txt file.");
    	token = "Bearer " + data;
    }

});



/* RETURN SERIES ID */
getSeriesbyName = function(series_string, callback) {

	request({
		url: 'https://api.thetvdb.com/search/series?name=' + series_string,
		method: "GET",
		headers: { 'Authorization': token, 'Accept-Language': 'en' }
	}, function(error, response, body) {

		if (response.statusCode == 200) {

			var result = JSON.parse(body);
			var arr = result["data"];
			var first = arr[0];
			var id = first["id"];
			callback(id.toString());

		} else if (response.statusCode == 401) {

			login(function(data) {

				if (data) {
					request({
						url: 'https://api.thetvdb.com/search/series?name=' + series_string,
						method: "GET",
						headers: { 'Authorization': token, 'Accept-Language': 'en' }
					}, function(error, response, body) {

						if (response.statusCode == 200) {

							var result = JSON.parse(body);
							var arr = result["data"];
							var first = arr[0];
							var id = first["id"];
							callback(id.toString());

						} else {
							callback(null);
						}
					})
				} else {
					callback(null);
				}

			});


		}
		 else {
			callback(null);
		}

	});

}



/* RETURN NUMBER OF AIRED SEASONS */
checkNumberOfSeasons = function(series_id, max_season, callback) {

	request({
		url: 'https://api.thetvdb.com/series/' + series_id + '/episodes/query?airedSeason=' + max_season,
		method: "GET",
		headers: { 'Authorization': token }
	}, function(error, response, body) {
		
		if (response.statusCode == 200) {

			var result = JSON.parse(body);
			var arr = result["data"];
			var first = arr[0];

			if (alreadyAired(first.firstAired))
				callback(max_season);
			else
				callback(max_season - 1);

		} else {
			callback(null);
		}

	});

}



/* CHECK IF EPISODE ALREADY AIRED */
alreadyAired = function(ep_date) {

	var episode_date = new Date(Date.parse(ep_date));
	var current_date = new Date();

	if (current_date > episode_date)
		return true;
	else
		return false;

}



/* GET SERIES INFO */
exports.getSeriesInfo = function(series_string, callback) {

	getSeriesbyName(series_string, function(data) {

		if (!data)
			callback(null);
		else {

			var series_id = data;
			var series_data = {
				series_id: series_id,
				series_name: "",
				series_overview: "",
		    	series_first_aired: "",
		    	series_poster: "",
		    	series_seasons: 0
			}

			request({
				url: 'https://api.thetvdb.com/series/' + series_id,
				method: "GET",
				headers: { 'Authorization': token }
			}, function(error, response, body) {

				if (response.statusCode == 200) {

					var result = JSON.parse(body);
					var name = result.data.seriesName;
					series_data.series_name = result.data.seriesName;
					series_data.series_overview = result.data.overview;
					series_data.series_first_aired = result.data.firstAired;

					request({
						url: 'https://api.thetvdb.com/series/' + series_id + '/episodes/summary',
						method: "GET",
						headers: { 'Authorization': token }
					}, function(error, response, body) {

						if (response.statusCode == 200) {

							var result = JSON.parse(body);
							var seasons = result.data.airedSeasons;
							var number_of_seasons = seasons.length;
							for (var i = 0; i < seasons.length; i++) {
								if (seasons[i] == "0") {
									number_of_seasons -= 1;
									break;
								}
							}
							
							checkNumberOfSeasons(series_id, number_of_seasons, function(data) {

								series_data.series_seasons = data;

								request({
									url: 'https://api.thetvdb.com/series/' + series_id + '/images/query?keyType=poster',
									method: "GET",
									headers: { 'Authorization': token }
								}, function(error, response, body) {

									if (response.statusCode == 200) {

										var result = JSON.parse(body);
										var result_data = result.data;
										var first_result = result_data[0];
										var poster_url = first_result.fileName;
										series_data.series_poster = img_path + poster_url;

										callback(series_data);

									} else {
										callback(null);
									}


								});
							

							})

						} else {
							callback(null);
						}


					});

				} else {
					callback(null);
				}

			});
}
	})

}



/* GET RANDOM EPISODE OF THE SERIES */
exports.getRandomEpisode = function(series_id, series_seasons, callback) {

	var random_season = Math.floor(Math.random() * (series_seasons - 1)) + 1;

	request({
		url: 'https://api.thetvdb.com/series/' + series_id + '/episodes/query?airedSeason=' + random_season,
		method: "GET",
		headers: { 'Authorization': token }
	}, function(error, response, body) {
		
		if (response.statusCode == 200) {

			var result = JSON.parse(body);
			var arr = result["data"];
			var max = arr.length;

			do {
				var random_episode_index = Math.floor(Math.random() * max);
				var ep = arr[random_episode_index];
			} while (!alreadyAired(ep.firstAired));

			var episode_data = {
				episode_season: random_season,
				episode_number: ep.airedEpisodeNumber,
				episode_name: ep.episodeName,
				episode_first_aired: ep.firstAired,
				episode_overview: ep.overview
			}

			callback(episode_data);

		} else {
			callback(null);
		}

		

	});

}



/* GET NEW TOKEN FROM THE TVDB API*/
login = function(callback) {

	request({
		url: 'https://api.thetvdb.com/login',
		method: "POST",
		json: { apikey: "XXXXXXXXXXXXXXXX" }
	}, function(error, response, body) {
		
		if (response.statusCode == 200) {

			var new_token = response.body.token;
      		
      		fs.writeFile('token.txt', new_token, function (err) {
	        	if (err) {
	            	callback(null);
	        	}
	            else {
	            	console.log('New token saved to file');
	            	token = "Bearer " + new_token;
	            	callback(true);
	            }
	        	
	        }); 

		} else {
        	console.log("Error: " + response.statusCode + " " + error);
		}

		

	});

}

