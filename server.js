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

//Registry of socket_ids and player information
var players = [];

var io = require('socket.io').listen(app);

io.sockets.on('connection', function(socket){

	log('Client connection by '+socket.id);

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
	//		'socket_id': the socket id of the persone that joined,
	// 		'membership': number of people in the room including the new one,
	// 	}
	// 	** Failure **
	// 	{
	// 		'result': 'fail',
	// 		'message': failure message
	// 	}

	socket.on('join_room', function(payload){

		log('\'join_room\' command '+JSON.stringify(payload));

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
		
		//Store info about new player
		players[socket.id] = {};
		players[socket.id].username = username;
		players[socket.id].room = room;

		//Join the room
		socket.join(room);

		//Get the room object
		var roomObject = io.sockets.adapter.rooms[room];
		
		//Tell everyone that is in the room that someone just joined
		var numClients = roomObject.length;
		var success_data = {
			result: 'success',
			room: room,
			username: username,
			socket_id: socket.id,
			membership: numClients
		}

		io.in(room).emit('join_room_response', success_data);

		for(var socket_in_room in roomObject.sockets){
			var success_data = {
				result: 'success',
				room: room,
				username: players[socket_in_room].username,
				socket_id: socket_in_room,
				membership: numClients
			}
			socket.emit('join_room_response', success_data)
		}

		log('join_room_success');

		if(room !== 'lobby'){
			send_game_update(socket, room, 'initial update');
		}
	});

	socket.on('disconnect', function(){
		log('Client disconnected '+JSON.stringify(players[socket.id]));

		if('undefined' !== typeof players[socket.id] && players[socket.id]){
			var username = players[socket.id].username;
			var room = players[socket.id].room;
			var payload = {
				username: username,
				socket_id: socket.id,
			}
			delete players[socket.id];
			io.in(room).emit('player_disconnected', payload);
		} 

	});

	// Expected payload for sending a message:
	// 	payload: {
	// 		'room': room to send message,
	//		'message': the message to send
	// 	}
	// Expected response:
	// 	** Success ** 
	// 	{
	// 		'result': 'success',
	// 		'room': room in which message is sent,
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

		var username = players[socket.id].username;
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

		io.in(room).emit('send_message_response', success_data);
		log('Message sent to Room '+room+' by '+username);
	});

	// Expected payload for invite:
	// 	payload: {
	// 		'requested_user': the socket id of the person to be invited,
	// 	}
	// Expected invite response:
	// 	** Success ** 
	// 	{
	// 		'result': 'success',
	// 		'socket_id': the socket id of the person being invited,
	// 	}
	// 	** Failure **
	// 	{
	// 		'result': 'fail',
	// 		'message': failure message
	// 	}
	// Expected invited response:
	// 	** Success ** 
	// 	{
	// 		'result': 'success',
	// 		'socket_id': the socket id of the person being invited,
	// 	}
	// 	** Failure **
	// 	{
	// 		'result': 'fail',
	// 		'message': failure message
	// 	}

	socket.on('invite', function(payload){
		log('invite with '+JSON.stringify(payload));
		if('undefined' === typeof payload || !payload){
			var error_message = 'invite had no payload, command aborted';
			log(error_message);
			socket.emit('invite_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}
		
		//Check that the message can be traced to a username
		var username = players[socket.id].username;
		if('undefined' === typeof username || !username){
			var error_message = 'invite can\'t identify who sent the message, command aborted';
			log(error_message);
			socket.emit('invite_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var requested_user = payload.requested_user;
		if('undefined' === typeof requested_user || !requested_user){
			var error_message = 'invite didn\'t specify a requested user, command aborted';
			log(error_message);
			socket.emit('invite_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var room = players[socket.id].room;
		var roomObject = io.sockets.adapter.rooms[room];
		// Make sure that the user being invited is in the room

		if (!roomObject.sockets.hasOwnProperty(requested_user)){
			var error_message = 'invite requested a user that wasn\'t in the room, command aborted';
			log(error_message);
			socket.emit('invite_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		// If everything is okay, respond to the inviter that the invite was successful

		var success_data = {
			result: 'success',
			socket_id: requested_user,
		}

		socket.emit('invite_response', success_data);

		// Tell the invitee that they have been invited

		var success_data = {
			result: 'success',
			socket_id: socket.id,
		}

		socket.to(requested_user).emit('invited', success_data);

		log('Invite successful');
	});

	// Expected payload for uninvite:
	// 	payload: {
	// 		'requested_user': the socket id of the person to be invited,
	// 	}
	// Expected uninvite response:
	// 	** Success ** 
	// 	{
	// 		'result': 'success',
	// 		'socket_id': the socket id of the person being invited,
	// 	}
	// 	** Failure **
	// 	{
	// 		'result': 'fail',
	// 		'message': failure message
	// 	}
	// Expected uninvited response:
	// 	** Success ** 
	// 	{
	// 		'result': 'success',
	// 		'socket_id': the socket id of the person being invited,
	// 	}
	// 	** Failure **
	// 	{
	// 		'result': 'fail',
	// 		'message': failure message
	// 	}

	socket.on('uninvite', function(payload){
		log('uninvite with '+JSON.stringify(payload));
		if('undefined' === typeof payload || !payload){
			var error_message = 'Uninvite had no payload, command aborted';
			log(error_message);
			socket.emit('uninvite_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}
		
		//Check that the message can be traced to a username
		var username = players[socket.id].username;
		if('undefined' === typeof username || !username){
			var error_message = 'Uninvite can\'t identify who sent the message, command aborted';
			log(error_message);
			socket.emit('uninvite_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var requested_user = payload.requested_user;
		if('undefined' === typeof requested_user || !requested_user){
			var error_message = 'Uninvite didn\'t specify a requested user, command aborted';
			log(error_message);
			socket.emit('uninvite_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var room = players[socket.id].room;
		var roomObject = io.sockets.adapter.rooms[room];
		// Make sure that the user being uninvited is in the room

		if (!roomObject.sockets.hasOwnProperty(requested_user)){
			var error_message = 'Uninvite requested a user that wasn\'t in the room, command aborted';
			log(error_message);
			socket.emit('uninvite_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		// If everything is okay, respond to the uninviter that the uninvite was successful

		var success_data = {
			result: 'success',
			socket_id: requested_user,
		}

		socket.emit('uninvite_response', success_data);

		// Tell the uninvitee that they have been uninvited

		var success_data = {
			result: 'success',
			socket_id: socket.id,
		}

		socket.to(requested_user).emit('uninvited', success_data);

		log('Uninvite successful');
	});

	// Expected payload for game_start:
	// 	payload: {
	// 		'requested_user': the socket id of the person to be invited,
	// 	}
	// Expected game_start_response:
	// 	** Success ** 
	// 	{
	// 		'result': 'success',
	// 		'socket_id': the socket id of the person you are playing with,
	//		'game_id': id of the game session
	// 	}
	// 	** Failure **
	// 	{
	// 		'result': 'fail',
	// 		'message': failure message
	// 	}


	socket.on('game_start', function(payload){
		log('game_start with '+JSON.stringify(payload));
		if('undefined' === typeof payload || !payload){
			var error_message = 'Game start had no payload, command aborted';
			log(error_message);
			socket.emit('game_start_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}
		
		//Check that the message can be traced to a username
		var username = players[socket.id].username;
		if('undefined' === typeof username || !username){
			var error_message = 'Game start can\'t identify who sent the message, command aborted';
			log(error_message);
			socket.emit('game_start_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var requested_user = payload.requested_user;
		if('undefined' === typeof requested_user || !requested_user){
			var error_message = 'Game start didn\'t specify a requested user, command aborted';
			log(error_message);
			socket.emit('game _start_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var room = players[socket.id].room;
		var roomObject = io.sockets.adapter.rooms[room];
		// Make sure that the user being uninvited is in the room

		if (!roomObject.sockets.hasOwnProperty(requested_user)){
			var error_message = 'Game start requested a user that wasn\'t in the room, command aborted';
			log(error_message);
			socket.emit('game_start_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		// If everything is okay, respond to the game starter that it was successful
		var game_id = Math.floor((1+Math.random())*0x10000).toString(16).substring(1);
		var success_data = {
			result: 'success',
			socket_id: requested_user,
			game_id: game_id
		}

		socket.emit('game_start_response', success_data);

		// Tell the invitee to play

		var success_data = {
			result: 'success',
			socket_id: socket.id,
			game_id: game_id
		}

		socket.to(requested_user).emit('game_start_response', success_data);

		log('Game start successful');
	});


	socket.on('play_token', function(payload){
		log('play_token with '+JSON.stringify(payload));
		if('undefined' === typeof payload || !payload){
			var error_message = 'Play token had no payload, command aborted';
			log(error_message);
			socket.emit('play_token_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}
		
		//Check that the player has been previously registered
		var player = players[socket.id];
		if('undefined' === typeof player || !player){
			var error_message = 'Server doesn\'t recognize you (try going back one screen), command aborted';
			log(error_message);
			socket.emit('play_token_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var username = players[socket.id].username;
		if('undefined' === typeof username || !username){
			var error_message = 'Play token can\'t identify who sent the message, command aborted';
			log(error_message);
			socket.emit('play_token_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var game_id = players[socket.id].room;
		if('undefined' === typeof game_id || !game_id){
			var error_message = 'Play token can\'t find your game board, command aborted';
			log(error_message);
			socket.emit('play_token_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var row = payload.row;
		if('undefined' === typeof row || row < 0 || row > 7){
			var error_message = 'Play token didn\'t specify a valid row, command aborted';
			log(error_message);
			socket.emit('play_token_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var column = payload.column;
		if('undefined' === typeof column || column < 0 || column > 7){
			var error_message = 'Play token didn\'t specify a valid column, command aborted';
			log(error_message);
			socket.emit('play_token_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var color = payload.color;
		if('undefined' === typeof color || !color || (color != 'light' && color != 'dark')){
			var error_message = 'Play token didn\'t specify a valid color, command aborted';
			log(error_message);
			socket.emit('play_token_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		var game = games[game_id];
		if('undefined' === typeof game || !game){
			var error_message = 'Play token couldn\'t find your game board, command aborted';
			log(error_message);
			socket.emit('play_token_response', {
				result: 'fail',
				message: error_message
			});
			return;
		}

		if(color !== game.whose_turn){
        	var error_message = 'play_token message played out of turn';
        	log(error_message);
        	socket.emit('play_token_response', {
            	result: 'fail',
             	message: error_message
            });
         	return;
         }

         if( ((game.whose_turn === 'light') && (game.player_light.socket != socket.id)) || ((game.whose_turn === 'dark') && (game.player_dark.socket != socket.id))){
	        var error_message = 'play_token turn played by wrong player ';
	        log(error_message);
	        socket.emit('play_token_response', {
	        	result: 'fail',
	        	message: error_message
	        });
			return;
		}

		var success_data = {
			result: 'success'
		};

		socket.emit('play_token_response', success_data);

		if(color == 'light'){
			game.board[row][column] = 'l';
			flip_board('l',row,column,game.board);
			game.whose_turn = 'dark';
			game.legal_moves = calculate_valid_moves('d',game.board);
		} else if(color == 'dark'){
			game.board[row][column] = 'd';
			flip_board('d',row,column,game.board);
			game.whose_turn = 'light';
			game.legal_moves = calculate_valid_moves('l',game.board);
		}

		var d = new Date();
		game.last_move_time = d.getTime();

		send_game_update(socket, game_id, 'played a token');
	});
});

// Code related to the game state

var games = [];

function create_new_game(){
	var new_game = {};
	new_game.player_light = {};
	new_game.player_dark = {};
	new_game.player_light.username = '';
	new_game.player_light.socket = '';
	new_game.player_dark.username = '';
	new_game.player_dark.socket = '';

	var d = new Date();
	new_game.last_move_time = d.getTime();

	new_game.whose_turn = 'dark';

	new_game.board = [
		[' ',' ',' ',' ',' ',' ',' ',' '],
		[' ',' ',' ',' ',' ',' ',' ',' '],
		[' ',' ',' ',' ',' ',' ',' ',' '],
		[' ',' ',' ','l','d',' ',' ',' '],
		[' ',' ',' ','d','l',' ',' ',' '],
		[' ',' ',' ',' ',' ',' ',' ',' '],
		[' ',' ',' ',' ',' ',' ',' ',' '],
		[' ',' ',' ',' ',' ',' ',' ',' ']
	];

	new_game.legal_moves = calculate_valid_moves('d', new_game.board);

	return new_game;
}

function check_line_match(who, dr, dc, r, c, board){
	if(board[r][c] === who){
		return true;
	}

	if(board[r][c] === ' '){
		return false;
	}

	if( (r+dr < 0) || (r+dr > 7) ){
		return false;
	}

	if( (c+dc < 0) || (c+dc > 7) ){
		return false;
	}

	return check_line_match(who,dr,dc,r+dr,c+dc,board);
}


// Check if the position at r,c contains the opposite of who on the board
// and if the line indicated by adding dr to r and dc to c eventually sends
// in the who color

function valid_move(who,dr,dc,r,c,board){
	var other;

	if(who === 'd'){
    	other = 'l';
	} else if(who === 'l'){
   		other = 'd';
  	} else {
    	log('Houston, we have a color problem: '+who);
    	return false;
  	}

  	if( (r+dr < 0) || (r+dr > 7) ){
    	return false;
  	}

	if( (c+dc < 0) || (c+dc > 7) ){
		return false;
  	}

  	if(board[r+dr][c+dc] != other){
	    return false;
	}

	if( (r+dr+dr < 0) || (r+dr+dr > 7) ){
		return false;
	}

	if( (c+dc+dc < 0) || (c+dc+dc > 7) ){
		return false;
	}

	return check_line_match(who,dr,dc,r+dr+dr,c+dc+dc,board);
}

function calculate_valid_moves(who,board){
	var valid = [
		[' ',' ',' ',' ',' ',' ',' ',' '],
		[' ',' ',' ',' ',' ',' ',' ',' '],
		[' ',' ',' ',' ',' ',' ',' ',' '],
		[' ',' ',' ',' ',' ',' ',' ',' '],
		[' ',' ',' ',' ',' ',' ',' ',' '],
		[' ',' ',' ',' ',' ',' ',' ',' '],
		[' ',' ',' ',' ',' ',' ',' ',' '],
		[' ',' ',' ',' ',' ',' ',' ',' ']
	];

	for(var row = 0; row < 8; row++){
		for(var column = 0; column < 8; column++){
			if(board[row][column] === ' '){
				nw = valid_move(who,-1,-1,row,column,board);
				nn = valid_move(who,-1, 0,row,column,board);
				ne = valid_move(who,-1, 1,row,column,board);

				ww = valid_move(who, 0,-1,row,column,board);
				ee = valid_move(who, 0, 1,row,column,board);

				sw = valid_move(who, 1,-1,row,column,board);
				ss = valid_move(who, 1, 0,row,column,board);
				se = valid_move(who, 1, 1,row,column,board);

				if(nw || nn || ne || ww || ee || sw || ss || se){
					valid[row][column] = who;
				}
			}
		}
	}
	return valid;
}

function flip_line(who, dr, dc, r, c, board){
	if( (r+dr < 0) || (r+dr > 7) ){
		return false;
	}
	if( (c+dc < 0) || (c+dc > 7) ){
		return false;
	}

	if(board[r+dr][c+dc] === ' '){
		return false;
	}
	if(board[r+dr][c+dc] === who){
	return true;
	} else {
		if(flip_line(who,dr,dc,r+dr,c+dc,board)){
	    	board[r+dr][c+dc] = who;
	    	return true;
	    } else {
			return false;
	    }
  }
}

function flip_board(who,row,column,board){
	flip_line(who,-1,-1,row,column,board);
	flip_line(who,-1, 0,row,column,board);
	flip_line(who,-1, 1,row,column,board);

	flip_line(who, 0,-1,row,column,board);
	flip_line(who, 0, 1,row,column,board);

	flip_line(who, 1,-1,row,column,board);
	flip_line(who, 1, 0,row,column,board);
	flip_line(who, 1, 1,row,column,board);
}


function send_game_update(socket, game_id, message){
	
	// Check to see if a game with game_id already exists & only 2 people are in the room
	
	if(('undefined' === typeof games[game_id]) || !games[game_id]){
		console.log('No game exists. Creating '+game_id+' for '+socket.id);
		games[game_id] = create_new_game();

	}

	var roomObject;
	var numClients;
	do{
		roomObject = io.sockets.adapter.rooms[game_id];
		numClients = roomObject.length;

		if(numClients > 2){
			console.log('Too many clients in room: '+game_id+' #: '+numClients);
			if(games[game_id].player_light.socket == roomObject.sockets[0]){
				games[game_id].player_light.socket = '';
				games[game_id].player_light.username = '';
			}
			if(games[game_id].player_dark.socket == roomObject.sockets[0]){
				games[game_id].player_dark.socket = '';
				games[game_id].player_dark.username = '';
			}

			var sacrifice = Object.keys(roomObject.sockets)[0];
			io.of('/').connected[sacrifice].leave(game_id);
		}
	}
	while((numClients-1) > 2);


	// Assign this socket a color

	if((games[game_id].player_light.socket != socket.id) && (games[game_id].player_dark.socket != socket.id)){
		console.log('Player isn\'t assigned a color: '+socket.id);
		if(games[game_id].player_dark.socket != '' && games[game_id].player_light.socket != ''){
			games[game_id].player_light.socket = '';
			games[game_id].player_light.username = '';
			games[game_id].player_dark.socket = '';
			games[game_id].player_dark.username = '';
		}
	}

	if(games[game_id].player_light.socket == ''){
		if(games[game_id].player_dark.socket != socket.id){
			games[game_id].player_light.socket = socket.id;
			games[game_id].player_light.username = players[socket.id].username;
		}
	}

	if(games[game_id].player_dark.socket == ''){
		if(games[game_id].player_light.socket != socket.id){
			games[game_id].player_dark.socket = socket.id;
			games[game_id].player_dark.username = players[socket.id].username;
		}
	}

	// Send game update

	var success_data = {
		result: 'success',
		game: games[game_id],
		message: message,
		game_id: game_id
	}

	io.in(game_id).emit('game_update', success_data);

	// Check to see if the game is over

	var row, column;
	var count = 0;
	var dark = 0;
	var light = 0;

	for(row = 0; row <8; row++){
		for(column = 0; column < 8; column++){
			if(games[game_id].legal_moves[row][column] != ' '){
				count++;
			}
			if(games[game_id].board[row][column] === 'd'){
				dark++;
			}
			if(games[game_id].board[row][column] === 'l'){
				light++;
			}
		}
	}


	if(count == 0){
  		var winner = 'tie game';

	  	if(dark > light){
			winner = 'dark';
	  	}
	  	if(light > dark){
	    	winner = 'light';
	  	}

		var success_data = {
			result: 'success',
			game: games[game_id],
			who_won: winner,
			game_id: game_id
		}

		io.in(game_id).emit('game_over', success_data);

		setTimeout(function(id){
			return function(){
				delete games[id];
			}
		}(game_id), 60*60*1000);
	}
}










