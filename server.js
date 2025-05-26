const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const fs = require("fs");

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

const socketData = [{ id: "", username: "", Message: "" }]; // Shared variable to store socket data

// Middleware to parse JSON
app.use(express.json());

// Serve files in the 'uploads' directory at the '/uploads' URL path
app.use("/uploads", express.static("uploads"));

// Socket.IO communication for real-time events
io.on("connection", (socket) => {
  try {
    console.log("Client user connected");

    // Listen for the "username" event
    socket.on("username", (username) => {
      console.log("Username received:", username);
      socket.username = username;
      // Add the username to the shared socketData array
      socketData.push({ id: socket.id, username, Message: socket.Message });
      console.log("Updated socketData:", socketData);
      // Notify all clients about the updated socketData
      io.emit("update socketData", socketData);
    });
    // Receive updated socket data from client (optional)
    socket.on("socketData", (data) => {
      console.log("Received socketData from client:", data);
      socketData = data;
      // Broadcast updated data to all clients except sender
      socket.broadcast.emit("update socketData by client", data);
    });
    // Handle client disconnection
    socket.on("disconnect", () => {
      // console.log(`User ${socket.username || "unknown"} disconnected`);
      // Remove the disconnected user from the socketData array
      const index = socketData.findIndex((user) => user.id === socket.id);
      if (index !== -1) {
        socketData.splice(index, 1);
      }
      console.log("Updated socketData after disconnect:", socketData);
      
      // Notify all clients about the updated socketData
      //io.emit("update socketData", socketData);
    });
  } catch (error) {
    console.error("Error in socket connection:", error);
  }
});
// API to get the current socket data, this is showing data
app.get("/api/socketData", (req, res) => {
  const { id, username, Message, fileUrl } = req.body;
  const newData = { id, username, Message, fileUrl };
  socketData.push(newData);
  //console.log("Data to socketData:", newData);
  res.status(201).json({ message: "Data added successfully", socketData });
  res.json(socketData); // Return the current socket data
});

// API to get socket data by socket id
app.get("/api/socketData/:id", (req, res) => {
  const { id } = req.params;
  const userData = socketData.find((user) => user.id === id);
  if (!userData) {
    return res.status(404).json({ error: `User with id "${id}" not found` });
  }
  res.json(userData);
});

// API to add data to the socketData array
app.get("/api/addsocketData", (req, res) => {
  const { username, Message } = req.body;
  if (!res.headersSent) {
    res.json({ Message: "Success", statuscode: 200 });
  }
  // Validate input parameters
  if (!username || !Message) {
    return res
      .status(400)
      .json({ error: "id, username, and Message are required" });
  }
  // Generate a random id
  const id = Math.random().toString(36).substr(2, 9); // Random alphanumeric string
  // Add the new data to the socketData array
  const newData = { id, username, Message };
  socketData.push(newData);
  console.log("Add socketData", newData);

    // Notify all connected clients about the updated socketData
  io.emit("Add socketData", socketData);
  if (!id || !username || !Message) {
    res.status(201).json({ message: "Data added successfully", socketData });
    res.json(socketData);
  }
});

//this is for file upload with message
app.post("/api/addsocketDataAttach", upload.single("file"), (req, res) => {
  const { username, Message, To } = req.body;
  let fileUrl = null;

  // Validate input parameters
  if (!username || !Message || !To) {
    return res.status(400).json({ error: "username and Message are required" });
  }

  // If a file was uploaded, save its path
  if (req.file) {
    // fileUrl = `/uploads/${req.file.filename}`;
    //this is for local c drive directory with IIS    
    fileUrl = `http://localhost:4478/${req.file.filename}`;

    //this is for local c drive directory with express
    // fileUrl = `http://localhost:3001/SOCKETAPI/uploads/${req.file.filename}`;
  }
  // Generate a random id
  const id = Math.random().toString(36).substr(2, 9);
  // Add the new data to the socketData array
  const newData = { id, username, Message, fileUrl, To, timestamp: new Date().toISOString() };
  socketData.push(newData);
  console.log("Added new data to socketData", newData);

  // Save to history
  saveToHistory(newData);

  // Notify all connected clients about the updated socketData
  io.emit("add attachfile socketData", socketData);
  res.status(201).json({ message: "Data added successfully", socketData });
});

function saveToHistory(data) {
  const filePath = "history.json";
  let history = [];
  if (fs.existsSync(filePath)) {
    history = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  history.push(data);
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
}

// API to delete a specific entry from the socketData array by id
app.delete("/api/deletesocketData/:id", (req, res) => {
  const { id } = req.params;
  // Find the index of the entry with the specified id
  const index = socketData.findIndex((user) => user.id === id);
  if (index === -1) {
    // If the id is not found, return a 404 error
    return res.status(404).json({ error: `User with id "${id}" not found` });
  }
  // Remove the entry from the socketData array
  const removedData = socketData.splice(index, 1);
  console.log(`Removed data:`, removedData);
  // Notify all connected clients about the updated socketData
  io.emit("update socketData", socketData);
  res.json({
    message: `User with id "${id}" deleted successfully`,
    socketData,
  });
});

// Start the server
server.listen(8042, () => {
  console.log("Server running on http://localhost:8042");
});
