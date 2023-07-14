const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const Cell = require("./Cell");
const Food = require("./Food");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.static("public"));

const server = http.createServer(app);
const io = socketIo(server);

let cells = {};
let foods = {};

// Dimensions of the game area
const WIDTH = 800;
const HEIGHT = 600;

// Generate a unique id for food items
let foodId = 0;
let initialRadius = 50;

// Function to generate food randomly
function createFood(x, y) {
    let id = foodId++;
    let radius = 5; // Or any size you want for the food
    let color = "blue"; // Or any color you want for the food

    let food = new Food(id, x, y, radius, color);
    foods[id] = food;
}

// Create 100 pieces of food randomly when the server starts
for (let i = 0; i < 100; i++) {
    let x = Math.floor(Math.random() * WIDTH);
    let y = Math.floor(Math.random() * HEIGHT);
    createFood(x, y);
}

function checkCollision(a, b) {
    const distance = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    return distance < a.radius + b.radius;
}

// This function can be used to handle cell-food collisions
function handleCellFoodCollision(cell, food) {
    if (checkCollision(cell, food)) {
        // Increase the cell's radius by a certain amount
        cell.radius += 1;

        // Remove the food from the foods object
        delete foods[food.id];

        // Optionally, you can add a new food to replace the eaten one
        foods[uuidv4()] = new Food();
    }
}

// This function can be used to handle cell-cell collisions
function handleCellCellCollision(cell1, cell2) {
    if (checkCollision(cell1, cell2)) {
        if (cell1.radius > cell2.radius) {
            // cell1 eats cell2
            cell1.radius += cell2.radius;
            delete cells[cell2.id];
        } else if (cell1.radius < cell2.radius) {
            // cell2 eats cell1
            cell2.radius += cell1.radius;
            delete cells[cell1.id];
        }
    }
}

io.on("connection", (socket) => {
    console.log("New client connected");
    cells[socket.id] = new Cell(
        socket.id,
        Math.random(WIDTH),
        Math.random(HEIGHT),
        initialRadius,
        "pink"
    );
    console.log(cells[socket.id]);

    socket.emit("welcome", { id: socket.id });

    socket.on("update", (cellData) => {
        // Update the cell's data in the server's cells object
        if (cells[socket.id]) {
            cells[socket.id] = cellData;
        }

        let cell = cells[socket.id];

        // Check for collisions with food
        for (let id in foods) {
            let food = foods[id];
            handleCellFoodCollision(cell, food);
        }

        // Check for collisions with other cells
        for (let id in cells) {
            if (id === socket.id) continue;
            let otherCell = cells[id];
            handleCellCellCollision(cell, otherCell);
        }

        // Then emit the updated cells and foods to all clients
        io.sockets.emit("update", { cells, foods });
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected");
        delete cells[socket.id];
    });
});
setInterval(() => {
    io.sockets.emit("update", { cells, foods });
}, 1000 / 60); // 60 updates per second

const port = process.env.PORT || 3000;

server.listen(port, () => console.log(`Server listening on port ${port}`));

setInterval(() => {
    createFood();
    Object.keys(cells).map((key) => {
        let cell = cells[key];
        createFood(
            cell.x + Math.random() * 4 * WIDTH - WIDTH * 2,
            cell.y + Math.random() * 4 * HEIGHT - HEIGHT * 2
        );
    });
}, 50);
