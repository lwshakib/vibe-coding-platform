import { useEffect, useState, useCallback, useRef } from "react";
import { getWebContainerInstance } from "@/lib/webcontainer";
import type { WebContainer, FileSystemTree, WebContainerProcess } from "@webcontainer/api";
import { Terminal } from "xterm";
import { useWorkspaceStore } from "@/context";

type WebContainerState =
  | "idle"
  | "booting"
  | "mounting"
  | "installing"
  | "starting"
  | "ready"
  | "stopped"
  | "error";

export function useWebContainer(
  files: Record<string, { content: string }> | null,
  terminalRef?: React.MutableRefObject<Terminal | null>,
  isStreaming: boolean = false,
  workspaceId?: string
) {
  const [instance, setInstance] = useState<WebContainer | null>(null);
  const [state, setState] = useState<WebContainerState>("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [port, setPort] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setShowExpoQR, setExpoQRData } = useWorkspaceStore();

  const mountedFilesRef = useRef<Record<string, string>>({});
  const isStartedRef = useRef(false);
  const isInstallingRef = useRef(false);
  const isBootingRef = useRef(false);
  const isMountingRef = useRef(false);
  const devProcessRef = useRef<WebContainerProcess | null>(null);
  const installProcessRef = useRef<WebContainerProcess | null>(null);
  const prevWorkspaceIdRef = useRef<string | undefined>(workspaceId);

  const writeToTerminal = (data: string) => {
    if (terminalRef?.current) {
      terminalRef.current.write(data.replace(/\n/g, "\r\n"));
    }
  };

  // Handle Workspace Switch
  useEffect(() => {
    if (workspaceId && prevWorkspaceIdRef.current && workspaceId !== prevWorkspaceIdRef.current) {
      console.log(`[WebContainer] Workspace changed from ${prevWorkspaceIdRef.current} to ${workspaceId}, resetting...`);
      
      // Kill existing processes if any
      if (devProcessRef.current) {
        devProcessRef.current.kill();
        devProcessRef.current = null;
      }
      if (installProcessRef.current) {
        installProcessRef.current.kill();
        installProcessRef.current = null;
      }
      
      // Reset local state
      mountedFilesRef.current = {};
      isStartedRef.current = false;
      isInstallingRef.current = false;
      isMountingRef.current = false;
      setState("idle");
      setUrl(null);
      setPort(null);
      
      // Clear terminal
      if (terminalRef?.current) {
        terminalRef.current.clear();
        terminalRef.current.write("\x1b[33mWorkspace changed, resetting environment...\x1b[0m\r\n");
      }
    }
    prevWorkspaceIdRef.current = workspaceId;
  }, [workspaceId, terminalRef]);

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

  const inputWriterRef = useRef<WritableStreamDefaultWriter<string> | null>(null);

  const startDevServer = useCallback(async (wc: WebContainer) => {
    setState((prev) => (prev === "ready" ? "ready" : "starting"));

    if (devProcessRef.current) {
      writeToTerminal("\x1b[33mFinishing existing dev server process...\x1b[0m\r\n");
      devProcessRef.current.kill();
      
      try {
        // Wait for the process to actually exit to ensure port is freed
        // Use a timeout to prevent hanging if the process is stubborn
        await Promise.race([
          devProcessRef.current.exit,
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
      } catch (e) {
        console.warn("[WebContainer] Error waiting for process exit:", e);
      }
      
      devProcessRef.current = null;
      writeToTerminal("\x1b[33mRestarting dev server...\x1b[0m\r\n");
    } else {
      writeToTerminal("\x1b[33mStarting dev server...\x1b[0m\r\n");
    }

    // Small delay to ensure the OS/WebContainer has fully released the port
    await new Promise(resolve => setTimeout(resolve, 500));

    const devProcess = await wc.spawn("npm", ["run", "dev"], {
      cwd: "/home/project",
      env: { PORT: "3000" },
    });

    devProcess.output.pipeTo(
      new WritableStream({
        write: (data) => {
          writeToTerminal(data);

          // Fallback: If we're stuck in 'starting' and see port info, force ready
          if (
            (data.includes("Local:") ||
              data.includes("Network:") ||
              data.includes("ready in") ||
              data.includes("Server started")) &&
            !url
          ) {
            console.log("[WebContainer] Fallback: Server might be ready");
          }

          // Expo QR Code detection
          if (data.includes("exp://")) {
            const match = data.match(/exp:\/\/[^\s\n\x1b]+/);
            if (match) {
              const qrUrl = match[0];
              setExpoQRData(qrUrl);
              setShowExpoQR(true);
            }
          }
        },
      })
    );

    devProcessRef.current = devProcess;
  }, [url, setExpoQRData, setShowExpoQR]);

  const stopDevServer = useCallback(async () => {
    if (devProcessRef.current) {
      writeToTerminal("\x1b[33mStopping dev server...\x1b[0m\r\n");
      devProcessRef.current.kill();
      
      try {
        await Promise.race([
          devProcessRef.current.exit,
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
      } catch (e) {
        console.warn("[WebContainer] Error stopping dev server:", e);
      }
      
      devProcessRef.current = null;
      setState("stopped");
      setUrl(null);
      setPort(null);
      writeToTerminal("\x1b[33mDev server stopped.\x1b[0m\r\n");
    }
  }, []);

  const runInstall = useCallback(async (wc: WebContainer) => {
    if (isInstallingRef.current) return;
    isInstallingRef.current = true;

    setState("installing");
    writeToTerminal(
      "\x1b[33mRunning npm install to sync dependencies...\x1b[0m\r\n"
    );
    
    try {
      const installProcess = await wc.spawn("npm", ["install"], {
        cwd: "/home/project",
      });
      installProcessRef.current = installProcess;

      installProcess.output.pipeTo(
        new WritableStream({
          write: (data) => writeToTerminal(data),
        })
      );

      const installExitCode = await installProcess.exit;
      
      if (installExitCode !== 0 && installProcessRef.current) {
        writeToTerminal(
          "\x1b[31mDependency installation failed.\x1b[0m\r\n"
        );
        isStartedRef.current = false;
        throw new Error("Failed to install dependencies");
      }
      
      if (installProcessRef.current) {
        writeToTerminal("\x1b[32mDependencies synced.\x1b[0m\r\n");
      }
    } finally {
      installProcessRef.current = null;
      isInstallingRef.current = false;
      // After install, we usually want to start or restart the server if it was running
      // but runInstall by itself shouldn't decide that. 
      // We'll let the UI or mountAndRun handle the follow-up.
    }
  }, []);

  const stopInstall = useCallback(async () => {
    if (installProcessRef.current) {
      writeToTerminal("\x1b[33mStopping dependency installation...\x1b[0m\r\n");
      installProcessRef.current.kill();
      installProcessRef.current = null;
      isInstallingRef.current = false;
      setState("idle"); // or should it go back to ready if it was ready?
      writeToTerminal("\x1b[33mInstallation stopped.\x1b[0m\r\n");
    }
  }, []);

  const boot = useCallback(async () => {
    if (isBootingRef.current || instance) return instance;
    isBootingRef.current = true;
    try {
      setState("booting");
      writeToTerminal("\x1b[33mBooting WebContainer...\x1b[0m\r\r\n");
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
        let dependenciesChanged = false;

        // Sanitize package.json and check for dependency changes
        if (finalFiles["package.json"]) {
          try {
            const pkg = JSON.parse(finalFiles["package.json"].content);
            let modified = false;

            if (pkg.scripts) {
              Object.keys(pkg.scripts).forEach((key) => {
                if (pkg.scripts[key] && pkg.scripts[key].includes("--turbo")) {
                  pkg.scripts[key] = pkg.scripts[key]
                    .replace(/--turbo/g, "")
                    .trim();
                  modified = true;
                }
              });
            }

            if (modified) {
              finalFiles["package.json"] = {
                content: JSON.stringify(pkg, null, 2),
              };
              writeToTerminal(
                "\x1b[33mRemoved incompatible --turbo flag from package.json scripts\x1b[0m\r\n"
              );
            }

            // Check if dependencies or devDependencies changed
            if (mountedFilesRef.current["package.json"]) {
              const oldPkg = JSON.parse(mountedFilesRef.current["package.json"]);
              if (
                JSON.stringify(oldPkg.dependencies) !==
                  JSON.stringify(pkg.dependencies) ||
                JSON.stringify(oldPkg.devDependencies) !==
                  JSON.stringify(pkg.devDependencies)
              ) {
                dependenciesChanged = true;
                writeToTerminal(
                  "\x1b[35m[Vibe] Dependency changes detected in package.json\x1b[0m\r\n"
                );
              }
            }
          } catch (e) {
            console.error("Failed to parse package.json for processing", e);
          }
        }

        let filesUpdated = false;
        if (Object.keys(mountedFilesRef.current).length === 0) {
          if (isMountingRef.current) return;
          isMountingRef.current = true;

          setState("mounting");
          
          // Clear current project directory if it's a fresh mount
          try {
            // We use /project instead of /home/project if we want to be safe, 
            // but the current structure has home/project. 
            // Better to just rm -rf existing contents if possible.
            const ls = await wc.fs.readdir("home/project").catch(() => []);
            for (const item of ls) {
              await wc.fs.rm(`home/project/${item}`, { recursive: true }).catch(() => {});
            }
          } catch (e) {
            // Likely directory doesn't exist yet, ignore
          }

          writeToTerminal("\x1b[33mMounting fresh project...\x1b[0m\r\n");

          const tree = transformToWebContainerTree(finalFiles);
          const mountTree: FileSystemTree = {
            home: {
              directory: {
                project: {
                  directory: tree,
                },
              },
            },
          };

          await wc.mount(mountTree);

          const newRef: Record<string, string> = {};
          Object.entries(finalFiles).forEach(([path, { content }]) => {
            newRef[path] = content;
          });
          mountedFilesRef.current = newRef;
          writeToTerminal("\x1b[32mFiles mounted successfully.\x1b[0m\r\n");
          isMountingRef.current = false;
          filesUpdated = true;
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
              writeToTerminal(`\x1b[90mUpdated: ${path}\x1b[0m\r\n`);
              filesUpdated = true;
            }
          }
        }

        // Handle logical flow based on changes
        if (
          dependenciesChanged ||
          (!isStartedRef.current && finalFiles["package.json"])
        ) {
          await runInstall(wc);
          await startDevServer(wc);
        }
        // No else if (filesUpdated && isStartedRef.current) block - let HMR handle it!
      } catch (err: any) {
        isInstallingRef.current = false;
        isMountingRef.current = false;
        setState("error");
        setError(err.message);
        writeToTerminal(`\x1b[31mError: ${err.message}\x1b[0m\r\n`);
      }
    },
    [startDevServer]
  );


  // Handle initial boot
  useEffect(() => {
    if (files && Object.keys(files).length > 0 && !instance && !isBootingRef.current) {
      boot();
    }
    
    // Cleanup on unmount
    return () => {
      if (devProcessRef.current) {
        console.log("[WebContainer] Hook unmounting, killing dev process...");
        devProcessRef.current.kill();
        devProcessRef.current = null;
      }
      if (installProcessRef.current) {
        console.log("[WebContainer] Hook unmounting, killing install process...");
        installProcessRef.current.kill();
        installProcessRef.current = null;
      }
    };
  }, [files, instance, boot]);

  useEffect(() => {
    if (!files || Object.keys(files).length === 0 || !instance) return;

    // Check if there are actual content differences between store and mounted files
    const hasChanges = Object.entries(files).some(
      ([path, { content }]) => mountedFilesRef.current[path] !== content
    );

    // Guard: We generally wait for streaming to finish to avoid mounting partial files
    // and frequent server restarts. However, if it's the first boot, we proceed.
    if (isStreaming && isStartedRef.current) return;

    // Only trigger if we have changes or haven't started yet
    if (hasChanges || !isStartedRef.current) {
      // Guard: Don't re-run if already in progress
      if (isBootingRef.current || isMountingRef.current || isInstallingRef.current) {
        return;
      }

      mountAndRun(instance, files);
    }
  }, [files, instance, mountAndRun, isStreaming]);

  useEffect(() => {
    const handleForceReady = () => {
      if (state !== "ready") {
        console.log("[WebContainer] Forcing ready state...");
        // Use default WebContainer URL logic if possible, or just set standard values
        const defaultUrl = instance
          ? `https://3000-${(instance as any)._node?.id || "preview"}.webcontainer.io`
          : null;
        
        setUrl(defaultUrl || `http://localhost:3000`);
        setPort(3000);
        setState("ready");
        isStartedRef.current = true;
      }
    };

    window.addEventListener("vibe-force-ready", handleForceReady);
    return () => window.removeEventListener("vibe-force-ready", handleForceReady);
  }, [state, instance]);

  return { 
    instance, 
    state, 
    url, 
    setUrl, 
    port, 
    setPort, 
    error, 
    startDevServer, 
    stopDevServer, 
    runInstall, 
    stopInstall 
  };
}
