var mongoose = require('mongoose');

mongoose.connect("mongodb://localhost/cookietyperbeta", function(err){
	if(err){
		throw new Error("Mongoose connection error: "+err);
	}
});

module.exports = mongoose;
