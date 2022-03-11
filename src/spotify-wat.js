var rp = require('request-promise');
var tough = require('tough-cookie');

var UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36';

function getCSRF(cookiejar) {
	return rp('https://accounts.spotify.com/login', {
		resolveWithFullResponse: true,
		headers: {
			'user-agent': UA
		},
		jar: cookiejar
	}).then(function (resp) {
		return resp.headers['set-cookie']
			.find(e => e.indexOf('csrf_token') === 0)
			.split(';')[0]
			.replace('csrf_token=', '');
	})
}

function login(cookiejar, username, password, csrf_token) {
	return rp({
		url: 'https://accounts.spotify.com/api/login',
		method: 'POST',
		form: {
			remember: false,
			username: username,
			password: password,
			csrf_token: csrf_token,
		},
		jar: cookiejar,
		headers: {
			'user-agent': UA
		}
	});
}

function getAccessToken(cookiejar) {
	return rp({
		url: 'https://open.spotify.com/browse',
		jar: cookiejar,
		resolveWithFullResponse: true,
		headers: {
			'user-agent': UA
		}
	}).then(function (resp) {
		return resp.headers['set-cookie']
			.find(e => e.indexOf('wp_access_token') === 0)
			.split(';')[0]
			.replace('wp_access_token=', '')
	});
}

exports.getAccessToken = function (username, password) {


	return rp({
		url: 'http://192.168.0.27:8080/rest/items/SpotifyPlayerBridge_AccessToken/state',
	}).then(function (resp) {
		console.log(resp)
		return resp
	});
};
