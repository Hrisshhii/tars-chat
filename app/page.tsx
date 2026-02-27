/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { SignedIn,SignedOut,useUser} from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { Id } from "@/convex/_generated/dataModel";
import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";

export default function Home() {
  const { user } = useUser();
  const createUser = useMutation(api.users.createOrUpdateUser);
  const users = useQuery(api.users.getUsers);
  const [selectedConversation,setSelectedConversation]=useState<Id<"conversations"> | null>(null);
  const updatePresence = useMutation(api.users.updatePresence);

  // sync clerk user into convex database
  useEffect(()=>{
    if (!user) return;
    createUser({
      clerkId: user.id,
      name: user.fullName || "Unknown",
      email: user.primaryEmailAddress?.emailAddress || "",
      imageUrl: user.imageUrl,
    });
  },[user]);

  const convexUserId = users?.find(u => u.clerkId === user?.id)?._id;

  const conversations=useQuery(api.conversations.getUserConversations,convexUserId?{userId: convexUserId}:"skip");

  useEffect(()=>{
    if (!selectedConversation || !conversations) return;
    const exists=conversations.some((c)=>c._id===selectedConversation);
    if (!exists){
      setSelectedConversation(null);
    }
  },[conversations,selectedConversation]);

  useEffect(()=>{
    if (!convexUserId) return;

    let interval: NodeJS.Timeout;

    const startPresence=async ()=>{
      await updatePresence({
        userId: convexUserId,
        isOnline: true,
      });

      interval=setInterval(()=>{
        updatePresence({
          userId: convexUserId,
          isOnline: true,
        });
      }, 10000);
    };

    startPresence();

    const handleBeforeUnload=()=>{
      updatePresence({
        userId: convexUserId,
        isOnline: false,
      });
    };

    window.addEventListener("beforeunload",handleBeforeUnload);

    return ()=>{
      clearInterval(interval);
      window.removeEventListener("beforeunload",handleBeforeUnload);
    };
  },[convexUserId]);

  if (users === undefined) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="animate-pulse text-lg">Loading Tars Chat...</div>
      </div>
    );
  }

  if (!users) 
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="animate-pulse text-lg">Loading Tars Chat...</div>
      </div>
    );

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.4}} className="h-screen bg-linear-to-br from-[#0f0f14] via-[#12121a] to-black">
      <SignedOut>
        <div className="flex items-center justify-center h-full">
          <SignIn routing="hash" />
        </div>
      </SignedOut>
      <SignedIn>
        <div className="h-full flex">
          {(() => {
            const currentUser=users.find((u)=>u.clerkId===user?.id);
            if (!currentUser) return null;
            return (
              <>
                <Sidebar currentUserConvexId={currentUser._id} selectedConversation={selectedConversation} onSelectConversation={setSelectedConversation}/>
                <ChatArea selectedConversation={selectedConversation} currentUserId={currentUser._id}/>
              </>
            );
          })()}
        </div>
      </SignedIn>
    </motion.div>
  );
}