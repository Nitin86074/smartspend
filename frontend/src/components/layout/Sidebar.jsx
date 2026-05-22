import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  ChevronRight,
  Download,
  FileText,
  Info,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  PiggyBank,
  Receipt,
  Repeat,
  Settings,
  Wallet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navLinks = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/expenses", label: "Expenses", icon: Receipt },
  { path: "/income", label: "Income", icon: Wallet },
  { path: "/budget", label: "Budget", icon: PiggyBank },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/insights", label: "Insights", icon: Lightbulb },
  { path: "/recurring", label: "Recurring", icon: Repeat },
  { path: "/reports/monthly", label: "Monthly Report", icon: FileText },
  { path: "/export", label: "Export Center", icon: Download },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/about", label: "About Project", icon: Info },
];

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const LogoHeader = ({ onClose, showClose = false }) => (
  <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7C3AED_0%,#4F46E5_100%)] text-white shadow-[0_0_20px_rgba(124,58,237,0.35)]">
        <span className="text-lg font-bold">S</span>
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold leading-none text-white">
          SmartSpend
        </h1>
        <p className="mt-1 truncate text-xs font-medium text-slate-300">
          AI finance manager
        </p>
      </div>
    </div>

    {showClose && (
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
        aria-label="Close sidebar"
      >
        <X className="h-5 w-5" />
      </button>
    )}
  </div>
);

const NavItems = ({ onClose }) => (
  <nav className="flex-1 space-y-1 overflow-y-auto p-3">
    {navLinks.map((link) => {
      const Icon = link.icon;

      return (
        <NavLink
          key={link.path}
          to={link.path}
          onClick={onClose}
          className={({ isActive }) =>
            `group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 backdrop-blur-sm ${
              isActive
                ? "bg-indigo-50/80 text-indigo-700 shadow-sm border border-indigo-200/50"
                : "text-slate-500 hover:bg-white/60 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-gray-800/60 dark:hover:text-white"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className="flex min-w-0 items-center gap-3">
                <Icon
                  className={`h-5 w-5 flex-shrink-0 ${
                    isActive
                      ? "text-indigo-600"
                      : "text-slate-400 group-hover:text-slate-700"
                  }`}
                />
                <span className="truncate">{link.label}</span>
              </span>
              {isActive && <ChevronRight className="h-4 w-4 text-indigo-600" />}
            </>
          )}
        </NavLink>
      );
    })}
  </nav>
);

const UserFooter = ({ user, onLogout }) => (
  <div className="border-t border-white/10 p-4">
    <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7C3AED_0%,#4F46E5_100%)] text-white">
        <span className="text-xs font-bold">{getInitials(user?.name)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {user?.name || "SmartSpend user"}
        </p>
        <p className="truncate text-xs text-slate-300">
          {user?.email || "Signed in"}
        </p>
      </div>
    </div>

    <button
      type="button"
      onClick={onLogout}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-[#EF4444] transition hover:bg-[#EF4444]/10"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  </div>
);

const SidebarPanel = ({ onClose, showClose = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  return (
    <div className="flex h-full flex-col bg-[#08101f] text-white">
      <LogoHeader onClose={onClose} showClose={showClose} />
      <NavItems onClose={onClose} />
      <UserFooter user={user} onLogout={handleLogout} />
    </div>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      <aside className="hidden h-screen w-[260px] flex-shrink-0 border-r border-white/20 bg-white/80 backdrop-blur-xl lg:block dark:border-white/10 dark:bg-gray-900/80">
        <SidebarPanel />
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
            />

            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-50 w-80 max-w-[86vw] border-r border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl dark:border-white/10 dark:bg-gray-900/80 lg:hidden"
            >
              <SidebarPanel onClose={onClose} showClose />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
