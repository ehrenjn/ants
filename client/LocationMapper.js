/*
A spatial hashing implementation that assumes every object stored in it has x and y properties
How it works:
    - first choose a radius R
    - break map into squares of size RxR
    - create a hashmap that maps squares to a list of objects contained in each square
    - now, say you have a point (x, y) that you want to find objects close to
    - first figure out what square (x, y) is on, call that square S
    - next consider the set of squares that contains S and the 8 squares surrounding S. Call this set of squares S2
    - if you think about it, S2 will contain all objects that are less than R units away from (x, y)
        - if you just draw a picture this makes sense
    - S2 will also likely contain some objects that are more than R units from (x, y), but these can easily be filtered out
*/


function LocationMapper(radius) {
    this.radius = radius;
    this.map = {};
}


LocationMapper.prototype.insert = function(obj) {
    const coord = [Math.floor(obj.x/this.radius), Math.floor(obj.y/this.radius)];
    if (this.map[coord] === undefined) {
        this.map[coord] = [];
    }
    this.map[coord].push(obj);
}


LocationMapper.prototype.nearbyObjects = function(x, y, maxObjects) {
    const [hashX, hashY] = [Math.floor(x/this.radius), Math.floor(y/this.radius)];
    const surroundingOffsets = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 1],
        [-1, 0],
        [-1, -1],
        [0, -1],
        [1, -1]
    ]

    const results = [];
    for (const [hashDx, hashDy] of surroundingOffsets) {
        const foundObjects = this.map[[hashX + hashDx, hashY + hashDy]];
        if (foundObjects !== undefined) {
            for (const obj of foundObjects) {
                if (distance(x, y, obj.x, obj.y) <= this.radius) {
                    results.push(obj);
                    if (results.length >= maxObjects) { // return early if we've found enough objects already
                        return results;
                    }
                }
            }
        }
    }

    return results;
}


function distance(x1, y1, x2, y2) {
    return ((x2 - x1)**2 + (y2 - y1)**2)**0.5;
}