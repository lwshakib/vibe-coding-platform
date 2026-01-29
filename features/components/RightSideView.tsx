"use client";

import { ModeToggle } from "@/components/mode-toggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceStore } from "@/context";
import { Download, Github, Lock, Plus } from "lucide-react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";
import CodeEditor from "../editor/CodeEditor";
import { CustomSearchBar } from "./CustomSearchBar";
import CustomTabs from "./CustomTabs";
import WebPreview from "./WebPreview";
import { useWebContainerContext } from "@/context/WebContainerContext";

type ResponsiveMode = "desktop" | "tablet" | "mobile";

const RightSideView: React.FC = () => {
  const { activeTab, setActiveTab } = useWorkspaceStore();
  const { url: previewUrl, port } = useWebContainerContext();

  const [isGithubDialogOpen, setIsGithubDialogOpen] = useState(false);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoDescription, setRepoDescription] = useState("");
  const [repoPrivate, setRepoPrivate] = useState(true);

  const handleDialogOpenChange = (open: boolean) => {
    setIsGithubDialogOpen(open);
    if (!open) {
      setIsCreatingRepo(false);
    }
  };

  const [url, setUrl] = useState("/");
  const [responsiveMode, setResponsiveMode] =
    useState<ResponsiveMode>("desktop");
  const [reloadKey, setReloadKey] = useState(0);

  const { state } = useWebContainerContext();
  const hasAutoSwitchedRef = React.useRef(false);

  React.useEffect(() => {
    if (state === "ready" && !hasAutoSwitchedRef.current) {
      setActiveTab("web-preview");
      hasAutoSwitchedRef.current = true;
    } else if (state !== "ready") {
      hasAutoSwitchedRef.current = false;
    }
  }, [state, setActiveTab]);

  const handleRefresh = () => {
    setReloadKey((prev) => prev + 1);
  };

  const handleResponsiveModeToggle = () => {
    const modes: ResponsiveMode[] = ["desktop", "tablet", "mobile"];
    const currentIndex = modes.indexOf(responsiveMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setResponsiveMode(modes[nextIndex]);
  };

  const getResponsiveIcon = () => {
    switch (responsiveMode) {
      case "desktop":
        return <Monitor className="h-3 w-3" />;
      case "tablet":
        return <Tablet className="h-3 w-3" />;
      case "mobile":
        return <Smartphone className="h-3 w-3" />;
    }
  };

  const handleExternalLink = () => {
    if (previewUrl) {
      const cleanPath = url.startsWith("/") ? url : `/${url}`;
      window.open(`${previewUrl}${cleanPath}`, "_blank");
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full h-full rounded-xl flex flex-col overflow-hidden">
        <header className="h-14 flex items-center justify-between shrink-0 gap-4 mr-4">
          <div className="flex items-center gap-4 flex-1">
            <CustomTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <AnimatePresence>
              {activeTab === "web-preview" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 max-w-xl w-full"
                >
                  <CustomSearchBar
                    value={url}
                    onChange={setUrl}
                    onSubmit={() => {}}
                    onRefresh={handleRefresh}
                    onExternalLink={previewUrl ? handleExternalLink : undefined}
                    onToggleResponsive={handleResponsiveModeToggle}
                    responsiveIcon={getResponsiveIcon()}
                    placeholder="Search or enter path..."
                    port={port || 3000}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center space-x-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-popover border-border text-popover-foreground">
                <AlertDialogHeader>
                  <AlertDialogTitle>Download Project Files</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This will download all your project files and folders as a
                    ZIP file.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-accent">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Download ZIP
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Dialog
              open={isGithubDialogOpen}
              onOpenChange={handleDialogOpenChange}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <Github className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-popover border-border text-popover-foreground">
                <DialogHeader>
                  <DialogTitle>GitHub Repositories</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Connect your project to GitHub to enable version control.
                  </DialogDescription>
                </DialogHeader>

                {isCreatingRepo ? (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="repo-name">Repository name</Label>
                      <Input
                        id="repo-name"
                        placeholder="my-awesome-repo"
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value)}
                        className="bg-secondary/50 border-border text-foreground"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="repo-description">
                        Description (optional)
                      </Label>
                      <Textarea
                        id="repo-description"
                        placeholder="A short description"
                        value={repoDescription}
                        onChange={(e) => setRepoDescription(e.target.value)}
                        className="min-h-24 bg-secondary/50 border-border text-foreground"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-border p-3 bg-secondary/50">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                          Private
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Only collaborators can see this
                        </p>
                      </div>
                      <Switch
                        checked={repoPrivate}
                        onCheckedChange={setRepoPrivate}
                      />
                    </div>
                    <div className="flex justify-end gap-2 text-foreground">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreatingRepo(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-primary text-primary-foreground"
                        onClick={() => setIsCreatingRepo(false)}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-foreground/90">
                        Linked Repository
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setIsCreatingRepo(true)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        New Repo
                      </Button>
                    </div>

                    <div className="p-3 rounded-md border border-border bg-secondary/50 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Github className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          vibe-coding-platform
                        </span>
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Commit Changes
                      </Label>
                      <Input
                        placeholder="Commit message..."
                        className="bg-secondary/50 border-border text-foreground text-sm"
                      />
                      <Button className="w-full bg-primary text-primary-foreground">
                        Commit & Push
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <div className="pl-2 border-l border-border h-8 flex items-center">
              <ModeToggle />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative rounded-md border-border border m-2">
          <motion.div
            initial={false}
            animate={{
              opacity: activeTab === "code-editor" ? 1 : 0,
              x: activeTab === "code-editor" ? 0 : -20,
              pointerEvents: activeTab === "code-editor" ? "auto" : "none",
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 h-full w-full"
          >
            <CodeEditor />
          </motion.div>

          <motion.div
            initial={false}
            animate={{
              opacity: activeTab === "web-preview" ? 1 : 0,
              x: activeTab === "web-preview" ? 0 : 20,
              pointerEvents: activeTab === "web-preview" ? "auto" : "none",
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 h-full w-full"
          >
            <WebPreview
              url={url}
              setUrl={setUrl}
              responsiveMode={responsiveMode}
              reloadKey={reloadKey}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RightSideView;
