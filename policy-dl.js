var fs = require('fs');

var AWS = require("aws-sdk");
AWS.config.loadFromPath('./config.json');
var s3 = new AWS.S3();

var policy_dl = function () {

    fs.exists('policy.json', function (exists) {
        if (exists) console.log('policy.json exist');

        else {
            console.log('policy.json doesn\'t exists - downloading');

            s3.getObject(
                { Bucket: 'koszykadi', Key: 'config/policy.json' },
                function (err, data) {
                    if (err) throw new Error(err.stack);
                    else {
                        fs.writeFile('policy.json', data.Body);
                        console.log('policy.json exist - downloaded');
                    }
                });
        }
    });
};

exports.policy_dl = policy_dl;