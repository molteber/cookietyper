var mongoose = require('./mongodb'),
	collection = require('./collections');

function Room(chatid, player, cb){
	var self = this;

	self._tempplayer = player;
	self.items = [];
	self.id = chatid;
	self.game = null;
	self.player = null;
	self.settings = {};

	/** Define commands **/
	self.commands = {
		goldencookie: function(itemId, msg, object, callback){
			var item = self.items[itemId];

			self.game.items.splice(itemId, 1);
			self.game.markModified('items');
			self.game.save(function(err, doc){
				var rand = Math.floor(Math.random()*2)+1;

				var date = new Date();
				var sec;

				if (!('goldencookies' in self.player.stats)) self.player.stats.goldencookies = 0;
				self.player.stats.goldencookies++;


				switch(rand){
					case 1:
						date.setSeconds(date.getSeconds()+77);
						sec = Math.round(date.getTime()/1000);

						var effect = {
							item: item._id,
							bonus: 7,
							expire: sec
						};

						self.player.effects.push(effect);
						self.game.markModified('players');

						self.game.save(function(){
							callback("The golden cookie now grants "+self.player.username+" cookies x7 for 77 seconds!");
						});
						break;
					case 2:
						date.setSeconds(date.getSeconds()+7);
						sec = Math.round(date.getTime()/1000);

						var effect = {
							item: item._id,
							bonus: 77,
							expire: sec
						};

						self.player.effects.push(effect);
						self.game.markModified('players');

						self.game.save(function(){
							callback("The golden cookie now grants "+self.player.username+" cookies x77 for 7 seconds!");
						});
						break;
				}
			});
		},
		l33t: function(itemId, msg, object, callback){
			var gameitem = self.game.items[itemId];
			var item = self.getItem(gameitem.item);
			console.log("1.0", item);

			self.game.items.splice(itemId, 1);
			self.game.markModified('items');
			self.game.save(function(){

				// Update stats
				if (!('leetcookies' in self.player.stats)) self.player.stats.leetcookies = 0;
				self.player.stats.leetcookies++;

				var cookies = 1337;

				// Look for bonus effects on your user
				if (!('cookies' in self.player.stats)) self.player.stats.cookies = 0;

				self.player.stats.cookies += (cookies*self.getBonusEffects());
				self.game.markModified('players');
				self.game.save(function() {
					var msg = item.eatmessage.replace('%username%', self.player.username).replace('%cookies%', cookies);
					callback(msg);
				});
				//callback("@"+object.from.username+" fikk "+item.bonus +" nye cookies fra sin L33T cookie");
			});
		},
		ninja: function(itemId, msg, object, callback) {
			var item = self.items[itemId];

			var rand = Math.floor(Math.random()*3)+1;

			self.game.items.splice(itemId, 1);
			self.game.markModified('items');

			self.game.save(function(){
				// Update stats
				if (!('ninjacookies' in self.player.stats)) self.player.stats.ninjacookies = 0;
				self.player.stats.ninjacookies++;

				for(var i = 0; i < rand; i++) {
					self.player.items.push({
						command: 'throwcookie'
					});
				}
				self.game.markModified('players');
				self.game.save(function(){

					var msg = item.eatmessage.replace('%username%', self.player.username).replace('%amount%', items);
					callback(msg);
				});
			});
		},
		throwcookie: function(itemId, msg, object, callback){
			callback("@"+self.player.username +" tried to throw a cookiestar at "+msg+", but failed\n[THIS COOKIE IS NOT READY YET :/]");
		},
		bluebeast: function(itemId, msg, object, callback){
			callback("[THIS COOKIE IS NOT READY YET :/]");
		},
		"5secondrule" : function(itemId, msg, object, callback) {
			callback("[THIS COOKIE IS NOT READY YET :/]");
		}
	};
	/** Define methods **/
	self.findPlayer = function(cb){
		console.log("Looking for player "+self._tempplayer);
		if(!('username' in self._tempplayer) || self._tempplayer.username == "undefined" || self._tempplayer.username.length < 1) {
			console.log("[Player] Invalid player object", self._tempplayer);
			return cb();
		}

		if(self.game == null) return cb();
		console.log("[Player] Game found");

		// Find the current player
		for(var i = 0; i < self.game.players.length; i++){
			if((self.game.players[i].id+"") == (""+self._tempplayer.id)){
				self.player = self.game.players[i];
				break;
			}
		}
		if(self.player == null){
			console.log("[Creating player]");
			// Player do not exists. Insert player into array
			self.player = {
				id: self._tempplayer.id,
				username: self._tempplayer.username,
				stats: {
					cookies: 0
				},
				items: [],
				effects: []
			};
			self.game.players.push(self.player);
			self.game.markModified('players');
			self.game.save(function(err, doc){
				console.log("[Player] Err? %s, or not", err, doc);
				cb();
			});
		}
		else {
			console.log("[Player] Player found", self.player);
			cb();
		}
	};

	self.getBonusEffects = function()
	{
		var date = new Date();
		var sec = Math.round(date.getTime()/1000);

		var bonus = 1;
		for (var i = 0; i < self.player.effects; i++) {
			if(sec < self.player.effects[i].expire) {
				bonus *= self.player.effects[i].bonus;
			} else {
				self.player.effects.splice(i, 1);
				self.game.markModified('players');
			}
		}
		return bonus;
	};

	self.doCommand = function(command, msg, object, callback){
		if(self.player == null) {
			callback("Don't try to steal this cookie when you don't have a username!");
			return false;
		}

		// Load all items!
		var item = self.hasItem(command);
		var playeritem = self.hasSelfItem(command);
		console.log("item command: ", item);
		console.log("player command: ", playeritem);
		if(playeritem >= 0 && playeritem !== null && self.commands[command] && self.commands[command] instanceof Function) {
			self.commands[command](playeritem, msg, object, callback);

			return true;
		} else if (item >= 0 && item !== null && self.commands[command] && self.commands[command] instanceof Function) {
			console.log("command found", command)
			self.commands[command](item, msg, object, callback);

			return true;
		}
		return false;
	};

	self.hasItem = function(command){
		for (var i = 0; i < self.items.length; i++) {
			console.log(self.items[i].command, command);
			if (self.items[i].command === command) {
				return i;
			}
		}
		return null;
	};

	self.hasSelfItem = function(command)
	{
		for (var i = 0; i < self.player.items.length; i++) {
			if(self.player.items[i].command === command) {
				return i;
			}
		}

		return null;
	}

	self.setting = function(key, def){
		if(key in self.settings) return self.settings[key];
		else return def;
	};

	self.setSetting = function(key, value) {
		self.settings[key] = value;
		self.game.markModified('settings');
	};

	this.startGame = function(cb){
		if(!(cb instanceof Function)){
			cb = function(){};
		}

		if(self.setting('started', false) == true) cb(false);
		else {
			console.log("Setting value");
			self.setSetting('started', true);
			self.game.save(function(err, doc){
				console.log("[Start] Err? %s, or not", doc);
				cb(true);
			});
		}
	}

	self.stopGame = function(cb){
		if(!(cb instanceof Function)){
			cb = function(){};
		}
		if(self.setting('started', true) == false) cb(false);
		else {
			self.setSetting('started', false);
			self.game.save(function(){
				cb(true);
			});
		}
	}

	self.getScore = function(username, cb){
		var cookies = 0;
		var split ="\n---------------";
		var melding = "Highscore:"+split;

		if(username){
			if(username.indexOf('@') >= 0){
				username = username.substr(username.indexOf('@')+1);
			}
			for(var i = 0; i < self.game.players.length; i++){
				if(username == self.game.players[i].username){
					if (!('cookies' in self.game.players[i].stats)) {
						self.game.players[i].stats.cookies = 0;
					}
					return cb("@"+self.game.players[i].username+" have "+self.game.players[i].stats.cookies+" cookies!");
				}
			}
		}
		// Sort the player array based on cookies
		self.game.players.sort(function(a, b) {
			return b.stats.cookies - a.stats.cookies;
		});

		for(var i = 0; i < self.game.players.length; i++){
			if (!('cookies' in self.game.players[i].stats)) {
				self.game.players[i].stats.cookies = 0;
			}
			melding += "\n@"+self.game.players[i].username+" has "+self.game.players[i].stats.cookies;
			cookies += 	self.game.players[i].stats.cookies;
		}
		melding += split+"\nYou have a total group score of "+cookies+" cookies!";
		return cb(melding);
	};

	self.loadItems = function(cb){
		var date = new Date();
		var seconds = Math.round(date.getTime()/1000);
		var items = [];
		var expire;
		for(var i = 0; i < self.game.items.length; i++) {
			if (self.game.items[i].expires > 0) {
				expire = self.game.items[i].expires;
				if (expire < seconds) {
					self.game.items.splice(i, 1);
					self.game.markModified('items');
					continue;
				}

			}
			items.push(self.game.items[i].item);
		}

		collection.Item.find({ _id: { $in: items} }, function(err, docs){
			self.items = docs;
			self.game.save(function(){
				cb();
			});
		});
	};

	self.getItem = function(id)
	{
		for (var i = 0; i < self.items.length; i++) {
			if(self.items[i]._id.equals(id)) {
				return self.items[i];
			}
		}
		return null;
	};

	// Look for gameroom
	console.log("Looking for room");
	collection.Room.findOne({chat_id: chatid}, function(err, doc) {
		if (err) {
			throw new Error("Gameroom error: "+err);
		} else if (doc) {
			console.log("Game found");
			self.game = doc;
			self.settings = self.game.settings;
			self.loadItems(function(){
				self.findPlayer(function(){
					cb(self);
				});
			});
		} else {
			console.log("Creating room");
			collection.Room.create({
				chat_id: chatid,
				players: [],
				items: [],
				effects: [],
				settings: {
					started: false
				}
			}, function(err, doc){
				if(err || !doc){
					console.log("Room creation failed", err, doc);
					throw new Error("New game error: "+err);
				} else {
					console.log("Room found");
					self.game = doc;
					self.settings = self.game.settings;
					self.loadItems(function(){
						self.findPlayer(function(){
							cb(self);
						});
					});
				}
			});
		}
	});
}

module.exports = Room;
