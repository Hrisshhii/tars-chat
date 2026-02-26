import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update user when they log in
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .unique();

    if (existing) {
      // update user if already exists
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    }

    // otherwise create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      isOnline: true,
      lastSeen: Date.now(),
    });

    return userId;
  },
});

// return all users for sidebar list
export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const updatePresence=mutation({
  args:{
    userId:v.id("users"),
    isOnline: v.boolean(),
  },
  handler: async (ctx,args)=>{
    await ctx.db.patch(args.userId,{
      isOnline: args.isOnline,
      lastSeen:Date.now(),
    })
  },
})