var util = require("util");
var helpers = require("../helpers");
var Policy = require("../s3post").Policy;
var S3Form = require("../s3post").S3Form;
var AWS_CONFIG_FILE = "config.json";
var POLICY_FILE = "policy.json";
var INDEX_TEMPLATE = "index.ejs";

var AWS = require("aws-sdk");
AWS.config.loadFromPath('./config.json');
var simpledb = new AWS.SimpleDB();

// credits: friends @ stackoverflow
// http://stackoverflow.com/posts/2117523/revisions
var uuid = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

var task = function(request, callback){
	//1. load configuration
	var awsConfig = helpers.readJSONFile(AWS_CONFIG_FILE);
	var policyData = helpers.readJSONFile(POLICY_FILE);

	//2. prepare policy
	var policy = new Policy(policyData);

	//3. generate form fields for S3 POST
	var s3Form = new S3Form(policy);
	var s3Fields = s3Form.generateS3FormFields();
	s3Form.addS3CredientalsFields(s3Fields, awsConfig);

	//4. get bucket name
	var bucketName = policyData.conditions[1].bucket;

	//5. add metadata
	s3Form.addField(s3Fields, 'x-amz-meta-my-name', 'Adrian Pedziwiatr');
	s3Form.addField(s3Fields, 'x-amz-meta-uploaded-by', request.ip);

    var logText = new Date().toLocaleString() + ' | ' +request.ip;
    var params = {
        DomainName: 'koszykadi',
        ItemName: '___FormAccessLog',
        Attributes: [ { Name: uuid(), Value:logText } ]
    };
    simpledb.putAttributes(params, function(err, data) {
        if (err) callback(null, err.stack);
        else 	callback(null, {template: INDEX_TEMPLATE, params:{fields:s3Fields, bucket:bucketName}});
    });

};

exports.action = task;
