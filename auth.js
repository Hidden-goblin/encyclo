"use strict";

var chalk = require('chalk'); // chalk is to color terminal output
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var rc = require('rc');
var conf = rc('encyclo');

console.log(conf);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    // User.findOne({ username: username }, function(err, user) {
      // if (err) { return done(err); }
      if (username !== conf.login) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (password !== conf.password) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, {id: username});
    // });
  }
));

function init( app ) {
  app.use(passport.initialize());
  app.use(passport.session());
};

var login = passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: false });

function guard(request, response, next) {
  console.log(chalk.yellow('[GUARD]'), request.user && request.user.id);
  // console.log(request.user);
  if (request.user && request.user.id && request.user.id === conf.login) return next();
  // response.status(401).send('unauthorize');
  return response.render('erreur.html',{error: "Vous n'êtes pas connecté. Action non autorisée."});
}

module.exports = {
  init: init,
  login: login,
  guard: guard
};