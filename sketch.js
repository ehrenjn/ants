let allAnts = [];
let antQueue = [];
const url = "ws://ec2-174-129-172-233.compute-1.amazonaws.com:8080/";
const antSocket = new WebSocket(url);


function setup() {
    createCanvas(400, 400);
    allAnts.push([10, 10, 10, 2]);
    allAnts.push([60, 80, 10, 2]);
    allAnts.push([20, 90, 10, 2]);
}

function draw() {
    background(220);

    let newAnts = [];
    allAnts.forEach(ant => {
        if (ant[1] >= width) {
            antQueue.push(ant);
        } else {
            square(ant[0], ant[1], ant[2], ant[3]);
            ant[1] = (ant[1] + 1);
            newAnts.push(ant);
        }
    });
    allAnts = newAnts;
}


window.setInterval(() => {
    if (antQueue.length > 0) {
        oldQueue = antQueue; // we can do this without worrying about changing antQueue in the middle of calling draw() because draw() is a blocking call that won't reliquish control until it's done executing
        antQueue = [];
        antSocket.send(JSON.stringify(oldQueue)); // everything we do with antQueue has to be done before this line since .send is a non blocking call, which allows draw() to be called while this line is being executed
    }
}, 200)


antSocket.onopen = function() {
    console.log('websocket connected');
    antSocket.send('ants')
}

antSocket.onmessage = function(event) {
    const { data } = event
    console.log(data);
}