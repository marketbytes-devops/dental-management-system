"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import {
  BarChart3,
  Receipt,
  CreditCard,
  Shield,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Undo2,
  AlertCircle,
  Banknote,
  FileText,
  Search,
  Settings
} from "lucide-react";
import ToothIcon from "@/components/ui/ToothIcon";

const navItems = [
  { name: "Dashboard", href: "/frontdesk/accountant/dashboard", icon: BarChart3 },
  { name: "Invoices", href: "/frontdesk/accountant/invoices", icon: Receipt },
  { name: "Payments", href: "/frontdesk/accountant/payments", icon: CreditCard },
  { name: "Insurance Claims", href: "/frontdesk/accountant/claims", icon: Shield },
  { name: "Claim Verification", href: "/frontdesk/accountant/claim-verification", icon: ShieldCheck },
  { name: "Revenue", href: "/frontdesk/accountant/revenue", icon: TrendingUp },
  { name: "Expenses", href: "/frontdesk/accountant/expenses", icon: TrendingDown },
  { name: "Refunds", href: "/frontdesk/accountant/refunds", icon: Undo2 },
  { name: "Outstanding Dues", href: "/frontdesk/accountant/dues", icon: AlertCircle },
  { name: "Payroll", href: "/frontdesk/accountant/payroll", icon: Banknote },
  { name: "Reports", href: "/frontdesk/accountant/reports", icon: FileText },
  { name: "Audit Logs", href: "/frontdesk/accountant/audit", icon: Search },
  { name: "Settings", href: "/frontdesk/accountant/settings", icon: Settings },
];

function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <li key={item.name}>
            <Link
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-semibold rounded-lg transition-colors group cursor-pointer outline-none ${
                isActive
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-gray-700 hover:bg-primary/5 hover:text-primary"
              }`}
            >
              <span className="mr-3 opacity-70 group-hover:opacity-100 text-gray-500 group-hover:text-primary transition-colors flex items-center">
                <item.icon className="w-5 h-5" />
              </span>
              {item.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function AccountantSidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
        <span className="text-xl font-bold text-primary flex items-center gap-2">
          <ToothIcon className="w-6 h-6 text-primary" strokeWidth={2.5} /> SmileCare
        </span>
        <span className="ml-2 text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase tracking-wider">
          Finance
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
            Finance Module
          </p>
          <Suspense fallback={<div className="px-3 py-2 text-sm text-gray-400 animate-pulse">Loading...</div>}>
            <NavLinks />
          </Suspense>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            A
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-gray-900 truncate">Accountant</span>
            <span className="text-[10px] text-gray-500 font-semibold truncate">Finance Dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
}
