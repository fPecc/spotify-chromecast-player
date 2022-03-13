var util = require('util');
var castv2Cli = require('castv2-client');
var RequestResponseController = castv2Cli.RequestResponseController;
var SpotifyWPAT = require('./spotify-wat');
var SpotifyWebApi = require('spotify-web-api-node');
var request = require('request-promise');

var global_access_token = null;

function SpotifyController(client, sourceId, destinationId) {
	RequestResponseController.call(this, client, sourceId, destinationId, 'urn:x-cast:com.spotify.chromecast.secure.v1');
}

util.inherits(SpotifyController, RequestResponseController);

SpotifyController.prototype.authenticate = function ({ username, password, device_name }) {
	var that = this;
	return new Promise(function (resolve, reject) {
		if (that.access_token != null) {
			return resolve();
		}

		that.device_name = device_name;

		that.api = new SpotifyWebApi({
			accessToken: that.access_token
		});

		// Send setCredentials request using web AT
		console.log('sending getInfo...');
		that.send({
			type: 'getInfo',
			payload: {}
		});

		// Once Chromecast replies, get the list of the devices
		that.on('message', function (message) {
			console.log(message);
			if(message.type === 'getInfoResponse')
			{
				SpotifyWPAT.getAccessToken(username, password).then(function (access_token) {

					that.api = new SpotifyWebApi({
						accessToken: access_token
					});

					var device = message["payload"]["deviceID"]
					var client = message["payload"]["clientID"]
					headers = {
						'authority': 'spclient.wg.spotify.com',
						'authorization': 'Bearer BQDiLLQz_WJ2mPueTnGlKy6mArfcfHR04VYY9o629IPA0a36PmFJifxQsLYd0mErFxmcrD4Wr2zzIe_CGoaGH1lTM5v7noh-dZ5OWH-v8zah9Yr8bZq9QBaKouOlikr7VMBKowCULBQLmtzEuhDO9eeR2Bp3hQb5xKy4ZSbgWh5YoI8yW-DO7Z-qLOeV9C7opySmyAc5Dh0QMec6yhf8hqzqVm8XkSBqdzSH1Zm-nmBRHTOHDzD9cjVyy5ZRvpb-7_4u8Lj6IaSYBYh6mZB5WuMBkPfZr-IK5Ikxr3datW3HHoTPzBbcoCu1hdbz',
						'content-type': 'text/plain;charset=UTF-8'
					}
					console.log(access_token)

					request_body = JSON.stringify({'clientId': client, 'deviceId': device})

					request({
						uri:'https://spclient.wg.spotify.com/device-auth/v1/refresh',
						method: 'POST',
						headers: headers, 
						body: request_body
					}).then(function(response){
									
						console.log(response)
						json_resp = JSON.parse(response)
						that.send({
							type: 'addUser',
							payload: {
								"blob": json_resp.accessToken,
								"tokenType": "accesstoken"
							}
						})

					})
				});
			}
			if (message.type === 'addUserResponse') {

				that.api.getMyDevices().then(function (response) {
					var devices = response.body.devices;
					var device = devices.find(e => e.name === that.device_name);
					that.device = device;

					resolve(that);
				})
			}
		});

	});
};

SpotifyController.prototype.getAPI = function () {
	return this.api;
};

SpotifyController.prototype.play = function (opt) {
	var that = this;
	opt.deviceId = this.device.id;
	return that.api.play(opt);
};

SpotifyController.prototype.pause = function () {
	return this.api.pause({
		deviceId: this.device.id
	});
};

module.exports = SpotifyController;
