// hmmm wondering if it really should be stack based or not (maybe every lowercase letter can be a register or something?)
    // I'm sure I'd eventually think of something that makes stacks better... think about it a bit
// lisp? too verbose
// stack machine? feels kinda impractical (easy to implement, annoying to actually use)
// nearby items and pickupable items should be completely seperate
// consider: pheromones, dirt, food, other ants, walls, the Unknown
    // all these things need properties
// to test approches:
    // implement current ant behavior in some kind of stack based code
    // make some slightly more complex ant behavior and implement it in stack code
    // try the same thing with non stack code, think about language implementation of each

// AVM ERRORS SHOULDNT THROW JAVASCRIPT ERRORS (should instead halt the AVM and just console.error)
    // maybe just have an error stack that stuff gets pushed to that you can inspect after avm executes?
// refactor math operations to be generated the same way as getters?

// I want to be able to parse a string and an int in a reasonable way, but also do indexing in a nice way
    // this is very closely related to looping, so maybe I should handle that first
    // annoyance is that I dont know if indexing should have its own parsing, or if "[" will just set a flag in the AMV that an index is occuring or what
        // the flag thing probably makes sense because that lets you use "]" as a "stack[-2][stack[-1]]" operator
        // WAIT I DONT EVEN NEED A FLAG, "[" COULD LITERALLY BE A NOP AND THE YOU COULD HAVE A GETTER IN THE SQUARE BRACKETS OR ANYTHING ELSE (neat)

// Should looping and if statements use the same mechanisms somehow?
    // for each and for N loops are easy, should look at how other langs handle while loops
    // one possible syntax for if statments is just a ternery javascript statement (with maybe a semicolon at the end of the :)
    // need a seperate stack for loops and conditionals... hopefully I can just do it with 1 stack? maybe 2 would be simpler?


"use strict";


function AVMOutputs() {
    this.take = undefined;
    this.movement = undefined;
    this.drop = undefined;
}

function AVMInputs(hitWall, currentDirection, nearbyItems, pickupableItems, inventory, ram) {
    this.hitWall = hitWall;
    this.currentDirection = currentDirection;
    this.nearbyItems = nearbyItems;
    this.pickupableItems = pickupableItems;
    this.inventory = inventory;
    this.ram = ram;
}

function AVM(hitWall, currentDirection, nearbyItems, pickupableItems, inventory, ram) {
    this.inputs = new AVMInputs(hitWall, currentDirection, nearbyItems, pickupableItems, inventory, ram);
    this.outputs = new AVMOutputs();
    this.stack = [];
}


AVM.prototype.execute = function(code) {
    let nextChar = 0;
    while (nextChar < code.length) {
        const opCode = code[nextChar];
        nextChar += 1;

        let operation = this.operations[opCode];
        if (operation === undefined) {
            if (isDigit(opCode)) {
                nextChar -= 1; // int parsing needs to start at this first digit
                operation = AVM.prototype.parseInt;
            } else {
                operation = AVM.prototype.nop;
            }
        }

        const numCharsRead = operation.bind(this)(nextChar, code);
        nextChar += numCharsRead? numCharsRead : 0;
    }
}


AVM.prototype.pop = function() {
    if (this.stack.length == 0) {
        throw new Error("can't pop (stack empty)");
    } else {
        return this.stack.pop();
    }
}

AVM.prototype.push = function(obj) {
    this.stack.push(obj);
}

AVM.prototype.nop = function() {}

AVM.prototype.parseInt = function(nextChar, code) {
    const int = readCharsUntil(nextChar, code, c => !isDigit(c));
    this.push(parseInt(int));
    return int.length;
}

function createAVMMathOperation(operation) {
    return function() {
        const [b, a] = [this.pop(), this.pop()];
        this.push(operation(a, b));
    }
}

function createAVMGetter(toGet) {
    return function() { // don't use arrow function because `this` can't be rebound (half the point of arrow funcs is that they inherit `this` from their scope)
        this.push(this.inputs[toGet]);
    }
}

function createAVMSetter(toSet) {
    return function() {
        console.log(this);
        console.log(this.outputs);
        this.outputs[toSet] = this.pop();
    }
}

function readCharsUntil(startingIndex, string, stopCondition) {
    let endingIndex = startingIndex;
    while (!stopCondition(string[endingIndex])) {
        if (string[endingIndex] === undefined) {
            throw Error("didn't find stopCondition before end of string");
        }
        endingIndex += 1;
    }
    return string.substring(startingIndex, endingIndex);
}

function isDigit(char) {
    return char >= '0' && char <= '9'
}


AVM.prototype.operations = {
    "+": createAVMMathOperation((a, b) => a + b),
    "-": createAVMMathOperation((a, b) => a - b),
    "/": createAVMMathOperation((a, b) => a / b),
    "*": createAVMMathOperation((a, b) => a * b),
    "%": createAVMMathOperation((a, b) => a % b),
    "&": createAVMMathOperation((a, b) => a && b),
    "|": createAVMMathOperation((a, b) => a || b),
    ">": createAVMMathOperation((a, b) => a > b),
    "<": createAVMMathOperation((a, b) => a < b),
    "]": createAVMMathOperation((a, b) => a[b]),
    "H": createAVMGetter("hitWall"),
    "D": createAVMGetter("currentDirection"),
    "N": createAVMGetter("nearbyItems"), 
    "P": createAVMGetter("pickupableItems"),
    "I": createAVMGetter("inventory"),
    "R": createAVMGetter("ram"),
    "T": createAVMSetter("take"),
    "M": createAVMSetter("movement"),
    "U": createAVMSetter("drop"),

    "p": function() { this.push(Math.PI); },

    "r": function() { this.push(Math.random()); },

    '"': function(nextChar, code) {
        const string = readCharsUntil(nextChar, code, c => c == '"');
        this.push(string);
        return string.length + 1; // +1 to skip past end quote
    },

    "?": function(nextChar, code) {
        if (this.pop()) {

        } else {
            const skippedCode = readCharsUntil(nextChar, code, c => c == ';' || c == ':');
            return skippedCode.length;
        }
    },
};


a = new AVM(false, 0, [], [], [], []);
a.execute("1 2+M\"test\"123");


/*
inputs:
    H: hit wall
    D: current direction
    N: nearby items
    P: pickupable items
    I: inventory
    R: ram
    ?: health/hunger/whatever

outputs:
    T: item to take
        can multiple items be picked up??
    M: item to move towards | direction to move
    U: item to drop / use

operations:
    + - * / % ^ & | 
    > <
    indexing (ram, items, inventory)
    set/get (for I/O)
    type checking (for items)
    propery access (for items) (same as indexing?)
    push/pop? (for outputs?) (I guess only picking up 1 item per frame makes sense)

control flow:
    if/else
    while loop
    for each loop (probably same as while loop)
        you could use a { to mean "iterate over whatever is on the stack"
        if its a number, it subtracts 1 every time it hits the matching } 
        if its a list, it just iterates over every item
        if its a boolean, it treats it like a number (1 = iterate once, 0 = don't iterate)
        this way looping would be the same as conditionals
    early loop breaking
        in theoy on a stack machine you could just push a 0... 
        but I kinda want the loop variables to not be accessible by the programmer because it makes things easier

misc:
    random
    pi
*/