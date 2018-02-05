var mongoosedb = require('mongoose');

mongoosedb.connect('mongodb://localhost/gcs_chat_db');
var db = mongoosedb.connection;
db.on('error', console.error);

exports.test = function test() {
    console.log('Test');
};

exports.demo = function demo() {
    console.log('Demo');
};

module.exports = db;