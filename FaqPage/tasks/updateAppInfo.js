var fs = require("fs");
var xml2js = require("xml2js");

var buildTemplate = "" +
"(function(){" +
	"\"use strict\";" +
	"window.faq_is_debug = %s; " +
	"window.faq_version = '%s';" +
	"window.faq_product_id = '%s';" +
"})();";

module.exports = function (grunt) {
	grunt.registerTask("updateAppInfo", function () {
		console.log("Updating build_config.js file...");

		var self = this;
		var done = this.async();
		var parser = new xml2js.Parser();
		fs.readFile(__dirname + "\\..\\AppManifest.xml", function (err, data) {
			if (err) {
				throw err;
			}
			parser.parseString(data, function (err, result) {
				if (err) {
					throw err;
				}

				var isDebug = self.flags.debug ? 1 : 0;
				console.log(result.App.$);
				var str = require("util").format(buildTemplate, isDebug, result.App.$.Version, result.App.$.ProductID);

				fs.writeFile(__dirname + "\\..\\Scripts\\build\\build_config.js", str, function (err) {
					if (err) {
						console.log(err);
					} else {
						console.log("The file was updated.");
					}
					done();
				});
			});
		});
	});
};