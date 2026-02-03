import { useEffect, useState, useCallback, useRef } from "react";
import { getWebContainerInstance, teardownWebContainer } from "@/lib/webcontainer";
import type { WebContainer, FileSystemTree, WebContainerProcess } from "@webcontainer/api";
import type { Terminal } from "xterm"; // Type-only import
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

  const logBufferRef = useRef<string[]>([]);

  const writeToTerminal = useCallback((data: string) => {
    const formattedData = data.replace(/\n/g, "\r\n");
    if (terminalRef?.current) {
      if (logBufferRef.current.length > 0) {
        terminalRef.current.write(logBufferRef.current.join(""));
        logBufferRef.current = [];
      }
      terminalRef.current.write(formattedData);
    } else {
      logBufferRef.current.push(formattedData);
    }
  }, [terminalRef]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (terminalRef?.current && logBufferRef.current.length > 0) {
        terminalRef.current.write(logBufferRef.current.join(""));
        logBufferRef.current = [];
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [terminalRef]);

  useEffect(() => {
    // Cleanup processes and teardown on unmount
    return () => {
      if (devProcessRef.current) {
        devProcessRef.current.kill();
        devProcessRef.current = null;
      }
      if (installProcessRef.current) {
        installProcessRef.current.kill();
        installProcessRef.current = null;
      }
      setInstance(null);
      teardownWebContainer();
    };
  }, []);

  // Listen for server-ready events and update state
  useEffect(() => {
    if (!instance) return;

    const unsubscribe = instance.on("server-ready", (port, url) => {
      setUrl(url);
      setPort(port);
      setState("ready");
      isStartedRef.current = true;
      writeToTerminal(`\x1b[32m\r\n[Vibe] Server ready at ${url}\x1b[0m\r\n`);
    });

    return () => {
      unsubscribe();
    };
  }, [instance, writeToTerminal]);

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
          current[part] = { file: { contents: content } };
        } else {
          if (!current[part] || (current[part] as any).file) {
            current[part] = { directory: {} };
          }
          current = (current[part] as any).directory;
        }
      });
    });
    return tree;
  };

  const startDevServer = useCallback(async (wc: WebContainer) => {
    setState((prev) => (prev === "ready" ? "ready" : "starting"));
    if (devProcessRef.current) {
      devProcessRef.current.kill();
      try {
        await Promise.race([
          devProcessRef.current.exit,
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
      } catch (e) {}
      devProcessRef.current = null;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));

    const devProcess = await wc.spawn("npm", ["run", "dev"], {
      cwd: "/",
      env: { PORT: "3000" },
    });

    devProcess.output.pipeTo(
      new WritableStream({
        write: (data) => {
          writeToTerminal(data);
          if (data.includes("exp://")) {
            const match = data.match(/exp:\/\/[^\s\n\x1b]+/);
            if (match) {
              setExpoQRData(match[0]);
              setShowExpoQR(true);
            }
          }
        },
      })
    );
    devProcessRef.current = devProcess;
  }, [setExpoQRData, setShowExpoQR, writeToTerminal]);

  const stopDevServer = useCallback(async () => {
    if (devProcessRef.current) {
      devProcessRef.current.kill();
      try {
        await Promise.race([
          devProcessRef.current.exit,
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
      } catch (e) {}
      devProcessRef.current = null;
      setState("stopped");
      setUrl(null);
      setPort(null);
    }
  }, []);

  const runInstall = useCallback(async (wc: WebContainer) => {
    if (isInstallingRef.current) return false;
    isInstallingRef.current = true;
    setState("installing");
    try {
      const installProcess = await wc.spawn("npm", ["install"], { cwd: "/" });
      installProcessRef.current = installProcess;
      installProcess.output.pipeTo(new WritableStream({ write: (data) => writeToTerminal(data) }));
      const installExitCode = await installProcess.exit;
      if (installExitCode !== 0 && installProcessRef.current) {
        writeToTerminal("\x1b[31m[Vibe] Dependency installation failed with exit code " + installExitCode + ".\x1b[0m\r\n");
        isStartedRef.current = false;
        return false;
      }
      writeToTerminal("\x1b[32m[Vibe] Dependencies installed successfully.\x1b[0m\r\n");
      return true;
    } catch (e: any) {
      writeToTerminal(`\x1b[31m[Vibe] Installation error: ${e.message}\x1b[0m\r\n`);
      return false;
    } finally {
      installProcessRef.current = null;
      isInstallingRef.current = false;
    }
  }, [writeToTerminal]);

  const stopInstall = useCallback(async () => {
    if (installProcessRef.current) {
      installProcessRef.current.kill();
      installProcessRef.current = null;
      isInstallingRef.current = false;
      setState("idle");
    }
  }, []);

  const boot = useCallback(async () => {
    if (isBootingRef.current || instance) return instance;
    isBootingRef.current = true;
    try {
      setState("booting");
      const wc = await getWebContainerInstance(workspaceId);
      setInstance(wc);
      return wc;
    } catch (err: any) {
      if (err.message?.includes("already booted")) {
         const wc = await getWebContainerInstance();
         setInstance(wc);
         return wc;
      }
      setState("error");
      setError(err.message);
      writeToTerminal(`\x1b[31mError booting: ${err.message}\x1b[0m\r\n`);
      return null;
    } finally {
      isBootingRef.current = false;
    }
  }, [instance, writeToTerminal]);

  const mountAndRun = useCallback(
    async (wc: WebContainer, projectFiles: Record<string, { content: string }>) => {
      try {
        let finalFiles = { ...projectFiles };
        let dependenciesChanged = false;
        
        // Detect if any crucial configuration files changed
        if (finalFiles["package.json"]) {
          try {
            const pkgContent = finalFiles["package.json"].content;
            const pkg = JSON.parse(pkgContent);
            let modified = false;
            
            // Remove incompatible --turbo flag that often breaks WebContainer dev servers
            if (pkg.scripts) {
              Object.keys(pkg.scripts).forEach((key) => {
                if (pkg.scripts[key] && pkg.scripts[key].includes("--turbo")) {
                  pkg.scripts[key] = pkg.scripts[key].replace(/--turbo/g, "").trim();
                  modified = true;
                }
              });
            }
            
            if (modified) {
              finalFiles["package.json"] = { content: JSON.stringify(pkg, null, 2) };
              writeToTerminal("\x1b[33m[Vibe] Optimized package.json for WebContainer environment.\x1b[0m\r\n");
            }

            // Check for dependency changes against currently mounted files
            const oldPkgStr = mountedFilesRef.current["package.json"];
            if (oldPkgStr) {
              const oldPkg = JSON.parse(oldPkgStr);
              const depsChanged = JSON.stringify(oldPkg.dependencies) !== JSON.stringify(pkg.dependencies);
              const devDepsChanged = JSON.stringify(oldPkg.devDependencies) !== JSON.stringify(pkg.devDependencies);
              
              if (depsChanged || devDepsChanged) {
                dependenciesChanged = true;
                writeToTerminal("\r\n\x1b[35m[Vibe] Dependencies changed, scheduled installation...\x1b[0m\r\n");
              }
            } else if (pkg.dependencies || pkg.devDependencies) {
              // Newly added package.json with dependencies
              dependenciesChanged = true;
              writeToTerminal("\r\n\x1b[35m[Vibe] New package.json detected, scheduled installation...\x1b[0m\r\n");
            }
          } catch (e) {
            console.error("Failed to parse package.json for dependency check", e);
          }
        }

        // Full mount or incremental update based on state
        if (Object.keys(mountedFilesRef.current).length === 0) {
          if (isMountingRef.current) return;
          isMountingRef.current = true;
          setState("mounting");
          
          try {
            const ls = await wc.fs.readdir("/").catch(() => []);
            for (const item of ls) {
              await wc.fs.rm(`/${item}`, { recursive: true }).catch(() => {});
            }
          } catch (e) {}

          const tree = transformToWebContainerTree(finalFiles);
          await wc.mount(tree);
          
          Object.entries(finalFiles).forEach(([path, { content }]) => {
            mountedFilesRef.current[path] = content;
          });
          isMountingRef.current = false;
          writeToTerminal("\x1b[32m[Vibe] Files mounted successfully.\x1b[0m\r\n");
        } else {
          // Incremental updates for efficiency
          let updatedCount = 0;
          for (const [path, { content }] of Object.entries(finalFiles)) {
            if (mountedFilesRef.current[path] !== content) {
              const fullPath = `/${path}`;
              const parts = fullPath.split("/");
              if (parts.length > 1) {
                await wc.fs.mkdir(parts.slice(0, -1).join("/"), { recursive: true });
              }
              await wc.fs.writeFile(fullPath, content);
              mountedFilesRef.current[path] = content;
              updatedCount++;
            }
          }

          // Handle deletions
          const currentMountedPaths = Object.keys(mountedFilesRef.current);
          for (const path of currentMountedPaths) {
            if (!finalFiles[path]) {
              try {
                await wc.fs.rm(`/${path}`, { recursive: true }).catch(() => {});
                delete mountedFilesRef.current[path];
                writeToTerminal(`\x1b[90m[Vibe] Removed: ${path}\x1b[0m\r\n`);
              } catch (e) {}
            }
          }
          
          if (updatedCount > 0) {
            writeToTerminal(`\x1b[90m[Vibe] Synced ${updatedCount} files.\x1b[0m\r\n`);
          }
        }

        // Run install if needed or if starting for the first time
        const shouldInstall = dependenciesChanged || (!isStartedRef.current && finalFiles["package.json"]);
        
        if (shouldInstall) {
          const success = await runInstall(wc);
          if (success) {
            await startDevServer(wc);
          }
        } else if (!isStartedRef.current) {
          // If no package.json but we need to start (might be just static files or custom server)
          await startDevServer(wc);
        } else if (dependenciesChanged) {
          // If server is already running but deps changed, we already handled it in shouldInstall block above,
          // but for clarity: if we only needed to restart server without install
          await startDevServer(wc);
        }
        // If it's a simple file change and server is already ready, we do nothing and let HMR handle it.
      } catch (err: any) {
        isInstallingRef.current = false;
        isMountingRef.current = false;
        setState("error");
        setError(err.message);
        writeToTerminal(`\x1b[31m[Vibe] WebContainer Error: ${err.message}\x1b[0m\r\n`);
      }
    },
    [startDevServer, runInstall, writeToTerminal]
  );

  useEffect(() => {
    if (files && Object.keys(files).length > 0 && !instance && !isBootingRef.current) {
      boot();
    }
    return () => {
      if (devProcessRef.current) {
        devProcessRef.current.kill();
        devProcessRef.current = null;
      }
      if (installProcessRef.current) {
        installProcessRef.current.kill();
        installProcessRef.current = null;
      }
    };
  }, [files, instance, boot]);

  useEffect(() => {
    if (!files || Object.keys(files).length === 0 || !instance) return;
    const hasChanges = Object.entries(files).some(([path, { content }]) => mountedFilesRef.current[path] !== content) ||
                       Object.keys(mountedFilesRef.current).some(path => !files[path]);
    
    // We allow updates even during streaming to ensure new files/routes are created immediately.
    // mountAndRun handles incremental updates efficiently to avoid unnecessary full reloads.
    if (hasChanges || !isStartedRef.current) {
      if (isMountingRef.current || isInstallingRef.current) return;
      mountAndRun(instance, files);
    }
  }, [files, instance, mountAndRun, isStreaming]);

  // WATCHER: Real-time file sync from WebContainer to UI
  useEffect(() => {
    // Keep watcher active as long as instance is available
    if (!instance || isMountingRef.current) return;
    
    let mounted = true;
    let watchHandle: any;
    
    // Batch file updates to prevent UI lag during bulk operations (like create-next-app)
    let pendingUpdates: Record<string, { content: string | null }> = {};
    let syncTimeout: any;

    const flushUpdates = async () => {
      if (!mounted || Object.keys(pendingUpdates).length === 0) return;
      
      const updates = { ...pendingUpdates };
      pendingUpdates = {};
      
      const currentWorkspace = useWorkspaceStore.getState().currentWorkspace;
      if (!currentWorkspace) return;
      
      const newFiles = { ...currentWorkspace.files };
      let changed = false;

      for (const [path, data] of Object.entries(updates)) {
        if (data.content === null) {
          if (newFiles[path]) {
            delete newFiles[path];
            delete mountedFilesRef.current[path];
            changed = true;
          }
        } else {
           if (mountedFilesRef.current[path] !== data.content) {
             mountedFilesRef.current[path] = data.content;
             newFiles[path] = { content: data.content };
             changed = true;
           }
        }
      }

      if (changed) {
        await useWorkspaceStore.getState().updateFiles(newFiles);
      }
    };

    const startWatching = async () => {
      try {
        watchHandle = await instance.fs.watch("/", { recursive: true }, async (type, eventFilename) => {
          if (!mounted || isMountingRef.current) return;
          
          const filename = typeof eventFilename === "string" ? eventFilename : new TextDecoder().decode(eventFilename);
          const cleanPath = filename.startsWith("/") ? filename.slice(1) : filename;
          
          if (!cleanPath || cleanPath.includes("node_modules") || cleanPath.includes(".next") || 
              cleanPath.includes(".git") || cleanPath.includes("dist") || cleanPath.includes("build") || 
              (cleanPath.split("/").some(p => p.startsWith(".")) && !cleanPath.endsWith(".keep"))) return;

          try {
            const fs = instance.fs as any;
            const isDir = await fs.readdir(`/${cleanPath}`).then(() => true).catch(() => false);
            
            if (isDir) {
               // Directory creation: Ensure we have a .keep file to track it in our JSON-based DB
               const ls = await fs.readdir(`/${cleanPath}`);
               if (ls.length === 0) {
                 await fs.writeFile(`/${cleanPath}/.keep`, "");
               }
               return;
            }

            const content = await fs.readFile(`/${cleanPath}`, "utf-8").catch(() => null);
            pendingUpdates[cleanPath] = { content };
            
            clearTimeout(syncTimeout);
            syncTimeout = setTimeout(flushUpdates, 300);
          } catch (e) {}
        });
      } catch (err) {}
    };

    startWatching();

    return () => {
      mounted = false;
      clearTimeout(syncTimeout);
      if (watchHandle) watchHandle.close();
    };
  }, [instance]);

  return { instance, state, url, setUrl, port, setPort, error, startDevServer, stopDevServer, runInstall, stopInstall };
}
