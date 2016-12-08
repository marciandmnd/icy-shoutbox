var Entry = require('../lib/entry');

exports.list = function(req, res, next) {
  Entry.getRange(0, -1, function(err, entries) {
    if (err) return next(err);

    res.render('entries', {
      title: 'Entries',
      entries: entries
    });
  });
};

exports.form = function(req, res) {
  res.render('post', { title: 'Post'});
};

exports.submit = function(req, res, next){
  var title = req.body.title;
  var body = req.body.body;

  var entry = new Entry({
    "username": res.locals.user.name,
    "title": title,
    "body": body
  });
  entry.save(function(err) {
    if (err) return next(err);
    res.redirect('/');
  });
};

