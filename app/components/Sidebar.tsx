
"use client";

import { UserButton } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { PlusCircle } from "lucide-react";

interface SidebarProps {
  currentUserConvexId: Id<"users">;
  selectedConversation: Id<"conversations"> | null;
  onSelectConversation: (id: Id<"conversations">) => void;
}

export function Sidebar({
  currentUserConvexId,
  selectedConversation,
  onSelectConversation,
}: SidebarProps) {
  const conversations=useQuery(api.conversations.getUserConversations,{userId:currentUserConvexId});
  const unreadCounts=useQuery(api.messages.getUnreadCounts,{userId:currentUserConvexId,})
  const users=useQuery(api.users.getUsers);
  const clearUnread=useMutation(api.messages.clearUnread);
  const createConversation = useMutation(api.conversations.createOrUpdateConversation);

  const createGroupConversation = useMutation(api.conversations.createGroupConversation);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);

  const [search, setSearch] = useState("");

  if(!conversations) return <div>Loading...</div>;

  const filteredConvos=conversations.filter((conversation)=>{
    if(!users) return false;
    if(conversation.isGroup){
      return(conversation.name ?? "").toLowerCase().includes(search.toLowerCase());
    }
    const otherParticipantId=conversation.participants.find(id=>id !== currentUserConvexId);
    const otherUser=users.find(u=>u._id===otherParticipantId);

    return (
      otherUser?.name.toLowerCase().includes(search.toLowerCase()) ?? false
    );
  });

  return (
    <div className="w-full md:w-1/3 border-r p-4 space-y-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Chats</h1>
          <UserButton />
        </div>
        <div className="flex gap-2">
          <input type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full p-4 border rounded-full border-gray-500"/>
          <button onClick={()=>setShowGroupModal(true)}>
            <PlusCircle size={40} className="bg-blue-400 rounded-full text-black cursor-pointer hover:scale-110"/>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {conversations.length === 0 && users && (
          <>
            <p className="text-gray-500 text-sm mb-2">
              Start a conversation:
            </p>

            {users.filter(u => u._id !== currentUserConvexId).map(u => (
                <div key={u._id}
                  onClick={async () => {
                    const convoId = await createConversation({
                      user1: currentUserConvexId,
                      user2: u._id,
                    });
                    onSelectConversation(convoId);
                  }}
                  className="p-3 border rounded cursor-pointer hover:bg-gray-700"
                >
                  {u.name}
                </div>
              ))}
          </>
        )}

        {filteredConvos.map((conversation)=>{
          const unread=unreadCounts?.find(u=>u.conversationId===conversation._id);
          const unreadCount = unread?.count ?? 0;
          const othreParticipantId=conversation.participants.find(id=>id!==currentUserConvexId);
          const otherUser=users?.find(u=>u._id===othreParticipantId);
          const latest = conversation.lastMessage;

          return(
            <div key={conversation._id} onClick={async ()=>{
                onSelectConversation(conversation._id);
                await clearUnread({
                  conversationId:conversation._id,
                  userId:currentUserConvexId,
                });
              }}
              className={`p-3 border rounded flex justify-between items-center cursor-pointer
                ${selectedConversation===conversation._id?"bg-gray-800":"hover:bg-gray-400"}  
              `}
            >
              <div className="flex flex-col">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">{conversation.isGroup?conversation.name ?? "Group Chat":otherUser?.name ?? "Unknown User"}</p>
                  {latest && (
                    <span className="text-xs text-gray-400">
                      {latest ? new Date(latest.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }):""}
                    </span>
                  )}
                </div>

                <p className="text-[0.75rem] text-gray-400 truncate w-45">
                  {latest?.content ?? "No messages yet"}
                </p>
              </div>
              
              {unreadCount > 0 && selectedConversation!==conversation._id && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-xl w-96 space-y-4">
            <h2 className="text-lg font-semibold">Create Group</h2>

            <input placeholder="Group name" value={groupName} onChange={(e)=>setGroupName(e.target.value)}
              className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
            />

            <div className="max-h-40 overflow-y-auto space-y-2">
              {users?.filter(u=>u._id !== currentUserConvexId).map(u=>{
                const isSelected = selectedUsers.includes(u._id);
                  return (
                    <div key={u._id}
                      onClick={()=>{
                        setSelectedUsers(prev=>isSelected? prev.filter(id=>id !== u._id):[...prev, u._id]);
                      }}
                      className={`p-2 rounded cursor-pointer ${isSelected ? "bg-blue-500" : "bg-zinc-800"}`}
                    >
                      {u.name}
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={()=>setShowGroupModal(false)} className="px-3 py-1 bg-zinc-700 rounded cursor-pointer">
                Cancel
              </button>

              <button
                onClick={async ()=>{
                  if (!groupName.trim() || selectedUsers.length===0) return;

                  const convoId=await createGroupConversation({
                    creatorId: currentUserConvexId,
                    participantIds: selectedUsers,
                    name: groupName,
                  });
                  setShowGroupModal(false);
                  setGroupName("");
                  setSelectedUsers([]);
                  onSelectConversation(convoId);
                }}
                className="px-3 py-1 bg-blue-500 rounded cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}