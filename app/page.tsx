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

  // sync clerk user into convex database
  useEffect(()=>{
    if (!user) return;
    createUser({
      clerkId: user.id,
      name: user.fullName || "Unknown",
      email: user.primaryEmailAddress?.emailAddress || "",
      imageUrl: user.imageUrl,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user]);

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