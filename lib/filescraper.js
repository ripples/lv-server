// borrowed from http://stackoverflow.com/a/31831122

var fs = require('fs');
var path = require('path');
var exports = {};
var folderReduceHelper = function(arr){
  if (arr.reduce) // if given an array...
    return arr.reduce(function(prev, curr, index, arr){
      if (curr.type==='folder'){ // reduce children as well
        if (curr.children)
          curr.children = folderReduceHelper(curr.children);
        prev.push(curr);
      }
      return prev;
    }, []); // provide empty array to start
  else { // check for folder, return single result
    if (arr.type === 'folder')
      return arr;
    else
      return undefined;
  }
};

exports.directoryTreeToObj = function(dir, done) {
  var results = [];

  fs.readdir(dir, function(err, list) {
    if (err)
    return done(err);

    var pending = list.length;

    if (!pending)
    return done(null, {name: path.basename(dir), type: 'folder', children: results});

    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          exports.directoryTreeToObj(file, function(err, res) {
            results.push({
              name: path.basename(file),
              type: 'folder',
              children: res
            });
            if (!--pending)
            done(null, results);
          });
        }
        else {
          results.push({
            type: 'file',
            name: path.basename(file)
          });
          if (!--pending)
          done(null, results);
        }
      });
    });
  });
};

// only return objects of type 'folder'
exports.directoryTreeFolders = function(dir, done){
  exports.directoryTreeToObj(dir, function(err, results){
    if (err)
      done(err);
    else
      done(null, folderReduceHelper(results)); // recursive helper to reduce folders.
  });
};

// only return objects of type 'file'
exports.directoryTreeFiles = function(dir, done){
  exports.directoryTreeToObj(dir, function(err, results){
    if (err)
      done(err);
    else
      done(null, results.reduce(function(prev, curr, index, arr){
        if (curr.type==='file') // push and return
          prev.push(curr);
        return prev;
      }), []); // provide empty array to start
  });
};

module.exports = exports;
