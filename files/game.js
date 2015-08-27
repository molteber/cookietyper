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
			self.game.save(function(){

				var rand = Math.floor(Math.random()*3)+1;
				var date = Date.now() / 1000 | 0;

				var date = new Date();
				var sec;

				var rand = 2;
				switch(rand){
					case 1:
						var bonus = 100+Math.floor(Math.pow(self.game.players.length*self.player.stats.goldencookie, self.player.stats.goldencookie));
						self.player.cookies += bonus;
						self.game.markModified('players');
						self.game.save();

						callback("@"+self.player.username+" fikk "+bonus +" nye cookies fra sin gylne kjeks");
						break;
					case 2:
						date.setSeconds(date.getSeconds()+77);
						sec = Math.round(date.getTime()/1000);

						var effect = {
							item: item._id,
							bonus: 7,
							expire: sec
						};

						self.player.effects.push(effect);

						self.game.save();

						callback("@"+self.player.username+" får nå x7 cookies i 77 sekunder fra sin gylne kjeks");
						break;
					case 3:
						date.setSeconds(date.getSeconds()+7);
						sec = Math.round(date.getTime()/1000);

						var effect = {
							item: item._id,
							bonus: 77,
							expire: sec
						};

						self.player.effects.push(effect);
						self.game.save(function(){
							callback("@"+self.player.username+" får nå x77 cookies i 7 sekunder fra sin gylne kjeks");
						});
						break;
				}
			});
		},
		l33t: function(itemId, msg, object, callback){
			var item = self.game.items[itemId];

			self.game.items.splice(itemId, 1);
			self.game.markModified('items');
			self.game.save(function(){
				self.player.cookies += 1337;
				self.game.markModified('players');
				self.game.save();

				callback("@"+object.from.username+" fikk "+item.bonus +" nye cookies fra sin L33T cookie");
			});
		},
		ninja: function(itemId, msg, object, callback) {
			var item = self.items[itemId];

			self.game.items.splice(itemId, 1);
			self.game.markModified('items');

			self.game.save(function() {
				self.player.items.push(item._id);
				self.game.markModified('players');
				self.game.save();

				callback("@"+self.player.username+" found some cookie stars laying on the ground. Use /throwcookie <username> to throw it on someone!\n[This item stacks]");
			});
		},
		throwcookie: function(itemId, msg, object, callback){
			callback("@"+self.player.username +" tried to throw a cookiestar at "+msg[0]+", but failed");
		}
	};
	/** Define methods **/
	self.findPlayer = function(cb){
		if(!('username' in self._tempplayer) || self._tempplayer.username == "undefined" || self._tempplayer.username.length < 1) {
			return cb();
		}

		if(self.game == null) return cb();

		// Find the current player
		for(var i = 0; i < self.game.players.length; i++){
			if((self.game.players[i].id+"") == (""+self._tempplayer.id)){
				self.player = self.game.players[i];
				break;
			}
		}
		if(self.player == null){
			// Player do not exists. Insert player into array
			self.player = {
				id: (""+self._tempplayer.id),
				username: self._tempplayer.username,
				stats: {
					cookies: 0
				},
				items: [],
				effects: []
			};
			self.game.players.push(self.player);
			self.game.markModified('players');
			self.game.save(function(){
				cb();
			});
		}
		else {
			cb();
		}
	};

	self.doCommand = function(command, msg, object, callback){
		if(self.player == null) {
			callback("Don't try to steal this cookie when you don't have a username!");
			return false;
		}

		// Load all items!
		var item = self.hasItem(command);
		if (item >= 0 && item !== null && self.commands[command] && self.commands[command] instanceof Function) {
			self.commands[command](item, msg, object, callback);
			return true;
		}
		return false;
	};

	self.hasItem = function(command){
		for (var i = 0; i < self.items.length; i++) {
			if (self.items[i].command === command) {
				return i;
			}
		}
		return null;
	};

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
			self.setSetting('started', true);
			self.game.save(function(){
				cb(true);
			});
		}
	}

	self.stopGame = function(cb){
		if(!(cb instanceof Function)){
			cb = function(){};
		}

		if(self.setting('started', false) == false) cb(false);
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
		var melding = "Scoren er som følger:"+split;

		if(username){
			if(username.indexOf('@') >= 0){
				username = username.substr(username.indexOf('@')+1);
			}
			for(var i = 0; i < self.game.players.length; i++){
				if(username == self.game.players[i].player){
					return cb("@"+self.game.players[i].player+" har "+self.game.players[i].cookies+" cookies!");
				}
			}
		}
		for(var i = 0; i < self.game.players.length; i++){
			melding += "\n@"+self.game.players[i].player+" har "+self.game.players[i].cookies;
			cookies += self.game.players[i].cookies;
		}
		melding += split+"\nTotalt har dere en score på "+cookies+" cookie!";
		return cb(melding);
	};

	self.loadItems = function(cb){
		collection.Item.find({ _id: { $in: self.game.items} }, function(err, docs){
			self.items = docs;
			cb();
		});
	};

	// Look for gameroom
	collection.Room.findOne({chat_id: chatid}, function(err, doc) {
		if (err) {
			throw new Error("Gameroom error: "+err);
		} else if (doc) {
			self.game = doc;
			self.settings = self.game.settings;
			self.loadItems(function(){
				self.findPlayer(function(){
					cb(self);
				});
			});
		} else {
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
					throw new Error("New game error: "+err);
				} else {
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
