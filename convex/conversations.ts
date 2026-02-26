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
    userId: v.id("users"),
  },
  handler: async (ctx,args)=>{
    const conversations=await ctx.db.query("conversations")
      .collect();

    const filtered=conversations.filter(c =>c.participants.includes(args.userId));

    const enriched=await Promise.all(
      filtered.map(async (c)=>{
        let lastMessage=null;

        if (c.lastMessageId) {
          lastMessage=await ctx.db.get(c.lastMessageId);
        }

        if (!lastMessage) {
          const messages=await ctx.db.query("messages").withIndex("by_conversation", q=>q.eq("conversationId", c._id)).collect();

          if (messages.length>0) {
            lastMessage=messages[messages.length-1];
          }
        }

        return {...c,lastMessage,};
      })
    );

    return enriched.sort((a, b) => {
      const aTime=a.lastMessage?.createdAt ?? 0;
      const bTime=b.lastMessage?.createdAt ?? 0;
      return bTime-aTime;
    });
  },
});

export const createGroupConversation = mutation({
  args: {
    creatorId: v.id("users"),
    participantIds: v.array(v.id("users")),
    name: v.string(),
  },
  handler: async (ctx,args)=>{
    const uniqueParticipants=Array.from(
      new Set([args.creatorId,...args.participantIds])
    );

    const conversationId=await ctx.db.insert("conversations",{
      participants: uniqueParticipants,
      isGroup: true,
      name: args.name,
    });

    return conversationId;
  },
});

export const deleteGroupConversation=mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx,args)=>{
    const conversation=await ctx.db.get(args.conversationId);
    if (!conversation) return;

    if (!conversation.isGroup) return;

    if (conversation.participants[0]!==args.userId) return;

    const messages=await ctx.db.query("messages").withIndex("by_conversation", q =>
        q.eq("conversationId", args.conversationId)
      ).collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    await ctx.db.delete(args.conversationId);
  },
});