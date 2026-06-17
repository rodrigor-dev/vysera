"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MoreHorizontal,
  Shield,
  UserX,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Users,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type UserRole = "user" | "pro" | "admin";
type UserStatus = "active" | "inactive";

interface UserRow {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  joined: string;
}

interface UsersTableProps {
  users?: UserRow[];
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

const mockUsers: UserRow[] = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", avatar: "", role: "admin", status: "active", joined: "Jan 15, 2024" },
  { id: "2", name: "Bob Smith", email: "bob@example.com", avatar: "", role: "pro", status: "active", joined: "Feb 3, 2024" },
  { id: "3", name: "Carol White", email: "carol@example.com", avatar: "", role: "user", status: "active", joined: "Mar 12, 2024" },
  { id: "4", name: "David Brown", email: "david@example.com", avatar: "", role: "user", status: "inactive", joined: "Apr 7, 2024" },
  { id: "5", name: "Eve Davis", email: "eve@example.com", avatar: "", role: "pro", status: "active", joined: "May 22, 2024" },
];

const roleBadgeStyle: Record<UserRole, string> = {
  user: "bg-muted text-muted-foreground border-border",
  pro: "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/20",
  admin: "bg-destructive/10 text-destructive border-destructive/20",
};

const roleColors: Record<UserRole, string> = {
  user: "text-muted-foreground",
  pro: "text-primary",
  admin: "text-destructive",
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export function UsersTable({
  users = mockUsers,
  isLoading,
  totalPages = 5,
  currentPage = 1,
  onPageChange,
}: UsersTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [suspendDialog, setSuspendDialog] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filterPills = [
    { label: "All", value: "all" },
    { label: "User", value: "user" },
    { label: "Pro", value: "pro" },
    { label: "Admin", value: "admin" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 flex-1 bg-white/5" />
          <Skeleton className="h-10 w-[200px] bg-white/5" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="premium-input w-full pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          {filterPills.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setRoleFilter(pill.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap",
                roleFilter === pill.value
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-muted text-muted-foreground border border-border hover:border-primary/20 hover:text-foreground",
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 premium-card"
          >
            <div className="rounded-full bg-muted p-4 mb-4">
              <UserCog className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No users found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filter criteria.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="premium-card overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    className="group border-b border-border/30 transition-all duration-200 hover:bg-primary/5"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 ring-1 ring-border">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                        roleBadgeStyle[user.role]
                      )}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "status-dot",
                          user.status === "active" ? "status-dot-active" : "status-dot-inactive"
                        )} />
                        <span className="text-sm capitalize text-muted-foreground">
                          {user.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                      {user.joined}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 glass-strong border-border/50">
                          <DropdownMenuLabel className="text-xs text-muted-foreground">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 cursor-pointer">
                            <Shield className="h-4 w-4" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSuspendDialog(user.id)}
                            className="gap-2 text-amber-500 cursor-pointer"
                          >
                            <UserX className="h-4 w-4" />
                            Suspend
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteDialog(user.id)}
                            className="gap-2 text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between border-t border-border/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {filtered.length} of {users.length} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange?.(currentPage - 1)}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === currentPage ? "default" : "ghost"}
                    size="icon"
                    onClick={() => onPageChange?.(p)}
                    className={cn(
                      "h-8 w-8 text-xs transition-all duration-200",
                      p === currentPage && "bg-primary/20 text-primary hover:bg-primary/30 glow-sm"
                    )}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => onPageChange?.(currentPage + 1)}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete User
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete this user? This action cannot be
              undone. All user data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialog(null)} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!suspendDialog} onOpenChange={() => setSuspendDialog(null)}>
        <DialogContent className="glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-amber-500" />
              Suspend User
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This will temporarily suspend the user account. They will not be
              able to access the platform until reinstated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuspendDialog(null)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => setSuspendDialog(null)} className="gap-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
              <UserX className="h-4 w-4" />
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
