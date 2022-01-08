const all_ants = [];


function setup() {
  createCanvas(400, 400);
  all_ants.push([10, 10, 10, 2]);
  all_ants.push([60, 80, 10, 2]);
  all_ants.push([20, 90, 10, 2]);
}

function draw() {
  background(220);
  all_ants.forEach(ant => {
    square(ant[0], ant[1], ant[2], ant[3]);
    ant[1] = (ant[1] + 1) % 400;
  });  
}