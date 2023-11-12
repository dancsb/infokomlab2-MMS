'use strict';

var Signalling = function(config) {
	if(typeof config.room === 'undefined') {
		throw 'No room defined in Signalling constructor!';
	}

	if(typeof config.signallingServer === 'undefined') {
		throw 'No signalling server defined in Signalling constructor!';
	}
	
	this.onMessage = config.onMessage || function(data) {
		console.log(data);
	};
	this.room = config.room;

	var that = this;

	this.socket = io(config.signallingServer);
	this.socket.on('message', function(data) {
    	that.onMessage(data);
	});

	this.socket.emit('subscribe', {room: this.room});
};

Signalling.prototype.send = function(msg) {
	this.socket.emit('message', msg)
}
