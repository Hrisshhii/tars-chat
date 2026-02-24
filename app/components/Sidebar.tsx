/* eslint-disable @next/next/no-img-element */
"use client";

import { UserButton } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

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

  useEffect(()=>{
    if(!selectedConversation) return;
    clearUnread({
      conversationId:selectedConversation,
      userId:currentUserConvexId,
    });
  },[selectedConversation]);

  if(!conversations) return <div>Loading...</div>;

  return (
    <div className="w-full md:w-1/3 border-r p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Chats</h1>
        <UserButton />
      </div>

      <div className="space-y-2">
        {conversations.length===0 && (
          <p className="text-gray-500 text-sm">
            No conversations yet.
          </p>
        )}

        {conversations.map((conversation)=>{
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
                const otherUsers=users?.find(u=>u._id===othreParticipantId);
                return (
                  <p className="font-medium">{otherUsers?.name??"Unknown User"}</p>
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