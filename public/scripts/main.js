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

var chatRoom = getURLparams('gameId');
if('undefined' == typeof chatRoom || !chatRoom){
	chatRoom = 'lobby';
}

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
	if(payload.socket_id == socket.id){
		return;
	} 

	var dom_elements = $('.socket_'+payload.socket_id);
	if( dom_elements.length == 0) {
		var nodeA = $('<div></div>');
		nodeA.addClass('socket_'+payload.socket_id);
		var nodeB = $('<div></div>');
		nodeB.addClass('socket_'+payload.socket_id);
		var nodeC = $('<div></div>');
		nodeC.addClass('socket_'+payload.socket_id);

		nodeA.addClass('');
		nodeB.addClass('');
		nodeB.append('<h4 class=\'name\'>'+payload.username+'</h4>');
		nodeC.addClass('');

		var buttonC = makeInviteButton();
		nodeC.append(buttonC);

		nodeA.hide();
		nodeB.hide();
		nodeC.hide();

		$('#players').append(nodeA,nodeB,nodeC);
		nodeA.slideDown(1000);
		nodeB.slideDown(1000);
		nodeC.slideDown(1000);

	} else {
		var buttonC = makeInviteButton();
		$('./socket_'+payload.socket_id+' button').replaceWith(buttonC);
		dom_elements.slideDown(1000);
	}

	var newHTML = '<p>'+payload.username+' has entered the lobby</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').append(newNode);
	newNode.slideDown(1000);
});

//Player disconnects
socket.on('player_disconnected', function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	if(payload.socket_id == socket.id){
		return;
	} 

	var dom_elements = $('.socket_'+payload.socket_id);
	if( dom_elements.length != 0) {
		dom_elements.slideUp(1000);
	}

	var newHTML = '<p>'+payload.username+' has left the lobby</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').append(newNode);
	newNode.slideDown(1000);
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

function makeInviteButton(){
	var newHTML = '<button type=\'button\' class=\'small\'>Invite</button>';
	var newNode = $(newHTML);
	return(newNode);

}

$(function(){
	var payload = {};
	payload.room = chatRoom;
	payload.username = username;

	console.log('*** Client Log Message: \' join_room\' payload: '+JSON.stringify(payload));
	socket.emit('join_room', payload);
});