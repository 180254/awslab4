var fs = require('fs');

var AWS = require("aws-sdk");
AWS.config.loadFromPath('./config.json');

var s3 = new AWS.S3();
var simpledb = new AWS.SimpleDB();

function checkStartDone(actionRemaining) {
    if (actionRemaining <= 0) {
        console.log('ON START DONE!')
    }
}
var onStart = function () {

    var actionRemaining = 2;

    fs.exists('policy.json', function (exists) {
        if (exists) {
            console.log('policy.json exist');
            checkStartDone(--actionRemaining);
        }

        else {
            console.log('policy.json doesn\'t exists - downloading');

            s3.getObject(
                { Bucket: 'koszykadi', Key: 'config/policy.json' },
                function (err, data) {
                    if (err) throw new Error(err.stack);
                    else {
                        fs.writeFile('policy.json', data.Body);
                        console.log('policy.json exist - downloaded');

                        checkStartDone(--actionRemaining);
                    }
                });
        }
    });

    simpledb.deleteDomain({ DomainName: 'koszykadi' }, function (err, data) {
        if (err) throw new Error(err.stack);
        else {
            simpledb.createDomain({ DomainName: 'koszykadi' }, function (err, data) {
                if (err)  throw new Error(err.stack);
                else checkStartDone(--actionRemaining);
            });
        }
    });
};

exports.onStart = onStart;