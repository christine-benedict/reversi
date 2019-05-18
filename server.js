//Import libraries
var static = require('node-static');
var http = require('http');

// Config for Heroku
var port = process.env.PORT;
var directory = __dirname + '/public';

// Config for localhost
if(typeof port == 'undefined' || !port ) {
	directory = './public';
	port = 8080;
}

// Static web server
var file = new static.Server(directory);

// This is our actual app
var app = http.createServer(
		function(request, response){
			request.addListener('end', 
				function() {
					file.serve(request, response);
				}
			).resume();
		}
	).listen(port);

console.log(`Server running on port ${port}`)


// Setup for socket server
var io = require('socket.io').listen(app);

io.sockets.on('connection', function(socket){
	function log(){
		var array = ['*** Server Log Message: '];
		for(var i = 0; i < arguments.length; i++){
			array.push(arguments[i]);
			console.log(arguments[i]);
		}
		socket.emit('log', array);
		socket.broadcast.emit('log', array);
	}
	log('A website connected to the server');

	socket.on('disconnect', function(socket){
		log('A website disconnected to the server');
	});

	// Expected payload for joining a room:
	// 	payload: {
	// 		'room': room to join,
	// 		'username': username of person joining
	// 	}
	// Expected response:
	// 	** Success ** 
	// 	{
	// 		'result': 'success',
	// 		'room': room joined,
	// 		'username': username that joined,
	// 		'membership': number of people in the room including the new one,
	// 	}
	// 	** Failure **
	// 	{
	// 		'result': 'fail',
	// 		'message': failure message
	// 	}

	socket.on('join_room', function(payload){
		log('server received a command', 'join_room', payload);
		if('undefined' === typeof payload || !payload){
			var error_message = 'join_room had no payload, command aborted';
			log(error_message);
			socket.emit('join_room_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var room = payload.room;
		if('undefined' === typeof room || !room){
			var error_message = 'join_room didn\'t specify a room, command aborted';
			log(error_message);
			socket.emit('join_room_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var username = payload.username;
		if('undefined' === typeof username || !username){
			var error_message = 'join_room didn\'t specify a username, command aborted';
			log(error_message);
			socket.emit('join_room_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}
		
		socket.join(room);
		var roomObject = io.sockets.adapter.rooms[room];
		if('undefined' === typeof roomObject || !roomObject){
			var error_message = 'join_room couldn\'t create a room (internal error), command aborted';
			log(error_message);
			socket.emit('join_room_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var numClients = roomObject.length;
		var success_data = {
			result: 'success',
			room: room,
			username: username,
			membership: (numClients+1)
		}

		io.sockets.in(room).emit('join_room_response', success_data);
		log('Room '+room+' was just joined by '+username);
	});

	// Expected payload for sending a message:
	// 	payload: {
	// 		'room': room to send message,
	// 		'username': username of person sending the message
	//		'message': the message to send
	// 	}
	// Expected response:
	// 	** Success ** 
	// 	{
	// 		'result': 'success',
	// 		'room': room in which message is sent,
	// 		'username': username that spoke,
	// 		'message': the message sent
	// 	}
	// 	** Failure **
	// 	{
	// 		'result': 'fail',
	// 		'message': failure message
	// 	}

	socket.on('send_message', function(payload){
		log('server received a command', 'send_message', payload);
		if('undefined' === typeof payload || !payload){
			var error_message = 'send_message had no payload, command aborted';
			log(error_message);
			socket.emit('send_message_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var room = payload.room;
		if('undefined' === typeof room || !room){
			var error_message = 'send_message didn\'t specify a room, command aborted';
			log(error_message);
			socket.emit('send_message_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var username = payload.username;
		if('undefined' === typeof username || !username){
			var error_message = 'send_message didn\'t specify a username, command aborted';
			log(error_message);
			socket.emit('send_message_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var message = payload.message;
		if('undefined' === typeof message || !message){
			var error_message = 'send_message didn\'t specify a message, command aborted';
			log(error_message);
			socket.emit('send_message_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var success_data = {
			result: 'success',
			room: room,
			username: username,
			message: message,
		}

		io.sockets.in(room).emit('send_message_response', success_data);
		log('Message sent to Room '+room+' by '+username);
	});
});


