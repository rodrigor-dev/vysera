"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, UserPlus, Crown, Activity } from "lucide-react";
import { UsersTable } from "@/components/admin/users-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statsSummary = [
  { label: "Total Users", value: "12,543", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
  { label: "Active Users", value: "10,234", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { label: "Pro Users", value: "2,847", icon: Crown, color: "text-purple-400", bg: "bg-purple-500/10" },
];

export default function AdminUsers() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="gradient-text text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage platform users</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 transition-all duration-300">
              <UserPlus className="h-4 w-4" />
              Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong border-border/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Create Admin User
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a new administrator account with full platform access.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-muted-foreground">Full Name</Label>
                <Input id="name" placeholder="John Doe" className="premium-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                <Input id="email" type="email" placeholder="admin@vysera.com" className="premium-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" className="premium-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm text-muted-foreground">Role</Label>
                <Select defaultValue="admin">
                  <SelectTrigger className="premium-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-border/50">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setCreateOpen(false)} className="gap-2">
                <Shield className="h-4 w-4" />
                Create Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid gap-4 sm:grid-cols-3"
      >
        {statsSummary.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="premium-card p-4 flex items-center gap-4">
              <div className={`rounded-xl p-3 ${stat.bg} ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <UsersTable />
      </motion.div>
    </div>
  );
}
