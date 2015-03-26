var authURL = 'https://github.com/login/oauth/',
	clientID = '503b0baa4664a76b6718';

var onAuthClick = function(event){
	event.preventDefault();

	var chars = '0123456789abcdef';
	var randomString = '';

	for(var index = 0; index < 7; index++){
		var selection = Math.floor(Math.random() * chars.length);
		randomString += chars.substring(selection, selection + 1);
	}

	localStorage.setItem('state', randomString);
	location.href = authURL.format(clientID, 'public_repo', randomString, encodeURIComponent(location.href));
}

document.addEventListener('DOMContentLoaded', function(){
	var authAnchor = this.querySelector('.comments .post .authenticate');
	var avatar = this.querySelector('.comments .post > img');
	if(localStorage.getItem('token')){
		avatar.title = localStorage.getItem('username');
		avatar.src = localStorage.getItem('avatar');

		return;
	}

	var storedCode = localStorage.getItem('code');
	if(storedCode){
		localStorage.removeItem('code');
		location.hash = 'comments';

		post(authURL + 'access_token', JSON.stringify({
			client_id: clientID,
			client_secret: '',
			code: storedCode
		}), function(req, error){
			if(error)
				return;

			var token = req.response.split('access_token=')[1].split('&')[0];
			localStorage.setItem('token', token);

			get('https://api.github.com/user', function(req, error){
				if(error)
					return;

				var data = JSON.parse(req.response);
				localStorage.setItem('username', data.login);
				localStorage.setItem('avatar', data.avatar_url);

				avatar.title = data.login;
				avatar.src = data.avatar_url;

				authAnchor.style.display = 'none';
			}, {Authorization: 'token ' + token});
		});

		return;
	}

	var match = location.search.match(/^\?code=(.+)&state=(.+)/);
	if(match){
		var savedState = localStorage.getItem('state');
		if(savedState && savedState === match[2]){
			localStorage.setItem('code', match[1]);
			location.href = location.href.split('?')[0];
		}
	}

	authURL += 'authorize?client_id={0}&scope={1}&state={2}&redirect_uri={3}';
	authAnchor.style.display = 'block'
	authAnchor.children[0].addEventListener('click', onAuthClick);

	localStorage.removeItem('state');
});
