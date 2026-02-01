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
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
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
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Lock className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="sessions" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Sessions
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-2xl overflow-hidden border border-border/40">
                <div className="bg-muted/30 p-6 border-b border-border/40">
                  <h3 className="text-lg font-semibold">Profile Information</h3>
                  <p className="text-sm text-muted-foreground">Update your account details and how others see you.</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Display Name</label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="h-11 rounded-xl border-border/60 bg-background focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Email Address</label>
                    <Input 
                      value={session.user.email} 
                      disabled 
                      className="h-11 rounded-xl border-border/60 bg-muted/50 text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-[11px] text-muted-foreground ml-1">Email changes are currently disabled for security.</p>
                  </div>
                </div>
                <div className="bg-muted/10 border-t border-border/10 p-6">
                  <Button 
                    onClick={handleUpdateProfile} 
                    disabled={isUpdatingProfile || name === session.user.name}
                    className="rounded-xl px-6 font-semibold shadow-lg"
                  >
                    {isUpdatingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              <div className="rounded-2xl overflow-hidden border border-border/40">
                <div className="bg-muted/30 p-6 border-b border-border/40">
                  <h3 className="text-lg font-semibold">Change Password</h3>
                  <p className="text-sm text-muted-foreground">Secure your account with a strong password.</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-1">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/80">Current Password</label>
                      <Input 
                        type="password" 
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-11 rounded-xl border-border/60 bg-background"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/80">New Password</label>
                        <Input 
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-11 rounded-xl border-border/60 bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/80">Confirm New Password</label>
                        <Input 
                          type="password" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-11 rounded-xl border-border/60 bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/10 border-t border-border/10 p-6">
                  <Button 
                    onClick={handleUpdatePassword} 
                    disabled={isUpdatingPassword || !currentPassword || !newPassword}
                    className="rounded-xl px-6 font-semibold shadow-lg"
                  >
                    {isUpdatingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Update Password
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-border/40">
                <div className="bg-muted/30 p-6 border-b border-border/40">
                  <h3 className="text-lg font-semibold">Connected Accounts</h3>
                  <p className="text-sm text-muted-foreground">Manage your linked social accounts for faster login.</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-muted/10 group">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full bg-background border border-border/40 flex items-center justify-center text-foreground">
                        <Chrome className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Google Account</p>
                        <p className="text-xs text-muted-foreground">Used for authentication and profile sync.</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold uppercase text-[10px] px-2">Connected</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-muted/10 group opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full bg-background border border-border/40 flex items-center justify-center text-foreground">
                        <Github className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">GitHub</p>
                        <p className="text-xs text-muted-foreground">Connect for easier project imports.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-lg h-8 text-[11px] font-bold">Connect</Button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-destructive/20 bg-destructive/5">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </h3>
                  <p className="text-sm text-muted-foreground">Permanently remove your account and all projects from Vibe.</p>
                </div>
                <div className="px-6 pb-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Once deleted, there is no going back. All your projects, credits, and history will be lost forever.
                  </p>
                </div>
                <div className="px-6 pb-6">
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    className="rounded-xl px-6 font-bold shadow-lg shadow-destructive/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-2xl overflow-hidden border border-border/40">
                <div className="bg-muted/30 p-6 border-b border-border/40">
                  <h3 className="text-lg font-semibold">Active Sessions</h3>
                  <p className="text-sm text-muted-foreground">Manage the devices where you are currently logged in.</p>
                </div>
                <div className="p-6">
                  {isSessionsLoading ? (
                    <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary/40" /></div>
                  ) : (
                    <div className="space-y-4">
                      {sessions?.map((s) => (
                        <div key={s.token} className="flex items-center justify-between p-4 rounded-2xl border border-border/40 bg-muted/20 group hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-background border border-border/40 text-muted-foreground group-hover:text-primary transition-colors">
                              {s.userAgent?.toLowerCase().includes("mobile") ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{s.userAgent || "Unknown Device"}</span>
                                {s.token === session.session.token && (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[10px] uppercase font-bold px-2">Current</Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{s.ipAddress || "Unknown IP"} • {new Date(s.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {s.token !== session.session.token && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
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
