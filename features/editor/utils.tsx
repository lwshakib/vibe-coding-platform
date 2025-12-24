import { File as FileIcon } from "lucide-react";

export const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (filename === ".gitignore")
    return <span className="text-gray-400 text-[10px] font-bold">git</span>;

  switch (ext) {
    case "ts":
    case "tsx":
      return (
        <div className="flex items-center justify-center w-4 h-4 rounded-[2px] bg-blue-500/10 text-blue-500 font-bold text-[8px] leading-none shrink-0">
          TS
        </div>
      );
    case "js":
    case "jsx":
    case "mjs":
      return (
        <div className="flex items-center justify-center w-4 h-4 rounded-[2px] bg-yellow-400/10 text-yellow-400 font-bold text-[8px] leading-none shrink-0">
          JS
        </div>
      );
    case "json":
      return (
        <div className="flex items-center justify-center w-4 h-4 text-yellow-200 font-bold text-[10px] leading-none shrink-0">
          {"{}"}
        </div>
      );
    case "md":
      return (
        <div className="flex items-center justify-center w-4 h-4 text-blue-300 font-bold text-[10px] leading-none shrink-0">
          i
        </div>
      );
    case "css":
      return (
        <div className="flex items-center justify-center w-4 h-4 text-blue-400 font-bold text-[8px] leading-none shrink-0">
          #
        </div>
      );
    default:
      return (
        <FileIcon className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
      );
  }
};
