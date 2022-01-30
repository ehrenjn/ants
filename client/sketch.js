// We don't really need p5 for this... can just use a canvas
// ant positions should be the middle of their bodies, not the top left corner
// ant turning is ok but looks too bouncy when they hit a wall
    // also, the reference video does basically the same turning as I do except I think each ant spends multiple frames actually doing each turn
// what happens if you disconnect temporarily, so the server forgets about you, and then you start sending ants again?
    // almost feels like we need a new system to make sure no ants are forgotten
// if an ant thinks too long it dies as if from overthinking




///////////////////////////////////////////////////////////////////////////////
// Global setup ///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


"use strict";

let allAnts = [];
let antQueue = [];
let allFood = [];
let readyToSendAnts = false;
const url = "ws://ec2-174-129-172-233.compute-1.amazonaws.com:8080/";
const antSocket = new WebSocket(url);
const userId = Math.random();
const userColor = [
    randInt(0, 0xFF), 
    randInt(0, 0xFF), 
    randInt(0, 0xFF),
];

const ANT_RADIUS = 7;
const FOOD_RADIUS = 10;




///////////////////////////////////////////////////////////////////////////////
// Cookie functions ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


function setCookie(name, value, expires = "") {
    document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}`;
}

function getExpires(exdays = 1000) {
	const d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60));
	let expires = "expires="+d.toUTCString();
}

function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return decodeURIComponent(parts.pop().split(";").shift());
}

function removeCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}




///////////////////////////////////////////////////////////////////////////////
// Draw functions /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


function setup() {
    createCanvas(displayWidth, displayHeight);
    for (let _ = 0; _ < 100; _++) {
        allAnts.push(new Ant(
            width/2,
            height/2
        ));
    }
}


function draw() {
    background(220);

    allAnts = updateAnts(allAnts, antQueue);
    allFood = updateFood(allFood);
}




///////////////////////////////////////////////////////////////////////////////
// Ant functions //////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


function updateFood(allFood) {
    if (randChance(0.3) && allFood.length < 100) {
        allFood.push(new Food());
    }

    let newFood = [];

    fill(0, 255, 0);
    allFood.forEach(food => {
        if (!food.eaten) {
            circle(food.x, food.y, FOOD_RADIUS);
            newFood.push(food);
        }
    });

    return newFood;
}


function updateAnts(allAnts, antQueue) {
    let locationMapper = new LocationMapper();
    allAnts.forEach(locationMapper.insert.bind(locationMapper));
    allFood.forEach(locationMapper.insert.bind(locationMapper));

    let newAnts = [];
    allAnts.forEach(ant => {
        
        // run AVM
        const avm = new AVM(
            ant.hitWall,
            ant.direction,
            locationMapper.nearbyObjects(ant.x, ant.y),
            [], [], []
        );
        avm.execute('N{ldf?Tb:x;}H?r2p**M:r0.2<?p20/r0.5<?0 1-*;D+M;;');

        // update ant parameters
        const newDirection = avm.outputs.movement;
        ant.direction = newDirection === undefined ? ant.direction : newDirection;
        const takenItem = avm.outputs.take;
        if (takenItem !== undefined && takenItem.constructor == Food && !takenItem.eaten) {
            takenItem.eaten = true;
        }
        ant.hitWall = false;

        // normalize direction to be between 0 and 2 pi
        ant.direction %= Math.PI * 2;

        // update ant location
        ant.x += Math.sin(ant.direction); // ants move at velocity 1
        ant.y += Math.cos(ant.direction);

        // bound out of bound ants
        if (ant.x > width || ant.y < 0 || ant.x < 0) {
            ant.hitWall = true;
            [ant.x, ant.y] = boundCoord(ant.x, ant.y);
        }

        // either send ant to server or draw it
        if (ant.y >= height) {
            antQueue.push(ant);
        } else {
            fill(ant.color[0], ant.color[1], ant.color[2]);
            circle(ant.x, ant.y, ANT_RADIUS);
            newAnts.push(ant);
        }
    });

    return newAnts;
}


function boundCoord(x, y) {
    if (x > width) x = width;
    if (y > height) y = height;
    if (y < 0) y = 0;
    if (x < 0) x = 0;
    return [x, y];
}




///////////////////////////////////////////////////////////////////////////////
// Classes ////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


function Ant(x, y) {
    this.x = x;
    this.y = y;
    this.direction = Math.random() * 2 * Math.PI;
    this.color = userColor;
    this.hitWall = false;
}


function Food() {
    this.x = randInt(0, width);
    this.y = randInt(0, height);
    this.eaten = false; // when food is eaten it means it is marked for deletion but hasn't been deleted yet
}


function LocationMapper() {
    this.map = {};
}

LocationMapper.prototype.insert = function(obj) {
    const coord = [Math.round(obj.x/10), Math.round(obj.y/10)];
    if (this.map[coord] === undefined) {
        this.map[coord] = [];
    }
    this.map[coord].push(obj);
}

LocationMapper.prototype.nearbyObjects = function(x, y) {
    let coord = [Math.round(x/10), Math.round(y/10)];
    return this.map[coord] || [];
}




///////////////////////////////////////////////////////////////////////////////
// Random functions ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


function randInt(min, max) {
    let valueRange = max - min + 1; // +1 to be inclusive
    return Math.floor(Math.random() * valueRange) + min;
}


function randElement(ary) {
    return ary[randInt(0, ary.length - 1)];
}


function randSign() {
    return randElement([-1, 1]);
}


function randChance(amt) {
    return Math.random() > amt;
}




///////////////////////////////////////////////////////////////////////////////
// Events /////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


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
    antSocket.send(JSON.stringify({
        'type': 'init',
        'id': userId
    }));
}


antSocket.onmessage = function(event) {
    let { data } = event
    data = JSON.parse(data);
    
    if (data.type == 'init') {
        readyToSendAnts = true;
    }
    
    else if (data.type == 'ant') {
        let newAnts = data.data;
        newAnts.forEach(ant => {
            ant.y = 0;
            allAnts.push(ant) // again, we can modify allAnts without fear of being interrupted because all these calls are blocking
        });
    }
}




var x = document.createElement("INPUT");
x.setAttribute("type", "text");
x.setAttribute("value", "Hello World!");

