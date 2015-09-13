"use strict";
// Chargement du module
var express = require( 'express' );
var controler = require( './controler');
var bodyParser = require('body-parser');


// setup de la DB

controler.initDB();

// Création d'une instance d'express
var app = express();

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.engine('html', require('ejs').renderFile);

// Lecture des routes dans l'ordre. Sort à la première correspondant à l'URL
app.get('/hello/:name', function (request, response) {
	//return response.send('Bonjour  '+ request.params.name );
	return response.render('hello.html', {name:request.params.name});
});

app.get('/article/:name', controler.article);

app.get('/create', function (request, response) {
	return response.render('createArticle.html');
});

app.post('/create', controler.createArticle);

app.get('/list', controler.list);

app.get('/', function index( request, response){ 
	return response.render('hello.html', {name: 'world'});
});

var server = app.listen(3000, function endInit(){
	console.log("Server is listening on port ", server.address().port);
});

