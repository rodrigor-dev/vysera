"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  DollarSign,
  TrendingUp,
  ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaymentStatus = "succeeded" | "pending" | "failed" | "refunded";

interface Payment {
  id: string;
  user: string;
  email: string;
  amount: number;
  plan: string;
  status: PaymentStatus;
  date: string;
  invoice: string;
}

const mockPayments: Payment[] = [
  { id: "1", user: "Alice Johnson", email: "alice@example.com", amount: 29.99, plan: "Pro Monthly", status: "succeeded", date: "2024-06-15", invoice: "INV-001" },
  { id: "2", user: "Bob Smith", email: "bob@example.com", amount: 299.99, plan: "Pro Yearly", status: "succeeded", date: "2024-06-14", invoice: "INV-002" },
  { id: "3", user: "Carol White", email: "carol@example.com", amount: 29.99, plan: "Pro Monthly", status: "pending", date: "2024-06-13", invoice: "INV-003" },
  { id: "4", user: "David Brown", email: "david@example.com", amount: 29.99, plan: "Pro Monthly", status: "failed", date: "2024-06-12", invoice: "INV-004" },
  { id: "5", user: "Eve Davis", email: "eve@example.com", amount: 299.99, plan: "Pro Yearly", status: "refunded", date: "2024-06-11", invoice: "INV-005" },
];

const statusStyles: Record<PaymentStatus, string> = {
  succeeded: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  refunded: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const statusDots: Record<PaymentStatus, string> = {
  succeeded: "status-dot-active",
  pending: "bg-amber-500",
  failed: "bg-red-500",
  refunded: "bg-blue-500",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

const summaryCards = [
  { label: "Total Revenue", value: "$689.96", trend: "+23.1%", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { label: "Monthly Revenue", value: "$389.96", trend: "Last 30 days", icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
  { label: "Transactions", value: "5", trend: "All time", icon: ReceiptText, color: "text-purple-400", bg: "bg-purple-500/10" },
];

export default function AdminPayments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = mockPayments.filter((p) => {
    const matchesSearch =
      p.user.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.invoice.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="gradient-text text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">View payment history and transactions</p>
        </div>
        <Button variant="ghost" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid gap-4 sm:grid-cols-3"
      >
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="premium-card p-4 flex items-center gap-4">
              <div className={`rounded-xl p-3 ${card.bg} ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.trend}</p>
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
        <div className="premium-card overflow-hidden">
          <div className="flex flex-col gap-3 p-4 border-b border-border/30 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search payments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="premium-input w-full pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px] premium-input">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-border/50">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4 mb-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No payments found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Plan</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((payment, index) => (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="group border-b border-border/20 transition-all duration-200 hover:bg-primary/5"
                    >
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{payment.user}</p>
                          <p className="text-xs text-muted-foreground">{payment.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{payment.plan}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[payment.status]}`}>
                          <span className={`status-dot ${statusDots[payment.status]}`} />
                          {payment.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{payment.date}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground hidden lg:table-cell">{payment.invoice}</TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between border-t border-border/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Showing {filtered.length} of {mockPayments.length} payments
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">Page {page} of 1</span>
                  <Button variant="ghost" size="icon" disabled={page >= 1} onClick={() => setPage(page + 1)} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
