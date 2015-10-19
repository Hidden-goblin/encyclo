"use strict";

// COMMON JS IMPORTS
var slug  = require('slug'); // slug transform to url frienldy text
var chalk = require('chalk'); // chalk is to color terminal output
var async = require('async'); // synchronize callbacks
var markdown = require('markdown').markdown;// markdown text formatting
var _ = require('lodash');
var fs = require('fs-extra');
var util = require('util');
var formidable = require('formidable');
var log4js = require('log4js');
log4js.configure({
  appenders: [
    { type: 'file', filename: 'logs/current.log', category: 'current', maxLogSize: 20480, backup: 0 }
  ]
});
var logger = log4js.getLogger('current');
logger.setLevel('ALL');

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
    // update or create
    db.encyclo.insert(designDocument, function(err, body) {
      if (err) return  console.log(err);
      logger.trace('design documents done');
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
      logger.trace(body);
     // console.log(markdown);
      // body.rows.forEach(function(row){
        // row.value = markdown.toHTML(row.value);
      // });
      // console.log(body);
      return response.render('list.html', body);
  });
};

// POST create

function createInformation( request, response ) {
  logger.trace('createInformation');
  var body = {};
    if ( request.body === undefined || request.body.title === undefined) {
      logger.trace('Creating an empty content and title');
      console.log( 'previous request', request.body );
      body.article = [{content: ' ', title: '', category: '', localization:''}];
    }
    else {
      logger.trace('Retrieving previous body');
      body = request.body;
    }
    return db.getLocalizationAndCategory( function(err, list) {
      if (err) return response.render('erreur.html', {error: 'Les listes d\'autocomplétion n\'ont pas pu être remplies'});
      _.assign( body, list);
      console.log('data to create-article', body);
      return response.render('create-article.html', body)});
};

var create = {
  get: function getArticleForm(request, response) {
    logger.trace('getArticleForm');
    return createInformation( request, response );
    },
  post: function createArticle(request, response) {
    logger.trace(request.body);
    // body must have been checked by front
    var body =  request.body;
    body.id = slug(body.title.trim(),slug.defaults.modes['rfc3986']);
    var today = new Date();
    body.lastChange = today.toString();
    body.author = request.user.id;
    body.lastAuthor = request.user.id;

    db.encyclo.atomic("encyclo", "create", body.id, body, handleResponse);

    function handleResponse(error, couchResp) {
      if (error) {
        logger.error('Article haven\'t been created');
        console.log('couchResp', couchResp);
        console.log('error', error);
        _.assign( request, {error: true,} );
        return createInformation( request, response );
      }
      // console.log(ca, grey('couch response'), body);
      // console.log(couchResp);
      // return response.redirect(302,'/article/'+body.id);
      couchResp.succes = true;
      couchResp.content = markdown.toHTML( couchResp.content);
      request = {};
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
    async.parallel({
      article: function(callback) {
        db.encyclo.get( id, callback );
      },
      listings: function(callback) {
        db.getLocalizationAndCategory(callback);
      },
    }, function(err, body) {
      if ( err ) return response.render('erreur.html',{error:'Article non trouvé dans la base ou erreur de requête à la base.'});
      return response.render('edite-article.html', body);
    });
  },
  post: function postEditeArticle(request, response) {
    var ca = blue('[UPDATE]');
    console.log(request.params);
    var body = request.body;
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

var upload = {
  get: function getUpload( request, response){
    return response.render('upload.html');
  },
  post: function postUpload( request, response){
    var form = new formidable.IncomingForm();
    var files = [];
    var fields = [];
    form.parse(request);
    form.on('field', function(field, value) {
      fields.push([field, value]);
    });

    form.on('file', function(field, file) {
      files.push([field, file]);
      var temp_path = this.openedFiles[0].path;
      // The file name of the uploaded file
      var file_name = this.openedFiles[0].name;
      // Location where we want to copy the uploaded file
      var new_location = 'uploads/';
      console.log('temp_path', temp_path);
      console.log('file_name', file_name);
      fs.copy(temp_path, new_location + file_name, function(err) {
      if ( err ) return response.render('erreur.html',{error:'File not uploaded'});
    });
    });
     form.on('end', function(fields, files) {
       return response.render("upload.html");
  });
  }
};

function fileList(request, response){
  fs.readdir('uploads/', function(err, files){
    if( err ) return response.render('erreur.html',{error:'File list can\'t be displayed'});
    console.log(files);
    var body = {filesArray: files};
    return response.render("files-list.html", body);
  });
}
//////
// COMMON JS EXPORTS
//////

module.exports = {
  list: list,
  article: article,
  initDB: initDesignDocuments,
  login: login,
  create: create,
  editeArticle: editeArticle,
  upload: upload,
  fileList: fileList,
};
