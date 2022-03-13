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
					var device = message["payload"]["deviceID"]
					var client = message["payload"]["clientID"]
					headers = {
						'authority': 'spclient.wg.spotify.com',
						//'authority': 'gew1-spclient.spotify.com',
						'authorization': 'Bearer ' + access_token,
						'content-type': 'text/plain;charset=UTF-8'
					}
					console.log(access_token)

					request_body = JSON.stringify({'clientId': client, 'deviceId': device})

					request({
						uri:'https://spclient.wg.spotify.com/device-auth/v1/refresh', 
						//uri:'https://gew1-spclient.spotify.com/device-auth/v1/refresh', 
						method: 'OPTIONS',
						headers: headers, 
						body: request_body
					}).then(function(resp){
									
						console.log(response)
						json_resp = response.json()
						that.send({
							type: 'addUser',
							payload: {
								"blob": json_resp["accessToken"],
								//"blob": that.access_token,
								"tokenType": "accesstoken"
							}
						})

					})
				});
			}
			if (message.type === 'setCredentialsResponse') {

				that.api.getMyDevices().then(function (response) {
					var devices = response.body.devices;
					var device = devices.find(e => e.name === that.device_name);
					that.device = device;

					resolve(that);
				})
			}
		});

		/*SpotifyWPAT.getAccessToken(username, password).then(function (access_token) {
			that.access_token = access_token;
			global_access_token = access_token;

			that.api = new SpotifyWebApi({
				accessToken: that.access_token
			});

			// Send setCredentials request using web AT
			console.log('sending getInfo...');
			that.send({
				type: 'getInfo',
				payload: {}
			});

		})*/

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
