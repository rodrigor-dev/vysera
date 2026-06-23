"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Upload,
  ExternalLink,
  LogOut,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Crown,
  Zap,
  ArrowRight,
  Clock,
  FileText,
  Check,
} from "lucide-react";
import Link from "next/link";

const tabItems = [
  { value: "profile", label: "Profile", icon: User },
  { value: "account", label: "Account", icon: Shield },
  { value: "preferences", label: "Preferences", icon: Bell },
  { value: "billing", label: "Billing", icon: CreditCard },
];

interface SubscriptionInfo {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd?: string;
  provider?: string;
}

interface InvoiceInfo {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { t, locale, changeLocale } = useTranslation();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [activeSub, setActiveSub] = useState<SubscriptionInfo | null>(null);
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [subLoading, setSubLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const role = user?.role || "user";
  const isPro = role === "pro" || role === "admin";

  useEffect(() => {
    if (activeTab !== "billing") return;
    setSubLoading(true);
    Promise.all([
      fetch("/api/subscriptions/active", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/subscriptions/invoices", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([subData, invData]) => {
        setActiveSub(subData.subscription || null);
        setInvoices(invData.invoices || []);
      })
      .catch(() => {})
      .finally(() => setSubLoading(false));
  }, [activeTab]);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/payments/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // ignore
    }
    setPortalLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) { toast.error("Not authenticated"); return; }
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save profile");
      useAuthStore.getState().setUser({ ...user, name, email } as any);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to change password");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    try {
      const res = await fetch("/api/user/account", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete account");
      await logout();
      window.location.href = "/";
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out");
      window.location.href = "/login";
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="gradient-text text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground/60">
          Manage your account settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="premium-card p-1 inline-flex">
          <TabsList className="bg-transparent gap-1">
            {tabItems.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                  "data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_12px_hsl(var(--primary)/0.1)]",
                  "data-[state=inactive]:text-muted-foreground/70 data-[state=inactive]:hover:text-foreground",
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="profile">
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 max-w-2xl"
          >
            <div className="premium-card p-6">
              <div className="mb-6 space-y-1">
                <h3 className="text-lg font-semibold">Profile</h3>
                <p className="text-sm text-muted-foreground/60">
                  Manage your public profile information
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-border/50">
                    {user?.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt="Avatar" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary text-lg font-semibold">
                        {user?.email?.charAt(0).toUpperCase() ?? "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm" className="gap-2 border-border/50">
                      <Upload className="h-4 w-4" />
                      Change Avatar
                    </Button>
                    <p className="mt-1 text-xs text-muted-foreground/50">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                    <input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="premium-input h-10 w-full px-3 text-sm text-foreground placeholder:text-muted-foreground/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="premium-input h-10 w-full px-3 text-sm text-foreground placeholder:text-muted-foreground/40"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  className="gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="account">
          <motion.div
            key="account"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 max-w-2xl"
          >
            <div className="premium-card p-6">
              <div className="mb-6 space-y-1">
                <h3 className="text-lg font-semibold">Password</h3>
                <p className="text-sm text-muted-foreground/60">Change your password</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-sm font-medium">Current Password</Label>
                  <div className="relative">
                    <input
                      id="current-password"
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="premium-input h-10 w-full px-3 pr-10 text-sm text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="premium-input h-10 w-full px-3 text-sm text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="premium-input h-10 w-full px-3 text-sm text-foreground"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>8+ characters</span>
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 ml-2" />
                  <span>1 uppercase</span>
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 ml-2" />
                  <span>1 number</span>
                </div>
                <Button
                  onClick={handlePasswordChange}
                  className="gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25"
                >
                  <Shield className="h-4 w-4" />
                  Update Password
                </Button>
              </div>
            </div>

            <div className="premium-card p-6 border-destructive/20">
              <div className="mb-6 space-y-1">
                <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground/60">Irreversible account actions</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-4">
                  <div>
                    <p className="text-sm font-medium">Sign Out</p>
                    <p className="text-xs text-muted-foreground/60">Sign out of your account on this device</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-border/50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  <div>
                    <p className="text-sm font-medium text-destructive">Delete Account</p>
                    <p className="text-xs text-muted-foreground/60">Permanently delete your account and all data</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={handleDeleteAccount}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="preferences">
          <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <div className="premium-card p-6">
              <div className="mb-6 space-y-1">
                <h3 className="text-lg font-semibold">Preferences</h3>
                <p className="text-sm text-muted-foreground/60">Customize your experience</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-4">
                  <div>
                    <p className="text-sm font-medium">Theme</p>
                    <p className="text-xs text-muted-foreground/60">Choose your preferred theme</p>
                  </div>
                  <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}>
                    <SelectTrigger className="w-32 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-border/50">
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-4">
                  <div>
                    <p className="text-sm font-medium">{t("settings.language")}</p>
                    <p className="text-xs text-muted-foreground/60">{t("settings.language.desc")}</p>
                  </div>
                  <Select value={locale} onValueChange={(v) => changeLocale(v as "en" | "pt")}>
                    <SelectTrigger className="w-32 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-border/50">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="bg-border/50" />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground/70 uppercase tracking-wider">Notifications</h4>
                  <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-4">
                    <div>
                      <p className="text-sm font-medium">Email Notifications</p>
                      <p className="text-xs text-muted-foreground/60">Receive emails about project updates</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-4">
                    <div>
                      <p className="text-sm font-medium">Export Completed</p>
                      <p className="text-xs text-muted-foreground/60">Notify when exports are ready</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-4">
                    <div>
                      <p className="text-sm font-medium">Marketing</p>
                      <p className="text-xs text-muted-foreground/60">Receive tips and product updates</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="billing">
          <motion.div
            key="billing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 max-w-2xl"
          >
            <div className="premium-card p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Current Plan</h3>
                  <p className="text-sm text-muted-foreground/60">
                    {isPro ? "You have full access to premium features" : "You are on the Free plan"}
                  </p>
                </div>
                {isPro && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-border/50"
                    onClick={handlePortal}
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    Manage
                  </Button>
                )}
              </div>

              {subLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
                </div>
              ) : (
                <div className={cn(
                  "flex items-center justify-between rounded-xl border p-4",
                  isPro
                    ? "border-primary/30 bg-gradient-to-r from-primary/5 to-purple-500/5"
                    : "border-border/50 bg-background/50",
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      isPro ? "bg-primary/20" : "bg-muted/30",
                    )}>
                      {isPro ? (
                        <Zap className="h-5 w-5 text-primary" />
                      ) : (
                        <Shield className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>
                    <div>
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        isPro
                          ? "bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary"
                          : "bg-muted/30 text-muted-foreground/60",
                      )}>
                        {isPro ? (
                          <><Zap className="h-3 w-3" />Pro Plan</>
                        ) : (
                          <><Shield className="h-3 w-3" />Free Plan</>
                        )}
                      </span>
                      {activeSub?.currentPeriodEnd && (
                        <p className="mt-1 text-xs text-muted-foreground/50">
                          Renews {new Date(activeSub.currentPeriodEnd).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {!isPro && (
                    <Button asChild className="gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25 shrink-0">
                      <Link href="/dashboard/upgrade">
                        <ArrowRight className="h-4 w-4" />
                        Upgrade
                      </Link>
                    </Button>
                  )}
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: "Projects", free: "3 max", pro: "Unlimited" },
                  { label: "Export Quality", free: "720p", pro: "4K" },
                  { label: "Watermark", free: "Yes", pro: "No" },
                  { label: "AI Voiceover", free: "No", pro: "Yes" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center justify-between rounded-lg border border-border/20 bg-white/[0.02] px-3 py-2">
                    <span className="text-xs text-muted-foreground/60">{f.label}</span>
                    <span className={cn(
                      "text-xs font-medium",
                      isPro ? "text-emerald-400" : "text-muted-foreground/50",
                    )}>
                      {isPro ? f.pro : f.free}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-card p-6">
              <div className="mb-6 space-y-1">
                <h3 className="text-lg font-semibold">Payment History</h3>
                <p className="text-sm text-muted-foreground/60">Your recent transactions</p>
              </div>
              {invoices.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border/50">
                  <div className="text-center">
                    <CreditCard className="mx-auto h-6 w-6 text-muted-foreground/30" />
                    <p className="mt-2 text-sm text-muted-foreground/50">No payment history yet</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between rounded-xl border border-border/20 bg-white/[0.02] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                          <Check className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{inv.description || "Payment"}</p>
                          <p className="text-xs text-muted-foreground/50">
                            {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "Unknown date"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: (inv.currency ?? "USD").toUpperCase(),
                          }).format(inv.amount / 100)}
                        </p>
                        <span className="text-[10px] text-emerald-400/70 capitalize">{inv.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
