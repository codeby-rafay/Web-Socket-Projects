import { useState } from "react";

export default function Sidebar({
  currentUser,
  onlineUsers,
  groups,
  activeChat,
  setActiveChat,
  socket,
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const [showGroupInput, setShowGroupInput] = useState(false);

  // Create a new group and join it right away
  function handleCreateGroup(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    socket.emit("create_group", newGroupName.trim());
    socket.emit("join_group", newGroupName.trim());
    setActiveChat({ type: "group", name: newGroupName.trim() });
    setNewGroupName("");
    setShowGroupInput(false);
  }

  // Join an existing group
  function handleJoinGroup(groupName) {
    socket.emit("join_group", groupName);
    setActiveChat({ type: "group", name: groupName });
  }

  // Open a private chat
  function handlePrivateChat(user) {
    setActiveChat({ type: "private", name: user.username });
  }

  // Helper: is this the currently open chat?
  function isActive(type, name) {
    return activeChat?.type === type && activeChat?.name === name;
  }

  // Other users (everyone except yourself)
  const others = onlineUsers.filter((u) => u.username !== currentUser);

  return (
    <aside className="w-72 min-w-55 bg-slate-800 border-r border-slate-700 flex flex-col">
      {/*Header*/}
      <div className="px-5 py-4 border-b border-slate-700">
        <h1 className="text-xl font-bold text-violet-400">💬 ChatApp</h1>
        <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          {currentUser}
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Online Users */}
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
            🟢 Online ({others.length})
          </h2>

          {others.length === 0 ? (
            <p className="text-slate-600 text-xs px-2 py-1">
              No other users online
            </p>
          ) : (
            <ul className="space-y-0.5">
              {others.map((user) => (
                <li
                  key={user.socketId}
                  onClick={() => handlePrivateChat(user)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors
                    ${
                      isActive("private", user.username)
                        ? "bg-violet-600 text-white"
                        : "text-slate-300 hover:bg-slate-700"
                    }`}
                >
                  <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  {user.username}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Divider */}
        <div className="mx-4 my-2 border-t border-slate-700" />

        {/* Groups */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Groups
            </h2>
            <button
              onClick={() => setShowGroupInput(!showGroupInput)}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
            >
              {showGroupInput ? "✕ Cancel" : "+ New"}
            </button>
          </div>

          {/* Create group input */}
          {showGroupInput && (
            <form onSubmit={handleCreateGroup} className="flex gap-1.5 mb-2">
              <input
                type="text"
                placeholder="Group name..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                autoFocus
                className="flex-1 bg-slate-900 border border-slate-600 text-white text-xs rounded-lg
                           px-3 py-2 outline-none placeholder-slate-500 focus:border-violet-500 transition-colors"
              />
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold
                           rounded-lg px-3 py-2 transition-colors cursor-pointer"
              >
                Go
              </button>
            </form>
          )}

          {/* Group list */}
          {groups.length === 0 ? (
            <p className="text-slate-600 text-xs px-2 py-1">No groups yet</p>
          ) : (
            <ul className="space-y-0.5">
              {groups.map((group) => (
                <li
                  key={group.name}
                  onClick={() => handleJoinGroup(group.name)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors
                    ${
                      isActive("group", group.name)
                        ? "bg-violet-600 text-white"
                        : "text-slate-300 hover:bg-slate-700"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-slate-400">#</span>
                    {group.name}
                  </span>
                  <span
                    className={`text-[11px] ${isActive("group", group.name) ? "text-violet-200" : "text-slate-500"}`}
                  >
                    {group.members.length}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
