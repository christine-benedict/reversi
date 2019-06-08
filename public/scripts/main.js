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

var chatRoom = getURLparams('game_id');
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
		
		nodeA.addClass('w-100')
		nodeA.append(nodeB, nodeC);
		nodeB.addClass('w-50');
		nodeB.append('<h4 class=\'name\'>'+payload.username+'</h4>');
		nodeC.addClass('w-50');

		var buttonC = makeInviteButton(payload.socket_id);
		nodeC.append(buttonC);

		nodeA.hide();
		nodeB.hide();
		nodeC.hide();

		$('#players').append(nodeA,nodeB,nodeC);
		nodeA.slideDown(1000);
		nodeB.slideDown(1000);
		nodeC.slideDown(1000);

	} else {
		uninvite(payload.socket_id);
		var buttonC = makeInviteButton(payload.socket_id);
		$('./socket_'+payload.socket_id+' button').replaceWith(buttonC);
		dom_elements.slideDown(1000);
	}

	var newHTML = '<p>'+payload.username+' has entered the room</p>';
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

	var newHTML = '<p>'+payload.username+' has left the room</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').append(newNode);
	newNode.slideDown(1000);
});

// Inviting
function invite(who){
	var payload = {};
	payload.requested_user = who;
	console.log('*** Cliend Log Message: \'invite\' payload: ' +JSON.stringify(payload));
	socket.emit('invite', payload);
}

socket.on('invite_response', function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makeInvitedButton(payload.socket_id);

	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

socket.on('invited', function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makePlayButton(payload.socket_id);

	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

// Uninviting
function uninvite(who){
	var payload = {};
	payload.requested_user = who;
	console.log('*** Cliend Log Message: \'uninvite\' payload: ' +JSON.stringify(payload));
	socket.emit('uninvite', payload);
}

socket.on('uninvite_response', function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makeInviteButton(payload.socket_id);

	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

socket.on('uninvited', function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makeInviteButton(payload.socket_id);

	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

// Game start
function game_start(who){
	var payload = {};
	payload.requested_user = who;
	console.log('*** Cliend Log Message: \'game_start\' payload: ' +JSON.stringify(payload));
	socket.emit('game_start', payload);
}

socket.on('game_start_response', function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makeEngagedButton();

	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);

	//Jump to a new page
	window.location.href = 'game.html?username='+username+'&game_id='+payload.game_id
});


// Messaging
socket.on('send_message_response', function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newHTML = '<p><b>'+payload.username+' says: </b>'+payload.message+'</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').append(newNode);
	newNode.slideDown(1000);
});

function sendMessage(){
	var payload = {};
	payload.room = chatRoom;
	payload.username = username;
	payload.message = $('#send_message_holder').val();
	console.log('*** Client Log Message: \' send_message\' payload: '+JSON.stringify(payload));
	socket.emit('send_message', payload)
}

function makeInviteButton(socket_id){
	var newHTML = '<button type=\'button\' class=\'small\'>Invite</button>';
	var newNode = $(newHTML);
	newNode.click(function(){
		invite(socket_id);
	});
	return(newNode);

}

function makeInvitedButton(socket_id){
	var newHTML = '<button type=\'button\' class=\'small\'>Invited</button>';
	var newNode = $(newHTML);
	newNode.click(function(){
		uninvite(socket_id);
	});
	return(newNode);

}

function makePlayButton(socket_id){
	var newHTML = '<button type=\'button\' class=\'small\'>Play</button>';
	var newNode = $(newHTML);
	newNode.click(function(){
		game_start(socket_id);
	});
	return(newNode);

}

function makeEngagedButton(){
	var newHTML = '<button type=\'button\' class=\'small\'>Playing</button>';
	var newNode = $(newHTML);
	return(newNode);

}

$(function(){
	var payload = {};
	payload.room = chatRoom;
	payload.username = username;

	console.log('*** Client Log Message: \' join_room\' payload: '+JSON.stringify(payload));
	socket.emit('join_room', payload);

	$('#quit').append('<a href="lobby.html?username='+username+'"><button class="small" aria-pressed="true">Quit</button></a>');		


});

var old_board = [
	['?','?','?','?','?','?','?','?'],
	['?','?','?','?','?','?','?','?'],
	['?','?','?','?','?','?','?','?'],
	['?','?','?','?','?','?','?','?'],
	['?','?','?','?','?','?','?','?'],
	['?','?','?','?','?','?','?','?'],
	['?','?','?','?','?','?','?','?'],
	['?','?','?','?','?','?','?','?']

];

var my_color = ' ';
var interval_timer;

socket.on('game_update', function(payload){
	console.log('*** Client Log Message: \' game_update\' \n\t payload: '+JSON.stringify(payload));
	if(payload.result == 'fail'){
		console.log(payload.message);
		window.location.href = 'lobby.html?username='+username;
		return;
	}
	

	var board = payload.game.board;
	if('undefined' == typeof board || !board){
		console.log('Internal error: received a malformed board update from the server');
		return;
	}

	if(socket.id == payload.game.player_light.socket){
		my_color = 'light';
	} else if(socket.id == payload.game.player_dark.socket){
		my_color = 'dark';
	} else {
		// Error catch
		window.location.href = 'lobby.html?username='+username;
		return;
	}

	$('#my_color').html('<h3 id="my_color">I am '+my_color+'</h3>');
	$('#my_color').append('<h4>It is '+payload.game.whose_turn+'\'s turn. Elapsed time <span id="elapsed"></span></h4>');

	clearInterval(interval_timer);
	interval_timer = setInterval(function(last_time){
	  	return function(){
		    //Do the work of updating the UI
		    var d = new Date();
		    var elapsedmilli = d.getTime() - last_time;
		    var minutes = Math.floor(elapsedmilli / (60 * 1000));
		    var seconds = Math.floor((elapsedmilli % (60 * 1000))/ 1000);

		    if(seconds < 10){
		    	$('#elapsed').html(minutes+':0'+seconds);
		    } else{
		    	$('#elapsed').html(minutes+':'+seconds);
		    }
		}}(payload.game.last_move_time), 1000);


	$('.drawn').ready(function(){

		var darksum = 0;
		var lightsum = 0;

		var row, column;
		for(row = 0; row < 8; row++){
			for( column = 0; column < 8; column ++){
				if(board[row][column] == 'd'){
					darksum++
				}
				if(board[row][column] == 'l'){
					lightsum++
				}
				

				if(old_board[row][column] != board[row][column]){
					if(old_board[row][column] == '?' && board[row][column] == ' '){
						$(`#${row}_${column}`).html('<div alt="empty square"/>');
					} else if(old_board[row][column] == '?' && board[row][column] == 'l'){
						$(`#${row}_${column}`).html('<img class="fade-in" src="./assets/tokens-01.svg" width="80rem" height="80rem alt="light square"/>');
					} else if(old_board[row][column] == '?' && board[row][column] == 'd'){
						$(`#${row}_${column}`).html('<img class="fade-in" src="./assets/tokens-02.svg" width="80rem" height="80rem alt="dark square"/>');
					} else if(old_board[row][column] == ' ' && board[row][column] == 'l'){
						$(`#${row}_${column}`).html('<img class="fade-in" src="./assets/tokens-01.svg" width="80rem" height="80rem  alt="light square"/>');
					} else if(old_board[row][column] == ' ' && board[row][column] == 'd'){
						$(`#${row}_${column}`).html('<img class="fade-in" src="./assets/tokens-02.svg" width="80rem" height="80rem  alt="dark square"/>');
					} else if(old_board[row][column] == 'l' && board[row][column] == ' '){
						$(`#${row}_${column}`).html('<img class="fade-out" src="./assets/tokens-01.svg" width="80rem" height="80rem  alt="empty square"/>');
					} else if(old_board[row][column] == 'd' && board[row][column] == ' '){
						$(`#${row}_${column}`).html('<img class="fade-out" src="./assets/tokens-02.svg" width="80rem" height="80rem  alt="empty square"/>');
					} else if(old_board[row][column] == 'l' && board[row][column] == 'd'){
						$(`#${row}_${column}`).html('<img class="light-to-dark" src="./assets/light_to_dark.svg" width="80rem" height="80rem" alt="dark square"/>');
					} else if(old_board[row][column] == 'd' && board[row][column] == 'l'){
						$(`#${row}_${column}`).html('<img class="dark-to-light" src="./assets/dark_to_light.svg" width="80rem" height="80rem alt="light square"/>');
					} else {
						$(`#${row}_${column}`).html('<img src="assets/images/error.svg" width="80rem" height="80rem alt="error"/>');
					}

					$(`#${row}_${column}`).off('click');
					$(`#${row}_${column}`).removeClass('hovered_over');


					if(payload.game.whose_turn === my_color){
  						if(payload.game.legal_moves[row][column] === my_color.substr(0,1)){
						$(`#${row}_${column}`).addClass('hovered_over');
						$(`#${row}_${column}`).click(function(r,c){
							return function(){
								var payload = {};
								payload.row = r;
								payload.column = c;
								payload.color = my_color;
								console.log('*** Client Log Message: \'play token\' payload: '+JSON.stringify(payload));
								socket.emit('play_token', payload)
							};
						}(row,column));
					} else {
						$(`#${row}_${column}`).removeClass('hovered_over');
					}
				}
			}
		}
		$('#darksum').html(darksum);
		$('#lightsum').html(lightsum);

		old_board = board;
	});

	socket.on('play_token_response', function(payload){
		console.log('*** Client Log Message: \' play_token_response\' \n\t payload: '+JSON.stringify(payload));
		if(payload.result == 'fail'){
			console.log(payload.message)
			alert(payload.message);
			return;
		}
	});

	socket.on('game_over', function(payload){
		console.log('*** Client Log Message: \' game_over\' \n\t payload: '+JSON.stringify(payload));
		if(payload.result == 'fail'){
			console.log(payload.message)
			return;
		}

		$('#game_over').html('<h1>Game Over</h1><h2>'+payload.who_won+' won!</h2>').addClass('game_over');
		$('#game_over').append('<a href="lobby.html?username='+username+'"><button class="large" aria-pressed="true">Return to the lobby</button></a>');		
	});
});
















