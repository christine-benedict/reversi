/* This code is a collab between Serena Epstein and Christine Benedict */

// Board initial setup
var old_board = [
                  [' ',' ',' ',' ',' ',' ',' ',' '],
                  [' ',' ',' ',' ',' ',' ',' ',' '],
                  [' ',' ',' ',' ',' ',' ',' ',' '],
                  [' ',' ',' ','l','d',' ',' ',' '],
                  [' ',' ',' ','d','l',' ',' ',' '],
                  [' ',' ',' ',' ',' ',' ',' ',' '],
                  [' ',' ',' ',' ',' ',' ',' ',' '],
                  [' ',' ',' ',' ',' ',' ',' ',' ']
                ];

var my_color = 'dark';
var darksum = 2;
var lightsum = 2;
var interval_timer;
var d = new Date();

// Once things are drawn, set the text for my color and elapsed time
$('#my_color').html('I am '+my_color);
$('#my_color').append('<h3 class="sub-subheader">It is '+game.whose_turn+'\'s turn. Elapsed time <span id="elapsed"></span></h3>');

clearInterval(interval_timer);
interval_timer = setInterval(function(last_time){
  return function (){
    //Do the work of updating the UI
    var d = new Date();
    var elapsedmilli = d.getTime() - last_time;
    var minutes = Math.floor(elapsedmilli / (60 * 1000));
    var seconds = Math.floor((elapsedmilli % (60 * 1000))/ 1000);

    if(seconds < 10){
    $('#elapsed').html(`${minutes}:0${seconds}`);
    }
    else{
    $('#elapsed').html(`${minutes}:${seconds}`);
    }

  }}(game.last_move_time), 1000);

// Function declarations
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
  return check_line_match(who, dr, dc, r+dr, c+dc, board);
}


/* Check if the position at r,c contains the opposite of who on the board
 * and if the line indicated by adding dr to r and dc to c eventually sends
 * in the who color */

function valid_move(who,dr,dc,r,c,board){
  var other;
  if(who === 'd'){
    other = 'l';
  }
  else if(who === 'l'){
    other = 'd';
  }
  else{
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
  return check_line_match(who, dr, dc, r+dr+dr, c+dc+dc, board);
}

function calculate_valid_moves(who, board){
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
  }
  else{
    if(flip_line(who,dr,dc,r+dr,c+dc,board)){
      board[r+dr][c+dc] = who;
      return true;
    }
    else{
      return false;
    }
  }
}

function flip_board(who, row, column, board){
  flip_line(who,-1,-1,row,column,board);
  flip_line(who,-1, 0,row,column,board);
  flip_line(who,-1, 1,row,column,board);

  flip_line(who, 0,-1,row,column,board);
  flip_line(who, 0, 1,row,column,board);

  flip_line(who, 1,-1,row,column,board);
  flip_line(who, 1, 0,row,column,board);
  flip_line(who, 1, 1,row,column,board);
}

function updateBoardImages(){
  for(let row = 0; row < 8; row++){
    for(let column = 0; column < 8; column ++){
      
      // This is a good time to also update the hover based on legal moves
      if(game.board[row][column] == ' ' && game.legal_moves[row][column] === my_color.substr(0,1)){
        $(`#${row}_${column}`).addClass('hovered_over');
      } else {
        $(`#${row}_${column}`).removeClass('hovered_over');
      }

      if(old_board[row][column] != game.board[row][column]){
        if(old_board[row][column] == 'l' && game.board[row][column] == ' '){
          $(`#${row}_${column}`).html('<img class="fade-out" src="./assets/tokens-01.svg" width="80rem" height="80rem  alt="empty square"/>');
        } else if(old_board[row][column] == 'd' && game.board[row][column] == ' '){
          $(`#${row}_${column}`).html('<img class="fade-out" src="./assets/tokens-02.svg" width="80rem" height="80rem  alt="empty square"/>');
        } else if(old_board[row][column] == 'l' && game.board[row][column] == 'd'){
          $(`#${row}_${column}`).html('<img class="light-to-dark" src="./assets/light_to_dark.svg" width="80rem" height="80rem" alt="dark square"/>')
        } else if(old_board[row][column] == 'd' && game.board[row][column] == 'l'){
          $(`#${row}_${column}`).html('<img class="dark-to-light" src="./assets/dark_to_light.svg" width="80rem" height="80rem alt="light square"/>');
        } else {
          $(`#${row}_${column}`).html('<img src="assets/images/error.svg" width="80rem" height="80rem alt="error"/>');
        }
      }
    }
  }
  old_board = game.board;
}

function checkIfWinner(){
  /* Check to see if the game is over */
  var row, column, winner;
  var count = 0;
  var black = 0;
  var white = 0;
  for(let row = 0; row < 8; row++){
    for(let column = 0; column < 8; column++){
      if(game.legal_moves[row][column] != ' '){
        count++;
      }
      if(game.board[row][column] === 'd'){
        black++;
      }
      if(game.board[row][column] === 'l'){
        white++;
      }
    }
  }

  if(count == 0){
    if(black === white){
      winner = 'tie game';
    } else if(black > white){
      winner = 'black';
    } else if(white > black){
      winner = 'white';
    } else {
      winner = null
    }
  }
  
  if (winner !== null && winner !== undefined){
    $('#game_over').html('<h1>Game over</h1><h2>'+game.who_won+' won!</h2>');
    $('#game_over').append('<a href="lobby.html?username='+winner+'" class="btn btn-success btn-lg active" role="button" aria-pressed="true">Return to the lobby</a>');
  }
}

// Create initial game state
var game = {
  whose_turn: 'dark',
  board: old_board,
  legal_moves: calculate_valid_moves('d', old_board),
  last_move_time: d.getTime(),
}

// Actually draw the game board
function drawBoard(){
  let squares = [];
  let rowCount = 0;
  let colCount = 0;

  for (let i = 0; i < 64; i++){
    squares[i] = {
      squareName:`${rowCount}_${colCount}`,
      row: rowCount,
      col: colCount
    };
    if((colCount+1)%8 === 0){
      colCount = 0;
      rowCount++
    } else {
      colCount++
    }
  }
  squares.map(square => {
    return (
      $('#board').addClass('drawn').append(`<div id=${square.squareName} class='square' onClick='clickASquare(${square.row},${square.col}); return false;' alt='empty square'></div>`)
    )
  })  
}

// Place initial tokens and set up hover
function setInitialSquares(){
  for(let row = 0; row < 8; row++){
    for( let column = 0; column < 8; column ++){
      if(game.board[row][column] == ' ' && game.legal_moves[row][column] === my_color.substr(0,1)){
        $(`#${row}_${column}`).addClass('hovered_over');
      }
      if(game.board[row][column] == 'l'){
        $(`#${row}_${column}`).html('<img class="fade-in" src="./assets/tokens-01.svg" width="80rem" height="80rem"  alt="light square"/>');
      } else if (game.board[row][column] == 'd'){
        $(`#${row}_${column}`).html('<img class="fade-in" src="./assets/tokens-02.svg" width="80rem" height="80rem"  alt="dark square"/>');
      }
    }
  }
}

// Functionality for when a user clicks a square
function clickASquare(row, column){

  // Check to make sure it is the player's turn
  if(game.whose_turn === my_color){

    // Check if valid move
    if(game.legal_moves[row][column] === my_color.substr(0,1)){

      // Add move to board array
      game.board[row][column] = 'd';

      // Flip tokens in the board array
      flip_board('d', row, column, game.board);
      
      // Place the appropriate token images
      $(`#${row}_${column}`).html('<img class="fade-in" src="./assets/tokens-02.svg" width="80rem" height="80rem" alt="dark square"/>').off('click').removeClass('hovered_over');
      updateBoardImages();
      

      // End of the player's move, add one to the count
      darksum = darksum + 1
      $('#darksum').html(darksum);
      $('#lightsum').html(lightsum);
      

      // Check if winner
      checkIfWinner();

      // Change whose turn it is
      game.whose_turn = 'light';
      game.legal_moves = calculate_valid_moves('l', game.board);
      game.last_move_time = d.getTime();
    }
  }
}

window.onload=function(){
  drawBoard();
  setInitialSquares();
  $('#darksum').html(darksum);
  $('#lightsum').html(lightsum);
}
