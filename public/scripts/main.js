// General functions
function getURLparams(param) {
	var pageUrl = window.location.search.substring(1);
	var pageUrlVariables = pageUrl.split('&');

	for(var i=0; i <pageUrlVariables.length; i++){
		var parameterName = pageUrlVariables[i].split('=');
		if(parameterName[0] == param) {
			return parameterName[1];
		}
	}
}

var username = getURLparams('username');
if('undefied' == typeof username || !username){
	username = "Wookie"+Math.floor(Math.random()*10000);
}

var chatRoom = 'Lobby Chat';

// Connect to socket server
var socket = io.connect();

socket.on('log', function(array){
	console.log.apply(console, array);
});

socket.on('join_room_response', function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	$('#messages').append('<p>New user joined the room: '+payload.username+'</p>');
});

socket.on('send_message_response', function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	$('#messages').append('<p><b>'+payload.username+' says: </b>'+payload.message+'</p>');
});

function sendMessage(){
	var payload = {};
	payload.room = chatRoom;
	payload.username = username;
	payload.message = $('#send_message_holder').val();
	console.log('*** Client Log Message: \' send_message\' payload: '+JSON.stringify(payload));
	socket.emit('send_message', payload)
}


$(function(){
	var payload = {};
	payload.room = chatRoom;
	payload.username = username;

	console.log('*** Client Log Message: \' join_room\' payload: '+JSON.stringify(payload));
	socket.emit('join_room', payload);
});