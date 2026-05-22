import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CircleDollarSign,
  PieChart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../api/axios";
import { getExpenseStats } from "../api/expenseApi";
import { getIncome } from "../api/incomeApi";
import { getInsights } from "../api/insightApi";
import ExpenseBarChart from "../components/charts/ExpenseBarChart";
import ExpensePieChart from "../components/charts/ExpensePieChart";
import MonthlyTrendChart from "../components/charts/MonthlyTrendChart";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import { DashboardSkeleton } from "../components/ui/Skeleton";
import { formatCurrency } from "../utils/formatCurrency";

const ChartCard = ({ children, description, icon: Icon, title }) => (
  <Card className="p-5">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      <div className="rounded-2xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/25 dark:text-primary-300">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    {children}
  </Card>
);

const StatCard = ({ label, value, helper, icon: Icon, variant = "indigo" }) => {
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
        <div className={`rounded-2xl p-3 ${tones[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
};

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

const getMonthLabel = (date) => monthFormatter.format(new Date(date));

const getLastSixMonthLabels = () => {
  const now = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return getMonthLabel(date);
  });
};

const buildMonthlyFinanceTrend = (expenseTrend = [], incomes = []) => {
  const monthLabels = getLastSixMonthLabels();

  const expenseByMonth = expenseTrend.reduce((acc, item) => {
    acc[item.month] = item.total || 0;
    return acc;
  }, {});

  const incomeByMonth = incomes.reduce((acc, item) => {
    const label = getMonthLabel(item.date);
    acc[label] = (acc[label] || 0) + Number(item.amount || 0);
    return acc;
  }, {});

  return monthLabels.map((label) => {
    const income = incomeByMonth[label] || 0;
    const expense = expenseByMonth[label] || 0;

    return {
      month: label,
      income,
      expense,
      balance: income - expense,
    };
  });
};

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      setLoading(true);
      setError("");

      const [expenseResult, incomeResult, insightResult] =
        await Promise.allSettled([
          getExpenseStats(),
          getIncome({ limit: 500 }),
          getInsights(),
        ]);

      if (!isMounted) return;

      const expenses =
        expenseResult.status === "fulfilled" ? expenseResult.value?.stats : null;
      const income =
        incomeResult.status === "fulfilled" ? incomeResult.value?.data : null;
      const insights =
        insightResult.status === "fulfilled" ? insightResult.value?.data : null;

      if (expenseResult.status === "rejected" && insightResult.status === "rejected") {
        const message = getApiErrorMessage(
          expenseResult.reason,
          "Analytics failed to load."
        );
        setError(message);
        toast.error(message);
      }

      setData({ expenses, income, insights });
      setLoading(false);
    };

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  const analytics = useMemo(() => {
    const categoryData =
      data?.expenses?.categoryBreakdown?.map((item) => ({
        name: item.category,
        amount: item.total,
        count: item.count,
      })) || [];

    const monthlyTrend = buildMonthlyFinanceTrend(
      data?.expenses?.monthlyTrend || [],
      data?.income?.incomes || []
    );

    const thisMonthIncome =
      data?.income?.summary?.thisMonth?.income ||
      data?.insights?.thisMonth?.income ||
      0;
    const thisMonthExpense =
      data?.expenses?.thisMonth?.total || data?.insights?.thisMonth?.total || 0;
    const balance =
      data?.income?.summary?.thisMonth?.balance ||
      data?.insights?.thisMonth?.balance ||
      thisMonthIncome - thisMonthExpense;

    const totalTrendIncome = monthlyTrend.reduce(
      (total, item) => total + item.income,
      0
    );
    const totalTrendExpense = monthlyTrend.reduce(
      (total, item) => total + item.expense,
      0
    );
    const trendBalance = totalTrendIncome - totalTrendExpense;

    return {
      allTimeExpense: data?.expenses?.allTime?.total || 0,
      allTimeCount: data?.expenses?.allTime?.count || 0,
      thisMonthIncome,
      thisMonthExpense,
      balance,
      categoryData,
      monthlyTrend,
      totalTrendIncome,
      totalTrendExpense,
      trendBalance,
      highestCategory: data?.insights?.highestSpendingCategory,
      comparison: data?.insights?.monthComparison,
    };
  }, [data]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Could not load analytics"
        description={error}
      />
    );
  }

  const hasCharts =
    analytics.categoryData.length > 0 ||
    analytics.monthlyTrend.some((item) => item.income > 0 || item.expense > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-300">
            <BarChart3 className="h-4 w-4" />
            Visual reports
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Understand spending categories, monthly trends, transaction volume,
            and how income compares with expenses.
          </p>
        </div>

        {analytics.comparison && (
          <Badge
            variant={
              analytics.comparison.trend === "increased"
                ? "red"
                : analytics.comparison.trend === "decreased"
                  ? "green"
                  : "gray"
            }
          >
            Spending {analytics.comparison.trend}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CircleDollarSign}
          label="All-time expense"
          value={formatCurrency(analytics.allTimeExpense)}
          helper={`${analytics.allTimeCount} total transactions`}
          variant="red"
        />
        <StatCard
          icon={Wallet}
          label="This month income"
          value={formatCurrency(analytics.thisMonthIncome)}
          helper="Income recorded this month"
          variant="green"
        />
        <StatCard
          icon={TrendingUp}
          label="This month expense"
          value={formatCurrency(analytics.thisMonthExpense)}
          helper="Expenses recorded this month"
          variant="yellow"
        />
        <StatCard
          icon={PieChart}
          label="Top category"
          value={analytics.highestCategory?.category || "No data"}
          helper={
            analytics.highestCategory
              ? formatCurrency(analytics.highestCategory.amount)
              : "Add expenses to see this"
          }
        />
      </div>

      {!hasCharts ? (
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="Add expenses and income to unlock charts and trends."
        />
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard
              icon={BarChart3}
              title="Category Spend"
              description="Bar chart of spending grouped by category."
            >
              <ExpenseBarChart data={analytics.categoryData} />
            </ChartCard>

            <ChartCard
              icon={PieChart}
              title="Category Share"
              description="Pie chart showing which categories dominate spending."
            >
              <ExpensePieChart data={analytics.categoryData} />
            </ChartCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <ChartCard
              icon={TrendingUp}
              title="Income vs Expense Trend"
              description="Last six months of money coming in compared with spending."
            >
              <MonthlyTrendChart data={analytics.monthlyTrend} />
            </ChartCard>

            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Six-Month Summary
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Quick read of your trend chart.
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-300">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Total income
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(analytics.totalTrendIncome)}
                  </p>
                </div>

                <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    Total expense
                  </p>
                  <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">
                    {formatCurrency(analytics.totalTrendExpense)}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Net trend balance
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      analytics.trendBalance >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(analytics.trendBalance)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Category Breakdown
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ranked list of spending categories and transaction count.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {analytics.categoryData.slice(0, 8).map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4 dark:border-gray-800"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {item.count} transactions
                    </p>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default Analytics;
