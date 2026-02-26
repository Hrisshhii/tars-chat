"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";

interface ChatAreaProps {
  selectedConversation: Id<"conversations"> | null;
  currentUserId:Id<"users">;
}

function formatTimeStamp(timestamp:number){
  const date=new Date(timestamp);
  const now=new Date();

  const isToday=date.toDateString()===now.toDateString();
  const isSameYear=date.getFullYear()===now.getFullYear();

  if(isToday){
    return date.toLocaleTimeString([],{
      hour:"2-digit",
      minute:"2-digit",
    });
  }

  if(isSameYear){
    return date.toLocaleDateString([],{
      month:"short",
      day:"numeric",
      hour:"2-digit",
      minute:"2-digit",
    });
  }

  return date.toLocaleString([],{
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function ChatArea({selectedConversation,currentUserId}:ChatAreaProps){
  const [message,setMessage]=useState("");
  const messages=useQuery(api.messages.getMessages,selectedConversation?{conversationId:selectedConversation}:"skip");
  const sendMessage=useMutation(api.messages.sendMessage);

  const messagesEndRef=useRef<HTMLDivElement|null>(null);
  const scrollContainerRef=useRef<HTMLDivElement|null>(null);
  const prevMessageCountRef=useRef<number>(0);

  const [isNearBottom,setIsNearBottom]=useState(true);

  const setTyping=useMutation(api.messages.setTyping);
  const typingUsers=useQuery(api.messages.getTypingUsers,selectedConversation?{conversationId:selectedConversation}:"skip");
  const stopTyping=useMutation(api.messages.stopTyping);
  const clearUnread = useMutation(api.messages.clearUnread);
  const typingTimeoutRef=useRef<NodeJS.Timeout|null>(null);
  const users=useQuery(api.users.getUsers);

  const conversations = useQuery(
    api.conversations.getUserConversations,
    selectedConversation ? { userId: currentUserId } : "skip"
  );

  let otherUser = null;

  if (conversations && selectedConversation && users) {
    const current = conversations.find(c => c._id === selectedConversation);
    const otherId = current?.participants.find(id => id !== currentUserId);
    otherUser = users.find(u => u._id === otherId);
  }

  useEffect(()=>{
    if(!messages) return;
    const isNewMessage=messages.length>prevMessageCountRef.current;
    if(isNewMessage && isNearBottom){
      messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
    }
    prevMessageCountRef.current=messages.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[messages]);

  useEffect(()=>{
    if (!selectedConversation || !messages) return;

    clearUnread({
      conversationId: selectedConversation,
      userId: currentUserId,
    });
  }, [selectedConversation,messages]);

  if(!selectedConversation){
    return (
      <div className="hidden md:flex flex-1 items-center justify-center">
        <p className="text-gray-400">
          Select a conversation to start chatting
        </p>
      </div>
    );
  }

  function handleScroll(){
    const container=scrollContainerRef.current;
    if(!container) return;

    const threshold=100;
    const isBottom=container.scrollHeight-container.scrollTop-container.clientHeight<threshold;
    setIsNearBottom(isBottom);
  }

  const showNewMessages=!isNearBottom;
  const isOnline=otherUser && otherUser.isOnline && Date.now()-otherUser.lastSeen < 20000;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {otherUser && (
        <div className="border-b p-4">
          <p className="font-semibold">{otherUser.name}</p>
          <p className="text-xs text-gray-400">
            {isOnline ? "Online"
              : `Last seen ${new Date(otherUser.lastSeen).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
          </p>
        </div>
      )}
      <div className="flex flex-col flex-1 min-h-0 p-4 relative">
        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto space-y-2 mb-4">
          {messages?.map((msg)=>(
            <div key={msg._id} className={`p-3 rounded-xl max-w-xs ${msg.senderId===currentUserId?"bg-blue-500 text-white ml-auto":"bg-gray-800"}`}>
              <div>{msg.content}</div>
              <div className="text-[0.75rem] opacity-60 mt-1 text-end">{formatTimeStamp(msg.createdAt)}</div>
            </div>
          ))}
          {typingUsers && users && typingUsers.filter(t=>t.userId!==currentUserId).map(t=>{
            const user=users.find(u=>u._id===t.userId);
            return(
              <div key={t._id} className="text-sm text-gray-400 italic mb-2">{user?.name || "Unknown user"} is typing...</div>
            )
          })}
          <div ref={messagesEndRef}/>
          
        </div>

        {showNewMessages && (
          <button onClick={()=>{
              messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
            }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg">
            ↓ New Messages
          </button>
        )}

        <div className="flex gap-2">
          <input value={message} onChange={(e)=>{
            const value=e.target.value;
              setMessage(value);
              if(!selectedConversation) return;

              if(value.trim().length>0){
                setTyping({
                  conversationId: selectedConversation,
                  userId:currentUserId,
                });
              }else{
                stopTyping({
                  conversationId:selectedConversation,
                  userId:currentUserId,
                });
              }
            }}  
            placeholder="Type a message..." className="flex-1 p-2 border rounded"/>
          <button onClick={async ()=>{
            if(!message.trim()) return;
            await sendMessage({
              conversationId:selectedConversation,
              senderId:currentUserId,
              content:message,
            });
            setMessage("");
            await stopTyping({
              conversationId:selectedConversation,
              userId:currentUserId,
            });
          }} className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer">Send</button>
        </div>
    </div>
  </div>
  );
}