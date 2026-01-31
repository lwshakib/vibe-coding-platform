import { useEffect, useState, useCallback, useRef } from "react";
import { getWebContainerInstance } from "@/lib/webcontainer";
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
  const prevWorkspaceIdRef = useRef<string | undefined>(workspaceId);

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
    if (workspaceId && prevWorkspaceIdRef.current && workspaceId !== prevWorkspaceIdRef.current) {
      if (devProcessRef.current) {
        devProcessRef.current.kill();
        devProcessRef.current = null;
      }
      if (installProcessRef.current) {
        installProcessRef.current.kill();
        installProcessRef.current = null;
      }
      mountedFilesRef.current = {};
      isStartedRef.current = false;
      isInstallingRef.current = false;
      isMountingRef.current = false;
      setState("idle");
      setUrl(null);
      setPort(null);
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
    if (isInstallingRef.current) return;
    isInstallingRef.current = true;
    setState("installing");
    try {
      const installProcess = await wc.spawn("npm", ["install"], { cwd: "/" });
      installProcessRef.current = installProcess;
      installProcess.output.pipeTo(new WritableStream({ write: (data) => writeToTerminal(data) }));
      const installExitCode = await installProcess.exit;
      if (installExitCode !== 0 && installProcessRef.current) {
        writeToTerminal("\x1b[31mDependency installation failed.\x1b[0m\r\n");
        isStartedRef.current = false;
        throw new Error("Failed to install dependencies");
      }
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
      const wc = await getWebContainerInstance();
      wc.on("server-ready", (port, url) => {
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
  }, [instance, writeToTerminal]);

  const mountAndRun = useCallback(
    async (wc: WebContainer, projectFiles: Record<string, { content: string }>) => {
      try {
        let finalFiles = { ...projectFiles };
        let dependenciesChanged = false;
        if (finalFiles["package.json"]) {
          try {
            const pkg = JSON.parse(finalFiles["package.json"].content);
            let modified = false;
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
              writeToTerminal("\x1b[33mRemoved incompatible --turbo flag from package.json scripts\x1b[0m\r\n");
            }
            if (mountedFilesRef.current["package.json"]) {
              const oldPkg = JSON.parse(mountedFilesRef.current["package.json"]);
              if (JSON.stringify(oldPkg.dependencies) !== JSON.stringify(pkg.dependencies) ||
                  JSON.stringify(oldPkg.devDependencies) !== JSON.stringify(pkg.devDependencies)) {
                dependenciesChanged = true;
              }
            }
          } catch (e) {}
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
        } else {
          for (const [path, { content }] of Object.entries(finalFiles)) {
            if (mountedFilesRef.current[path] !== content) {
              const fullPath = `/${path}`;
              const parts = fullPath.split("/");
              if (parts.length > 1) {
                await wc.fs.mkdir(parts.slice(0, -1).join("/"), { recursive: true });
              }
              await wc.fs.writeFile(fullPath, content);
              mountedFilesRef.current[path] = content;
              writeToTerminal(`\x1b[90mUpdated: ${path}\x1b[0m\r\n`);
            }
          }
          const currentMountedPaths = Object.keys(mountedFilesRef.current);
          for (const path of currentMountedPaths) {
            if (!finalFiles[path]) {
              try {
                await wc.fs.rm(`/${path}`, { recursive: true }).catch(() => {});
                delete mountedFilesRef.current[path];
                writeToTerminal(`\x1b[90mDeleted: ${path}\x1b[0m\r\n`);
              } catch (e) {}
            }
          }
        }

        if (dependenciesChanged || (!isStartedRef.current && finalFiles["package.json"])) {
          await runInstall(wc);
          await startDevServer(wc);
        }
      } catch (err: any) {
        isInstallingRef.current = false;
        isMountingRef.current = false;
        setState("error");
        setError(err.message);
        writeToTerminal(`\x1b[31mError: ${err.message}\x1b[0m\r\n`);
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
    if (isStreaming && isStartedRef.current) return;
    if (hasChanges || !isStartedRef.current) {
      if (isBootingRef.current || isMountingRef.current || isInstallingRef.current) return;
      mountAndRun(instance, files);
    }
  }, [files, instance, mountAndRun, isStreaming]);

  useEffect(() => {
    if (!instance || state !== "ready" || isMountingRef.current) return;
    let mounted = true;
    let watchHandle: any;
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
              const currentFiles = useWorkspaceStore.getState().currentWorkspace?.files || {};
              const isAlreadyPresent = Object.keys(currentFiles).some(p => p === `${cleanPath}/.keep` || p.startsWith(`${cleanPath}/`));
              if (!isAlreadyPresent) await fs.writeFile(`/${cleanPath}/.keep`, "");
              return;
            }
            const content = await fs.readFile(`/${cleanPath}`, "utf-8").catch(() => null);
            if (content !== null) {
              if (mountedFilesRef.current[cleanPath] !== content) {
                mountedFilesRef.current[cleanPath] = content;
                const currentFiles = { ...useWorkspaceStore.getState().currentWorkspace?.files };
                currentFiles[cleanPath] = { content };
                await useWorkspaceStore.getState().updateFiles({ ...currentFiles });
              }
            } else {
              const currentFiles = { ...useWorkspaceStore.getState().currentWorkspace?.files };
              if (currentFiles[cleanPath]) {
                delete currentFiles[cleanPath];
                delete mountedFilesRef.current[cleanPath];
                await useWorkspaceStore.getState().updateFiles({ ...currentFiles });
              }
            }
          } catch (e) {}
        });
      } catch (err) {}
    };
    startWatching();
    return () => {
      mounted = false;
      if (watchHandle) watchHandle.close();
    };
  }, [instance, state]);

  return { instance, state, url, setUrl, port, setPort, error, startDevServer, stopDevServer, runInstall, stopInstall };
}
