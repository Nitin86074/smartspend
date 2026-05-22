import {
  BarChart3,
  LayoutDashboard,
  LineChart,
  PiggyBank,
  Receipt,
  Settings,
  Wallet,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { path: "/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/expenses", label: "Spend", icon: Receipt },
  { path: "/income", label: "Income", icon: Wallet },
  { path: "/budget", label: "Budget", icon: PiggyBank },
  { path: "/analytics", label: "Charts", icon: BarChart3 },
  { path: "/growth-analytics", label: "Growth", icon: LineChart },
  { path: "/settings", label: "More", icon: Settings },
];

const MobileBottomNav = () => {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 shadow-2xl shadow-slate-300/40 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-7 gap-1">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[0.68rem] font-semibold transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{link.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
