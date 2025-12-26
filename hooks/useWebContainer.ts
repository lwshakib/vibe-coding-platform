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
  const [error, setError] = useState<string | null>(null);

  const mountedFilesRef = useRef<Record<string, string>>({});
  const isStartedRef = useRef(false);
  const isInstallingRef = useRef(false);

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
          if (!current[part]) {
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
    try {
      setState("booting");
      writeToTerminal("\x1b[33mBooting WebContainer...\x1b[0m\r\n");
      const wc = await getWebContainerInstance();
      setInstance(wc);
      return wc;
    } catch (err: any) {
      setState("error");
      setError(err.message);
      writeToTerminal(`\x1b[31mError booting: ${err.message}\x1b[0m\r\n`);
      return null;
    }
  }, []);

  const mountAndRun = useCallback(
    async (
      wc: WebContainer,
      projectFiles: Record<string, { content: string }>
    ) => {
      try {
        if (Object.keys(mountedFilesRef.current).length === 0) {
          setState("mounting");
          writeToTerminal("\x1b[33mMounting files...\x1b[0m\r\n");
          const tree = transformToWebContainerTree(projectFiles);
          await wc.mount(tree);

          const newRef: Record<string, string> = {};
          Object.entries(projectFiles).forEach(([path, { content }]) => {
            newRef[path] = content;
          });
          mountedFilesRef.current = newRef;
          writeToTerminal("\x1b[32mFiles mounted successfully.\x1b[0m\r\n");
        } else {
          for (const [path, { content }] of Object.entries(projectFiles)) {
            if (mountedFilesRef.current[path] !== content) {
              const parts = path.split("/");
              if (parts.length > 1) {
                const dir = parts.slice(0, -1).join("/");
                await wc.fs.mkdir(dir, { recursive: true });
              }
              await wc.fs.writeFile(path, content);
              mountedFilesRef.current[path] = content;
              writeToTerminal(`\x1b[90mUpdated ${path}\x1b[0m\r\n`);
            }
          }
        }

        if (
          !isStartedRef.current &&
          !isInstallingRef.current &&
          projectFiles["package.json"]
        ) {
          isInstallingRef.current = true;
          setState("installing");
          writeToTerminal("\x1b[33mInstalling dependencies...\x1b[0m\r\n");
          const installProcess = await wc.spawn("npm", ["install"]);

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
            throw new Error("Failed to install dependencies");
          }
          writeToTerminal("\x1b[32mDependencies installed.\x1b[0m\r\n");

          isInstallingRef.current = false;
          setState("starting");
          writeToTerminal("\x1b[33mStarting dev server...\x1b[0m\r\n");
          const devProcess = await wc.spawn("npm", ["run", "dev"]);

          devProcess.output.pipeTo(
            new WritableStream({
              write: (data) => writeToTerminal(data),
            })
          );

          wc.on("server-ready", (port, url) => {
            setUrl(url);
            setState("ready");
            isStartedRef.current = true;
            writeToTerminal(`\x1b[32mServer ready at ${url}\x1b[0m\r\n`);
          });
        }
      } catch (err: any) {
        isInstallingRef.current = false;
        setState("error");
        setError(err.message);
        writeToTerminal(`\x1b[31mError: ${err.message}\x1b[0m\r\n`);
      }
    },
    []
  );

  useEffect(() => {
    if (files && Object.keys(files).length > 0) {
      if (!instance && state === "idle") {
        boot().then((wc) => {
          if (wc) mountAndRun(wc, files);
        });
      } else if (instance) {
        mountAndRun(instance, files);
      }
    }
  }, [files, instance, boot, mountAndRun]);

  return { instance, state, url, error };
}
