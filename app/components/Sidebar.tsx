
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

  const [search, setSearch] = useState("");

  useEffect(()=>{
    if(!selectedConversation) return;
    clearUnread({
      conversationId:selectedConversation,
      userId:currentUserConvexId,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selectedConversation]);

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
        {conversations.length===0 && (
          <p className="text-gray-500 text-sm">
            No conversations yet.
          </p>
        )}

        {filteredConvos.map((conversation)=>{
          const unread=unreadCounts?.find(u=>u.conversationId===conversation._id);
          const unreadCount = unread?.count ?? 0;
          return(
            <div key={conversation._id} onClick={()=>onSelectConversation(conversation._id)}
              className={`p-3 border rounded flex justify-between items-center cursor-pointer
                ${selectedConversation===conversation._id?"bg-gray-800":"hover:bg-gray-400"}  
              `}
            >
              {(()=>{
                const othreParticipantId=conversation.participants.find(id=>id!==currentUserConvexId);
                const otherUser=users?.find(u=>u._id===othreParticipantId);
                return (
                  <p className="font-medium">{otherUser?.name??"Unknown User"}</p>
                );
              })()}
              
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