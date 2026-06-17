"use client";

import Link from "next/link";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { name: "User Management", href: "/admin/users", icon: "👥" },
  { name: "Role Permissions", href: "/admin/roles", icon: "🔑" },
  { name: "System Logs", href: "/admin/logs", icon: "📝" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState({});

  useEffect(() => {
    if (pathname) {
      navItems.forEach((item) => {
        if (item.subItems) {
          const hasActiveSub = item.subItems.some((sub) => pathname === sub.href);
          if (hasActiveSub) {
            setOpenDropdowns((prev) => ({ ...prev, [item.name]: true }));
          }
        }
      });
    }
  }, [pathname]);

  const toggleDropdown = (name) => {
    setOpenDropdowns((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <span className="text-xl font-bold text-primary flex items-center gap-2">
          <ToothIcon className="w-6 h-6 text-primary" strokeWidth={2.5} /> SmileCare
        </span>
        <span className="ml-2 text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase tracking-wider">
          Admin
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Administration</p>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors group"
                >
                  <span className="mr-3 text-lg opacity-70 group-hover:opacity-100">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">Admin User</span>
            <span className="text-xs text-gray-500">Superadmin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
