/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Check, CheckCheck, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { motion } from "framer-motion";

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
  const users=useQuery(api.users.getUsers);

  const deleteGroupConversation=useMutation(api.conversations.deleteGroupConversation);

  const deleteMessage = useMutation(api.messages.deleteMessage);
  const markAsSeen = useMutation(api.messages.markAsSeen);

  const [showEmojiPicker,setShowEmojiPicker]=useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEmojiClick=(emojiData:any)=>{
    setMessage((prev)=>prev+emojiData.emoji);
  };

  const conversations = useQuery(
    api.conversations.getUserConversations,
    selectedConversation ? { userId: currentUserId } : "skip"
  );

  const currentConversation=conversations?.find(c => c._id === selectedConversation);

  let headerTitle="";
  let headerSubtitle="";
  let isGroup=false;
  let isOnline=false;

  if (currentConversation && users){
    if (currentConversation.isGroup){
      isGroup=true;
      headerTitle=currentConversation.name ?? "Group Chat";
      const memberNames=users.filter(u => currentConversation.participants.includes(u._id)).map(u => u.name);
      headerSubtitle=memberNames.join(", ");
    }else{
      const otherId=currentConversation.participants.find(
        id=>id !== currentUserId
      );
      const otherUser=users.find(u=>u._id===otherId);
      isOnline=!!otherUser?.isOnline && Date.now()-(otherUser?.lastSeen ?? 0)<20000;
      headerTitle=otherUser?.name ?? "";
      headerSubtitle=isOnline?"Online":`Last seen ${new Date(otherUser?.lastSeen ?? 0).toLocaleTimeString([],{
            hour: "2-digit",
            minute: "2-digit",
          })}`;
    }
  }

  useEffect(()=>{
    if(!messages) return;
    const isNewMessage=messages.length>prevMessageCountRef.current;
    if(isNewMessage && isNearBottom){
      messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
    }
    prevMessageCountRef.current=messages.length;
  },[messages]);

  useEffect(()=>{
    if (!selectedConversation || !messages) return;

    clearUnread({
      conversationId: selectedConversation,
      userId: currentUserId,
    });
  }, [selectedConversation,messages]);

  useEffect(()=>{
    if(!selectedConversation || !messages) return;
    markAsSeen({
      conversationId:selectedConversation,
      userId:currentUserId,
    });
  },[messages,selectedConversation])

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
    <div className="flex flex-col flex-1 min-h-0 relative overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b border-white/10 bg-black/5 backdrop-blur-md">
        <div>
          <p className="font-semibold">{headerTitle}</p>
          <div className="flex gap-2">
            <p className={`text-xs truncate max-w-100 ${isGroup?"text-gray-400":isOnline?"text-emerald-200 animate-pulse":"text-rose-200"}`}>
              {headerSubtitle}
            </p>
          </div>
        </div>

        {isGroup && currentConversation?.participants[0] === currentUserId && (
          <button
            onClick={async () => {
              await deleteGroupConversation({
                conversationId: selectedConversation!,
                userId: currentUserId,
              });
            }}
            className="text-red-500/50 rounded p-2 border border-red-500/50 text-sm hover:text-red-300 hover:border-red-300 cursor-pointer"
          >
            Delete Group
          </button>
        )}
      </div>
      <div className="flex flex-col flex-1 min-h-0 p-4 relative overflow-visible">
        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto space-y-2 mb-4">
          {messages?.map((msg)=>(
            <motion.div initial={{opacity:0,x:50}} animate={{opacity:1,x:0}} transition={{duration:0.2}}
              key={msg._id} className={`group relative p-3 rounded-xl w-fit max-w-[52%] hover:scale-[1.01] transition-transform duration-200
              ${msg.senderId===currentUserId?"bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20 ml-auto"
                :"bg-white/10 backdrop-blur-md border border-white/10 text-white"}`}>
              <div className="break-all whitespace-pre-wrap px-1">
                {isGroup  && msg.senderId!==currentUserId && (
                  <p className="text-xs font-semibold text-blue-300 mb-1">{users?.find(u=>u._id===msg.senderId)?.name}</p>
                )}
                {msg.content}
              </div>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.2}}
                className="text-[0.75rem] opacity-60 mt-1 text-end flex items-center justify-end gap-1">
                {formatTimeStamp(msg.createdAt)}
                {msg.senderId===currentUserId && (
                  <span className={`${(msg.seenBy?.length ?? 0)>1?"text-[#04031a]":""}`}>
                    {(msg.seenBy?.length ?? 0)>1?<CheckCheck size={20}/>:<Check size={20}/>}
                  </span>
                )}
              </motion.div>

              {msg.senderId===currentUserId && (
                <button onClick={()=>deleteMessage({
                  messageId:msg._id,
                  userId:currentUserId,
                })}
                className="absolute right-2 top-1 opacity-10 group-hover:opacity-100 text-[0.95rem] text-red-200 cursor-pointer"
                >🗑</button>
              )}
            </motion.div>
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

        <div className="relative flex gap-2 items-center">
          <div className="relative">
            <button type="button"
              onClick={()=>{
                setShowEmojiPicker(prev=>!prev);
              }}
              className="text-xl px-2 cursor-pointer text-gray-400 hover:text-blue-400 transition"
            >
              <Smile />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-16 left-0 z-999">
                <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.DARK}/>
              </div>
            )}
          </div>

          <input value={message} 
            onKeyDown={(e)=>{
              if(e.key==="Enter" && !e.shiftKey){
                e.preventDefault();
                if(!message.trim()) return;
                sendMessage({
                  conversationId: selectedConversation,
                  senderId: currentUserId,
                  content: message,
                });
                setMessage("");
                setShowEmojiPicker(false);
                stopTyping({
                  conversationId: selectedConversation,
                  userId: currentUserId,
                });
              }
            }}
            onChange={(e)=>{
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
            placeholder="Type a message..." className="flex-1 px-4 py-2 bg-transparent text-white border border-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          <button onClick={async ()=>{
            if(!message.trim()) return;
            await sendMessage({
              conversationId:selectedConversation,
              senderId:currentUserId,
              content:message,
            });
            setMessage("");
            setShowEmojiPicker(false);
            await stopTyping({
              conversationId:selectedConversation,
              userId:currentUserId,
            });
          }} className="bg-linear-to-r from-blue-600 to-blue-500 px-5 py-2 rounded-full hover:scale-105 transition-all duration-200 shadow-md shadow-blue-500/30 cursor-pointer">Send</button>
        </div>
    </div>
  </div>
  );
}