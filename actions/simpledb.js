var AWS = require("aws-sdk");
AWS.config.loadFromPath('./config.json');
var simpledb = new AWS.SimpleDB();

var task = function (request, callback) {

    var params = {
        SelectExpression: 'select * from koszykadi'
    };

    simpledb.select(params, function (err, data) {
        if (err) callback(null, err.stack);
        else     callback(null, data);
    });
};

exports.action = task;