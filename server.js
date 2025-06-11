const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = new socketIo.Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

// Configure CORS for Express
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE"],
  credentials: true
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Initialize socket data storage
let socketData = [];
let socketDataChatNote = [];

// Middleware
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("Client user connected");

  socket.on("username", (username) => {
    if (!username) {
      socket.emit("error", "Username is required");
      return;
    }

    socket.username = username;
    const userData = { id: socket.id, username, Message: "" };
    
    // Remove existing entry if any
    socketData = socketData.filter(user => user.id !== socket.id);
    socketData.push(userData);
    
    io.emit("update socketData", socketData);
  });

  socket.on("socketData", (data) => {
    if (!Array.isArray(data)) {
      socket.emit("error", "Invalid data format");
      return;
    }
    socketData = data;
    socket.broadcast.emit("update socketData by client", data);
  });

  socket.on("disconnect", () => {
    socketData = socketData.filter(user => user.id !== socket.id);
    io.emit("update socketData", socketData);
  });
});

// Helper function to save chat history
function saveToHistory(data) {
  const filePath = "history.json";
  let history = [];
  
  try {
    if (fs.existsSync(filePath)) {
      history = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    history.push(data);
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error("Error saving to history:", error);
  }
}

// API Routes
app.get("/api/socketData", (req, res) => {
  res.json(socketData);
});

app.get("/api/socketDataChatNote", (req, res) => {
  res.json(socketDataChatNote);
});

app.get("/api/socketData/:id", (req, res) => {
  const { id } = req.params;
  const userData = socketData.find(user => user.id === id);
  
  if (!userData) {
    return res.status(404).json({ error: `User with id "${id}" not found` });
  }
  
  res.json(userData);
});

app.post("/api/addsocketData", (req, res) => {
  const { username, Message } = req.body;

  if (!username || !Message) {
    return res.status(400).json({ error: "Username and Message are required" });
  }

  const id = Math.random().toString(36).substr(2, 9);
  const newData = { id, username, Message, timestamp: new Date().toISOString() };
  
  socketData.push(newData);
  io.emit("Add socketData", socketData);
  
  res.status(201).json({ message: "Data added successfully", data: newData });
});

app.post("/api/addsocketDataAttach", upload.single("file"), (req, res) => {
  const { username, Message, To, Groupchat } = req.body;

  if (!username || !Message || !To) {
    return res.status(400).json({ error: "Username, Message, and To are required" });
  }

  let fileUrl = null;
  if (req.file) {
    fileUrl = `http://10.0.100.31:4478/${req.file.filename}`;
  }

  const id = Math.random().toString(36).substr(2, 9);
  const newData = {
    id,
    username,
    Message,
    fileUrl,
    To,
    Groupchat,
    timestamp: new Date().toISOString()
  };

  socketData.push(newData);
  saveToHistory(newData);
  io.emit("add attachfile socketData", socketData);

  res.status(201).json({ message: "Data added successfully", data: newData });
});

app.post("/api/addsocketTicketChatnote", upload.single("file"), (req, res) => {
  const { username, Message, To, Groupchat } = req.body;

  if (!username || !Message || !To) {
    return res.status(400).json({ error: "Username, Message, and To are required" });
  }

  let fileUrl = null;
  if (req.file) {
    fileUrl = `http://10.0.100.31:4478/${req.file.filename}`;
  }
  const readdata = "false";
  const id = Math.random().toString(36).substr(2, 9);
  const newData = {
    id,
    username,
    Message,
    fileUrl,
    To,
    Groupchat,
    readdata,
    timestamp: new Date().toISOString()
  };

  socketDataChatNote.push(newData);
  saveToHistory(newData);
  io.emit("addTicketChatNote", socketDataChatNote);

  res.status(201).json({ message: "Data added successfully", data: newData });
});

app.post("/api/addsocketTicketChatnoteAdmin", upload.single("file"), (req, res) => {
  const { username, Message, To, Groupchat } = req.body;

  if (!username || !Message || !To) {
    return res.status(400).json({ error: "Username, Message, and To are required" });
  }

  let fileUrl = null;
  if (req.file) {
    fileUrl = `http://10.0.100.31:4478/${req.file.filename}`;
  }
  const readdata = "false";
  const typechat = "admin";
  const id = Math.random().toString(36).substr(2, 9);
  const newData = {
    id,
    username,
    Message,
    fileUrl,
    To,
    Groupchat,
    readdata,
    typechat,
    timestamp: new Date().toISOString()
  };

  socketDataChatNote.push(newData);
  saveToHistory(newData);
  io.emit("addTicketChatNote", socketDataChatNote);

  res.status(201).json({ message: "Data added successfully", data: newData });
});

app.post("/api/addsocketTicketChatnoteAirline", upload.single("file"), (req, res) => {
  const { username, Message, To, Groupchat } = req.body;

  if (!username || !Message || !To) {
    return res.status(400).json({ error: "Username, Message, and To are required" });
  }

  let fileUrl = null;
  if (req.file) {
    fileUrl = `http://10.0.100.31:4478/${req.file.filename}`;
  }
  const readdata = "false";
  const typechat = "airline";
  const id = Math.random().toString(36).substr(2, 9);
  const newData = {
    id,
    username,
    Message,
    fileUrl,
    To,
    Groupchat,
    readdata,
    typechat,
    timestamp: new Date().toISOString()
  };

  socketDataChatNote.push(newData);
  saveToHistory(newData);
  io.emit("addTicketChatNote", socketDataChatNote);

  res.status(201).json({ message: "Data added successfully", data: newData });
});
app.post("/api/markAsReadbyAirline/:To/:From", (req, res) => {
  const { To, From } = req.params;

  // Find the message by ID
  // const message = socketDataChatNote.find(user => user.To === To && user.username === From);
  const updatedMessages = socketDataChatNote.filter(user => user.To === To && user.username === From && user.typechat === "airline");

   if (!updatedMessages) {
    return res.status(404).json({ error: `Message with id "${To}" not found` });
  }
   updatedMessages.forEach(message => {
    message.readdata = true; // Set 'readdata' to true for each matching message
  });
  res.json({ message: "Message marked as read", updatedMessages });
});

app.post("/api/markAsReadbyAdmin/:From/:To", (req, res) => {
  const { From, To } = req.params;

  // Find the message by ID
  // const message = socketDataChatNote.find(user => user.To === To && user.username === From);
  const updatedMessages = socketDataChatNote.filter(user => user.username === From && user.To === To && user.typechat === "admin");

   if (!updatedMessages) {
    return res.status(404).json({ error: `Message with id "${To}" not found` });
  }
   updatedMessages.forEach(message => {
    message.readdata = true; // Set 'readdata' to true for each matching message
  });
  res.json({ message: "Message marked as read", updatedMessages });
});

app.get("/api/countUnreadMessagesAirline/:To/:From", (req, res) => {
  const { To, From } = req.params;

  // Find all messages that match the "To", "From", and "readdata = false"
  const unreadMessages = socketDataChatNote.filter(
    message => message.To === To && message.username === From && JSON.parse(message.readdata) === false && message.typechat === "airline"
  );

  console.log("to:", To);
  console.log("from:", From);
  console.log("unreadMessages:", unreadMessages.length);

  // Return the count of unread messages
  res.json({ unreadCount: unreadMessages.length });
});

app.get("/api/countUnreadMessagesAdmin/:From/:To", (req, res) => {
  const { From, To } = req.params;

  // Find all messages that match the "To", "From", and "readdata = false"
  const unreadMessages = socketDataChatNote.filter(
    message => message.username === From && message.To === To && JSON.parse(message.readdata) === false && message.typechat === "admin"
  );

  console.log("to:", To);
  console.log("from:", From);
  console.log("unreadMessages:", unreadMessages.length);

  // Return the count of unread messages
  res.json({ unreadCount: unreadMessages.length });
});

app.get("/api/socketDataChatNote/:id", (req, res) => {
  const { id } = req.params;
  const userData = socketDataChatNote.find(user => user.id === id);
  
  if (!userData) {
    return res.status(404).json({ error: `User with id "${id}" not found` });
  }
  
  res.json(userData);
});

app.delete("/api/deletesocketData/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = socketData.length;
  
  socketData = socketData.filter(user => user.id !== id);
  
  if (socketData.length === initialLength) {
    return res.status(404).json({ error: `User with id "${id}" not found` });
  }

  io.emit("update socketData", socketData);
  res.json({ message: "Data deleted successfully", socketData });
});

// Start server
const PORT = process.env.PORT || 8042;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
