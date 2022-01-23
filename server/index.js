const WebSock = require("ws")
const wss = new WebSock.WebSocketServer({ port: 8080 });


// Ridiculous? Yes. Works as long as the dicts aren't too big? Yes.
function Map() {
	this._map = {};

	// TODO: 💀 
	this.findVal = function(val) {
		for (let x in this._map) {
			for (let y in this._map[x]) {
				if (this._map[x][y] === val) {
					return [parseInt(x), parseInt(y)];
				}
			}
		}
		return [undefined, undefined]
	};

	this.getVal = function (x, y) {
		// TODO: 💀 
		try {
			return this._map[x][y];
		} catch (err) {
			return undefined
		}
	};

	this.setVal = function (x, y, val) {
		if (x in this._map === false) {
			this._map[x] = {};
		}	  
		this._map[x][y] = val;
	};

	this.findMin = function (func) { // Find minimum x,y coordinates
		let x = Object.keys(this._map)[0]
		let y = Object.keys(this._map[x])[0]
		let best = [parseInt(x), parseInt(y), this._map[x][y], func(x, y, this._map[x][y])]
		for (let x in this._map) {
			for (let y in this._map[x]) {
				let val = func(x, y, this._map[x][y])
				if (this._map[x][y] < best[3]) {
					best[0] = parseInt(x)
					best[1] = parseInt(y)
					best[2] = this._map[x][y]
					best[3] = val
				}
			}
		}	
		return best
	}

	this.isEmpty = function () {
		return Object.keys(this._map).length === 0;
	}
}

const mapper = {

	map: new Map(),
	mapOld: new Map(),

	idToWs: {},

	getIdRelativeToId: function (rel_x, rel_y, id) {	
		let [x, y] = this.map.findVal(id)
		x += rel_x
		y += rel_y
		return this.map.getVal(x, y)	
	}, 

	isInMap: function(id) {
		return (this.map.findVal(id)[0] !== undefined)
	},

	addClient: function(id, ws) {
		[x, y] = this.mapOld.findVal(id)
		if (x != undefined) {
			this.map.setVal(x, y, id)
			this.idToWs[id] = ws
		}

		else if (Object.keys(this.map._map).length !== 0) { // if map is not empty
			
			let [x, y, idFound, _] = this.map.findMin(function (x, y) {
							return Math.max([x, y])
						})
			console.log("XY" + x + "," + y)
			// now we need to find a place to add them, free space that's
			// adjacent I guess
			adjacentOffsets = [[0, -1], [0, 1], [1, 0], [-1, 0]]
			newLoc = []
			//for (offset in adjacentOffsets) {
			Object.values(adjacentOffsets).every(offset => {
				console.log("OFFSET" + offset)
				if (this.getIdRelativeToId(offset[0], offset[1], idFound) === undefined) {
					newLoc = [parseInt(x) + offset[0], parseInt(y) + offset[1]]
					console.log(newLoc + "," + parseInt(x) + "," + parseInt(y));
					return false
				}
				return true
			})
			
			x = newLoc[0]
			y = newLoc[1]
			console.log(x + "," + y)
			this.map.setVal(x, y, id)
			this.mapOld.setVal(x, y, id)
			this.idToWs[id] = ws
		} else {
			this.map.setVal(0, 0, id)
			this.mapOld.setVal(0, 0, id)
			this.idToWs[id] = ws
		}
		console.log(this.map);
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
			console.log(data['id']);
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
	let srcId = data["id"];
	delete data["id"];

	data = JSON.stringify(data);
	console.log("ANTS!!");
	console.log(data);
	console.log("END ANTS!!");

	//console.log(mapper.getLeft(id))
	//console.log(mapper.idToWs[mapper.getLeft(id)])
	Object.values([[-1,0],[0,-1],[0,1],[1,0]]).every(offset => {
		let dstId = mapper.getIdRelativeToId(offset[0], offset[1], srcId);
		if (dstId != undefined) {
			mapper.idToWs[dstId].send(data);
			return false
		}
		return true;
	})
}
