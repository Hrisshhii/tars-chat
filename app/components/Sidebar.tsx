
"use client";

import { UserButton } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";

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

  const [search, setSearch] = useState("");

  useEffect(()=>{
    if(!selectedConversation) return;
    clearUnread({
      conversationId:selectedConversation,
      userId:currentUserConvexId,
    });
  },[selectedConversation, currentUserConvexId, clearUnread]);

  if(!conversations) return <div>Loading...</div>;

  const filteredConvos=conversations.filter((conversation)=>{
    const otherParticipantId=conversation.participants.find(id=>id!==currentUserConvexId);
    const otherUser=users?.find(u=>u._id===otherParticipantId);

    if(!otherUser) return false;
    return otherUser.name.toLowerCase().includes(search.toLowerCase());
  })

  return (
    <div className="w-full md:w-1/3 border-r p-4 space-y-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Chats</h1>
          <UserButton />
        </div>
        <input type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full p-4 border rounded-full border-gray-500"/>
      </div>

      <div className="space-y-2">
        {conversations.length === 0 && users && (
          <>
            <p className="text-gray-500 text-sm mb-2">
              Start a conversation:
            </p>

            {users
              .filter(u => u._id !== currentUserConvexId)
              .map(u => (
                <div
                  key={u._id}
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
                  <p className="font-semibold">{otherUser?.name??"Unknown User"}</p>
                  {latest && (
                    <span className="text-xs text-gray-400">
                      {latest ? new Date(latest.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }):""}
                    </span>
                  )}
                </div>

                <p className="text-[0.75rem] text-gray-400 truncate w-[180px]">
                  {latest?.content ?? "No messages yet"}
                </p>
              </div>
              
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}