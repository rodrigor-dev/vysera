"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  LayoutDashboard,
  Video,
  Scissors,
  FolderOpen,
  Upload,
  Download,
  LayoutTemplate,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { VyseraLogo } from "@/components/shared/vysera-logo";
import { useTranslation } from "@/lib/i18n/use-translation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", labelKey: "sidebar.home", icon: LayoutDashboard },
  { href: "/dashboard/create", label: "Create Video", labelKey: "sidebar.create", icon: Video },
  { href: "/dashboard/edit", label: "Edit Video", icon: Scissors },
  { href: "/dashboard/library", label: "Library", labelKey: "sidebar.library", icon: FolderOpen },
  { href: "/dashboard/uploads", label: "Uploads", icon: Upload },
  { href: "/dashboard/exports", label: "Exports", labelKey: "sidebar.exports", icon: Download },
  { href: "/dashboard/templates", label: "Templates", labelKey: "sidebar.templates", icon: LayoutTemplate },
  { href: "/dashboard/settings", label: "Settings", labelKey: "sidebar.settings", icon: Settings },
];

const sidebarVariants = {
  open: { width: 256, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  closed: { width: 72, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isCollapsed = !sidebarOpen && !isMobile;

  const navLink = (item: (typeof navItems)[0]) => {
    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => isMobile && setSidebarOpen(false)}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
          "ease-[cubic-bezier(0.16,1,0.3,1)]",
          isActive
            ? "text-white"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {isActive && (
          <motion.div
            layoutId="active-nav"
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        {isActive && (
          <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
        )}
        <div
          className={cn(
            "relative z-10 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300",
            isActive
              ? "bg-primary/20 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
              : "text-muted-foreground group-hover:bg-accent/50 group-hover:text-foreground",
          )}
        >
          <item.icon className="h-4.5 w-4.5" />
        </div>
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 truncate"
            >
              {item.labelKey ? t(item.labelKey) : item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col glass-strong border-r border-border/50">
      <div
        className={cn(
          "flex h-16 items-center border-b border-border/50 px-4",
          isCollapsed ? "justify-center" : "justify-between",
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <VyseraLogo size="sm" showText={!isCollapsed} animated={false} />
        </Link>
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-none">
        <nav className="flex flex-col gap-1">{navItems.map(navLink)}</nav>
      </div>

      <div className="border-t border-border/50 p-3">
        <Link href="/dashboard/upgrade">
          <Button
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25",
              "hover:from-primary/90 hover:to-purple-500/90 hover:shadow-primary/30",
              "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              isCollapsed ? "h-9 w-9 p-0" : "",
            )}
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            {!isCollapsed && (
              <span className="text-xs font-semibold tracking-wide uppercase">
                Upgrade Pro
              </span>
            )}
          </Button>
        </Link>
      </div>

      <Separator className="mx-3 w-auto bg-border/50" />

      <div
        className={cn(
          "flex items-center gap-3 p-3",
          isCollapsed ? "justify-center" : "",
        )}
      >
        <Avatar className="h-9 w-9 shrink-0 ring-2 ring-border/50">
          {user?.user_metadata?.avatar_url ? (
            <AvatarImage src={user.user_metadata.avatar_url} alt="Avatar" />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary text-xs font-semibold">
              {user?.email?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          )}
        </Avatar>
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-w-0 flex-1"
            >
              <p className="truncate text-sm font-medium text-foreground">
                {user?.user_metadata?.name ?? user?.email ?? "User"}
              </p>
              <p className="truncate text-xs text-muted-foreground/60">
                {user?.email ?? ""}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64"
            >
              {sidebarContent}
            </motion.aside>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={isCollapsed ? "closed" : "open"}
      initial={sidebarOpen ? "open" : "closed"}
      className="fixed left-0 top-0 z-30 h-screen overflow-hidden"
    >
      {sidebarContent}
    </motion.aside>
  );
}
