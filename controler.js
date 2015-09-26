"use strict";

// COMMON JS IMPORTS
var slug  = require('slug'); // slug transform to url frienldy text
var chalk = require('chalk'); // chalk is to color terminal output
var markdown = require('markdown').markdown;// markdown text formatting
var db = require('./db-utilities')

var blue    = chalk.blue;
var green   = chalk.green;
var grey    = chalk.grey;
var yellow  = chalk.yellow;

// Base de donnée
var designDocument = require('./design-docs/encyclo');

////// 
// DB SETUP FUNCTION
////// 

function initDesignDocuments() {
  var name = designDocument._id;
  db.encyclo.head(name, function(err, res, headers) {
    // Send error if something else than no document
    if (err && err.statusCode !== 404) return console.log(err);
    // to be updated, couch docs needs the last revision in parameter
    // -> Add current rev if doc exist
    if (headers && headers.etag) designDocument._rev = headers.etag.replace(/"/g,'');
    // console.log(headers.etag);
    console.log(designDocument);

    // update or create
    db.encyclo.insert(designDocument, function(err, body) {
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
  response.locals.title = 'Les articles de l\'encyclopédie';
  
  db.encyclo.view('encyclo', 'all', function(err, body) {
      if(err)return response.status(500).send('Error in the request');
      console.log(body);
     // console.log(markdown);
      // body.rows.forEach(function(row){
        // row.value = markdown.toHTML(row.value);
      // });
      // console.log(body);
      return response.render('list.html', body);
  });
};

// POST create

var create = {
  get: function getArticleForm(request, response) {
    return db.getLocalizationAndCategory( function(err, list) {
      if (err) return response.render('erreur.html', {error: 'Les listes d\'autocomplétion n\'ont pas pu être remplies'}); 
      return response.render('create-article.html',list )});
    
    },
  post: function createArticle(request, response) {
    var ca = blue('[CREATE]');
    console.log(ca, request.body);
    var body =  request.body;
    body.id = slug(body.title.trim(),slug.defaults.modes['rfc3986']);
    var today = new Date();
    body.lastChange = today.toString();
    body.author = request.user.id;
    body.lastAuthor = request.user.id;
    console.log(ca, body);
    
    db.encyclo.atomic("encyclo", "create", body.id, body, handleResponse); 

    function handleResponse(error, couchResp) {
      if (error) { 
        console.log(error);
        return response.render('createArticle.html',{error: true,});
      }
      console.log(ca, grey('couch response'), body);
      console.log(couchResp);
      // return response.redirect(302,'/article/'+body.id);
      couchResp.succes = true;
      couchResp.content = markdown.toHTML( couchResp.content);
      return response.render('article.html', couchResp);
    }
  }
};

// GET article
function article(request, response) {
  var prefix = blue('[ARTICLE]');
  console.log(prefix, request.params);
  var id = request.params.name;
  console.log(prefix, grey('get with id'), id);
  db.encyclo.get( id, function (err, couchResp) {
    if (err) return response.status(404).send(404);
    console.log(prefix, grey('couch response'), couchResp);
    couchResp.content = markdown.toHTML(couchResp.content);
    return response.render('article.html', couchResp);
  });
}


var login = {
  get: function getLogin(request, response) {
      response.locals.title = 'Login';
      return response.render('login.html');
  },
  post: function postLogin(request, response) {
    var prefix  = blue('[LOGIN]');
    var body    =  request.body;
    console.log(prefix, body);
    
    return response.render('login.html');
  },
};

var editeArticle = {
  get: function getEditeArticle(request, response) {
    console.log(request.params);
    var id = request.params._id;
    db.encyclo.get( id, function (err, couchResp) {
      if ( err ) return response.render('erreur.html',{error:'Article non trouvé dans la base ou erreur de requête à la base.'});
        couchResp.content = couchResp.content.trim();
        return response.render('edite-article.html', couchResp);
    })
  },
  post: function postEditeArticle(request, response) {
    var ca = blue('[UPDATE]');
    console.log(request.params);
    var body = request.body;
    var today = new Date();
    body.lastChange = today.toString();
    body.lastAuthor = request.user.id;
    body.content = body.content.trim();
    db.encyclo.atomic("encyclo", "update", request.params._id, body, function (error, couchResp) {
      if (error) { 
        console.log(error);
        return response.render('createArticle.html',{error: true,});
      }
      console.log(ca, grey('couch response'), request.body);
      console.log(couchResp);
      couchResp.succes = true;
      couchResp.content = markdown.toHTML(couchResp.content);
          return response.render('article.html',couchResp);
      }); 
  },
};

////// 
// COMMON JS EXPORTS
////// 

module.exports = {
  list: list,
  article: article,
  initDB: initDesignDocuments,
  login: login,
  create: create,
  editeArticle: editeArticle
};
