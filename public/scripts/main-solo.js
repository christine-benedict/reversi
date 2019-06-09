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
var date = new Date();

var computerOptions = [];
var computerMoveTimeout;

// Create initial game state
var game = {
  whose_turn: 'dark',
  board: JSON.parse(JSON.stringify(old_board)),
  legal_moves: calculate_valid_moves('d', old_board),
  last_move_time: date.getTime(),
}

// Once things are drawn, set the text for my color and elapsed time
  $('#my_color').append(`<h3 class="sub-subheader">It is <span class="${game.whose_turn}">&nbsp;${game.whose_turn}'s&nbsp;</span> turn. <span class="elapsed">&nbsp;&nbsp;Elapsed time <span id="elapsed"></span></span></h3>`);

function intervalTimer(last_move_time){
  clearInterval(interval_timer)
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

    }}(last_move_time), 1000);
}

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
        
        $(`#${row}_${column}`).removeClass('hovered_over');

        if(nw || nn || ne || ww || ee || sw || ss || se){
          valid[row][column] = who;
          if(who === 'l'){
            computerOptions.push({row: row, column: column});
          } else if(who ==='d'){
            $(`#${row}_${column}`).addClass('hovered_over');
          }
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

  darksum = 0;
  lightsum = 0;

  for(let row = 0; row < 8; row++){
    for(let column = 0; column < 8; column++){
      
      if(game.board[row][column] == 'l'){
        lightsum = lightsum +1;
      }
      if(game.board[row][column] == 'd'){
        darksum = darksum + 1
      }
      
      // // This is a good time to also update the hover based on legal moves
      // if(game.board[row][column] == ' ' && game.legal_moves[row][column] === my_color.substr(0,1)){
      //   $(`#${row}_${column}`).addClass('hovered_over');
      // } else {
      //   $(`#${row}_${column}`).removeClass('hovered_over');
      // }

      if(old_board[row][column] !== game.board[row][column]){  
        if(old_board[row][column] === ' ' && game.board[row][column] === 'd'){
          $(`#${row}_${column}`).html('<img class="fade-in" src="./assets/tokens-02.svg" width="80rem" height="80rem" alt="dark square"/>').off('click').removeClass('hovered_over');
        } else if(old_board[row][column] === ' ' && game.board[row][column] === 'l'){
          $(`#${row}_${column}`).html('<img class="fade-in" src="./assets/tokens-01.svg" width="80rem" height="80rem" alt="dark square"/>').off('click').removeClass('hovered_over');
        } else if(old_board[row][column] === 'l' && game.board[row][column] === 'd'){
          $(`#${row}_${column}`).html(`<img class="fade-in transitional" id="pow" src="./assets/hovers/${Math.floor(Math.random()*7)}.png"/>`).delay(1000).queue(function(n) {
            $(this).html('<img class="light-to-dark" src="./assets/light_to_dark.svg" width="80rem" height="80rem" alt="dark square"/>');
            n();
          })        
        } else if(old_board[row][column] === 'd' && game.board[row][column] === 'l'){
          $(`#${row}_${column}`).html(`<img class="fade-in transitional" id="pow" src="./assets/hovers/${Math.floor(Math.random()*7)}.png"/>`).delay(1000).queue(function(n) {
              $(this).html('<img class="dark-to-light" src="./assets/dark_to_light.svg" width="80rem" height="80rem" alt="light square"/>');
              n();
          })
        } else {
          $(`#${row}_${column}`).html('<img src="assets/images/error.svg" width="80rem" height="80rem alt="error"/>');
        }
      }
    }
  }
  old_board = JSON.parse(JSON.stringify(game.board));
}

function checkIfWinner(){
  /* Check to see if the game is over */
  var winner;
  var count = 0;
  var dark = 0;
  var light = 0;
  for(let row = 0; row < 8; row++){
    for(let column = 0; column < 8; column++){
      if(game.legal_moves[row][column] !== ' '){
        count++;
      }
      if(game.board[row][column] === 'd'){
        dark++;
      }
      if(game.board[row][column] === 'l'){
        light++;
      }
    }
  }

  console.log('Checking for a winner. ', dark, light, 'Count is '+count)

  if(count == 0){
    if(dark === light){
      winner = 'tie game';
    } else if(dark > light){
      winner = 'Dark';
    } else if(light > dark){
      winner = 'Light';
    } else {
      winner = null
    }
  }
  
  if (winner !== null && winner !== undefined){
    $('#game_over').html('<h1>Game over</h1><h2>'+winner+' won!</h2>').addClass('game_over');
    $('#game_over').append('<a href="./index.html" role="button" aria-pressed="true"><button class="large home">Return to Start</button></a><a href="./sologame.html" role="button" aria-pressed="true"><button class="large home">Play Again</button></a>');
    return true;
  } else {
    return false;
  }
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

function computersTurn(row, column){

    // Add move to board array
    game.board[row][column] = 'l';

    // Flip tokens in the board array
    flip_board('l', row, column, game.board);
    
    // Place the appropriate token images
    updateBoardImages();
    

    // End of the player's move, add one to the count
    $('#darksum').html(darksum);
    $('#lightsum').html(lightsum);

    // Change whose turn it is

    game.whose_turn = 'dark';
    game.legal_moves = JSON.parse(JSON.stringify(calculate_valid_moves('d', game.board)));
    game.last_move_time = new Date().getTime();
    computerOptions = [];
    $('#my_color').html(`<h3 class="sub-subheader">It is <span class="${game.whose_turn}">&nbsp;${game.whose_turn}'s&nbsp;</span> turn. Elapsed time <span id="elapsed"></span></h3>`);
    clearInterval(interval_timer);
    intervalTimer(game.last_move_time);
    clearTimeout(computerMoveTimeout);


    // Check if winner
    checkIfWinner();
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
      updateBoardImages('d');
      

      // End of the player's move, add one to the count
      $('#darksum').html(darksum);
      $('#lightsum').html(lightsum);

      // Change whose turn it is
      game.whose_turn = 'light';
      game.legal_moves = JSON.parse(JSON.stringify(calculate_valid_moves('l', game.board)));
      game.last_move_time = new Date().getTime();
      $('#my_color').html(`<h3 class="sub-subheader">It is <span class="${game.whose_turn}">&nbsp;${game.whose_turn}'s&nbsp;</span> turn. Elapsed time <span id="elapsed"></span></h3>`);
      clearInterval(interval_timer);
      intervalTimer(game.last_move_time);

      // Check if winner
      checkIfWinner();      

      let computerMove = Math.floor(Math.random()*computerOptions.length);
      
      if(!checkIfWinner()){
        computerMoveTimeout = setTimeout(() => {
          computersTurn(computerOptions[computerMove].row, computerOptions[computerMove].column)}, 3000
        );
      }
    }
  }
}

window.onload=function(){
  drawBoard();
  setInitialSquares();
  $('#darksum').html(darksum);
  $('#lightsum').html(lightsum);
  intervalTimer(game.last_move_time);
}
