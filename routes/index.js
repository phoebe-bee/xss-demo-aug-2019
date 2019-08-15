var express = require('express');
var router = express.Router();
var db = require('../models');
var bcrypt = require('bcrypt');
var xss = require('xss');

/* GET home page. */
router.get('/', function(req, res, next) {
  var user = null;
  if (req.session && req.session.user) {
    db.post.findAll().then(function (posts) {
      res.render('forum_dashboard', {title: 'Home', posts: posts, user: req.session.user});
    });
  } else {
    res.redirect('/login');
  }
});

router.get('/post', function (req, res, next) {
  var post_id = req.query.id;
  db.post.findOne({where: {id: post_id}}).then(function (post_obj) {
    if (post_obj) {
      res.render('post', {post: post_obj.dataValues, user: req.session.user});
    } else {
      req.session.notifications = [{level: "danger", text: 'That post doesn\'t exist.'}];
      res.redirect('/').then(function () {
        req.session.notifications = [];
      });
    }
  });
});

router.post('/post', function (req, res, next) {
  var post_id = req.body.id;
  if (req.session.user.isAdmin) {
    db.post.destroy({where:{id: post_id}}).then(function () {
      res.redirect('/');
    });
  } else {
    req.session.notifications = [{level: "danger", text: 'Access denied'}];
    res.redirect('/').then(function () {
      req.session.notifications = [];
    });
  }
});

router.post('/new', function (req, res, next) {
  if (req.session && req.session.user) {
    res.render('new', {user: req.session.user});
  } else {
    req.session.notifications = [{level: "danger", text: 'You must be logged in to do that'}];
    res.redirect('/login').then(function () {
      req.session.notifications = [];
    });
  }
});

router.post('/save_post', function (req, res, next) {
  var safe_title = req.body.title || "";
  var unsafe_post_body = xss(req.body.post_body || "");
  var safe_post_body = xss(unsafe_post_body);
  if (safe_post_body && safe_title) {
    db.post.build({title: safe_title, post_body: safe_post_body, author: req.session.user.username}).save().then(function (post) {
      res.redirect('/post?id='+post.dataValues.id);
    });
  } else {
    req.session.notifications = [{level: "warn", text: 'Your post must have a title and a body!'}];
    res.redirect('/new').then(function () {
      req.session.notifications = [];
    });
  }
});

router.get('/signup', function (req, res, next) {
  if (req.session && req.session.user) {
    res.redirect('/');
  } else {
    var notifications = req.session.notifications;
    res.render('sign_up', {title: 'Sign Up!', notifications: notifications}).then(function () {
      req.session.notifications = [];
    });
  }
});

router.get('/login', function (req, res, next) {
  if (req.session && req.session.user) {
    res.redirect('/');
  } else {
    var notifications = req.session.notifications;
    res.render('login', {title: 'Log In', notifications: notifications}).then(function () {
      req.session.notifications = [];
    });
  }
});

router.post('/login', function (req, res, next) {
  var email = req.body.email;
  var password = req.body.password;
  if (email && password) {
    db.user.findOne({where: {email: email}}).then(function (user_obj) {
      if (user_obj) {
        bcrypt.compare(password, user_obj.dataValues.password, function(err, result) {
          if (err || !result) {
            req.session.notifications = [{level: "danger", text: 'That email/password combination is not recognised.'}];
            res.redirect('/login').then(function () {
              req.session.notifications = [];
            });
          } else if (result) {
            req.session.user = user_obj.dataValues;
            req.session.user.isAdmin = user_obj.dataValues.id === 1;
            res.redirect('/');
          }
        });
      } else {
        req.session.notifications = [{level: "danger", text: 'That email/password combination is not recognised.'}];
        res.redirect('/login').then(function () {
          req.session.notifications = [];
        });
      }
    });
  } else {
    req.session.notifications = [{level: "warn", text: 'Please make sure you fill in both fields.'}];
    res.redirect('/login').then(function () {
      req.session.notifications = [];
    });
  }
});

router.post('/signup', function (req, res, next) {
  var email = req.body.email;
  var unsafe_username = req.body.username;
  var safe_username = xss(unsafe_username);
  var password = req.body.password;

  if (email && safe_username && password) {
    bcrypt.hash(password, 10, function(err, hash) {
      db.user.build({email: email, username: safe_username, password: hash}).save().then(function (user_obj) {
        req.session.user = user_obj.dataValues;
        req.session.user.isAdmin = user_obj.dataValues.id === 1;
        res.redirect('/');
      });
    });
  } else {
      res.session.notifications([{level: 'danger', text:'Could not create an account with those credentials.'}]);
      res.render('signup').then(function () {
        req.session.notifications = [];
      })
  }
});

router.post('/logout', function (req, res, next) {
  req.session.destroy(function (err) {
    if (err) {
      console.error(err);
    } else {
      res.redirect('/login');
    }
  });
});

module.exports = router;
