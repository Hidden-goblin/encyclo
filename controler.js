"use strict";

// COMMON JS IMPORTS
var rc = require('rc');
var conf = rc('encyclo');
var hote = 'http://'+ conf.baselogin+':'+conf.basepasswd+'@localhost:5984';

var nano  = require('nano')(hote);
var slug  = require('slug'); // slug transform to url frienldy text
var chalk = require('chalk'); // chalk is to color terminal output
var markdown = require('markdown').markdown;// markdown text formatting

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
    // console.log(headers.etag);
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
    // if ()
  return response.render('createArticle.html');
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
    db.atomic("encyclo", "create", body.id, body, function (error, couchResp) {
      if (error) { 
        console.log(error);
        return response.render('createArticle.html',{error: true,});
      }
      console.log(ca, grey('couch response'), body);
      console.log(couchResp);
      // return response.redirect(302,'/article/'+body.id);
      return response.render('article.html',{succes: true,
                                            title: body.title,
                                            author: body.author,
                                            category: body.category,
                                            localization: body.localization,
                                            lastChange: body.lastChange,
                                            content: markdown.toHTML(body.content),
                                            _id: body.id,
                                        })
    }); 
  }
}

// GET article
function article(request, response) {
  var prefix = blue('[ARTICLE]');
  console.log(prefix, request.params);
  var id = request.params.name;
  console.log(prefix, grey('get with id'), id);
  db.get( id, function (err, body) {
    if (err) return response.status(404).send(404);
    console.log(prefix, grey('couch response'), body);
    body.content = markdown.toHTML(body.content);
    return response.render('article.html', body);
  });
}


var login = {
  get: function getLogin(request, response) {
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
    db.get( id, function (err, body) {
      if ( err ) return response.render('erreur.html',{error:'Article non trouvé dans la base ou erreur de requête à la base.'});
        body.content = body.content.trim();
        return response.render('edite-article.html', body);
    })
  },
  post: function postEditeArticle(request, response) {
    var ca = blue('[UPDATE]');
    console.log(request.params);

    db.atomic("encyclo", "update", request.params._id, request.body, function (error, couchResp) {
      if (error) { 
        console.log(error);
        return response.render('createArticle.html',{error: true,});
      }
      console.log(ca, grey('couch response'), request.body);
      console.log(couchResp);
      // return response.render('article.html',{succes: true,
      //                                       title: body.title,
      //                                       author: body.author,
      //                                       category: body.category,
      //                                       localization: body.localization,
      //                                       lastChange: body.lastChange,
      //                                       content: markdown.toHTML(body.content),
      //                                       _id: body.id,
      //                                   }) 
      db.get( request.params._id, function (err, body) {
        console.log(blue( '[POST UPTDATE GET] for new display'));
        console.log(yellow(body.name));
        if ( err ) return response.render('erreur.hml', {error: 'L\'article demandé ne peut pas être affiché'});
          return response.render('article.html',{succes: true,
                                            title: body.title,
                                            author: body.author,
                                            category: body.category,
                                            localization: body.localization,
                                            lastChange: body.lastChange,
                                            content: markdown.toHTML(body.content),
                                            _id: request.params._id, });
      }); 
      })}
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
