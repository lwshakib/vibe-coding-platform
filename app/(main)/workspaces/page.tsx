"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
  <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
    {[...Array(10)].map((_, idx) => (
      <div key={idx} className="flex flex-col gap-2">
        <div className="group block w-full aspect-square rounded-3xl bg-[#101018] p-px text-left">
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.3rem] bg-[#101018]">
            <Skeleton className="absolute inset-0 h-full w-full bg-white/10" />
            <Skeleton className="relative size-12 rounded-full bg-white/20" />
          </div>
        </div>
        <div className="px-1 text-[11px] text-white/90 space-y-1">
          <Skeleton className="h-4 w-24 bg-white/20" />
          <Skeleton className="h-3 w-28 bg-white/10" />
        </div>
      </div>
    ))}
  </div>
);

export default function WorkspacesPage() {
  const { workspaces, setWorkspaces } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [appType, setAppType] = useState<AppType>(AppType.VITE_APP);
  const [step, setStep] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = authClient.useSession();

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
        ...prev,
        data.workspace as Workspace,
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
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground w-full">
      {/* Top chrome */}
      <header className="flex items-center justify-between px-6 pt-4 sm:px-10 lg:px-16">
        <div className="flex items-center gap-3">
          <Logo className="text-white" />
        </div>
        <div className="flex items-center gap-4 text-xs text-white/60">
          <span className="hidden text-[11px] sm:inline">Limited credits</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={session?.user?.image || ""}
                    alt={session?.user?.name || "User"}
                  />
                  <AvatarFallback>
                    {session?.user?.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={async () => {
                  await authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        router.push("/sign-in");
                      },
                    },
                  });
                }}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog
            open={createDialogOpen}
            onOpenChange={(open) => {
              setCreateDialogOpen(open);
              if (!open) {
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
                className="h-8 rounded-full bg-white px-4 text-[11px] font-semibold text-black shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:bg-white/90 disabled:opacity-60"
              >
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0c0c12] border-white/10 sm:max-w-md overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {step === 0 ? "Create workspace" : "Choose your stack"}
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  {step === 0
                    ? "Give your workspace a name. You can change it later."
                    : "Select the framework you want to use for this project."}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 h-1 w-full bg-white/5 overflow-hidden rounded-full">
                <motion.div
                  className="h-full bg-white transition-all duration-300"
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
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">
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
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-11"
                        />
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
                                ? "border-white bg-white/10 ring-1 ring-white/20"
                                : "border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/20"
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
                              <div className="text-sm font-medium text-white/90">
                                {template.label}
                              </div>
                              <div className="text-[10px] text-white/40 mt-0.5 capitalize">
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
                      className="text-white/60 hover:text-white hover:bg-white/5 px-2"
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
                      className="text-white/60 hover:text-white hover:bg-white/5 px-4"
                    >
                      Cancel
                    </Button>
                    {step === 0 ? (
                      <Button
                        type="button"
                        disabled={!newWorkspaceName.trim()}
                        onClick={() => setStep(1)}
                        className="bg-white text-black hover:bg-white/90 px-6 font-semibold"
                      >
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={creating}
                        onClick={createWorkspace}
                        className="bg-white text-black hover:bg-white/90 px-6 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.3)]"
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
            <h1 className="text-lg font-semibold text-white">
              Your Workspaces
            </h1>
            <p className="mt-1 text-xs text-white/45">
              Manage your workspaces and continue where you left off.
            </p>
            {error ? (
              <p className="mt-2 text-xs text-red-300">{error}</p>
            ) : null}
          </div>

          {loading ? (
            <WorkspacesSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {workspaces.length === 0 ? (
                <div className="col-span-full text-white/70 text-sm">
                  No workspaces yet. Create one to get started.
                </div>
              ) : (
                workspaces.map((workspace: Workspace) => {
                  const thumbnail = workspaceThumbnails.get(workspace.id);
                  return (
                    <div key={workspace.id} className="flex flex-col gap-2">
                      <Link
                        href={`/workspaces/${workspace.id}`}
                        className="group block w-full aspect-square rounded-3xl bg-[#101018] p-px text-left transition-transform duration-200 hover:-translate-y-1"
                      >
                        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.3rem] bg-[#101018]">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={`${workspace.name} thumbnail`}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : null}
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.7),transparent_55%)] opacity-80" />
                          <div className="relative flex items-center justify-center">
                            <div className="flex size-11 items-center justify-center rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-transform duration-300 group-hover:scale-110">
                              {(() => {
                                const template = getTemplateByType(
                                  workspace.app_type
                                );
                                return (
                                  <img
                                    src={template?.logo || "/logos/react.svg"}
                                    alt={template?.label || "Workspace"}
                                    className={cn(
                                      "size-6",
                                      template?.logoStyling
                                    )}
                                  />
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </Link>

                      <div className="px-1 text-[11px] text-white/90">
                        <div className="font-medium">{workspace.name}</div>
                        <div className="mt-0.5 text-[10px] text-white/65">
                          Updated{" "}
                          {new Date(workspace.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
