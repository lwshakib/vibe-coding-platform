"use client";

import React from "react";

interface UserMessageProps {
  content: string;
}

const UserMessage: React.FC<UserMessageProps> = ({ content }) => {
  return (
    <div className="flex justify-end mb-6">
      <div className="max-w-[85%] bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white/90">
        {content}
      </div>
    </div>
  );
};

export default UserMessage;
