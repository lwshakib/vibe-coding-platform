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
import { Download, Github, Lock, Menu, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function TopView() {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("My Project");
  const [isGithubDialogOpen, setIsGithubDialogOpen] = useState(false);

  // Mock states for UI demonstration
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoDescription, setRepoDescription] = useState("");
  const [repoPrivate, setRepoPrivate] = useState(true);

  const currentName = nameInput;

  const startEditing = () => {
    setIsEditingName(true);
  };

  const submitName = () => {
    setIsEditingName(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsGithubDialogOpen(open);
    if (!open) {
      setIsCreatingRepo(false);
    }
  };

  return (
    <header className="bg-background border-b border-border px-6 py-2 flex-shrink-0 h-14 flex items-center justify-between">
      <div className="flex items-center">
        {isEditingName ? (
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={submitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitName();
              if (e.key === "Escape") setIsEditingName(false);
            }}
            autoFocus
            className="bg-transparent border-none outline-none p-0 text-foreground text-sm font-medium w-fit focus:ring-0"
            style={{ width: `${Math.max(currentName.length + 1, 5)}ch` }}
          />
        ) : (
          <h2
            className="text-foreground/90 text-sm font-medium cursor-text hover:text-foreground transition-colors"
            onDoubleClick={startEditing}
            title="Double click to rename"
          >
            {currentName}
          </h2>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="Export"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-popover border-border text-popover-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle>Download Project Files</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will download all your project files and folders as a ZIP
                file named "{currentName}.zip".
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

        <Dialog open={isGithubDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="GitHub"
              title="GitHub"
            >
              <Github className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-popover border-border text-popover-foreground">
            <DialogHeader>
              <DialogTitle>GitHub Repositories</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Connect your project to GitHub to enable version control and
                collaboration features.
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
                    placeholder="A short description of your repository"
                    value={repoDescription}
                    onChange={(e) => setRepoDescription(e.target.value)}
                    className="min-h-24 bg-secondary/50 border-border text-foreground"
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-3 bg-secondary/50">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none text-foreground">
                      Private
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Only you and collaborators can see this repository
                    </p>
                  </div>
                  <Switch
                    checked={repoPrivate}
                    onCheckedChange={setRepoPrivate}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingRepo(false)}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
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
                    className="h-7 text-xs border-border text-muted-foreground hover:text-foreground"
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
                  <span className="text-xs text-muted-foreground">
                    TypeScript
                  </span>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Commit Changes
                  </Label>
                  <Input
                    placeholder="Commit message..."
                    className="bg-secondary/50 border-border text-foreground text-sm"
                  />
                  <div className="flex items-center space-x-2 py-1">
                    <Switch id="readme" />
                    <Label
                      htmlFor="readme"
                      className="text-xs text-muted-foreground"
                    >
                      Enhance with AI README
                    </Label>
                  </div>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Commit & Push
                  </Button>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Disconnect GitHub Account
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
  );
}
