var http = require('http');
var fs = require('fs');
var helpers = require("../helpers");

var AWS = require("aws-sdk");
AWS.config.loadFromPath('./config.json');

var s3 = new AWS.S3();
var simpledb = new AWS.SimpleDB();

var task = function (request, callback) {

    var bucket = request.query.bucket;
    var key = request.query.key;
    var etag = request.query.etag;

    var filePath = 'bucketfiles/' + key.replace(/[^0-9a-zA-Z_\.]/g, '_');

    s3.getObject({ Bucket: bucket, Key: key }, function (err, data) {
        if (err) callback(null, err.stack);
        else {
            // 1. get interesting data
            var metadata = data.Metadata;

            var info = {};
            info[ 'bucket' ] = bucket;
            info[ 'bucket_key' ] = key;
            info[ 'filePath_local' ] = filePath;

            var digests = {};
            digests[ 'md5' ] = helpers.calculateDigest("md5", data.Body, 'hex');
            digests[ 'sha1' ] = helpers.calculateDigest("sha1", data.Body, 'hex');
            digests[ 'sha256' ] = helpers.calculateDigest("sha256", data.Body, 'hex');
            digests[ 'sha512' ] = helpers.calculateDigest("sha512", data.Body, 'hex');

            // 2. send response
            callback(null, {
                template: 'uploaded.ejs',
                params: { info: info, digests: digests, metadata: metadata }
            });

            // 3. write file locally
            fs.writeFile(filePath, data.Body);

            // 4. store digests in simpledb
            var paramsSimpleDb = {
                DomainName: 'koszykadi',
                ItemName: 'key',
                Attributes: [
                    { Name: 'md5', Value: digests[ 'md5' ] },
                    { Name: 'sha1', Value: digests[ 'sha1' ] },
                    { Name: 'sha256', Value: digests[ 'sha256' ] },
                    { Name: 'sha512', Value: digests[ 'sha512' ] }
                ]
            };

            simpledb.putAttributes(paramsSimpleDb, function (err, data) {
                if (err) callback(null, err.stack);
            });
        }
    });
};

exports.action = task;