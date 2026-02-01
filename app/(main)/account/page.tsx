"use client";

import React, { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
    const confirmed = window.confirm("Are you absolutely sure? This will permanently delete your account and all associated data.");
    if (!confirmed) return;

    await authClient.deleteUser({
        callbackURL: "/sign-in"
    }, {
      onSuccess: () => {
        toast.success("Account deleted");
        router.push("/sign-in");
      },
      onError: (ctx) => {
        toast.error(ctx.error.message || "Failed to delete account");
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
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-8 border-b border-border/10">
          <div className="flex flex-col md:flex-row md:items-top gap-6">
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

        <div className="max-w-4xl mx-auto px-4 mt-8">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="flex items-center gap-8 mb-12 bg-transparent border-b border-border/10 h-auto p-0 rounded-none w-full">
              <TabsTrigger 
                value="profile" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all"
              >
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="sessions" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all"
              >
                Sessions
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-12">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                      <h3 className="text-lg font-bold mb-1">Identity</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">How others see you across the platform.</p>
                    </div>
                    <div className="md:col-span-2 space-y-6 max-w-xl">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80 tracking-tight">Display Name</label>
                        <Input 
                          value={name} 
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your name"
                          className="h-12 rounded-xl border-border bg-muted/20 focus:bg-background focus:ring-primary/20 transition-all font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80 tracking-tight">Email Address</label>
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
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-16">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-bold mb-1">Password</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Protect your account with a unique password.</p>
                </div>
                
                <div className="md:col-span-2 space-y-6 max-w-xl">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/80">Current Password</label>
                      <Input 
                        type="password" 
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-12 rounded-xl border-border bg-muted/20"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80">New Password</label>
                        <Input 
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-12 rounded-xl border-border bg-muted/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/80">Confirm New</label>
                        <Input 
                          type="password" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-12 rounded-xl border-border bg-muted/20"
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

              <div className="grid md:grid-cols-3 gap-8 border-t border-border/10 pt-16">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-bold mb-1">Connected</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Linked accounts for authentication.</p>
                </div>
                
                <div className="md:col-span-2 space-y-2 max-w-xl">
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

              <div className="grid md:grid-cols-3 gap-8 border-t border-border/10 pt-16">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-bold text-destructive mb-1">Account Deletion</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Wipe all your data from Vibe permanently.</p>
                </div>
                <div className="md:col-span-2 space-y-6 max-w-xl">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Once you delete your account, there is no going back. All projects, credits, and history will be wiped.
                  </p>
                  <Button 
                    variant="ghost" 
                    onClick={handleDeleteAccount}
                    className="h-11 rounded-xl px-10 font-bold text-destructive hover:bg-destructive/10 border border-destructive/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-bold mb-1">Active Devices</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Currently active logins for your account.</p>
                </div>
                
                <div className="md:col-span-2 space-y-1 max-w-xl">
                  {isSessionsLoading ? (
                    <div className="py-10"><Loader2 className="w-6 h-6 animate-spin text-primary/40" /></div>
                  ) : (
                    <div className="divide-y divide-border/10">
                      {sessions?.map((s) => (
                        <div key={s.token} className="flex items-center justify-between py-5 group">
                          <div className="flex items-center gap-5">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-muted/30 text-muted-foreground group-hover:text-primary transition-colors">
                              {s.userAgent?.toLowerCase().includes("mobile") ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold">{s.userAgent || "Unknown Device"}</span>
                                {s.token === session.session.token && (
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">Active Now</span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground font-medium mt-1 uppercase tracking-tight">{s.ipAddress || "Unknown IP"} • {new Date(s.createdAt).toLocaleDateString()}</p>
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
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
