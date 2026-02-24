import {mutation,query} from "./_generated/server";
import {v} from "convex/values";

// creates one on one convos or returns existing one
export const createOrUpdateConversation=mutation({
  args:{
    user1:v.id("users"),
    user2:v.id("users"),
  },
  handler:async (ctx,args)=>{
    //get covos
    const conversations=await ctx.db.query("conversations").collect();

    //check if convo exists
    const existing=conversations.find((c)=>{
      return (
        !c.isGroup && c.participants.length===2 &&
        c.participants.includes(args.user1) && c.participants.includes(args.user2)
      );
    });

    if(existing) return existing._id;

    //otherwise create new one
    const conversationId=await ctx.db.insert("conversations",{
      participants:[args.user1,args.user2],
      isGroup:false,
    });
    return conversationId;
  },
});

export const getUserConversations=query({
  args:{
    userId:v.id("users"),
  },
  handler:async (ctx,args)=>{
    const conversations=await ctx.db.query("conversations").collect();
    return conversations.filter((c)=>c.participants.includes(args.userId));
  },
});