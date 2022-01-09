// We don't really need p5 for this... can just use a canvas
// ant positions should be the middle of their bodies, not the top left corner

"use strict";

let allAnts = [];
let antQueue = [];
let readyToSendAnts = false;
const url = "ws://ec2-174-129-172-233.compute-1.amazonaws.com:8080/";
const antSocket = new WebSocket(url);
const userId = Math.random();
const userColor = [
    randInt(0, 0xFF), 
    randInt(0, 0xFF), 
    randInt(0, 0xFF),
];


function setup() {
    createCanvas(400, 400);
    for (let _ = 0; _ < 10; _++) {
        allAnts.push(new Ant(
            randInt(10, width),
            randInt(10, height)
        ));
    }
}

function draw() {
    background(220);

    let newAnts = [];
    allAnts.forEach(ant => {
        if (Math.abs(ant.dx) > 2) { 
            ant.dx = (ant.dx/Math.abs(ant.dx)) * 2
        }
        if (Math.abs(ant.dy) > 2) { 
            ant.dy = (ant.dy/Math.abs(ant.dy)) * 2
        }
        if (ant.x > width) {
            ant.x = width;
            ant.dx *= -1;
        }
        if (ant.y < 0) {
            ant.y = 0;
            ant.dy *= -1;
        }
        if (ant.x < 0) {
            ant.x = 0;
            ant.dx *= -1;
        }
        if (ant.y >= height) {
            antQueue.push(ant);
        } else {
            fill(ant.color[0], ant.color[1], ant.color[2]);
            square(ant.x, ant.y, 10, 2);
            ant.dy += randElement([-0.25,0,0.25]);
            ant.dx += randElement([-0.25,0,0.25]);
            ant.x += ant.dx;
            ant.y += ant.dy;
            newAnts.push(ant);
        }
    });
    allAnts = newAnts;
}


function Ant(x, y) {
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
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

function randElement(ary) {
    return ary[randInt(0, ary.length - 1)];
}
