// Require important stuff
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var https = require("https");
var querystring = require("querystring");
var urlParser = require("url");

// Default base URL for method calls
var defaultMethodUrlBase = "https://api.telegram.org/bot<token>/";

var merge_options = function (obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
};

var methods = {
	me: {
		method: "getMe",
		arguments: {},
		"default": {}
	},
	msg: {
		method: "sendMessage",
		arguments: {
			chat_id: {
				required: true,
				type: "integer"
			},
			text: {
				required: true,
				type: "string"
			},
			disable_web_page_preview: {
				required: false,
				type: "boolean"
			},
			reply_to_message_id: {
				required: false,
				type: "integer",
			},
			reply_markup: {
				required: false,
				type: ['ReplyKeyboardMarkup', 'ReplyKeyboardHide','ForceReply']
			}
		},
		"default": {
			chat_id: null,
			text: null,
			disable_web_page_preview: null,
			reply_to_message_id: null,
			reply_markup: null
		}
	},
	fwd: {
		method: "forwardMessage",
		arguments: {
			chat_id: {
				required: true,
				type: "integer"
			},
			from_chat_id: {
				required: true,
				type: "integer"
			},
			message_id: {
				required: true,
				type: "integer"
			}
		},
		"default": {
			chat_id: null,
			from_chat_id: null,
			message_id: null
		}
	},
	photo: {
		method: "sendPhoto",
		arguments: {
			chat_id: {
				required: true,
				type: "integer"
			},
			photo: {
				required: true,
				type: ['InputFile', 'string']
			},
			caption: {
				required: false,
				type: "string"
			},
			reply_to_message_id: {
				required: false,
				type: "integer"
			},
			reply_markup: {
				required: false,
				type: ['ReplyKeyboardMarkup', 'ReplyKeyboardHide','ForceReply']
			}
		},
		"default": {
			chat_id: null,
			photo: null,
			caption: null,
			reply_to_message_id: null,
			reply_markup: null
		}
	},
	audio: {
		method: "sendAudio",
		arguments: {
			chat_id: {
				required: true,
				type: "integer"
			},
			audio: {
				required: true,
				type: ['InputFile', 'string']
			},
			reply_to_message_id: {
				required: false,
				type: "integer"
			},
			reply_markup: {
				required: false,
				type: ['ReplyKeyboardMarkup', 'ReplyKeyboardHide','ForceReply']
			}
		},
		"default": {
			chat_id: null,
			audio: null,
			reply_to_message_id: null,
			reply_markup: null
		}
	},
	doc: {
		method: "sendDocument",
		arguments: {
			chat_id: {
				required: true,
				type: "integer"
			},
			"document": {
				required: true,
				type: ['InputFile', 'string']
			},
			reply_to_message_id: {
				required: false,
				type: "integer"
			},
			reply_markup: {
				required: false,
				type: ['ReplyKeyboardMarkup', 'ReplyKeyboardHide','ForceReply']
			}
		},
		"default": {
			chat_id: null,
			"document": null,
			reply_to_message_id: null,
			reply_markup: null
		}
	},
	sticker: {
		method: "sendSticker",
		arguments: {
			chat_id: {
				required: true,
				type: "integer"
			},
			sticker: {
				required: true,
				type: ['InputFile', 'string']
			},
			reply_to_message_id: {
				required: false,
				type: "integer"
			},
			reply_markup: {
				required: false,
				type: ['ReplyKeyboardMarkup', 'ReplyKeyboardHide','ForceReply']
			}
		},
		"default": {
			chat_id: null,
			sticker: null,
			reply_to_message_id: null,
			reply_markup: null
		}
	},
	video: {
		method: "sendVideo",
		arguments: {
			chat_id: {
				required: true,
				type: "integer"
			},
			video: {
				required: true,
				type: ['InputFile', 'string']
			},
			reply_to_message_id: {
				required: false,
				type: "integer"
			},
			reply_markup: {
				required: false,
				type: ['ReplyKeyboardMarkup', 'ReplyKeyboardHide','ForceReply']
			}
		},
		"default": {
			chat_id: null,
			video: null,
			reply_to_message_id: null,
			reply_markup: null
		}
	},
	location: {
		method: "sendLocation",
		arguments: {
			chat_id: {
				required: true,
				type: "integer"
			},
			latitude: {
				required: true,
				type: "float"
			},
			longitude: {
				required: true,
				type: "float"
			},
			reply_to_message_id: {
				required: false,
				type: "integer"
			},
			reply_markup: {
				required: false,
				type: ['ReplyKeyboardMarkup', 'ReplyKeyboardHide','ForceReply']
			}
		},
		"default": {
			chat_id: null,
			latitude: null,
			longitude: null,
			reply_to_message_id: null,
			reply_markup: null
		}
	},
	action: {
		method: "sendChatAction",
		arguments: {
			chat_id: {
				required: true,
				type: "integer"
			},
			action: {
				required: true,
				type: "string"
			}
		},
		"default": {
			chat_id: null,
			action: null
		}
	},
	photos: {
		method: "getuserProfilePhotos",
		arguments: {
			user_id: {
				required: true,
				type: "integer"
			},
			offset: {
				required: false,
				type: "integer"
			},
			limit: {
				required: false,
				type: "integer"
			}
		},
		"default": {
			user_id: null,
			offset: null,
			limit: 100
		}
	},
	webhook: {
		method: "setWebhook",
		arguments: {
			url: {
				required: false,
				type: "string"
			}
		},
		"default": {
			url: ""
		}
	},
	updates: {
		method: "getUpdates",
		arguments: {
			offset: {
				required: false,
				type: "integer"
			},
			limit: {
				required: false,
				type: "integer"
			},
			timeout: {
				required: false,
				type: "integer"
			}
		},
		"default": {
			offset: null,
			limit: 100,
			timeout: 0
		}
	}
}

/**
 * Creates a new BotAPI-object for a bot
 *
 * @param {String} botToken	The authentication token for the bot, as provided by BotFather
 *
 * @constructor
 */

function Bot(name, token, url){
	this.url = url || defaultMethodUrlBase;
	this.name = name;
	this.token = token;

	// Add token tok url
	this.url = this.url.replace("<token>", this.token);

    this.getName = function(){
		return this.name;
	};
	this.request = function(method, options, callback){
		if(options instanceof Function){
			callback = options;
			options = callback;
		}
		options = options || {};
		callback = callback || function(){};
		var self = this;

		if (self.token == "") {
			throw new Error("Token not set. Please set the token-attribute on the Bot object");
		}

		if (!methods[method]) {
			throw new Error(method+" is an nnvalid method.");
		}
		var method = methods[method];

		var url = self.url + method.method;
		url = urlParser.parse(url);

		var result = "";

		var data = merge_options(method.default, options);
		data = querystring.stringify(data);

		var req = https.request({
			host: url.host,
			path: url.path,
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			}
		}, function(res) {
			res.on("data", function(chunk) {
				result += "" + chunk;
			});
			res.on("end", function() {
				try {
					result = JSON.parse(result);
					if (!result.ok) {
						callback(result.description);
					} else {
						callback(null, result);
					}
				} catch (e) {
					callback(e);
					console.log("ERR ", e);
				}

			});
			res.on("error", function(e) {
                self.emit('res error', e);
				callback(e);
			});
		});
        req.on("error", function(e){
            self.emit('req error', e);
        });
		req.write(data);
		req.end();
	}
}

util.inherits(Bot, EventEmitter);
module.exports = Bot;
