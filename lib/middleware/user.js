var User = require('../user');

module.exports = function(req, res, next) {
  var uid = req.session.uid;
  console.log('!!!' + uid);
  if (!uid) return next();
  console.log('????????uid exists')
  User.get(uid, function(err, user){
    if (err) return next(err);
    // Expose user data to response object
    req.user = res.locals.user = user;
    next();
  });
};