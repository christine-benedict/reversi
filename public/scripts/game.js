
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
			$('#board').addClass('drawn').append(`<div id=${square.squareName} class='square' onClick='clickASquare(${square.row},${square.col}); return false;' ></div>`)
		)
	})	
}

window.onload=function(){
	drawBoard();
}