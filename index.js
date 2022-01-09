const WebSock = require("ws")
const wss = new WebSock.WebSocketServer({ port: 8080 });


const mapper = {

	map: [],

	idToWs: {},

	getLeft: function (id) {
		if (this.map.indexOf(id) == 0) {
			return (this.map[this.map.length - 1])
		} 
		else {
			return (this.map[this.map.indexOf(id) - 1])
		}  
	}, 

	getRight: function (id) {
		if (this.map.indexOf(id) == this.map.length - 1) {
			return (this.map[0])
		} 
		else {
			return (this.map[this.map.indexOf(id) + 1])
		}  
	},

	isInMap: function(id) {
		console.log(this)
		return this.map.includes(id)
	},

	addClient: function(id, ws) {
		this.map.push(id)
		this.idToWs[id] = ws
	}
};

wss.on('connection', function connection(ws) {
	ws.on('message', function message(data) {
		console.log("=S==========")
		console.log(data)
		data = data.toString()
		console.log(data)
		console.log("=E===========")
		console.log(data)
		data = JSON.parse(data)
		if (data["type"] == "init") {
			if (mapper.isInMap(data['id'])) {
				ws.send(JSON.stringify({'type': 'init', 'data': 'connection maintained'}))
			}
			else {
				mapper.addClient(data["id"], ws)
				ws.send(JSON.stringify({'type': 'init', 'data': 'connected'}))
			}
		}
		else if(data["type"] == "ant") {
			pumpAnts(data)
		}
		console.log('received: %s', data);
	});
});

function pumpAnts (data) {
	// TODO: Tell the client to wait before accepting ants probably
	// TODO: will probably need to order ants based on the tick recieved in the future
	// For no no processing at all just push the ants through the pipes
	// TODO: Only pumps left thus far lol
	id = data["id"]
	delete data["id"]

	data = JSON.stringify(data)
	console.log("ANTS!!")
	console.log(data)
	console.log("END ANTS!!")

	console.log(id)
	console.log(mapper.getLeft(id))
	console.log(mapper.idToWs[mapper.getLeft(id)])
	ws = mapper.idToWs[mapper.getLeft(id)]
	ws.send(data)
}
