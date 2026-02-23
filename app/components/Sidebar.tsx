/* eslint-disable @next/next/no-img-element */
"use client";

import { UserButton } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
interface SidebarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users: any[];
  currentUserId: string;
  search: string;
  setSearch: (value: string) => void;
  onSelectUser: (userId: Id<"users">) => void;
}

export function Sidebar({
  users,
  currentUserId,
  search,
  setSearch,
  onSelectUser,
}: SidebarProps) {
  const filteredUsers = users?.filter((u) => u.clerkId !== currentUserId)?.filter((u)=>u.name.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="w-full md:w-1/3 border-r p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Chats</h1>
        <UserButton />
      </div>

      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <div className="space-y-2">
        {filteredUsers?.length === 0 && (
          <p className="text-gray-500 text-sm">
            No users found.
          </p>
        )}

        {filteredUsers?.map((u) => (
          <div
            key={u._id}
            onClick={() => onSelectUser(u._id)}
            className="p-3 border rounded flex items-center gap-3 cursor-pointer hover:bg-gray-100"
          >
            <img src={u.imageUrl} alt={u.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-medium">{u.name}</p>
              <p className="text-sm text-gray-500">
                {u.email}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}