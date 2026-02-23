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

  const [search,setSearch]=useState("");
  const [selectedConversation,setSelectedConversation]=useState<string | null>(null);

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

  if (!user || !users) return <div>Loading...</div>;

  // handles convo creation when clicked on user
  const handleSelectUser=async (otherUserId: Id<"users">)=>{
    const currentUser=users.find((u)=>u.clerkId===user.id);
    if (!currentUser) return;

    const conversationId=await createConvo({
      user1: currentUser._id,
      user2: otherUserId,
    });

    setSelectedConversation(conversationId);
  };

  return (
    <div className="h-screen flex">
      <SignedOut>
        <SignInButton />
      </SignedOut>

      <SignedIn>
        <Sidebar
          users={users}
          currentUserId={user.id}
          search={search}
          setSearch={setSearch}
          onSelectUser={handleSelectUser}
        />

        <ChatArea
          selectedConversation={
            selectedConversation
          }
        />
      </SignedIn>
    </div>
  );
}