var collections = require('./files/collections');

var items = [
	{
		name: 'Golden cookie',
		command: "goldencookie",
		chance: 100,
		dropmessage: 'A very special cookie fell down from heaven. (%command%)',
		eatmessage: '',
		expires: (60*10)
	},
	{
		name: "1337 cookie",
		command: "l33t",
		chance: 90,
		dropmessage: 'Shh! My LEET my senses are tingling. Quick, eat this cookie! (%command%)',
		eatmessage: 'Mmmmmmm, enjoy your %cookies% new cookies, %username%',
		expires: (60*5)
	},
	{
		name: "Ninja",
		command: "ninja",
		chance: 50,
		dropmessage: 'What was that??',
		eatmessage: "%username% received %amount% cookiestars from a hidden ninja\nThrow it at someone by using the command 'throwcookie <username>'\n[This item stacks]",
		expires: (60*2.5)
	},
	{
		name: "Dirty cookie",
		command: '5secondrule',
		chance: 75,
		dropmessage: 'NO! I dropped some cookies on the floor. Quick! Pick them up before the germs get them! (%command%)',
		eatmessage: "%username% cleaned a cookie and ate it. While inside the mouth, the cookie splits into %cookies% new cookies.",
		expires: 5
	},
	{
		name: "Blue shiny object",
		command: 'bluebeast',
		chance: 20,
		dropmessage: 'What is that blue shiny thing behind your ear? (%command%)',
		eatmessage: "%username% found a blue shell-ish item. Hmm.. It appears to slide quite fast on any surface. (slidethebeast)",
		expires: (60*30)
	}
];

var counted = 0;
var endcallback = function(err, doc){
	if(err) console.log("ERR:", err);
	else console.log(doc);
	counted++;

	if(counted >= items.length){
		process.exit(0);
	}
}

for(var i = 0; i < items.length; i++){
	collections.Item.find({command: items[i].command}, function(integer, err, doc) {

		if(err == null && doc.length < 1) {
			collections.Item.create(items[integer], endcallback);
			console.log("adding");
		} else {
			console.log("erroring");
			endcallback(err, doc);
		}
	}.bind(null, i));
}
