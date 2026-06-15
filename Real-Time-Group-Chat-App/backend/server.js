import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

app.get("/", (req, res) => {
  res.send("<h1>Hello world</h1>");
});

const ROOM = "group";

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("joinRoom", async (userName) => {
    console.log(`${userName} joined the group`);

    await socket.join(ROOM);

    // send to all
    // io.to(ROOM).emit("roomNotice", userName);

    // broadcast to all except sender
    socket.to(ROOM).emit("roomNotice", userName);

    socket.on("chatMessage", (msg) => {
      socket.to(ROOM).emit("chatMessage", msg);
    });

    socket.on("typing", () => {
      socket.to(ROOM).emit("typing", userName);
    });

    socket.on("stopTyping", () => {
      socket.to(ROOM).emit("stopTyping", userName);
    });
  });
});

server.listen(5000, () => {
  console.log("server running at http://localhost:5000");
});
