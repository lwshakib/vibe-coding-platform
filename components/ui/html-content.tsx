import React from "react";
import { cn } from "@/lib/utils";

interface HtmlContentProps {
  content: string;
  className?: string;
}

const HtmlContent: React.FC<HtmlContentProps> = ({ content, className }) => {
  return (
    <div
      className={cn(
        "prose prose-sm prose-invert max-w-none wrap-break-word",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default HtmlContent;
