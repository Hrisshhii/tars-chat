import {mutation,query} from "./_generated/server";
import {v} from "convex/values";

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