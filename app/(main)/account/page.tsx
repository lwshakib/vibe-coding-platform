"use client";

import React, { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  User, 
  Lock, 
  ShieldCheck, 
  Trash2, 
  Globe, 
  Github, 
  Chrome,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Loader2
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { useWorkspaceStore } from "@/context";

export default function AccountPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const { credits, fetchCredits } = useWorkspaceStore();
  
  // Profile State
  const [name, setName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  // Sessions State
  const [sessions, setSessions] = useState<any[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Account Deletion State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const fetchSessions = async () => {
    setIsSessionsLoading(true);
    try {
      const res = await authClient.listSessions();
      if (res.data) {
        setSessions(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      fetchSessions();
    }
    fetchCredits();
  }, [session, fetchCredits]);

  const handleUpdateProfile = async () => {
    if (!name.trim()) return toast.error("Name cannot be empty");
    
    setIsUpdatingProfile(true);
    await authClient.updateUser({
      name: name.trim(),
    }, {
      onSuccess: () => {
        toast.success("Profile updated successfully");
        setIsUpdatingProfile(false);
      },
      onError: (ctx) => {
        toast.error(ctx.error.message || "Failed to update profile");
        setIsUpdatingProfile(false);
      }
    });
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match");
    }
    
    setIsUpdatingPassword(true);
    await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true
    }, {
      onSuccess: () => {
        toast.success("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsUpdatingPassword(false);
      },
      onError: (ctx) => {
        toast.error(ctx.error.message || "Failed to update password");
        setIsUpdatingPassword(false);
      }
    });
  };

  const handleRevokeSession = async (token: string) => {
    setRevokingId(token);
    await authClient.revokeSession({
        token: token
    }, {
      onSuccess: () => {
        toast.success("Session revoked");
        fetchSessions();
        setRevokingId(null);
      },
      onError: (ctx) => {
        toast.error(ctx.error.message || "Failed to revoke session");
        setRevokingId(null);
      }
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "delete my account") return;
    
    setIsDeletingAccount(true);
    await authClient.deleteUser({
        callbackURL: "/sign-in"
    }, {
      onSuccess: () => {
        toast.success("Account deleted");
        router.push("/sign-in");
      },
      onError: (ctx) => {
        toast.error(ctx.error.message || "Failed to delete account");
        setIsDeletingAccount(false);
      }
    });
  };

  if (isSessionPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    router.push("/sign-in");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground w-full">
      {/* Top Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 sm:px-10 lg:px-16 bg-background/80 backdrop-blur-md border-b border-border/10">
        <div className="flex items-center gap-3">
          <Logo className="text-foreground" />
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="hidden text-[11px] sm:inline">
            {credits !== null ? `${(credits / 1000).toFixed(1)}k credits remaining` : "Limited credits"}
          </span>
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 w-full pb-20 font-inter">
        {/* Profile Intro */}
        <div className="max-w-5xl mx-auto px-6 pt-12 pb-10 border-b border-border/5">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <Avatar className="h-24 w-24 border-4 border-muted shadow-xl">
              <AvatarImage src={session.user.image || ""} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary uppercase">
                {session.user.name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{session.user.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {session.user.email}
              </p>
              <div className="pt-2">
                <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-bold text-[10px] uppercase tracking-wider px-3">
                    Personal Account
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 mt-12 space-y-32">
          {/* Profile Section */}
          <section id="profile" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-12">
              <div className="grid lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-1">
                    <h3 className="text-xl font-bold mb-2 tracking-tight">Identity</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">How others see you across the platform.</p>
                  </div>
                  <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Display Name</label>
                      <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background focus:ring-primary/20 transition-all font-medium"
                      />
                    </div>
                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Email Address</label>
                      <Input 
                        value={session.user.email} 
                        disabled 
                        className="h-12 rounded-xl border-border bg-muted/40 text-muted-foreground cursor-not-allowed font-medium"
                      />
                      <p className="text-[11px] font-medium text-muted-foreground/60 ml-1 italic">Email can only be changed via identity provider.</p>
                    </div>

                    <div className="pt-2">
                      <Button 
                        onClick={handleUpdateProfile} 
                        disabled={isUpdatingProfile || name === session.user.name}
                        className="rounded-xl px-10 font-bold shadow-lg h-11"
                      >
                        {isUpdatingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section id="security" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-24 border-t border-border/5 pt-20">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <h3 className="text-xl font-bold mb-2 tracking-tight">Security</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Protect your account with a unique password and manage linked accounts.</p>
              </div>
              
              <div className="lg:col-span-2 space-y-10">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Current Password</label>
                    <Input 
                      type="password" 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">New Password</label>
                      <Input 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background transition-colors"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Confirm New</label>
                      <Input 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background transition-colors"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <Button 
                    onClick={handleUpdatePassword} 
                    disabled={isUpdatingPassword || !currentPassword || !newPassword}
                    className="rounded-xl px-10 font-bold shadow-lg h-11"
                  >
                    {isUpdatingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Update Password
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-12 border-t border-border/5 pt-20">
              <div className="lg:col-span-1">
                <h3 className="text-xl font-bold mb-2 tracking-tight">Connected</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Linked accounts for authentication.</p>
              </div>
              
              <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between py-4 border-b border-border/10 group">
                      <div className="flex items-center gap-4">
                          <Chrome className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          <div>
                              <p className="text-sm font-bold">Google Account</p>
                              <p className="text-[11px] text-muted-foreground">Primary login provider</p>
                          </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Connected</span>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-border/10 group opacity-60">
                      <div className="flex items-center gap-4">
                          <Github className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          <div>
                              <p className="text-sm font-bold">GitHub</p>
                              <p className="text-[11px] text-muted-foreground">Sync your repositories</p>
                          </div>
                      </div>
                      <Button variant="link" className="text-[11px] font-bold uppercase tracking-widest h-auto p-0 text-primary">Connect</Button>
                  </div>
              </div>
            </div>
          </section>

          {/* Sessions Section */}
          <section id="sessions" className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-t border-border/5 pt-20">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <h3 className="text-xl font-bold mb-2 tracking-tight">Active Devices</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Currently active logins for your account.</p>
              </div>
              
              <div className="lg:col-span-2 space-y-1">
                {isSessionsLoading ? (
                  <div className="py-10"><Loader2 className="w-6 h-6 animate-spin text-primary/40" /></div>
                ) : (
                  <div className="divide-y divide-border/10">
                    {sessions?.map((s) => (
                      <div key={s.token} className="flex items-center justify-between py-5 group">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted/30 text-muted-foreground group-hover:text-primary transition-colors">
                            {s.userAgent?.toLowerCase().includes("mobile") ? <Smartphone className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold truncate max-w-[200px]">{s.userAgent || "Unknown Device"}</span>
                              {s.token === session.session.token && (
                                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border-none">Active Now</Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium mt-1 uppercase tracking-tight truncate">
                              {s.ipAddress || "Unknown IP"} • {new Date(s.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {s.token !== session.session.token && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg h-9 w-9 p-0"
                            onClick={() => handleRevokeSession(s.token)}
                            disabled={revokingId === s.token}
                          >
                            {revokingId === s.token ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section id="danger-zone" className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-t border-border/10 pt-20">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <h3 className="text-xl font-bold text-destructive mb-2 tracking-tight uppercase tracking-widest">Danger Zone</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Wipe all your data from Vibe permanently.</p>
              </div>
              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 bg-destructive/5 border border-destructive/10 rounded-3xl">
                  <p className="text-sm text-destructive font-medium leading-relaxed">
                    Once you delete your account, there is no going back. All projects, credits, and history will be permanently wiped from our servers.
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="h-12 rounded-xl px-12 font-bold text-destructive hover:bg-destructive/10 border border-destructive/20 transition-all hover:scale-[1.02]"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Account Deletion Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-border bg-background/95 backdrop-blur-xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              Delete Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground pt-2">
              This action is <span className="text-destructive font-bold">permanent</span> and cannot be undone. All your workspaces and data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                Type <span className="text-foreground select-all">"delete my account"</span> to confirm
              </label>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="delete my account"
                className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background focus:ring-destructive/20 transition-all"
                autoFocus
              />
            </div>
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold text-xs uppercase tracking-wider border-border/50 h-11">
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== "delete my account" || isDeletingAccount}
              variant="destructive"
              className="rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-destructive/20 h-11 px-8"
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Confirm Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
