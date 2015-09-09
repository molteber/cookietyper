var mongoose = require('./mongodb');

var RoomSchema = new mongoose.Schema({
	chat_id : String,
	players: [
		{
			id: {type: String, unique: true, dropDubs: true, required: true},
			username: {type: String, required: true},
			stats: mongoose.Schema.Types.Mixed,
			items: [
				{
					command: String,
					expires: {type: Number, default: 0, min:0}
				}
			],
			effects: [{
				item: mongoose.Schema.Types.ObjectId,
				bonus: Number,
				expires: {type: Number, default: 0, min:0}
			}]
		}
	],
	items: [{
		item: mongoose.Schema.Types.ObjectId,
		expires: {type: Number, default: 0, min:0}
	}],
	settings: mongoose.Schema.Types.Mixed,
	effects: [{
		item: mongoose.Schema.Types.ObjectId,
		bonus: Number,
		expires: {type: Number, default: 0, min:0}
	}],
	created: {type: Date, default: Date.now }
});

var ItemSchema = new mongoose.Schema({
	name: {type: String, trim: true, required: true},
	command: {type: String, unique: true, required: true},
	random: {type: [Number], index: '2d'},
	chance: {type: Number, min: 0, max: 100, default: 100},
	dropmessage: String,
	eatmessage: String,
	expires: {type: Number, min: 0, default: 0},
	additional: mongoose.Schema.Types.Mixed
});

ItemSchema.path('random').default(function(){
	return [Math.random(), 0];
});

var Room = mongoose.model("Room", RoomSchema);
var Item = mongoose.model("Item", ItemSchema);

module.exports = {Room: Room, Item: Item, ItemSchema: ItemSchema, RoomSchema: RoomSchema};
