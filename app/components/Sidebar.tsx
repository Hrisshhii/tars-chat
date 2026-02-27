/* eslint-disable @next/next/no-img-element */

"use client";

import { UserButton } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import {motion} from "framer-motion";

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
    <div className="w-full md:w-1/3 p-6 backdrop-blur-xl border-r space-y-4 border-white/10">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 via-indigo-300 to-cyan-200 bg-clip-text text-transparent">Chats</h1>
          <UserButton />
        </div>
        <div className="flex gap-2">
          <input type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full p-4 px-4 py-3 bg-white/5 border border-white/10 rounded-full"/>
          <button onClick={()=>setShowGroupModal(true)}>
            <PlusCircle size={40} className="bg-blue-400 rounded-full text-black cursor-pointer hover:scale-110 hover:bg-blue-300 transition-all"/>
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
                className="p-3  border border-white/10 rounded cursor-pointer hover:bg-gray-700"
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
              className={`py-4 px-0 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-200 cursor-pointer
                ${selectedConversation===conversation._id?"bg-gray-800":"hover:bg-gray-400"}  
              `}
            >
              <div className="flex items-start gap-4">
                <div className="relative shrink-0 pt-1 pl-2">
                  <img
                    src={otherUser?.imageUrl}
                    alt="avatar"
                    className="w-10 rounded-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 leading-tight">
                  <div className="flex justify-between items-center gap-2">
                    <p className="font-semibold text-white text-[0.95rem] truncate max-w-[75%]">
                      {conversation.isGroup ? conversation.name ?? "Group Chat" : otherUser?.name ?? "Unknown User"}
                    </p>

                    {latest && (
                      <span className="text-[0.7rem] p-2 text-white/40 whitespace-nowrap shrink-0 pl-1">
                        {new Date(latest.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-[0.8rem] text-white/50 truncate">
                    {latest?.content ?? "No messages yet"}
                  </p>
                </div>
              </div>
              
              {unreadCount > 0 && selectedConversation!==conversation._id && (
                <span className="bg-linear-to-r from-rose-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full shadow-md">
                  {unreadCount}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          
          <motion.div initial={{opacity: 0,scale: 0.9,y: 20}} animate={{opacity:1, scale: 1,y: 0}} exit={{opacity: 0}} transition={{duration: 0.2}}
            className="w-105 max-w-[95%] p-6 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/40">
            
            <h2 className="text-xl font-semibold text-white mb-4">Create Group</h2>

            <input placeholder="Group name..." value={groupName} onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-3 mb-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 
                focus:outline-none focus:ring-2 focus:ring-blue-500transition"/>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {users ?.filter((u)=>u._id !== currentUserConvexId).map((u)=>{
                  const isSelected=selectedUsers.includes(u._id);
                  return (
                    <div key={u._id} onClick={()=>setSelectedUsers((prev)=>isSelected ? prev.filter((id) => id !== u._id) : [...prev, u._id])}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200
                        ${isSelected ? "bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30"
                            : "bg-white/4 hover:bg-white/8 text-white/80"
                        }`}
                    >
                      <span className="truncate">{u.name}</span>

                      {isSelected && (
                        <span className="text-sm font-semibold">✓</span>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={()=>setShowGroupModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition">
                Cancel
              </button>

              <button
                onClick={async()=>{
                  if(!groupName.trim()||selectedUsers.length===0) return;
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
                className="px-5 py-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-500 hover:scale-105 transition-all duration-200 shadow-lg 
                  shadow-blue-500/30 text-white font-medium"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}