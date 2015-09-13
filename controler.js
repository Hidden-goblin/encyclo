"use strict";

// COMMON JS IMPORTS

var nano  = require('nano')('http://localhost:5984');
var slug  = require('slug'); // slug transform to url frienldy text
var chalk = require('chalk'); // chalk is to color terminal output

var blue    = chalk.blue;
var green   = chalk.green;
var grey    = chalk.grey;
var yellow  = chalk.yellow;

// Base de donnée
var db = nano.use('encyclo');
var designDocument = require('./design-docs/encyclo');

////// 
// DB SETUP FUNCTION
////// 

function initDesignDocuments() {
  var name = designDocument._id;
  db.head(name, function(err, res, headers) {
    // Send error if something else than no document
    if (err && err.statusCode !== 404) return console.log(err);
    // to be updated, couch docs needs the last revision in parameter
    // -> Add current rev if doc exist
    if (headers && headers.etag) designDocument._rev = headers.etag.replace(/"/g,'');
    console.log(headers.etag);
    console.log(designDocument);

    // update or create
    db.insert(designDocument, function(err, body) {
      if (err) return  console.log(err);
      console.log(green('design documents done'));
    });
    
  });
}

////// 
// ROUTING CONTROLLERS
////// 

// GET list
function list(request, response){
  // Don't use list as it will also send design docs

  // db.list({include_docs: true}, function (err,body) {
  //  if(err){
  //    return response.status(500).send('Error in the request');
  //  }
  //  return response.render('list.html', body);
  // });

  db.view('encyclo', 'all', function(err, body) {
      if(err)return response.status(500).send('Error in the request');
      console.log(body);
      return response.render('list.html', body);
  });
};

// POST create
function createArticle(request, response) {
  var ca = blue('[CREATE]');
  console.log(ca, request.body);
  var body =  request.body;
  body.id = slug(body.title.trim(),slug.defaults.modes['rfc3986']);
  console.log(ca, body);
  db.atomic("encyclo", "create", body.id, body, function (error, couchResp) {
    if (error) { 
      console.log(error);
      return response.render('createArticle.html',{error: true,});
    }
    console.log(ca, grey('couch response'), body);
    console.log(couchResp);
    return response.render('createArticle.html', {succes: true,});  
  }); 
}

// GET article
function article(request, response) {
  var prefix = blue('[ARTICLE]');
  var id = request.params.name;
  console.log(prefix, grey('get with id'), id);
  db.get( id, function (err, body) {
    if (err) return response.status(404).send(404);
    console.log(prefix, grey('couch response'), body);
    return response.render('article.html', body);
  });
}

////// 
// COMMON JS EXPORTS
////// 

module.exports = {
  list: list,
  article: article,
  createArticle: createArticle,
  initDB: initDesignDocuments,
};
