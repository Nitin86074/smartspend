import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  Download,
  FileText,
  PiggyBank,
  Receipt,
  Target,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../api/axios";
import { getBudget } from "../api/budgetApi";
import { getExpenseStats } from "../api/expenseApi";
import { exportPDF } from "../api/exportApi";
import { getIncome } from "../api/incomeApi";
import { getInsights } from "../api/insightApi";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import { DashboardSkeleton } from "../components/ui/Skeleton";
import { formatCurrency } from "../utils/formatCurrency";

const StatCard = ({ icon: Icon, label, value, helper, tone = "indigo" }) => {
  const tones = {
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-300",
    indigo:
      "bg-primary-50 text-primary-600 dark:bg-primary-900/25 dark:text-primary-300",
    red: "bg-red-50 text-red-600 dark:bg-red-900/25 dark:text-red-300",
    yellow: "bg-amber-50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-300",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {helper}
          </p>
        </div>
        <div className={`rounded-2xl p-3 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
};

const ProgressBar = ({ value = 0, status = "safe" }) => {
  const color =
    status === "exceeded"
      ? "bg-red-500"
      : status === "warning"
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
};

const MonthlyReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadReport = async () => {
      setLoading(true);
      setError("");

      const [incomeResult, expenseResult, budgetResult, insightResult] =
        await Promise.allSettled([
          getIncome({ limit: 5 }),
          getExpenseStats(),
          getBudget(),
          getInsights(),
        ]);

      if (!isMounted) return;

      const income =
        incomeResult.status === "fulfilled" ? incomeResult.value?.data : null;
      const expenses =
        expenseResult.status === "fulfilled" ? expenseResult.value?.stats : null;
      const budget =
        budgetResult.status === "fulfilled" ? budgetResult.value?.data : null;
      const insights =
        insightResult.status === "fulfilled" ? insightResult.value?.data : null;

      if (
        incomeResult.status === "rejected" &&
        expenseResult.status === "rejected" &&
        insightResult.status === "rejected"
      ) {
        setError(getApiErrorMessage(incomeResult.reason, "Monthly report failed to load."));
      }

      setReportData({ income, expenses, budget, insights });
      setLoading(false);
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, []);

  const report = useMemo(() => {
    const month = reportData?.insights?.thisMonth;
    const incomeSummary = reportData?.income?.summary;
    const expenseMonth = reportData?.expenses?.thisMonth;

    const income = incomeSummary?.thisMonth?.income ?? month?.income ?? 0;
    const expense = month?.total ?? expenseMonth?.total ?? 0;
    const balance = incomeSummary?.thisMonth?.balance ?? month?.balance ?? income - expense;
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

    return {
      income,
      expense,
      balance,
      savingsRate,
      expenseCount: month?.count ?? expenseMonth?.count ?? 0,
      comparison: reportData?.insights?.monthComparison,
      highestCategory: reportData?.insights?.highestSpendingCategory,
      budget: reportData?.budget,
      suggestions: reportData?.insights?.suggestions || [],
      recentExpenses: reportData?.insights?.recentExpenses || [],
      categories: reportData?.expenses?.categoryBreakdown || [],
    };
  }, [reportData]);

  const handlePdfExport = async () => {
    setExporting(true);

    try {
      await exportPDF({});
      toast.success("Monthly PDF export started");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "PDF export failed."));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        icon={FileText}
        title="Could not load monthly report"
        description={error}
      />
    );
  }

  const budgetSummary = report.budget?.summary;
  const currentMonth = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-300">
            <FileText className="h-4 w-4" />
            Monthly financial report
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {currentMonth} Report
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            A screenshot-ready summary of income, expenses, balance, budget
            status, category trends, and saving suggestions.
          </p>
        </div>

        <Button
          icon={Download}
          isLoading={exporting}
          onClick={handlePdfExport}
        >
          Export PDF
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Monthly income"
          value={formatCurrency(report.income)}
          helper="Total income recorded this month"
          tone="green"
        />
        <StatCard
          icon={Receipt}
          label="Monthly expense"
          value={formatCurrency(report.expense)}
          helper={`${report.expenseCount} expense transactions`}
          tone="red"
        />
        <StatCard
          icon={report.balance >= 0 ? ArrowUpRight : ArrowDownRight}
          label="Net balance"
          value={formatCurrency(report.balance)}
          helper={report.balance >= 0 ? "Positive cash flow" : "Negative cash flow"}
          tone={report.balance >= 0 ? "indigo" : "yellow"}
        />
        <StatCard
          icon={Target}
          label="Savings rate"
          value={`${report.savingsRate}%`}
          helper="Balance as a share of income"
          tone={report.savingsRate >= 20 ? "green" : "yellow"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Executive Summary
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The short version you can explain during a demo.
              </p>
            </div>
            <Brain className="h-5 w-5 text-primary-600 dark:text-primary-300" />
          </div>

          <div className="space-y-3">
            <ReportLine
              label="Financial status"
              value={report.balance >= 0 ? "Surplus month" : "Deficit month"}
              variant={report.balance >= 0 ? "green" : "red"}
            />
            <ReportLine
              label="Top spending category"
              value={
                report.highestCategory
                  ? `${report.highestCategory.category} (${formatCurrency(report.highestCategory.amount)})`
                  : "No category data"
              }
              variant="yellow"
            />
            <ReportLine
              label="Spending trend"
              value={
                report.comparison
                  ? `${report.comparison.trend} by ${report.comparison.percentageChange || 0}%`
                  : "No comparison yet"
              }
              variant={
                report.comparison?.trend === "increased"
                  ? "red"
                  : report.comparison?.trend === "decreased"
                    ? "green"
                    : "gray"
              }
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Budget Health
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Monthly spending against your budget limit.
              </p>
            </div>
            <PiggyBank className="h-5 w-5 text-primary-600 dark:text-primary-300" />
          </div>

          {budgetSummary ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {budgetSummary.percentage}%
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(budgetSummary.totalSpent)} spent of{" "}
                    {formatCurrency(report.budget?.budget?.monthlyLimit)}
                  </p>
                </div>
                <Badge
                  variant={
                    budgetSummary.status === "exceeded"
                      ? "red"
                      : budgetSummary.status === "warning"
                        ? "yellow"
                        : "green"
                  }
                >
                  {budgetSummary.status}
                </Badge>
              </div>
              <ProgressBar
                value={budgetSummary.percentage}
                status={budgetSummary.status}
              />
              {budgetSummary.isExceeded && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-300">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">
                    You exceeded the monthly budget by{" "}
                    <strong>{formatCurrency(budgetSummary.overSpent)}</strong>.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={PiggyBank}
              title="No budget in report"
              description="Set a budget to include budget health in this report."
            />
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Category Breakdown
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Top spending categories this report can discuss.
          </p>

          {report.categories.length > 0 ? (
            <div className="mt-5 space-y-3">
              {report.categories.slice(0, 6).map((category) => (
                <div
                  key={category.category}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4 dark:border-gray-800"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {category.category}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {category.count} transactions
                    </p>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(category.total)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Receipt}
              title="No category data"
              description="Add expenses to include category breakdowns."
            />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Saving Suggestions
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Smart recommendations generated from this month.
          </p>

          {report.suggestions.length > 0 ? (
            <div className="mt-5 space-y-3">
              {report.suggestions.slice(0, 4).map((suggestion) => (
                <div
                  key={suggestion.title}
                  className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {suggestion.title}
                    </p>
                    <Badge
                      variant={
                        suggestion.type === "danger"
                          ? "red"
                          : suggestion.type === "warning"
                            ? "yellow"
                            : "green"
                      }
                    >
                      {suggestion.type}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    {suggestion.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Brain}
              title="No suggestions yet"
              description="Add more financial activity to generate suggestions."
            />
          )}
        </Card>
      </div>
    </div>
  );
};

const ReportLine = ({ label, value, variant }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <Badge variant={variant}>{value}</Badge>
  </div>
);

export default MonthlyReport;
