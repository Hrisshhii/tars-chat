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

  useEffect(()=>{
    if(!messages) return;
    const isNewMessage=messages.length>prevMessageCountRef.current;
    if(isNewMessage && isNearBottom){
      messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
    }
    prevMessageCountRef.current=messages.length;
  },[messages]);

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

  return (
    <div className="flex flex-col flex-1 p-4 relative">
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages?.map((msg)=>(
          <div key={msg._id} className={`p-3 rounded-xl max-w-xs ${msg.senderId===currentUserId?"bg-blue-500 text-white ml-auto":"bg-gray-800"}`}>
            <div>{msg.content}</div>
            <div className="text-[0.75rem] opacity-60 mt-1 text-end">{formatTimeStamp(msg.createdAt)}</div>
          </div>
        ))}
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
        <input value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 p-2 border rounded"/>
        <button onClick={async ()=>{
          if(!message.trim()) return;
          await sendMessage({
            conversationId:selectedConversation,
            senderId:currentUserId,
            content:message,
          });
          setMessage("");
        }} className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer">Send</button>
      </div>
    </div>
  );
}