// We don't really need p5 for this... can just use a canvas

"use strict";

let allAnts = [];
let antQueue = [];
let readyToSendAnts = false;
const url = "ws://ec2-174-129-172-233.compute-1.amazonaws.com:8080/";
const antSocket = new WebSocket(url);
const userId = Math.random();
const userColor = [
    randInt(0xA0, 0xFF), 
    randInt(0xA0, 0xFF), 
    randInt(0xA0, 0xFF),
];


function setup() {
    createCanvas(400, 400);
    allAnts.push(new Ant(10, 10));
    allAnts.push(new Ant(60, 80));
    allAnts.push(new Ant(20, 90));
}

function draw() {
    background(220);

    let newAnts = [];
    allAnts.forEach(ant => {
        if (ant.x > width) {
            ant.x = width;
        }
        if (ant.y < 0) {
            ant.y = 0
        }
        if (ant.x < 0) {
            ant.x = 0;
        }
        if (ant.y >= height) {
            antQueue.push(ant);
        } else {
            fill(ant.color[0], ant.color[1], ant.color[2]);
            square(ant.x, ant.y, 10, 2);
            ant.y += randInt(0, 1) ? 1 : -1;
            ant.x += randInt(0, 1) ? 1 : -1;
            newAnts.push(ant);
        }
    });
    allAnts = newAnts;
}


function Ant(x, y) {
    this.x = x;
    this.y = y;
    this.color = userColor;
}


window.setInterval(() => {
    if (readyToSendAnts && antQueue.length > 0) {
        let oldQueue = antQueue; // we can do this without worrying about changing antQueue in the middle of calling draw() because draw() is a blocking call that won't reliquish control until it's done executing
        antQueue = [];
        antSocket.send(JSON.stringify({ // everything we do with antQueue has to be done before this line since .send is a non blocking call, which allows draw() to be called while this line is being executed
            'type': 'ant',
            'id': userId,
            'data': oldQueue
        }));
    }
}, 200)


antSocket.onopen = function() {
    console.log('websocket connected');
    antSocket.send(JSON.stringify({
        'type': 'init',
        'id': userId
    }));
}


antSocket.onmessage = function(event) {
    let { data } = event
    console.log(data);
    data = JSON.parse(data);
    
    if (data.type == 'init') {
        readyToSendAnts = true;
        console.log('ready to send ants');
    }
    
    else if (data.type == 'ant') {
        let newAnts = data.data;
        newAnts.forEach(ant => {
            ant.y = 0;
            allAnts.push(ant) // again, we can modify allAnts without fear of being interrupted because all these calls are blocking
        });
    }
}


function randInt(min, max) {
    let valueRange = max - min + 1; // +1 to be inclusive
    return Math.floor(Math.random() * valueRange) + min;
}
