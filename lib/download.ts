import JSZip from "jszip";
import { log } from "./logger";

export const downloadProjectAsZip = async (
  projectName: string,
  files: Record<string, { content: string }>
) => {
  const zip = new JSZip();

  Object.entries(files).forEach(([path, { content }]) => {
    // Ensure directories are created as well if the path contains slashes
    // jszip's zip.file("path/to/file", content) automatically handles intermediate directories
    zip.file(path, content);
  });

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${projectName.replace(/\s+/g, "_").toLowerCase() || "project"}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
