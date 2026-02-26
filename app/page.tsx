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

  useEffect(()=>{
    if (!user) return;
    let interval: NodeJS.Timeout;
    let convexUserId: Id<"users"> | null = null;

    const setupPresence=async ()=>{
      if (!users) return;

      const convexUser=users.find(u=>u.clerkId===user.id);
      if (!convexUser) return;

      convexUserId=convexUser._id;

      // set online immediately
      await updatePresence({
        userId: convexUserId,
        isOnline: true,
      });

      // heartbeat every 15s
      interval = setInterval(() => {
        updatePresence({
          userId: convexUserId!,
          isOnline: true,
        });
      }, 15000);
    };
    setupPresence();

    return ()=>{
      if (interval) clearInterval(interval);

      if (convexUserId){
        updatePresence({
          userId: convexUserId,
          isOnline: false,
        });
      }
    };
  }, [user?.id]);

  if (users === undefined) {
    return <div>Loading...</div>;
  }

  if (!users) return <div>Loading...</div>;

  return (
    <div className="h-screen bg-black">
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
    </div>
  );
}