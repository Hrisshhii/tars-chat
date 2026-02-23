/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect,useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useMutation,useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Home() {
  const { user } = useUser();
  const createUser = useMutation(api.users.createOrUpdateUser);
  const users=useQuery(api.users.getUsers);

  const [search,setSearch]=useState("");

  const createConvo=useMutation(api.conversations.createOrUpdateConversation);
  const [selectedConvo,setSelectedConvo]=useState<string|null>(null);

  useEffect(() => {
    if (!user) return;

    createUser({
      clerkId: user.id,
      name: user.fullName || "Unknown",
      email: user.primaryEmailAddress?.emailAddress || "",
      imageUrl: user.imageUrl,
    });
  }, [user]);

  if(!user) return <div>Loading...</div>

  const filteredUsers=users?.filter((u)=>u.clerkId!==user?.id).filter((u)=>u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-screen flex flex-col items-center p-8">
      <SignedOut>
        <SignInButton />
      </SignedOut>

      <SignedIn>
        <div className="w-full max-w-md space-y-4">
          <h1 className="flex justify-between items-center">Users</h1>
          <UserButton />
        </div>

        <input type="text" placeholder="Search users..." value={search} onChange={e=>setSearch(e.target.value)} 
        className="w-full p-2 border rounded" />

        <div className="space-y-2">
          {filteredUsers?.length===0 && (
            <p className="text-gray-500 text-sm">No users found.</p>
          )}
          {filteredUsers?.map((u)=>(
            <div key={u._id} onClick={async ()=>{
              const currentUser=users?.find((usr)=>usr.clerkId===user?.id);
              if(!currentUser) return;
              const conversationId=await createConvo({
                user1:currentUser._id,
                user2:u._id,
              });
              setSelectedConvo(conversationId);
            }} 
            className="p-3 border rounded flex items-center gap-3 cursor-pointer hover:bg-gray-100">
              <img src={u.imageUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover"/>
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
              </div>
            </div>
          ))}
        </div>
      </SignedIn>
    </div>
  );
}