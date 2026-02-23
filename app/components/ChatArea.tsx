"use client";

interface ChatAreaProps {
  selectedConversation: string | null;
}

export function ChatArea({
  selectedConversation,
}: ChatAreaProps) {
  return (
    <div className="hidden md:flex flex-1 items-center justify-center">
      {selectedConversation ? (
        <p className="text-gray-600">
          Conversation ID: {selectedConversation}
        </p>
      ) : (
        <p className="text-gray-400">
          Select a conversation to start chatting
        </p>
      )}
    </div>
  );
}