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
  const isStartingRef = useRef(false);
  const isInstallingRef = useRef(false);
  const isBootingRef = useRef(false);
  const isMountingRef = useRef(false);
  const devProcessRef = useRef<WebContainerProcess | null>(null);
  const installProcessRef = useRef<WebContainerProcess | null>(null);
  
  // log buffer
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
      isStartingRef.current = false;
      writeToTerminal(`\x1b[32m\r\n[Vibe] Preview server active at ${url}\x1b[0m\r\n`);
      writeToTerminal(`\x1b[90m[Vibe] Mapped port: ${port}\x1b[0m\r\n`);
    });

    return () => {
      unsubscribe();
    };
  }, [instance, writeToTerminal]);

  // Allow manual 'force ready' from UI if server-ready event is missed
  useEffect(() => {
    const forceReady = () => {
      if (state !== "ready" && instance) {
        writeToTerminal("\x1b[33m[Vibe] Force-transitioning to ready state.\x1b[0m\r\n");
        setState("ready");
        isStartedRef.current = true;
        isStartingRef.current = false;
      }
    };
    window.addEventListener("vibe-force-ready", forceReady);
    return () => window.removeEventListener("vibe-force-ready", forceReady);
  }, [state, instance, writeToTerminal]);

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

  const startDevServer = useCallback(async (wc: WebContainer, skipClear: boolean = false) => {
    if (isStartingRef.current && !devProcessRef.current) {
      writeToTerminal("\x1b[33m[Vibe] Startup already in progress. Please wait...\x1b[0m\r\n");
      return;
    }
    
    isStartingRef.current = true;
    setState("starting");
    writeToTerminal("\r\n\x1b[35m[Vibe] Initializing fresh server boot sequence...\x1b[0m\r\n");
    
    // Cleanup previous process if any
    if (devProcessRef.current) {
      writeToTerminal("\x1b[33m[Vibe] Killing existing dev server process...\x1b[0m\r\n");
      const proc = devProcessRef.current;
      proc.kill();
      try {
        await Promise.race([
          proc.exit,
          new Promise(resolve => setTimeout(resolve, 2500))
        ]);
      } catch (e) {}
      
      devProcessRef.current = null;
      isStartedRef.current = false;
      setUrl(null);
      setPort(null);
      writeToTerminal("\x1b[32m[Vibe] Previous process terminated and resources released.\x1b[0m\r\n");
    }
    
    if (!skipClear) {
      writeToTerminal("\x1b[2J\x1b[H"); 
    }
    
    writeToTerminal("\x1b[36m[Vibe] Preparing to spawn new application instance...\x1b[0m\r\n");

    await new Promise(resolve => setTimeout(resolve, 1200));

    let command = "npm";
    let args = ["run", "dev"];
    
    if (mountedFilesRef.current["package.json"]) {
       try {
         const pkg = JSON.parse(mountedFilesRef.current["package.json"]);
         if (!pkg.scripts?.dev) {
           if (pkg.scripts?.start) {
             args = ["run", "start"];
             writeToTerminal("\x1b[90m[Vibe] No 'dev' script found, falling back to 'npm start'\x1b[0m\r\n");
           } else {
             command = "node";
             args = [pkg.main || "index.js"];
             writeToTerminal(`\x1b[90m[Vibe] No scripts found, falling back to 'node ${args[0]}'\x1b[0m\r\n`);
           }
         }
       } catch (e) {}
    } else {
      command = "node";
      args = ["index.js"];
      writeToTerminal("\x1b[90m[Vibe] No package.json, attempting 'node index.js'\x1b[0m\r\n");
    }

    try {
      writeToTerminal(`\x1b[33m[Vibe] Executing: ${command} ${args.join(" ")}\x1b[0m\r\n`);
      const devProcess = await wc.spawn(command, args, {
        cwd: "/",
        env: { 
          PORT: "3000",
          HOST: "0.0.0.0",
          NODE_ENV: "development"
        },
      });

      devProcessRef.current = devProcess;

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
      
      writeToTerminal("\x1b[90m[Vibe] Process successfully spawned. Listening for server-ready event...\x1b[0m\r\n");
      
      const watchdog = setTimeout(() => {
        if (isStartingRef.current && devProcessRef.current === devProcess && state === "starting") {
          writeToTerminal("\x1b[33m\r\n[Vibe] Warning: Server is taking a long time to start. Check if it's listening on the correct port.\x1b[0m\r\n");
          isStartingRef.current = false;
        }
      }, 30000);

      devProcess.exit.then((code) => {
        clearTimeout(watchdog);
        if (devProcessRef.current === devProcess) {
          if (code !== 0 && code !== null) {
            writeToTerminal(`\x1b[31m\r\n[Vibe] Process exited with code: ${code}\x1b[0m\r\n`);
          } else {
            writeToTerminal("\x1b[33m\r\n[Vibe] Process terminated.\x1b[0m\r\n");
          }
          
          isStartedRef.current = false;
          isStartingRef.current = false;
          devProcessRef.current = null;

          if (code === 0 || code === null) {
            setUrl(null);
            setPort(null);
            setState("stopped");
          } else {
            // For non-zero exit codes (errors), we keep the URL and state 
            // so the web preview remains visible with whatever it last showed.
            // The error is already logged to the terminal above.
            writeToTerminal("\x1b[90m[Vibe] Keep-alive: Preview remains mounted. Check terminal for error details.\x1b[0m\r\n");
          }
        }
      });
    } catch (err: any) {
      writeToTerminal(`\x1b[31m\r\n[Vibe] Fatal error during spawn: ${err.message}\x1b[0m\r\n`);
      isStartedRef.current = false;
      isStartingRef.current = false;
      devProcessRef.current = null;
    }
  }, [setExpoQRData, setShowExpoQR, writeToTerminal, state]);

  const stopDevServer = useCallback(async () => {
    if (devProcessRef.current) {
      writeToTerminal("\x1b[33m\r\n[Vibe] Stopping dev server...\x1b[0m\r\n");
      devProcessRef.current.kill();
      try {
        await Promise.race([
          devProcessRef.current.exit,
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
      } catch (e) {}
      devProcessRef.current = null;
      isStartedRef.current = false;
      isStartingRef.current = false;
      setState("stopped");
      setUrl(null);
      setPort(null);
    }
  }, [writeToTerminal]);

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
  }, [instance, writeToTerminal, workspaceId]);

  const isSyncingRef = useRef(false);

  const mountAndRun = useCallback(
    async (wc: WebContainer, projectFiles: Record<string, { content: string }>) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      try {
        const finalFiles = { ...projectFiles };
        let dependenciesChanged = false;
        
        if (finalFiles["package.json"]) {
          const pkgContent = finalFiles["package.json"].content;
          let pkg: any;
          try {
            pkg = JSON.parse(pkgContent);
          } catch (parseError: any) {
            if (!isStreaming) {
              writeToTerminal(`\x1b[31m[Vibe] package.json parse error: ${parseError.message}\x1b[0m\r\n`);
              isSyncingRef.current = false;
              setError(`Invalid package.json: ${parseError.message}`);
              return;
            }
          }
          
          let modified = false;
          if (pkg?.scripts) {
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

          if (pkg) {
            const oldPkgStr = mountedFilesRef.current["package.json"];
            if (oldPkgStr) {
              try {
                const oldPkg = JSON.parse(oldPkgStr);
                const depsChanged = JSON.stringify(oldPkg.dependencies) !== JSON.stringify(pkg.dependencies);
                const devDepsChanged = JSON.stringify(oldPkg.devDependencies) !== JSON.stringify(pkg.devDependencies);
                if (depsChanged || devDepsChanged) {
                  dependenciesChanged = true;
                  writeToTerminal("\r\n\x1b[35m[Vibe] Dependencies changed, scheduled installation...\x1b[0m\r\n");
                }
              } catch (e) {}
            } else if (pkg.dependencies || pkg.devDependencies) {
              dependenciesChanged = true;
              writeToTerminal("\r\n\x1b[35m[Vibe] New package.json detected, scheduled installation...\x1b[0m\r\n");
            }
          }
        }

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

        const shouldInstall = !isStreaming && (dependenciesChanged || (!isStartedRef.current && !isStartingRef.current && finalFiles["package.json"]));
        if (shouldInstall) {
          if (dependenciesChanged && devProcessRef.current) {
            await stopDevServer();
          }
          const success = await runInstall(wc);
          if (success) {
            await startDevServer(wc, true);
          }
        } else if (!isStartedRef.current && !isStartingRef.current && state !== "starting") {
          await startDevServer(wc, true);
        }
      } catch (err: any) {
        isInstallingRef.current = false;
        isMountingRef.current = false;
        isStartingRef.current = false;
        // We no longer transition to 'error' state here to keep the terminal 
        // as the primary source of error information, as requested.
        setError(err.message);
        writeToTerminal(`\x1b[31m[Vibe] WebContainer Error: ${err.message}\x1b[0m\r\n`);
      } finally {
        isSyncingRef.current = false;
      }
    },
    [startDevServer, stopDevServer, runInstall, writeToTerminal, isStreaming, state]
  );

  useEffect(() => {
    if (files && Object.keys(files).length > 0 && !instance && !isBootingRef.current) {
      boot();
    }
  }, [files, instance, boot]);

  const wasStreamingRef = useRef(isStreaming);

  useEffect(() => {
    const wasStreaming = wasStreamingRef.current;
    wasStreamingRef.current = isStreaming;
    if (!files || Object.keys(files).length === 0 || !instance) return;

    const hasChanges = Object.entries(files).some(([path, { content }]) => mountedFilesRef.current[path] !== content) ||
                       Object.keys(mountedFilesRef.current).some(path => !files[path]);
    
    // Only trigger mount and run if:
    // 1. Files have actually changed (hasChanges)
    // 2. We just stopped streaming (wasStreaming)
    // 3. It's the first mount (no files mounted yet AND not already starting)
    const shouldTrigger = !isStreaming && (
      hasChanges || 
      wasStreaming || 
      (!isStartedRef.current && !isStartingRef.current && Object.keys(mountedFilesRef.current).length === 0)
    );

    if (shouldTrigger) {
      if (isMountingRef.current || isInstallingRef.current) return;
      mountAndRun(instance, files);
    }
  }, [files, instance, mountAndRun, isStreaming]);

  useEffect(() => {
    if (!instance || isMountingRef.current) return;
    let mounted = true;
    let watchHandle: any;
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
               const ls = await fs.readdir(`/${cleanPath}`);
               if (ls.length === 0) { await fs.writeFile(`/${cleanPath}/.keep`, ""); }
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
