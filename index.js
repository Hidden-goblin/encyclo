'use strict';
// Chargement du module
var express = require( 'express' );
var controler = require( './controler');
var bodyParser = require('body-parser');
// var cookieParser = require('cookie-parser');
var session = require('express-session');
var auth = require('./auth');

////// 
// DB CONFIG
////// 

controler.initDB();

////// 
// SERVER CONFIG
////// 


// Création d'une instance d'express
var app = express();
// Ajout middleware 
// app.use(cookieParser('keyboard cat'));

app.use(session({ secret: 'keyboard cat' }));

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

auth.init(app);
// set static file folder
// http://expressjs.com/api.html#express.static
app.use(express.static('./public'))

// define template engine
// http://expressjs.com/api.html#app.engine
// TODO update to consolidate
app.engine('html', require('ejs').renderFile);


////// 
// ROUTING
////// 

// Lecture des routes dans l'ordre. Sort à la première correspondant à l'URL
app.get('/hello/:name', function (request, response) {
  return response.render('hello.html', {name:request.params.name});
});

app.get('/article/:name', controler.article);

app.get('/edit/:_id', auth.guard, controler.editeArticle.get);
app.post('/edit/:_id', auth.guard, controler.editeArticle.post);

app.get('/create', auth.guard, controler.create.get);
app.post('/create', auth.guard, controler.create.post);

app.get('/login', controler.login.get);
app.post('/login', auth.login);

app.get('/list', controler.list);

app.get('/', function index( request, response){ 
  return response.render('hello.html', {name: 'world'});
});

////// 
// LAUNCHING
////// 

var server = app.listen(3000, function endInit(){
  console.log("Server is listening on port ", server.address().port);
});
