var redis = require('redis');
var bcrypt = require('bcrypt');

//create long-running Redis connection
var db = redis.createClient();

module.exports = User;

function User(obj) {
  for (var key in obj) {
    this[key] = obj[key];
  }
};

User.prototype.save = function(fn) {
  if (this.id) {
    this.update(fn);
  } else {
    var user = this;

    // Create unique ID
    db.incr('user:ids', function(err, id){
      if (err) return fn(err);
      user.id = id;
      user.hashPassword(function(err){
        if (err) return fn(err);
        user.update(fn);
      });
    });
  }
};

User.prototype.update = function(fn) {
  var user = this;
  var id = user.id;

  // Index user ID by name
  db.set('user:id:' + user.name, id, function(err){
    if (err) return fn(err);

    // Use Redis hash to store data
    db.hmset('user:' + id, user, function(err){
      fn(err);
    });
  });
};

User.prototype.hashPassword = function(fn){
  var user = this;

  // Generate a 12-char salt
  bcrypt.genSalt(12, function(err, salt){
    if (err) return fn(err);
    user.salt = salt;
    bcrypt.hash(user.pass, salt, function(err, hash){
      if (err) return fn(err);
      user.pass = hash;
      fn();
    });
  });
}

User.getByName = function(name, fn){

  // Look up user ID by name
  User.getId(name, function(err, id){
    if (err) return fn(err);
    User.get(id, fn);
  });
};

// Get id indexed by name
User.getId = function(name, fn){
  db.get('user:id:' + name, fn);
}

// Fetch plain object hash
// Convert plan object to a new User object
User.get = function(id, fn){
  db.hgetall('user:' + id, function(err, user){
    if (err) return fn(err);
    fn(null, new User(user));
  });
};

User.authenticate = function(name, pass, fn){
  User.getByName(name, function(err, user){
    if (err) return fn(err);
    if (!user.id) return fn(); // User doesn't exist
    bcrypt.hash(pass, user.salt, function(err, hash){
      if (err) return fn(err);
      if (hash == user.pass) return fn(null, user); // Match found
      fn(); // Invalid pw
    });
  });
};

// var tobi = new User({
//   name: 'Tobi',
//   pass: 'im a ferret',
//   age: '2'
// });

// tobi.save(function(err){
//   if (err) throw err;
//   console.log('user id %d', tobi.id);
// });