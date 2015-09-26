"use strict";

var rc    = require('rc');
var conf  = rc('encyclo');
var hote  = 'http://'+ conf.baselogin+':'+conf.basepasswd+'@localhost:5984';
var nano  = require('nano')(hote);
var async = require('async'); // synchronize callbacks
var db = nano.use('encyclo');

function unkey(row) {
  return row.key;
}

function getLocalizationAndCategory( done ) {
  async.parallel({
    categories: function(callback) {
      db.view('encyclo','byCategory', {group: true}, callback);
    }, 
    localizations: function(callback) {
      db.view('encyclo','byLocalization', {group: true}, callback);
    }
  }, function (err, result) {
      if (err) return done(err);
      return done( null, {
        categories: result.categories[0].rows.map(unkey),
        localizations: result.localizations[0].rows.map(unkey),
      });
  });
}

module.exports = {
  nano: nano,
  encyclo: db,
  getLocalizationAndCategory: getLocalizationAndCategory,
};