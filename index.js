"use strict";
// Chargement du module
var express = require( 'express' );
// Création d'une instance d'express
var app = express();

app.get('/', function index( request, response){ 
	return response.send('Hello world');
});

var server = app.listen(3000, function endInit(){
	console.log("Server is listening on port ", server.address().port);
});

