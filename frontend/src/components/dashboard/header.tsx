"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import {
  Menu,
  Search,
  Bell,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PageTitleEntry = { key: string } | { literal: string };

const pageTitleMap: Record<string, PageTitleEntry> = {
  "/dashboard": { key: "sidebar.home" },
  "/dashboard/create": { key: "sidebar.create" },
  "/dashboard/edit": { literal: "Edit Video" },
  "/dashboard/library": { key: "sidebar.library_title" },
  "/dashboard/uploads": { literal: "Uploads" },
  "/dashboard/exports": { key: "sidebar.exports" },
  "/dashboard/templates": { key: "sidebar.templates" },
  "/dashboard/settings": { key: "sidebar.settings" },
  "/dashboard/upgrade": { key: "sidebar.upgrade_title" },
};

export function Header() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSidebar, theme, setTheme } = useUIStore();
  const { user, logout: authLogout } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [notifications] = useState(3);

  const pageTitleEntry = Object.entries(pageTitleMap).find(([key]) =>
    pathname.startsWith(key),
  )?.[1];
  const pageTitle = pageTitleEntry
    ? "key" in pageTitleEntry
      ? t(pageTitleEntry.key)
      : pageTitleEntry.literal
    : t("sidebar.home");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authLogout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      toast.error("Failed to log out");
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center justify-between",
        "glass border-b border-border/50 px-4 lg:px-6",
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div ref={searchRef} className="relative">
          <AnimatePresence mode="wait">
            {searchOpen ? (
              <motion.div
                key="search-expanded"
                initial={{ width: 40, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 40, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="premium-input h-9 w-full pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50"
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="search-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchOpen(true)}
                  className="hidden h-9 gap-2 rounded-xl border border-border/50 bg-background/50 px-3 sm:flex hover:bg-accent/50 hover:border-border"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Search...</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded-md border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70">
                    <Command className="h-2.5 w-2.5" />
                    K
                  </kbd>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground sm:hidden"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          {theme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          {notifications > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground shadow-lg shadow-destructive/25">
              {notifications}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="ml-1 flex items-center gap-2 rounded-xl px-2 hover:bg-accent/50"
            >
              <Avatar className="h-8 w-8 ring-2 ring-border/50">
                {user?.user_metadata?.avatar_url ? (
                  <AvatarImage
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                  />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary text-xs font-semibold">
                    {user?.email?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground/60 sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 glass-strong border-border/50"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {user?.user_metadata?.name ?? "User"}
                </span>
                <span className="text-xs font-normal text-muted-foreground/60">
                  {user?.email ?? ""}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings")}
              className="gap-2"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings")}
              className="gap-2"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
