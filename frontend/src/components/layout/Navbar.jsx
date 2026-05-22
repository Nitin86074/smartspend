import { Menu, Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const pageMeta = {
  "/dashboard": {
    title: "Dashboard",
    description: "Your financial command center.",
  },
  "/about": {
    title: "About Project",
    description: "Explain SmartSpend like a portfolio product.",
  },
  "/expenses": {
    title: "Expenses",
    description: "Track, filter, and manage spending.",
  },
  "/income": {
    title: "Income",
    description: "Monitor every earning source.",
  },
  "/budget": {
    title: "Budget",
    description: "Stay ahead of monthly limits.",
  },
  "/analytics": {
    title: "Analytics",
    description: "Turn transactions into visual trends.",
  },
  "/insights": {
    title: "Insights",
    description: "Smart signals for better money choices.",
  },
  "/recurring": {
    title: "Recurring Expenses",
    description: "Manage subscriptions and repeated bills.",
  },
  "/reports/monthly": {
    title: "Monthly Report",
    description: "Screenshot-ready financial summary.",
  },
  "/export": {
    title: "Export Center",
    description: "Download PDF and CSV finance reports.",
  },
  "/settings": {
    title: "Settings",
    description: "Manage preferences and profile details.",
  },
};

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const Navbar = ({ onMenuClick, searchTerm = "", onSearchChange = () => {} }) => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const meta = pageMeta[pathname] || {
    title: "SmartSpend",
    description: "Manage your money with clarity.",
  };

  return (
    <header className="flex h-[72px] flex-shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#08101f]/95 px-3 text-white shadow-sm shadow-black/20 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-white sm:text-xl">
            {meta.title}
          </h2>
          <p className="hidden truncate text-sm text-slate-300 sm:block">
            {meta.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden w-72 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white backdrop-blur-sm md:flex">
          <Search className="h-4 w-4 flex-shrink-0 text-slate-300" />
          <input
            type="text"
            placeholder="Search your finances..."
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="hidden min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-sm backdrop-blur-sm sm:flex">
          <div className="hidden min-w-0 pl-2 text-right sm:block">
            <p className="max-w-36 truncate text-sm font-semibold text-white">
              {user?.name || "User"}
            </p>
            <p className="max-w-36 truncate text-xs text-slate-300">
              {user?.email || "Signed in"}
            </p>
          </div>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7C3AED_0%,#4F46E5_100%)] text-white">
            <span className="text-xs font-bold">{getInitials(user?.name)}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
