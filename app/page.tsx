"use client";

import { useEffect, useState } from "react";
import { SignedIn,SignedOut,SignInButton,useUser} from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { Id } from "@/convex/_generated/dataModel";

export default function Home() {
  const { user } = useUser();
  const createUser = useMutation(api.users.createOrUpdateUser);
  const users = useQuery(api.users.getUsers);
  const createConvo = useMutation(api.conversations.createOrUpdateConversation);
  const [selectedConversation,setSelectedConversation]=useState<Id<"conversations"> | null>(null);

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

  if (users === undefined) {
    return <div>Loading...</div>;
  }

  // handles convo creation when clicked on user
  const handleSelectUser=async (otherUserId: Id<"users">)=>{
    if(!user) return;
    const currentUser=users.find((u)=>u.clerkId===user.id);
    if (!currentUser) return;

    const conversationId=await createConvo({
      user1: currentUser._id,
      user2: otherUserId,
    });

    setSelectedConversation(conversationId);
  };

  if (!users) return <div>Loading...</div>;

  return (
    <div className="h-screen flex">
      <SignedOut>
        <div className="flex items-center justify-center h-screen w-full">
          <SignInButton />
        </div>
      </SignedOut>
      <SignedIn>
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
      </SignedIn>
    </div>
  );
}