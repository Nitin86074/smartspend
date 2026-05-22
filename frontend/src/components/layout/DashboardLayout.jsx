import { cloneElement, isValidElement, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import PageTransition from "../ui/PageTransition";
import MobileBottomNav from "./MobileBottomNav";
import BudgetWarningPopup from "./BudgetWarningPopup";

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const enhancedChildren = isValidElement(children)
    ? cloneElement(children, {
        searchTerm,
        onSearchChange: setSearchTerm,
      })
    : children;

  return (
    <div className="dark flex h-dvh overflow-hidden bg-[#0d1117] text-white font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-[#0d1117]">
          <div className="mx-auto w-full px-3 pb-28 pt-4 sm:px-6 lg:px-8 lg:py-7">
            <PageTransition>{enhancedChildren}</PageTransition>
          </div>
        </main>
        <MobileBottomNav />
        <BudgetWarningPopup />
      </div>
    </div>
  );
};

export default DashboardLayout;
