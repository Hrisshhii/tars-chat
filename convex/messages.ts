import {mutation,query} from "./_generated/server";
import {v} from "convex/values";

export const sendMessage=mutation({
  args:{
    conversationId:v.id("conversations"),
    senderId:v.id("users"),
    content:v.string(),
  },
  handler: async (ctx,args)=>{
    const messageId=await ctx.db.insert("messages",{
      conversationId:args.conversationId,
      senderId:args.senderId,
      content:args.content,
      createdAt:Date.now(),
      deleted:false,
    });
    await ctx.db.patch(args.conversationId,{
      lastMessageId:messageId,
    });

    const conversation=await ctx.db.get(args.conversationId);
    if(!conversation) return;

    for (const participantId of conversation.participants){
      if(participantId===args.senderId) continue;
      
      const existing=await ctx.db.query("unread").filter(q=>q.and(
        q.eq(q.field("conversationId"),args.conversationId),
        q.eq(q.field("userId"),participantId)
      )).unique();

      if(existing){
        await ctx.db.patch(existing._id,{
          count:existing.count+1,
        });
      }else{
        await ctx.db.insert("unread",{
          conversationId:args.conversationId,
          userId:participantId,
          count:1,
        });
      }
    }

    return messageId;
  }
});

export const getMessages=query({
  args:{
    conversationId:v.id("conversations"),
  },
  handler:async (ctx,args)=>{
    return await ctx.db.query("messages").withIndex("by_conversation",(q)=>(
      q.eq("conversationId",args.conversationId)
    )).collect();
  },
});

export const clearUnread=mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing=await ctx.db.query("unread").filter((q)=>q.and(
          q.eq(q.field("conversationId"), args.conversationId),
          q.eq(q.field("userId"), args.userId)
        )).unique();

    if (existing) {
      await ctx.db.patch(existing._id,{count:0});
    }
  },
});

export const getUnreadCounts = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args)=>{
    return await ctx.db.query("unread").filter((q)=>
        q.eq(q.field("userId"), args.userId)
      ).collect();
  },
});