# The AVM

The AVM (Ant Virtual Machine) is an interpreter for a stack based language inspired by 05AB1E  

## Literals

- **Numbers**: Numbers begin with any digit and can contain a decimal. Numbers cannot be negative. Numbers are terminated by any character that is not part of the number. For example, the code `12.54` pushes the number 12.54 to the stack.
- **Strings**: A `"` is used to begin and end a string literal. For example, the code `"str"` will push the string "str" to the stack

## Math

The following commands each pop two elements from the stack, and push one element onto the stack. The two popped elements will be referred to as A and B, where B is the element that was pushed onto the stack most recently, and A is the element that was pushed onto the stack before A.

- `+`: Pushes A + B
- `-`: Pushes A - B
- `/`: Pushes A / B
- `*`: Pushes A * B
- `%`: Pushes A % B
- `|`: Pushes A || B (a boolean)
- `&`: Pushes A && B (a boolean)
- `=`: Pushes `true` if A == B, false otherwise
- `>`: Pushes `true` if A > B, false otherwise
- `<`: Pushes `true` if A < B, false otherwise

## Inputs

- `H`: Pushes `true` if the ant hit a wall last frame, `false` otherwise
- `D`: Pushes the ant's current direction (specified in radians)
- `N`: Pushes a list of objects close to the ant
- `P`: Pushes a list of object the ant can pick up
- `I`: Pushes the ant's current inventory
- `R`: Pushes the ant's current RAM

## Outputs

- `T`: Pops the top element off the stack and makes the ant take that item (if it is within pick up distance of the ant)
- `M`: Pops the top element off the stack and uses it to move the ant. If the object is a number it is treated as the new movement direction for the ant. If it is an object on the map then the ant will move toward that object
- `U`: Pops the top element off the stack and sets it as the item the ant will drop this frame (if the ant is carrying that item)

## Misc

- `!`: Logical not. Pops the top element off the stack and pushes `false` if that object is truthy, pushes `true` otherwise
- `p`: Pushes pi to the stack
- `r`: Pushes a random number between 0 and 1
- `d`: Duplicates the top element on the stack (pushes a copy)
- `x`: Destroys the top element of the stack
- `f`: Pops the top element off the stack and pushes `true` if that element is food, `false` otherwise

## Looping

- `{`: Begins a loop. When the AVM encounters a `{` it will pop an object off the top of the stack, and use that object to loop. If that object is a number N, it will loop N times. If that object is a list it will iterate over every element of the list.
- `}`: Closes a loop
- `l`: Pushes the current loop object to the stack. If you are looping on a number, `l` will push a 0 on the first iteration of the loop, 1 on the next iteration, and so on (until the loop ends). If you are looping on a list, `l` will push an element of the list to the stack.
- `b`: Breaks out of the current loop

## Conditionals

- `?`: Starts an if statement. Pops the top element off the stack and checks if it is truthy or falsy. If it is truthy, the code after the `?` is executed. Execution continues until a `:` (else) or `;` (if/else terminator) are found. If the value on the stack is falsy, execution jumps to the corresponding `:` or `;`
- `:` Starts an else statement. Must come after a `?` and before a `;`. The code after the `:` and before the `;` is executed if the corresponding `?` found a falsy value on the stack
- `;`: Terminates an if or if else statement