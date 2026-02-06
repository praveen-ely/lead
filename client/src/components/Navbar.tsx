import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Search,
  Bell,
  RefreshCw,
  LogOut,
  Settings,
  LayoutDashboard,
  Database,
  Users,
  UserCheck,
  FileText,
  TrendingUp,
} from "lucide-react";

type MenuItem = {
  id: string;
  label: string;
  icon: any;
  description: string;
  path: string;
};

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement | null>(null);

  const menuItems: MenuItem[] = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Overview & Analytics", path: "/" },
      { id: "leads", label: "Dynamic Leads", icon: Database, description: "Lead Generation & Management", path: "/leads" },
      { id: "users", label: "Users", icon: Users, description: "User Management", path: "/users" },
      { id: "preferences", label: "Preferences", icon: UserCheck, description: "User Settings & Filters", path: "/preferences" },
      { id: "settings", label: "Settings", icon: Settings, description: "System Configuration", path: "/settings" },
    ],
    []
  );

  const activePath = location.pathname === "/" ? "/" : location.pathname;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/users?search=${encodeURIComponent(q)}`);
    else navigate("/users");
  };

  // Close notifications when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!notificationsOpen) return;
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) setNotificationsOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [notificationsOpen]);

  // ESC closes drawer
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* ===== LEFT ICON RAIL (ALWAYS VISIBLE) ===== */}
      <div className="fixed left-0 top-0 z-50 h-full w-16 bg-slate-950/95 border-r border-slate-800 flex flex-col items-center py-4">
        {/* Toggle Drawer */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition mb-6"
          title="Open Navigation"
        >
          <Menu size={22} />
        </button>

        {/* Brand */}
        <div className="flex flex-col items-center mb-8 select-none">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div className="mt-2 text-center leading-tight">
            <div className="text-[10px] font-extrabold text-white">LeadGen</div>
            <div className="text-[10px] font-extrabold text-white">Pro</div>
          </div>
        </div>

        {/* Quick nav icons */}
        <div className="flex-1 flex flex-col items-center gap-3">
          {menuItems.map((item) => {
            const isActive = item.path === "/" ? activePath === "/" : activePath.startsWith(item.path);
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={[
                  "p-3 rounded-xl transition-all group",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "text-slate-300 hover:text-white hover:bg-slate-800",
                ].join(" ")}
                title={item.label}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>

        {/* Bottom icon (settings) */}
        <button
          onClick={() => navigate("/settings")}
          className="p-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* ===== TOP BAR (FIXED) ===== */}
      <nav className="fixed top-0 left-16 right-0 z-40 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">LeadGen Pro</h1>
                <p className="text-[11px] text-slate-400 truncate">Company Data Management</p>
              </div>
            </div>

            {/* Center - Search */}
            <div className="hidden md:flex flex-1 max-w-lg">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users, leads, data..."
                    className="w-full pl-10 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition"
                  />
                </div>
              </form>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => window.location.reload()}
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition active:scale-[0.98]"
              >
                <RefreshCw size={16} />
                <span className="text-sm">Refresh</span>
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen((s) => !s)}
                  className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-900">Notifications</h3>
                      <p className="text-xs text-slate-500">Latest system updates</p>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      <div className="p-4 hover:bg-slate-50 border-b border-slate-100">
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-blue-500 rounded-full mt-2" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">New lead received</p>
                            <p className="text-xs text-slate-500">2 minutes ago</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-slate-50">
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-green-500 rounded-full mt-2" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">Sync completed</p>
                            <p className="text-xs text-slate-500">1 hour ago</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 border-t border-slate-200 bg-slate-50">
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="w-full text-sm font-semibold text-slate-700 hover:text-slate-900"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings */}
              <button
                onClick={() => navigate("/settings")}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                aria-label="Settings"
              >
                <Settings size={20} />
              </button>

              {/* Profile */}
              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-700">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                  A
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-white">Admin User</div>
                  <div className="text-[11px] text-slate-400">admin@leadgen.com</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile search under topbar */}
          <div className="md:hidden pb-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                />
              </div>
            </form>
          </div>
        </div>
      </nav>

      {/* ===== SIDEBAR DRAWER (ONLY WHEN OPEN) ===== */}
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
            onClick={() => setSidebarOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 z-50 w-[320px] max-w-[85vw] bg-slate-950 border-r border-slate-800 shadow-2xl">
            {/* Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
               
                <div>
                  <div className="text-white font-semibold leading-tight">Navigation</div>
                  <div className="text-[11px] text-slate-400 leading-tight">Quick access</div>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu */}
            <div className="p-3 space-y-2 overflow-y-auto h-[calc(100%-64px-88px)]">
              {menuItems.map((item) => {
                const isActive = item.path === "/" ? activePath === "/" : activePath.startsWith(item.path);
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={[
                      "w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition",
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800",
                    ].join(" ")}
                  >
                    <div className={["w-10 h-10 rounded-xl flex items-center justify-center",
                      isActive ? "bg-white/15" : "bg-slate-900"
                    ].join(" ")}>
                      <Icon size={20} />
                    </div>

                    <div className="text-left min-w-0">
                      <div className="font-semibold truncate">{item.label}</div>
                      <div className={["text-xs truncate", isActive ? "text-blue-100" : "text-slate-400"].join(" ")}>
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800">
              <button
                onClick={() => navigate("/logout")}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-slate-200 hover:bg-slate-900 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                  <LogOut size={20} />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Logout</div>
                  <div className="text-xs text-slate-400">Sign out</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
