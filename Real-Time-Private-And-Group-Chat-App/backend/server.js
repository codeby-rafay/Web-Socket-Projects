const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// In-memory storage
const users = {};
const groups = {};
const privateMessages = {};

// get all online users as a list
function getOnlineUsers() {
  return Object.values(users);
}

// make a consistent key for two users (alphabetical order)
function getPrivateRoomKey(user1, user2) {
  return [user1, user2].sort().join("_");
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // 1. User joins with a username
  socket.on("join", (username) => {
    // Save the user
    users[socket.id] = { username, socketId: socket.id };
    socket.username = username; // attach to socket for easy access later

    console.log(`${username} joined`);

    // Tell everyone the updated user list
    io.emit("users_updated", getOnlineUsers());

    // Send existing groups to the new user
    socket.emit("groups_list", Object.values(groups));
  });

  // 2. Send a private message
  socket.on("private_message", ({ toUsername, text }) => {
    const fromUsername = socket.username;
    if (!fromUsername) return;

    const message = {
      from: fromUsername,
      to: toUsername,
      text,
      time: new Date().toLocaleTimeString(),
    };

    // Save message in history
    const key = getPrivateRoomKey(fromUsername, toUsername);
    if (!privateMessages[key]) privateMessages[key] = [];
    privateMessages[key].push(message);

    // Find the recipient's socket and send them the message
    const recipientSocket = Object.values(users).find(
      (u) => u.username === toUsername,
    );
    if (recipientSocket) {
      io.to(recipientSocket.socketId).emit("private_message", message);
    }

    // Also send back to the sender (so they see their own message)
    socket.emit("private_message", message);
  });

  // 3. Get private message history with a specific user
  socket.on("get_private_history", (otherUsername) => {
    const key = getPrivateRoomKey(socket.username, otherUsername);
    const history = privateMessages[key] || [];
    socket.emit("private_history", {
      withUser: otherUsername,
      messages: history,
    });
  });

  // 4. Create a group
  socket.on("create_group", (groupName) => {
    if (groups[groupName]) {
      socket.emit("error_msg", "Group name already exists!");
      return;
    }

    groups[groupName] = {
      name: groupName,
      members: [socket.username],
      messages: [],
    };

    // Join the socket.io room for this group
    socket.join(groupName);

    console.log(`Group "${groupName}" created by ${socket.username}`);

    // Tell everyone about the new group list
    io.emit("groups_list", Object.values(groups));
  });

  // 5. Join an existing group
  socket.on("join_group", (groupName) => {
    const group = groups[groupName];
    if (!group) {
      socket.emit("error_msg", "Group not found!");
      return;
    }

    // Add user to group members if not already in it
    if (!group.members.includes(socket.username)) {
      group.members.push(socket.username);
    }

    // Join the socket.io room
    socket.join(groupName);

    console.log(`${socket.username} joined group "${groupName}"`);

    // Send the group's message history to the user
    socket.emit("group_history", { groupName, messages: group.messages });

    // Update group list for everyone
    io.emit("groups_list", Object.values(groups));
  });

  // 6. Send a group message
  socket.on("group_message", ({ groupName, text }) => {
    const group = groups[groupName];
    if (!group) return;

    const message = {
      from: socket.username,
      groupName,
      text,
      time: new Date().toLocaleTimeString(),
    };

    // Save message to group history
    group.messages.push(message);

    // Send to everyone in the group room
    io.to(groupName).emit("group_message", message);
  });

  // 7. User disconnects
  socket.on("disconnect", () => {
    console.log(`${socket.username || socket.id} disconnected`);
    delete users[socket.id];
    io.emit("users_updated", getOnlineUsers());
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
