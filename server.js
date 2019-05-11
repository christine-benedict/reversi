//Import libraries
var static = require('node-static');
var http = require('http');

// Config for Heroku
var port = process.env.PORT;
var directory = __dirname + '/public';

//Config for localhost
if(typeof port == 'undefined' || !port ) {
	directory = './public';
	port = 8080;
}

//Static web server
var file = new static.Server(directory);

//This is our actual app
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