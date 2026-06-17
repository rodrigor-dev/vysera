"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  DollarSign,
  FileText,
  AlertTriangle,
  Shield,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  ReceiptText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VyseraLogo } from "@/components/shared/vysera-logo";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Financial", href: "/admin/financial", icon: DollarSign },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: ReceiptText },
  { name: "Logs", href: "/admin/logs", icon: FileText },
  { name: "Errors", href: "/admin/errors", icon: AlertTriangle },
  { name: "Admin Logs", href: "/admin/admin-logs", icon: Shield },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 px-4 relative">
        <VyseraLogo size="sm" variant="icon" />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-3 overflow-hidden"
            >
              <VyseraLogo size="sm" showText={false} />
              <span className="gradient-text text-lg font-bold tracking-tight">Admin</span>
              <span className="badge-premium">v1.0</span>
            </motion.div>
          )}
        </AnimatePresence>
        {mobileOpen && (
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="ml-auto md:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="premium-divider mx-4" />

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-none">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
                  "hover:bg-primary/5",
                  isActive
                    ? "bg-gradient-to-r from-primary/15 to-transparent text-primary glow-sm border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground border-l-2 border-transparent",
                )}
                style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
              >
                <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-300", isActive && "scale-110")} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="premium-divider mx-4" />

      <div className="p-3">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground hover:bg-primary/5",
            collapsed && "justify-center",
          )}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <ArrowLeft className="h-5 w-5 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Return to Dashboard
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col glass-strong transition-all duration-300 md:flex",
          collapsed ? "w-[72px]" : "w-64",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {sidebarContent}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border/50 bg-background shadow-md hover:bg-accent hover:border-primary/30 transition-all duration-300"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-64 glass-strong"
            >
              {sidebarContent}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-30 md:hidden glass-strong rounded-lg"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </>
  );
}
