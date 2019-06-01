
function drawBoard(){
	let squares = [];
	let rowCount = 0;
	let colCount = 0;

	for (let i = 0; i < 64; i++){
		squares[i] = `${rowCount}_${colCount}`;
		if((colCount+1)%8 === 0){
			colCount = 0;
			rowCount++
		} else {
			colCount++
		}
	}
	squares.map(square => {
		return (
			$('#board').addClass('drawn').append(`<div id=${square} class='square'></div>`)
		)
	})	
}

window.onload=function(){
	drawBoard();
}