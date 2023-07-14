let socket = io.connect();

let player = {};
let cells = {};
let foods = {};
let myCellId = null;

function setup() {
    createCanvas(800, 600);
}

function draw() {
    background(220);

    let cell = cells[myCellId];

    // If your cell doesn't exist, don't proceed with the rest of the draw function
    if (!cell) {
        return;
    }

    // Calculate the scale factor based on cell radius
    let scaleFactor = 100 / cell.radius; // This is an example scale value, you may need to adjust this for your game
    // Implement limit to the scale factor to prevent it from becoming too big or too small
    // scaleFactor = constrain(scaleFactor, 0.5, 2);

    // Calculate the translated position for centering the cell
    let translateX = width / 2 - cell.x * scaleFactor;
    let translateY = height / 2 - cell.y * scaleFactor;

    // Draw cells
    for (let id in cells) {
        let otherCell = cells[id];
        if (otherCell.color) {
            fill(otherCell.color);
        }
        let otherCellSize = otherCell.radius * 2 * scaleFactor;
        ellipse(
            otherCell.x * scaleFactor + translateX,
            otherCell.y * scaleFactor + translateY,
            otherCellSize
        );
    }

    // Draw foods
    for (let id in foods) {
        let food = foods[id];
        if (food.color) {
            fill(food.color);
        }
        let foodSize = food.radius * 2 * scaleFactor;
        ellipse(
            food.x * scaleFactor + translateX,
            food.y * scaleFactor + translateY,
            foodSize
        );
    }
}

setInterval(() => {
    console.log(cells);
    console.log("my cell: ", cells[myCellId]);
    // console.log(foods);
}, 5000);

socket.on("welcome", (data) => {
    myCellId = data.id;
    console.log(myCellId);
});

socket.on("update", (data) => {
    // Store your cell's current position before updating cells
    let myCurrentCell = cells[myCellId];

    // Update all cells and foods
    cells = data.cells;
    foods = data.foods;

    // Restore your cell's current position
    if (myCurrentCell) {
        cells[myCellId].x = myCurrentCell.x;
        cells[myCellId].y = myCurrentCell.y;
    }
});

function createVector(x, y) {
    return { x: x, y: y };
}
let velocity = createVector(0, 0);

function mouseMoved() {
    // Calculate velocity based on mouse position and cell's position
    let cell = cells[myCellId];
    if (cell) {
        velocity = createVector(mouseX - 400, mouseY - 300);
        velocity.limit(5); // Limit the speed
        // Update the cell's position
        cell.x += velocity.x;
        cell.y += velocity.y;

        // Send the updated cell data to the server
        socket.emit("update", cell);
    }
}
