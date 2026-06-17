"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  ArrowLeft,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminHeaderProps {
  title: string;
  description?: string;
}

function getInitials(name: string | null | undefined) {
  if (!name) return "A";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function AdminHeader({ title, description }: AdminHeaderProps) {
  const { user, logout } = useAuthStore();
  const userName = user?.user_metadata?.name || user?.email || "Admin";
  const userEmail = user?.email || "admin@vysera.com";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 px-6 glass"
    >
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground hidden sm:block">{description}</p>
          )}
        </div>
        <span className="badge-premium hidden sm:inline-flex items-center gap-1">
          <Shield className="h-2.5 w-2.5" />
          Admin
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2 text-muted-foreground hover:text-foreground transition-all duration-300"
        >
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Return to App</span>
          </Link>
        </Button>

        <div className="premium-divider w-px h-6 mx-1 hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 rounded-full px-2 hover:bg-primary/5 transition-all duration-300"
            >
              <Avatar className="h-7 w-7 ring-1 ring-border">
                <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={userName} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                {userName}
              </span>
              <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-strong border-border/50">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{userName}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {userEmail}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive cursor-pointer"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}
