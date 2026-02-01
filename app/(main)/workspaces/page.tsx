"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserMenu } from "@/components/user-menu";

import { Button } from "@/components/ui/button";
import { Logo, LogoIcon } from "@/components/logo";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceStore, Workspace } from "@/context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronRight, RefreshCw, Sparkles } from "lucide-react";
import { uniqueNamesGenerator, adjectives, animals } from "unique-names-generator";
import { cn } from "@/lib/utils";
import { AppType } from "@/generated/prisma/enums";
import {
  WORKSPACE_REGISTRY,
  getTemplateByType,
} from "@/lib/workspace-registry";

const generateGradientThumbnail = () => {
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  ];

  const randomGradient =
    gradients[Math.floor(Math.random() * gradients.length)];
  const svgContent = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${
            randomGradient.match(/#[a-fA-F0-9]{6}/g)?.[0] || "#667eea"
          }" />
          <stop offset="100%" style="stop-color:${
            randomGradient.match(/#[a-fA-F0-9]{6}/g)?.[1] || "#764ba2"
          }" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <circle cx="150" cy="100" r="30" fill="white" opacity="0.8" />
      <path d="M140 90 L160 90 L160 110 L140 110 Z" fill="white" opacity="0.6" />
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};

const WorkspacesSkeleton = () => (
  <div className="w-full">
    <Table className="border-collapse">
      <TableHeader>
        <TableRow className="border-t border-b border-border/10">
          <TableHead className="w-[45%] pl-4">Project</TableHead>
          <TableHead>Stack</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right pr-4"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, idx) => (
          <TableRow key={idx} className="h-16 border-b border-border/10">
            <TableCell className="pl-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg bg-muted/50" />
                <Skeleton className="h-4 w-32 bg-muted/50" />
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-20 bg-muted/50" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24 bg-muted/50" /></TableCell>
            <TableCell className="pr-4"><div className="flex justify-end"><Skeleton className="size-8 rounded-full bg-muted/50" /></div></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default function WorkspacesPage() {
  const { workspaces, setWorkspaces, credits, fetchCredits } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [appType, setAppType] = useState<AppType>(AppType.VITE_APP);
  const [step, setStep] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const generateNames = () => {
    const names = Array.from({ length: 3 }, () => 
      uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        length: 2,
        separator: ' ',
        style: 'capital'
      })
    );
    setSuggestedNames(names);
  };

  const workspaceThumbnails = useMemo(() => {
    const thumbnails = new Map<string, string>();
    workspaces.forEach((workspace: Workspace) => {
      thumbnails.set(workspace.id, generateGradientThumbnail());
    });
    return thumbnails;
  }, [workspaces]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/workspaces");
      if (!res.ok) {
        throw new Error("Failed to load workspaces");
      }
      const data = await res.json();
      setWorkspaces(data.workspaces ?? []);
    } catch (err) {
      console.error(err);
      setError("Unable to load workspaces right now.");
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async () => {
    try {
      setCreating(true);
      setError(null);
      setCreateError(null);
      const fallbackName = `Workspace ${new Date().toLocaleString()}`;
      const name = newWorkspaceName.trim() || fallbackName;
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, app_type: appType }),
      });
      if (!res.ok) {
        throw new Error("Failed to create workspace");
      }
      const data = await res.json();
      setWorkspaces((prev: Workspace[]) => [
        data.workspace as Workspace,
        ...prev,
      ]);
      setCreateDialogOpen(false);
      setNewWorkspaceName("");
      setStep(0);
    } catch (err) {
      console.error(err);
      setCreateError("Unable to create workspace.");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
    generateNames();
    fetchCredits();
  }, [fetchCredits]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground w-full">
      {/* Top chrome */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 sm:px-10 lg:px-16 bg-background/80 backdrop-blur-md border-b border-border/10">
        <div className="flex items-center gap-3">
          <Logo className="text-foreground" />
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="hidden text-[11px] sm:inline">
            {credits !== null ? `${(credits / 1000).toFixed(1)}k credits remaining` : "Limited credits"}
          </span>
          <UserMenu />
          <Dialog
            open={createDialogOpen}
            onOpenChange={(open) => {
              setCreateDialogOpen(open);
              if (open) {
                generateNames();
              } else {
                setStep(0);
                setNewWorkspaceName("");
                setCreateError(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                disabled={creating}
                className="h-8 rounded-full bg-primary px-4 text-[11px] font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 disabled:opacity-60"
              >
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border sm:max-w-md overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {step === 0 ? "Create workspace" : "Choose your stack"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {step === 0
                    ? "Give your workspace a name. You can change it later."
                    : "Select the framework you want to use for this project."}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 h-1 w-full bg-muted overflow-hidden rounded-full">
                <motion.div
                  className="h-full bg-primary transition-all duration-300"
                  initial={{ width: "0%" }}
                  animate={{ width: step === 0 ? "50%" : "100%" }}
                />
              </div>

              <div className="relative min-h-44">
                <AnimatePresence mode="wait">
                  {step === 0 ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 pt-2"
                    >
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                            Workspace name
                          </label>
                          <Input
                            autoFocus
                            value={newWorkspaceName}
                            onChange={(e) => {
                              setNewWorkspaceName(e.target.value);
                              if (createError) setCreateError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newWorkspaceName.trim()) {
                                setStep(1);
                              }
                            }}
                            placeholder="e.g. My Awesome Project"
                            className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50 h-12 rounded-xl focus:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                             <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                               <Sparkles className="size-3 text-primary" />
                               Magic Suggestions
                             </div>
                             <button
                               onClick={generateNames}
                               className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                             >
                               <RefreshCw className="size-3" />
                               Refresh
                             </button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {suggestedNames.map((name, i) => (
                              <button
                                key={i}
                                onClick={() => setNewWorkspaceName(name)}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
                                  newWorkspaceName === name 
                                    ? "bg-primary/10 border-primary text-primary" 
                                    : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-muted/50"
                                )}
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {createError ? (
                          <p className="text-xs text-red-400 font-medium">
                            {createError}
                          </p>
                        ) : null}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 pt-2"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {WORKSPACE_REGISTRY.map((template) => (
                          <button
                            key={template.type}
                            type="button"
                            onClick={() => setAppType(template.type)}
                            className={cn(
                              "group flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 transition-all",
                              appType === template.type
                                ? "border-primary bg-accent ring-1 ring-primary/20"
                                : "border-border bg-card hover:bg-accent/50 hover:border-primary/20"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-10 w-10 items-center justify-center transition-transform group-hover:scale-110",
                                template.logoStyling
                              )}
                            >
                              <img
                                src={template.logo}
                                alt={template.label}
                                className="h-full w-full"
                              />
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium text-foreground">
                                {template.label}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                                {template.category}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <DialogFooter className="mt-6">
                <div className="flex w-full items-center justify-between">
                  {step === 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep(0)}
                      className="text-muted-foreground hover:text-foreground px-2"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCreateDialogOpen(false)}
                      className="text-muted-foreground hover:text-foreground px-4"
                    >
                      Cancel
                    </Button>
                    {step === 0 ? (
                      <Button
                        type="button"
                        disabled={!newWorkspaceName.trim()}
                        onClick={() => setStep(1)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 font-semibold"
                      >
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={creating}
                        onClick={createWorkspace}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 font-semibold shadow-lg"
                      >
                        {creating ? "Creating..." : "Create Workspace"}
                      </Button>
                    )}
                  </div>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-start justify-center px-4 pb-10 pt-10 sm:px-8 lg:px-20">
        <div className="w-full max-w-5xl">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-foreground">
              Your Workspaces
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage your workspaces and continue where you left off.
            </p>
            {error ? (
              <p className="mt-2 text-xs text-red-300">{error}</p>
            ) : null}
          </div>

          {loading ? (
            <WorkspacesSkeleton />
          ) : (
            <div className="w-full">
              {workspaces.length === 0 ? (
                <div className="text-center py-24 bg-muted/20 rounded-2xl border border-dashed border-border">
                  <div className="inline-flex size-14 items-center justify-center mb-4">
                    <LogoIcon size={32} className="opacity-20 grayscale" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">No workspaces yet</h3>
                  <p className="text-xs text-muted-foreground mt-1 px-10">
                    Get started by creating your first workspace.
                  </p>
                </div>
              ) : (
                <Table className="border-collapse">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-t border-b border-border/10">
                      <TableHead className="w-[45%] pl-4 text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60">Project</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60">Stack</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60">Last Updated</TableHead>
                      <TableHead className="text-right pr-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...workspaces]
                      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                      .map((workspace: Workspace) => {
                        const template = getTemplateByType(workspace.app_type);
                        return (
                          <TableRow 
                            key={workspace.id} 
                            className="group cursor-pointer h-16 transition-colors hover:bg-muted/30 border-b border-border/10"
                            onClick={() => router.push(`/workspaces/${workspace.id}`)}
                          >
                            <TableCell className="pl-4 font-medium">
                              <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-105">
                                  <img
                                    src={template?.logo || "/logos/react.svg"}
                                    alt={template?.label || "Workspace"}
                                    className={cn("size-5", template?.logoStyling)}
                                  />
                                </div>
                                <span className="truncate max-w-[200px] md:max-w-xs">{workspace.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-extrabold bg-primary/5 text-primary border-none px-2 pr-2.5">
                                {template?.label || "Vite"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(workspace.updatedAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell className="text-right pr-4">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary"
                              >
                                <ChevronRight className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
