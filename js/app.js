(function($){
	
	//Last FM Scrobble credentials
	var lastfmUser = "mediafy-ab";
	var lastfmApiKey = "f253a395993f32dd89e1b421f7510533";

	//Defualt images
	var unknownAlbum = "img/unknown.png";	//Default unknown artwork image
	var sleep = "img/pause.png"; 			//Default sleep image

	//Global variables
	var _playing = true; //Is song playing
	var _currentSong = ""; //Which song is playing
	
	var _pollRate = 4000; //Time between Last FM API-requests, in milliseconds

	//Update UI
	function updateCurrent(img, title, artist, playing){
		
		//Preload cover-image
		var preloadImg = new Image();
		//Update when image is loaded
		preloadImg.onload=function(){
			if(playing) {
				$(".background").css("background-image", "url("+img+")");
			} else {
				$(".background").css("background-image", "");
			}
			$(".album-art").css("background-image", "url("+img+")");
			$(".title").text(title);
			$(".artist").text(artist);
		}
		preloadImg.onerror=function(){
			if(playing) {
				$(".background").css("background-image", "url("+img+")");
			} else {
				$(".background").css("background-image", "");
			}
			$(".album-art").css("background-image", "url("+img+")");
			$(".title").text(title);
			$(".artist").text(artist);
		}
		preloadImg.src = img;
	}

	//Get playing song from Last FM. Get album art from Spotify. Update UI
	function fetchFromLastFm(delay){
		$.ajax({ 
			url: "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=1&user="+lastfmUser+"&api_key="+lastfmApiKey+"&format=json", 
			dataType: "json", 
			cache: false, 
			success: function(json) { 
				
				for(var i = 0; i < json.recenttracks.track.length; i++) {
					//Get first track
					track = json.recenttracks.track[i];
					
					
					//Defaults
					var img = sleep; //Album art
					var name = getRandomQoute(); //Song name
					var artist = ""; //Artist name
					var album = ""; //Album name
					var currentSong = ""; //Current playing song id
					var playing = false; //Is current song playing
					
					//Is currently playing?
					if(track["@attr"] && track["@attr"].nowplaying)
						playing = true;
					
					//Update UI?
					var change = playing != _playing;
					
										
					//If playing, set values of song
					if(playing) {
						name = track.name;
						artist = track.artist["#text"];
						album = track.album["#text"];
						
						//Is this song already set as playing?
						currentSong = artist + "-" + name + "-" + album;
						change = currentSong != _currentSong; //Update UI?
						
						if(change)
						{
							//Get backup img from Last FM in case Spotify API cannot find album art
							if(track.image.length > 0 && track.image[track.image.length - 1]["#text"].length > 0)
							{
								img = track.image[track.image.length - 1]["#text"];
								img = img.replace("300x300", "1000x1000");
							} else {
								//Start with unknown artwork
								img = unknownAlbum;
							}
						}
					} 
					
					_playing = playing;
					_currentSong = currentSong;
					
					//Update UI
					if(change){
						if(playing)
							getSpotifyCover(img, name, artist, album, _currentSong); //Spotify has better images for playing songs
						else
							updateCurrent(img, name, artist, playing); //Update to paused view
					}
					
					
					break; //Only do one song, playing song is always first
				}
				setTimeout(function(){fetchFromLastFm(delay);}, delay);
			}, 
			error: function(){
				setTimeout(function(){fetchFromLastFm(delay);}, delay);
			},
		});
		
		
		
	}

	//Get better quality image from a Spotify API search
	function getSpotifyCover(fallbackImg, name, artist, album, currentSong){
		$.ajax({
			url: "https://api.spotify.com/v1/search?q="+name+"%20"+artist+"%20"+album+"&type=track&limit=1", 
			dataType: "json", 
			cache: false, 
			success: function(json) {
				var img = fallbackImg;
				//Use image from Spotify API result
				if(json.tracks.items.length > 0 && json.tracks.items[0].album.images.length > 0  && _currentSong == currentSong && _playing){
					img = json.tracks.items[0].album.images[0].url;
				}
				//Update UI
				updateCurrent(img, name, artist, _playing);
				
			},
			error: function(){
				//Update UI
				if(_currentSong == currentSong && _playing)
					updateCurrent(fallbackImg, name, artist, _playing);
			}
		});
	}
	
	//Qoutes, used when asleep
	function getRandomQoute(){
		return _arrQoutes[Math.floor(Math.random() * _arrQoutes.length)];
	}
	var _arrQoutes = [
		"Good night, and good luck.",
		"Life is short. Have a bit of patience",
		"Why do they put pizza in a square box?",
		"Just because you can't dance doesn't mean you shouldn't dance",
		"What are they planting to grow the seedless watermelon?",
		"Why is there an expiration date on sour cream?",
		"I haven't slept for ten days, because that would be too long.",
		"I remixed a remix, it was back to normal.",
		"My fake plants died because I did not pretend to water them.",
		"When in doubt, look intelligent."
	];


	//Hide cursor
	var _tMouseCursor;
	var _tJustHidden;
	var _justHidden = false;
	var _cursorHideDelay = 5000; //millis. Has to be longer than 500

	function hideCursor(){
		$(document).mousemove(function() {
			if (!_justHidden) {
				if(typeof(_tMouseCursor) != "undefined")
					clearTimeout(_tMouseCursor);
				$('html').css({cursor: 'default'});
				_tMouseCursor = setTimeout(_hide, _cursorHideDelay);
			}
		});
		_hide();
	}
	function _hide() {
		if(typeof(_tJustHidden) != "undefined")
			clearTimeout(_tJustHidden);
		$('html').css({cursor: 'none'});
		_justHidden = true;
		_tJustHidden = setTimeout(function(){_justHidden = false;}, 500);
	}
	
	
	//Run app
	$(function(){
		fetchFromLastFm(_pollRate);
		hideCursor();
	}); 
})(jQuery);