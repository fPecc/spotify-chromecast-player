var rp = require('request-promise');
var tough = require('tough-cookie');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

//var UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36';
var UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36';

exports.getAccessToken = function (username, password) {

	return rp({
		//url: 'https://open.spotify.com/get_access_token?reason=transport&productType=web_player',
		url: 'https://open.spotify.com/browse',
		headers: {
			'user-agent': UA
		},
		cookies: {
			'sp_dc': process.env.SP_DC, 'sp_key': process.env.SP_KEY
		}
	}).then(function(resp){
		console.log(resp)
		var json_resp = JSON.parse(resp.split('data-testid="config"')[1].split('</script>')[0].split('type="application/json">')[1]);
		console.log('--------------------------------------')
		console.log(json_resp)
		return json_resp.accessToken;
		//var dom = new JSDOM(resp);
		//console.log(dom.window.document.getElementById('config').value)
		//return JSON.parse(resp).accessToken
	});

	/*return rp({
		url: 'http://192.168.0.27:8080/rest/items/SpotifyPlayerBridge_AccessToken/state',
	}).then(function (resp) {
		console.log(resp)
		return resp
	});*/
};
