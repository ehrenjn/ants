const WebSock = require("ws")
const wss = new WebSock.WebSocketServer({ port: 8080 });


// Ridiculous? Yes. Works as long as the dicts aren't too big? Yes.
function Map() {
	this._map = {};

	// TODO: 💀 
	this.findVal = function(val) {
		for (var x in this._map) {
			for var(y in this._map) {
				if this._map[x][y] === val :
					return [x, y];
			}
		}
		return [undefined, undefined]
	};

	this.getVal = function (x, y) {
		return this._map[x][y];
	};

	this.setVal = function (x, y, val) {
		if (x in this._map === false) {
			this._map[x] = {};
		}	  
		this._map[x][y] = val;
	};

	this.findMin = function (func) {
		x = _map.keys()[0]
		y = _map.keys[x].keys()[0]
		best = [x, y, _map(x, y), func(x, y, _map(x, y))]
		for (var x in this._map) {
			for var(y in this._map) {
				val = func(x, y, _map(x, y))
				if this._map[x][y] < best[3] {
					best[0] = x
					best[1] = y
					best[2] = this._map[x][y]
					best[3] = val
				}
			}
		}	
		return best
	}
}

const mapper = {

	map: new Map(),
	mapOld: new Map(),

	idToWs: {},

	getIdRelativeToId: function (rel_x, rel_y, id) {	
		[x, y] = this.map.findVal(id)
		x += rel_x
		y += rel_y
		return this.map.getVal(x, y)	
	}, 

	isInMap: function(id) {
		return (this.map.findVal(id)[0] === undefined)
	},

	addClient: function(id, ws) {
		[x, y] = this.mapOld.findVal(id)
		if x != undefined {
			this.map.setVal(x, y, id)
			this.idToWs[id] = ws
		}

		else {
			
			[x, y, id, _] = this.map.findMin(function (x, y) {
							return Math.max([x, y])
						})

			// now we need to find a place to add them, free space that's
			// adjacent I guess
			adjacentOffsets = [[0, -1], [0, 1], [1, 0], [-1, 0]]
			newLoc = [undefined, undefined]
			for (offset in adjacentOffsets) {
				if (this.getIdRelativeToId(offset[0], offset[1], id) === undefined) {
					newLoc = [x + offset[0], y + offset[1]]
					break
				}
			}
			
			x = newLoc[0]
			y = newLoc[1]
			this.map.setVal(x, y, id)
			this.mapOld.setVal(x, y, id)
			this.idToWs[id] = ws
		}
	},

	pruneClient: function(id, ws) {
//		this.map.push(id)
//		this.idToWs[id] = ws
	},
 
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
