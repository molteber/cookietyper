var Bot = require("./telebot"),
	collections = require('./files/collections'),
	Room = require('./files/game');




bot = new Bot("CookieTyperBetaBot", "106390704:AAHpEbbJgu32FDSnNIQttBF5iKtUzurQm2k");

var options = {
	limit: 1,
	timeout: 60000,
	offset: 0
};

var gameitems = {
	max: 5,
	min: 1,
	curr: null,
	get: function(cb){
		if(this.curr == null) this.curr = this.max;

		var rand = this.rand(this.curr);
		if(rand == this.curr){
			// Find an item and add to game
			collections.Item.findOne({random: { $near : [Math.random(), 0] } }, function(err, doc){
				if(err || !doc){
					if(!doc) err = "Ingen items";

					console.log("ERR!! %s", err);
					cb();
				} else {
					this.curr = this.max;
					cb(doc);
				}
			});
		} else {
			if(this.curr > this.min) this.curr--;
			cb();
		}

	},
	rand: function(max){
		return Math.floor(Math.random()*max)+1;
	}
}
/*
collections.Item.create({
	name: "Golden cookie",
	command: "goldencookie"
});
collections.Item.create({
	name: "Ninja cookie",
	command: "ninja"
});*/
var getUpdates = bot.request.bind(bot, "updates", options);

var getupdatesCallback = function(err, res){
	if(!err){
		if(typeof res == "object" && res.result && res.result.length > 0 && res.result[0].update_id){
			options.offset = res.result[0].update_id+1;

			var text = res.result[0].message.text;
			var object = res.result[0].message;
			console.log("Message: %s", text);
			console.log(res.result[0].message);
			if(text){
				var words = text.split(" ");
				// Is it a command
				new Room(object.chat.id, object.from, function(game) {
					// Check if the message is a command
					console.log("has started: %s", game.setting('started', false));
					if (words[0].indexOf('/') === 0) {
						var command = words[0].split("@"+bot.getName())[0].substr(1);
						words.splice(0,1);
						words = words.join(' ');
						console.log("command: %s, %s", command, words);

						if(game.setting('started', false) && !game.doCommand(command, words, object, function(msg){
							console.log("Bot: %s", msg);
							bot.request("msg", {
								chat_id: object.chat.id,
								text: msg
							});
						})){
							console.log("checking to see if the app have that command", typeof commands, command);
							if(!commands[command]){
								if(aliases[command] && commands[aliases[command]]){
									command = aliases[command];
								}
							}
							if(commands[command]){
								console.log("Info: Triggering command [%s]", command);
								commands[command](words, res.result[0].message, function(msg){
									console.log("Bot: %s", msg);
									bot.request("msg", {
										chat_id: res.result[0].message.chat.id,
										text: msg
									});
								});
							}
						}
					} else {

						if(game.setting('started', false) == true) {
							var player = game.player;
							var cookie = 1;

							var date = new Date();
							var sec = Math.round(date.getTime()/1000);

							// Loop effects
							var effect;
							for(var i = 0; i < player.effects.length; i++){
								effect = player.effects[i];
								if(effect.expire < sec) {
									player.effects.splice(i, 1)
								} else {
									cookie *= effect.bonus;
								}
							}

							game.player.stats.cookies += cookie;
							game.game.markModified('players');
							game.game.save(function(err, save){

								// Check if we should add a item to the game
								gameitems.get(function(doc){
									console.log(doc, "COOKIE DROPPED")
									if(doc){
										var item = {
											item: doc._id,
											expires: 0
										};
										if(doc.expires > 0) {
											var date = new Date();
											date.setSeconds(date.getSeconds()+doc.expires);
											item.expires = Math.floor(date.getTime()/1000);
										}

										game.game.items.push(item);
										game.game.markModified('items');
										game.game.save(function(err, saved){
											var msg;
											if(doc.dropmessage && doc.dropmessage.length > 0) {
												msg = doc.dropmessage.replace('%command%', doc.command);
											} else {
												msg = "A very special cookie fell down from heaven. Eat it by typing the command  '"+doc.command+"'";
											}
											console.log("Bot: %s", msg);
											bot.request("msg", {
												chat_id: object.chat.id,
												text: msg
											});
										});
									}
								});
							});
						}
					}
				});
			} else {
				console.log("Info: Empty/missing text");
			}
		}
		else{
			if(typeof res == "object"){
				console.log("Info: No new messages");
			}
			else{
				console.log("Info: "+res);
			}
		}
	}
	else{
		console.log("Error: ", err);
	}
	getUpdates(getupdatesCallback);
}

getupdatesCallback(null, "Booting script");

function getObject(starter, str, obj){
	starter = starter || global;
	var obj = obj.split(".");
	var data = starter;
	for(i = 0; i < obj.length; i++){
		if(data[obj[i]]){
			data = data[obj[i]];
		} else return false;
	}
	return data;
}


var commands = {
	start: function(msg, object, callback){
		// Start a game again or create a new one for this chat
		var startedmessages = [
			"The game has been on like forever. That means you should probably lay off some cookies soon. Just a tip.",
			"It's already on, d'uuuh",
			"Because you started the game while a game is already running, I'll give you guys x5 cookies from now!"
		];

		var additionalcallback = {
			2: {
				timeout: 2000,
				message: "Hah! NOPE! Just kidding! LOL! Only x1 for you"
			}
		};

		var rand = Math.floor(Math.random()*startedmessages.length);

		var chat = object.chat.id;
		new Room(chat, object.from, function(game){
			game.startGame(function(changed){
				if(changed) callback("The game has begun. COOKIEEEEEEES!!!");
				else callback(startedmessages[rand]);

				if (rand in additionalcallback) {
					setTimeout(function() {
						callback(additionalcallback[rand].message);
					}, additionalcallback[rand].timeout);
				}
			});
		});
	},
	stop: function(msg, object, callback){
		var stoppedmessages = [
			"The game is already put on hold. You haven't eaten cookies for aaages :''(",
			"It was never on... You feel skinny yet?",
			"The game has begun. COOKIEEEEEEES!!!",
			"Yeez, relax yo. It's stopped!"
		];

		var additionalcallback = {
			2: {
				timeout: 2000,
				message: "Fooled yah, I didn't start the game again. *sobs*"
			},
			3: {
				timeout: 500,
				message: "But you should really consider starting the game again <3"
			}
		};

		var rand = Math.floor(Math.random()*stoppedmessages.length);

		game.stopGame(function(changed){
			if(changed) callback("The game is put on hold. No cookies for you :'(");
			else callback(stoppedmessages[rand]);

			if (rand in additionalcallback) {
				setTimeout(function() {
					callback(additionalcallback[rand].message);
				}, additionalcallback[rand].timeout);
			}
		});
	},
	score: function(game, msg, object, callback){
		game.getScore(msg, function(msg) {
			callback(msg);
		})
	},
	cookies: function(game, msg, object, callback){
		var items = game.items;
		console.log(game.items);
		console.log(game.game.items);

		if(items.length > 0){
			var diff = {};
			for(var i = 0; i < items.length; i++){
				if(diff[items[i].command]){
					diff[items[i].command].total++;
				} else {
					diff[items[i].command] = {
						total : 1,
						name: items[i].name,
					}
				}
			}
			var split ="\n---------------";
			var melding = "These cookies is just waiting to get eaten!"+split;

			for(a in diff){
				melding += "\n"+diff[a].name;
				if(diff[a].total > 1) melding += " (x"+diff[a].total+")";
				melding += " - "+a;
			}
			melding += split+"\nWrite the command which is written in the end to eat the cookie";
			callback(melding);
		} else {
			callback("What? No cookies?? Cookie monster sad :'(");
		}
	},
	status: function(game, msg, object, callback){
		if(game.setting('started', false) == false){
			callback("The game is on hold. Run the command /start to compete for all the cookies in the world!");
		} else {
			callback("The game is up and running. Type and eat all the cookies you can!! Do you need a break? Type /stop or /pause");
		}
	}
};
var aliases = {
	pause: "stop",
	play: "start"
};
