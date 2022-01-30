/*
TODO
consider: pheromones, dirt, food, other ants, walls, the Unknown
    all these things need properties

AVM ERRORS SHOULDNT THROW JAVASCRIPT ERRORS (should instead halt the AVM and just console.error)
    maybe just have an error stack that stuff gets pushed to that you can inspect after avm executes?
refactor math operations to be generated the same way as getters?

Should maybe think about how sandboxed this really is
    I'm 90% sure indexing will let you do ACE somehow, although executing random functions might be tricky
*/

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


function ForNLoopCondition(n, location) {
    this.location = location;
    this.finalValue = n;
    this.nextValue = 0;
}

ForNLoopCondition.prototype.loop = function() {
    if (this.nextValue < this.finalValue) {
        this.currentValue = this.nextValue;
        this.nextValue += 1;
        return this.currentValue;
    }
}


function ForEachLoopCondition(object, location) {
    this.location = location;
    this.object = object;
    this.index = 0;
}

ForEachLoopCondition.prototype.loop = function() {
    if (this.index < this.object.length) {
        this.currentValue = this.object[this.index];
        this.index += 1;
        return this.currentValue;
    }
}


function AVM(hitWall, currentDirection, nearbyItems, pickupableItems, inventory, ram) {
    this.inputs = new AVMInputs(hitWall, currentDirection, nearbyItems, pickupableItems, inventory, ram);
    this.outputs = new AVMOutputs();
    this.stack = [];
    this.loopStack = [];
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
                operation = AVM.prototype.parseNumber;
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

AVM.prototype.parseNumber = function(nextChar, code) {
    const int = readCharsUntil(nextChar, code, c => (!isDigit(c) && c != "."));
    this.push(parseFloat(int));
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


// reads characters until a balanced number of opening and closing chars have been seen, and the stopCondition is met
function readCharsUntilBalanced(startingIndex, string, openingChar, closingChar, stopCondition) {
    let foundValidStopCondition = false;
    let nestedStatementDepth = 0;

    for (var endingIndex = startingIndex; endingIndex < string.length; endingIndex++) {
        const char = string[endingIndex];
        if (nestedStatementDepth == 0 && stopCondition(char)) {
            foundValidStopCondition = true;
            break;
        } else if (char == openingChar) {
            nestedStatementDepth += 1;
        } else if (char == closingChar) {
            nestedStatementDepth -= 1;
            if (nestedStatementDepth < 0) {
                throw Error("found end of nested statement before beginning");
            }
        }
    }

    if (!foundValidStopCondition) {
        throw Error("didn't find a balanced stopCondition before end of string");
    }

    return string.substring(startingIndex, endingIndex);
}


function isDigit(char) {
    return char >= '0' && char <= '9'
}

function peekStack(stack) {
    return stack[stack.length - 1];
}


AVM.prototype.operations = {
    "+": createAVMMathOperation((a, b) => a + b),
    "-": createAVMMathOperation((a, b) => a - b),
    "/": createAVMMathOperation((a, b) => a / b),
    "*": createAVMMathOperation((a, b) => a * b),
    "%": createAVMMathOperation((a, b) => a % b),
    "&": createAVMMathOperation((a, b) => a && b),
    "|": createAVMMathOperation((a, b) => a || b),
    "=": createAVMMathOperation((a, b) => a == b),
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

    "!": function() { this.push(!this.pop()); },

    "p": function() { this.push(Math.PI); },

    "r": function() { this.push(Math.random()); },

    "d": function() { this.push(peekStack(this.stack)); },

    "f": function() { 
        const itemName = this.pop().constructor.name;
        this.push(itemName == 'Food'); 
    },

    "x": function() { this.pop(); },

    '"': function(nextChar, code) {
        const string = readCharsUntil(nextChar, code, c => c == '"');
        this.push(string);
        return string.length + 1; // +1 to skip past end quote
    },

    "?": function(nextChar, code) {
        if (this.pop()) {
            return 0;
        } else {
            const stopCondition = c => c == ':' || c == ';';
            const skippedCode = readCharsUntilBalanced(nextChar, code, '?', ';', stopCondition);
            return skippedCode.length + 1; // skip the else opcode so that the else branch executes normally
        }
    },

    ":": function(nextChar, code) {
        const skippedCode = readCharsUntilBalanced(nextChar, code, '?', ';', c => c == ';');
        return skippedCode.length;
    },

    "{": function(nextChar, code) {
        const loopObject = this.pop();
        if (typeof(loopObject) == 'number') {
            var loopCondition = new ForNLoopCondition(loopObject, nextChar);
        } else {
            var loopCondition = new ForEachLoopCondition(loopObject, nextChar);
        }
        this.loopStack.push(loopCondition);
        return readCharsUntilBalanced(nextChar, code, '{', '}', c => c == '}').length;
    },

    "}": function(nextChar) {
        const loopCondition = peekStack(this.loopStack);
        const currentValue = loopCondition.loop();
        if (currentValue !== undefined) {
            return loopCondition.location - nextChar; // loop back to matching {
        } else {
            this.loopStack.pop();
        }
    },

    "l": function() {
        this.push(peekStack(this.loopStack).currentValue)
    },

    "b": function(nextChar, code) {
        const skippedCode = readCharsUntilBalanced(nextChar, code, '{', '}', c => c == '}');
        this.loopStack.pop();
        return skippedCode.length + 1;
    }
};


function tests() {
    let a = new AVM(false, 0, [1, 2, 3], [], [], []);
    a.execute("0N{lb{1+}1+}7");
    console.log(a.stack); // [0, 1, 7]
    a.execute("0? 1?2:3; :4;");
    console.log(a.stack); // [4]
}