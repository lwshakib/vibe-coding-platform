import { useEffect, useState, useCallback, useRef } from "react";
import { getWebContainerInstance } from "@/lib/webcontainer";
import type { WebContainer, FileSystemTree } from "@webcontainer/api";
import { Terminal } from "xterm";

type WebContainerState =
  | "idle"
  | "booting"
  | "mounting"
  | "installing"
  | "starting"
  | "ready"
  | "error";

export function useWebContainer(
  files: Record<string, { content: string }> | null,
  terminalRef?: React.MutableRefObject<Terminal | null>
) {
  const [instance, setInstance] = useState<WebContainer | null>(null);
  const [state, setState] = useState<WebContainerState>("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [port, setPort] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mountedFilesRef = useRef<Record<string, string>>({});
  const isStartedRef = useRef(false);
  const isInstallingRef = useRef(false);
  const isBootingRef = useRef(false);
  const isMountingRef = useRef(false);

  const writeToTerminal = (data: string) => {
    if (terminalRef?.current) {
      terminalRef.current.write(data.replace(/\n/g, "\r\n"));
    }
  };

  const transformToWebContainerTree = (
    files: Record<string, { content: string }>
  ): FileSystemTree => {
    const tree: FileSystemTree = {};

    Object.entries(files).forEach(([path, { content }]) => {
      const parts = path.split("/");
      let current = tree;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;

        if (isFile) {
          current[part] = {
            file: {
              contents: content,
            },
          };
        } else {
          if (!current[part] || (current[part] as any).file) {
            current[part] = {
              directory: {},
            };
          }
          current = (current[part] as any).directory;
        }
      });
    });

    return tree;
  };

  const boot = useCallback(async () => {
    if (isBootingRef.current || instance) return instance;
    isBootingRef.current = true;
    try {
      setState("booting");
      writeToTerminal("\x1b[33mBooting WebContainer...\x1b[0m\r\n");
      const wc = await getWebContainerInstance();
      
      // Attach listener IMMEDIATELY after getting instance
      wc.on("server-ready", (port, url) => {
        console.log(`[WebContainer] Server Ready: ${port} ${url}`);
        setUrl(url);
        setPort(port);
        setState("ready");
        isStartedRef.current = true;
        writeToTerminal(`\x1b[32mServer ready at ${url}\x1b[0m\r\n`);
      });

      setInstance(wc);
      return wc;
    } catch (err: any) {
      setState("error");
      setError(err.message);
      writeToTerminal(`\x1b[31mError booting: ${err.message}\x1b[0m\r\n`);
      return null;
    } finally {
      isBootingRef.current = false;
    }
  }, [instance]);

  const mountAndRun = useCallback(
    async (
      wc: WebContainer,
      projectFiles: Record<string, { content: string }>
    ) => {
      try {
        let finalFiles = { ...projectFiles };

        // Sanitize package.json to remove --turbo flag which crashes WebContainer
        if (finalFiles["package.json"]) {
          try {
            const pkg = JSON.parse(finalFiles["package.json"].content);
            let modified = false;
            
            if (pkg.scripts) {
              Object.keys(pkg.scripts).forEach(key => {
                if (pkg.scripts[key] && pkg.scripts[key].includes("--turbo")) {
                  pkg.scripts[key] = pkg.scripts[key].replace(/--turbo/g, "").trim();
                  modified = true;
                }
              });
            }

            if (modified) {
              finalFiles["package.json"] = {
                content: JSON.stringify(pkg, null, 2)
              };
              writeToTerminal("\x1b[33mRemoved incompatible --turbo flag from package.json scripts\x1b[0m\r\n");
            }
          } catch (e) {
            console.error("Failed to parse package.json for sanitization", e);
          }
        }

        if (Object.keys(mountedFilesRef.current).length === 0) {
          if (isMountingRef.current) return;
          isMountingRef.current = true;
          
          setState("mounting");
          writeToTerminal("\x1b[33mMounting files...\x1b[0m\r\n");
          
          const tree = transformToWebContainerTree(finalFiles);
          const mountTree: FileSystemTree = {
            home: {
              directory: {
                project: {
                  directory: tree
                }
              }
            }
          };
          
          await wc.mount(mountTree);

          const newRef: Record<string, string> = {};
          Object.entries(finalFiles).forEach(([path, { content }]) => {
            newRef[path] = content;
          });
          mountedFilesRef.current = newRef;
          writeToTerminal("\x1b[32mFiles mounted successfully.\x1b[0m\r\n");
          isMountingRef.current = false;
        } else {
          for (const [path, { content }] of Object.entries(finalFiles)) {
            if (mountedFilesRef.current[path] !== content) {
              const fullPath = `home/project/${path}`;
              const parts = fullPath.split("/");
              if (parts.length > 1) {
                const dir = parts.slice(0, -1).join("/");
                await wc.fs.mkdir(dir, { recursive: true });
              }
              await wc.fs.writeFile(fullPath, content);
              mountedFilesRef.current[path] = content;
              writeToTerminal(`\x1b[90mUpdated ${path}\x1b[0m\r\n`);
            }
          }
        }

        // Only run install/dev if not already started and not currently installing
        if (
          !isStartedRef.current &&
          !isInstallingRef.current &&
          finalFiles["package.json"]
        ) {
          // Mark as started IMMEDIATELY to prevent re-entry
          isStartedRef.current = true;
          isInstallingRef.current = true;
          
          setState("installing");
          writeToTerminal("\x1b[33mInstalling dependencies...\x1b[0m\r\n");
          const installProcess = await wc.spawn("npm", ["install"], {
            cwd: "/home/project",
          });

          installProcess.output.pipeTo(
            new WritableStream({
              write: (data) => writeToTerminal(data),
            })
          );

          const installExitCode = await installProcess.exit;

          if (installExitCode !== 0) {
            writeToTerminal(
              "\x1b[31mDependency installation failed.\x1b[0m\r\n"
            );
            isInstallingRef.current = false;
            isStartedRef.current = false; // Allow retry on failure
            throw new Error("Failed to install dependencies");
          }
          writeToTerminal("\x1b[32mDependencies installed.\x1b[0m\r\n");

          isInstallingRef.current = false;
          
          // Only set to starting if we're not already ready (race condition check)
          setState(prev => prev === "ready" ? "ready" : "starting");
          
          writeToTerminal("\x1b[33mStarting dev server...\x1b[0m\r\n");

          const devProcess = await wc.spawn("npm", ["run", "dev"], {
            cwd: "/home/project",
            env: { PORT: "3000" }, // Force standard port
          });

          devProcess.output.pipeTo(
            new WritableStream({
              write: (data) => {
                writeToTerminal(data);
                
                // Fallback detection if server-ready event misses
                if (state !== "ready" && data.includes("Server started on port")) {
                  const match = data.match(/port (\d+)/i);
                  const detectedPort = match ? parseInt(match[1]) : 3000;
                  
                  // Only trigger if we don't have a URL yet
                  if (!url) {
                    console.log(`[WebContainer] Fallback detected port: ${detectedPort}`);
                    // Note: In WebContainer, local URLs are usually formatted like this
                    // but it's better to wait for the official event if possible.
                    // However, we can at least update the state if we're sure it's up.
                    // We'll give it a tiny bit of time or just set standard values.
                  }
                }
              },
            })
          );
        }
      } catch (err: any) {
        isInstallingRef.current = false;
        isMountingRef.current = false;
        setState("error");
        setError(err.message);
        writeToTerminal(`\x1b[31mError: ${err.message}\x1b[0m\r\n`);
      }
    },
    []
  );


  useEffect(() => {
    // Only trigger if we have files and haven't started the process yet
    if (!files || Object.keys(files).length === 0) return;
    
    // Guard: Don't re-run if already started or in progress
    if (isStartedRef.current || isBootingRef.current || isMountingRef.current || isInstallingRef.current) {
      return;
    }
    
    if (!instance) {
      // Need to boot first
      boot().then((wc) => {
        if (wc) mountAndRun(wc, files);
      });
    } else {
      // Already have instance, just mount/run
      mountAndRun(instance, files);
    }
  }, [files, instance, boot, mountAndRun]);

  return { instance, state, url, port, error };
}
