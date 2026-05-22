import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getBudget } from "../../api/budgetApi";
import { formatCurrency } from "../../utils/formatCurrency";
import Button from "../ui/Button";

const DISMISS_KEY = "smartspend_budget_warning_dismissed";

const BudgetWarningPopup = () => {
  const [budgetWarning, setBudgetWarning] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkBudget = async () => {
      if (sessionStorage.getItem(DISMISS_KEY) === "true") return;

      try {
        const response = await getBudget();
        const summary = response.data?.summary;
        const budget = response.data?.budget;

        if (isMounted && summary?.isExceeded) {
          setBudgetWarning({
            overSpent: summary.overSpent,
            percentage: summary.percentage,
            totalSpent: summary.totalSpent,
            monthlyLimit: budget?.monthlyLimit,
          });
          setIsVisible(true);
        }
      } catch {
        // No budget yet or budget API unavailable should not block the app.
      }
    };

    checkBudget();

    return () => {
      isMounted = false;
    };
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible || !budgetWarning) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-5 shadow-2xl dark:border-red-900/50 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-red-50 p-3 text-red-600 dark:bg-red-900/25 dark:text-red-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Budget Exceeded
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                You have crossed your monthly spending limit. Review your budget
                before adding more expenses.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="rounded-2xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Close warning"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-xs font-semibold text-red-600 dark:text-red-300">
              Over by
            </p>
            <p className="mt-1 font-bold text-red-700 dark:text-red-200">
              {formatCurrency(budgetWarning.overSpent)}
            </p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Spent
            </p>
            <p className="mt-1 font-bold text-gray-900 dark:text-white">
              {formatCurrency(budgetWarning.totalSpent)}
            </p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Limit
            </p>
            <p className="mt-1 font-bold text-gray-900 dark:text-white">
              {formatCurrency(budgetWarning.monthlyLimit)}
            </p>
          </div>
        </div>

        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-red-500"
            style={{ width: `${Math.min(100, budgetWarning.percentage || 100)}%` }}
          />
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={dismiss}>
            Dismiss
          </Button>
          <Link to="/budget" onClick={dismiss}>
            <Button className="w-full sm:w-auto" icon={ArrowRight}>
              Review budget
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BudgetWarningPopup;
