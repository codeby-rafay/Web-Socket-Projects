import { useState, useEffect, useRef } from "react";

export default function ChatWindow({ activeChat, currentUser, socket }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const bottomRef = useRef(null); // for auto scroll

  // Load history and listen for new messages whenever the chat changes
  useEffect(() => {
    if (!activeChat) return;

    // Clear messages when switching chats
    setMessages([]);

    if (activeChat.type === "private") {
      // Ask server for past messages with this person
      socket.emit("get_private_history", activeChat.name);

      socket.on("private_history", ({ withUser, messages: history }) => {
        if (withUser === activeChat.name) setMessages(history);
      });

      socket.on("private_message", (msg) => {
        const isRelevant =
          msg.from === activeChat.name || msg.to === activeChat.name;
        if (!isRelevant) return;
        setMessages((prev) => {
          // Deduplicate
          const isDupe = prev.some(
            (m) =>
              m.from === msg.from && m.text === msg.text && m.time === msg.time,
          );
          return isDupe ? prev : [...prev, msg];
        });
      });
    }

    if (activeChat.type === "group") {
      socket.on("group_history", ({ groupName, messages: history }) => {
        if (groupName === activeChat.name) setMessages(history);
      });

      socket.on("group_message", (msg) => {
        if (msg.groupName === activeChat.name) {
          setMessages((prev) => [...prev, msg]);
        }
      });
    }

    return () => {
      socket.off("private_history");
      socket.off("private_message");
      socket.off("group_history");
      socket.off("group_message");
    };
  }, [activeChat, socket]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(e) {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    if (activeChat.type === "private") {
      socket.emit("private_message", {
        toUsername: activeChat.name,
        text: inputText.trim(),
      });
    } else {
      socket.emit("group_message", {
        groupName: activeChat.name,
        text: inputText.trim(),
      });
    }

    setInputText("");
  }

  // No chat selected
  if (!activeChat) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-slate-900">
        <div className="text-center text-slate-600">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-slate-500">
            Pick a conversation
          </h2>
          <p className="text-sm mt-1">
            Select a user or group from the sidebar
          </p>
        </div>
      </main>
    );
  }

  // Active chat
  return (
    <main className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold">
          {activeChat.type === "private"
            ? activeChat.name[0].toUpperCase()
            : "#"}
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm leading-tight">
            {activeChat.name}
          </h3>
          <p className="text-slate-400 text-xs">
            {activeChat.type === "private" ? "Private message" : "Group chat"}
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-center text-slate-600 text-sm mt-10">
            No messages yet. Say hi!
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.from === currentUser;
          return (
            <div
              key={i}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[60%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}
              >
                {/* Sender name — only shown in group chats for others */}
                {activeChat.type === "group" && !isMe && (
                  <span className="text-violet-400 text-xs font-semibold px-1">
                    {msg.from}
                  </span>
                )}

                {/* Bubble */}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${
                      isMe
                        ? "bg-violet-600 text-white rounded-br-sm"
                        : "bg-slate-700 text-slate-100 rounded-bl-sm"
                    }`}
                >
                  {msg.text}
                </div>

                {/* Timestamp */}
                <span className="text-slate-600 text-[11px] px-1">
                  {msg.time}
                </span>
              </div>
            </div>
          );
        })}

        {/* Invisible anchor for auto-scroll */}
        <div ref={bottomRef} />
      </div>

      {/* Message input */}
      <div className="px-6 py-4 bg-slate-800 border-t border-slate-700 shrink-0">
        <form onSubmit={sendMessage} className="flex gap-3 items-center">
          <input
            type="text"
            placeholder={`Message ${activeChat.name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            autoFocus
            className="flex-1 bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-2.5
                       text-sm outline-none placeholder-slate-500 focus:border-violet-500 transition-colors"
          />
          <button
            type="submit"
            className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-5 py-2.5
                       text-sm font-semibold transition-colors cursor-pointer shrink-0"
          >
            Send →
          </button>
        </form>
      </div>
    </main>
  );
}
