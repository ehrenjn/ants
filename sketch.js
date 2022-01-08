// We don't really need p5 for this... can just use a canvas

"use strict";

let allAnts = [];
let antQueue = [];
let readyToSendAnts = false;
const url = "ws://ec2-174-129-172-233.compute-1.amazonaws.com:8080/";
const antSocket = new WebSocket(url);
const userId = Math.random();


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
        if (ant.y >= width) {
            antQueue.push(ant);
        } else {
            square(ant.x, ant.y, 10, 2);
            ant.y = (ant.y + 1);
            newAnts.push(ant);
        }
    });
    allAnts = newAnts;
}


function Ant(x, y) {
    this.x = x;
    this.y = y;
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
        console.log("GOT ANT");
        let newAnts = data.data;
        newAnts.forEach(ant => {
            ant.y = 0;
            allAnts.push(ant) // again, we can modify allAnts without fear of being interrupted because all these calls are blocking
        });
    }
}


function randomColor() {
    let color;
    do {
        color = "#"
        for (var i = 0; i < 6; i++) {
            let newDigit = randInt(0, 15);
            color += newDigit.toString(16);
        }
    } while (color.match(/#(([abcdef].....)|(..[abcdef]...)|(....[abcdef].))/) === null); //make sure color is bright
    return color;
}
