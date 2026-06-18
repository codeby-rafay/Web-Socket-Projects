import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

// Connect to the backend once when the app loads
const socket = io("http://localhost:5000");

export default function App() {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    socket.on("users_updated", (users) => setOnlineUsers(users));
    socket.on("groups_list", (list) => setGroups(list));
    return () => {
      socket.off("users_updated");
      socket.off("groups_list");
    };
  }, []);

  function handleLogin(e) {
    e.preventDefault();
    if (!username.trim()) return;
    socket.emit("join", username.trim());
    setIsLoggedIn(true);
  }

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 w-full max-w-sm shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">💬</div>
            <h1 className="text-3xl font-bold text-white">ChatApp</h1>
            <p className="text-slate-400 mt-2 text-sm">
              Enter your name to start chatting
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Your name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              className="bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none
                         placeholder-slate-500 focus:border-violet-500 transition-colors text-sm"
            />
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl py-3
                         transition-colors cursor-pointer text-sm"
            >
              Join Chat →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      <Sidebar
        currentUser={username}
        onlineUsers={onlineUsers}
        groups={groups}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        socket={socket}
      />
      <ChatWindow
        activeChat={activeChat}
        currentUser={username}
        socket={socket}
      />
    </div>
  );
}
