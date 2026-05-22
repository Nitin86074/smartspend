import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CalendarCheck,
  CircleDollarSign,
  Lightbulb,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../api/axios";
import { getInsights } from "../api/insightApi";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import { DashboardSkeleton } from "../components/ui/Skeleton";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";

const suggestionStyles = {
  success: {
    icon: ShieldCheck,
    badge: "green",
    panel:
      "border-emerald-100 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-900/10",
    iconBox:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  tip: {
    icon: Lightbulb,
    badge: "blue",
    panel:
      "border-blue-100 bg-blue-50/70 dark:border-blue-900/50 dark:bg-blue-900/10",
    iconBox:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  warning: {
    icon: AlertTriangle,
    badge: "yellow",
    panel:
      "border-amber-100 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-900/10",
    iconBox:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  alert: {
    icon: AlertTriangle,
    badge: "yellow",
    panel:
      "border-amber-100 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-900/10",
    iconBox:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  danger: {
    icon: AlertTriangle,
    badge: "red",
    panel:
      "border-red-100 bg-red-50/70 dark:border-red-900/50 dark:bg-red-900/10",
    iconBox: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
};

const StatCard = ({ icon: Icon, label, value, helper, variant = "indigo" }) => {
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

const ProgressBar = ({ value = 0 }) => (
  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
    <div
      className="h-full rounded-full bg-primary-600"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

const normalizeSuggestionType = (type) => {
  if (type === "alert") return "warning";
  return type || "tip";
};

const makeSavingActionPlan = (insights = {}) => {
  const month = insights.thisMonth || {};
  const comparison = insights.monthComparison || {};
  const highestCategory = insights.highestSpendingCategory;
  const budgetHealth = insights.budgetHealth;
  const categoryInsights = insights.categoryInsights || [];
  const suggestions = [];

  if (highestCategory?.amount && month.total > 0) {
    const categoryShare = Math.round((highestCategory.amount / month.total) * 100);
    const targetReduction = Math.ceil(highestCategory.amount * 0.1);

    suggestions.push({
      id: "top-category-reduction",
      type: categoryShare >= 40 ? "warning" : "tip",
      title: `Trim ${highestCategory.category} by 10%`,
      message: `${highestCategory.category} is your biggest category this month. A small 10% reduction could save around ${formatCurrency(targetReduction)} without changing your whole lifestyle.`,
      impact: formatCurrency(targetReduction),
      action: `Review ${highestCategory.category} transactions`,
      confidence: categoryShare >= 40 ? "High" : "Medium",
    });
  }

  if (month.dailyAverage > 0) {
    const weeklyTarget = Math.ceil(month.dailyAverage * 2);

    suggestions.push({
      id: "two-day-spend-freeze",
      type: month.balance < 0 ? "danger" : "tip",
      title: "Try a two-day spend freeze",
      message: `Your daily average is ${formatCurrency(month.dailyAverage)}. Skipping non-essential spending for two days could protect about ${formatCurrency(weeklyTarget)} this week.`,
      impact: formatCurrency(weeklyTarget),
      action: "Pause non-essential purchases for two days",
      confidence: "Medium",
    });
  }

  if (comparison.trend === "increased" && comparison.difference > 0) {
    const recoveryTarget = Math.ceil(comparison.difference * 0.25);

    suggestions.push({
      id: "spending-increase-recovery",
      type: "warning",
      title: "Recover part of this month increase",
      message: `Spending is up by ${formatCurrency(comparison.difference)} compared with last month. Targeting just 25% of that increase gives you a realistic saving goal of ${formatCurrency(recoveryTarget)}.`,
      impact: formatCurrency(recoveryTarget),
      action: "Find one category to reduce this week",
      confidence: "High",
    });
  }

  if (budgetHealth?.limit && budgetHealth?.remaining >= 0) {
    const daysLeft = Math.max(
      1,
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() -
        new Date().getDate()
    );
    const dailyLimit = Math.floor(budgetHealth.remaining / daysLeft);

    suggestions.push({
      id: "daily-budget-limit",
      type: dailyLimit > 0 ? "success" : "danger",
      title: "Use a daily budget guardrail",
      message: `You have ${formatCurrency(budgetHealth.remaining)} left for the month. That means around ${formatCurrency(dailyLimit)} per day for the remaining ${daysLeft} day(s).`,
      impact: formatCurrency(budgetHealth.remaining),
      action: "Keep daily spending under this guardrail",
      confidence: "High",
    });
  }

  const risingCategory = categoryInsights.find(
    (item) => item.trend === "increased" && item.difference > 0
  );

  if (risingCategory) {
    suggestions.push({
      id: "rising-category-watch",
      type: "warning",
      title: `${risingCategory.category} is rising`,
      message: `${risingCategory.category} increased by ${formatCurrency(risingCategory.difference)} this month. Check if this was planned or if it needs a temporary cap.`,
      impact: formatCurrency(Math.ceil(risingCategory.difference * 0.5)),
      action: `Set a short-term cap for ${risingCategory.category}`,
      confidence: "Medium",
    });
  }

  if (month.balance > 0) {
    const savingTarget = Math.ceil(month.balance * 0.3);

    suggestions.push({
      id: "surplus-saving-transfer",
      type: "success",
      title: "Move part of your surplus to savings",
      message: `You currently have a surplus of ${formatCurrency(month.balance)}. Moving 30% of it can lock in ${formatCurrency(savingTarget)} before it gets spent casually.`,
      impact: formatCurrency(savingTarget),
      action: "Transfer surplus to savings",
      confidence: "High",
    });
  }

  return suggestions.slice(0, 4);
};

const Insights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getInsights();
        setInsights(response.data);
      } catch (err) {
        const message = getApiErrorMessage(err, "Insights failed to load.");
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        icon={Brain}
        title="Could not load insights"
        description={error}
      />
    );
  }

  if (!insights) {
    return (
      <EmptyState
        icon={Brain}
        title="No insights yet"
        description="Add income, budget, and expenses to generate insights."
      />
    );
  }

  const month = insights.thisMonth || {};
  const comparison = insights.monthComparison || {};
  const highestCategory = insights.highestSpendingCategory;
  const budgetHealth = insights.budgetHealth;
  const suggestions = insights.suggestions || [];
  const actionPlan = makeSavingActionPlan(insights);
  const categoryInsights = insights.categoryInsights || [];
  const recentExpenses = insights.recentExpenses || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-300">
            <Brain className="h-4 w-4" />
            Smart spending intelligence
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Insights
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Read the signals behind your spending, category movement, budget
            health, and saving opportunities.
          </p>
        </div>

        <Badge variant={month.balanceStatus === "surplus" ? "green" : "red"}>
          {month.balanceStatus || "No balance data"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="This month balance"
          value={formatCurrency(month.balance)}
          helper={`${formatCurrency(month.income)} income minus ${formatCurrency(month.total)} spending`}
          variant={month.balance >= 0 ? "green" : "red"}
        />
        <StatCard
          icon={Receipt}
          label="This month spending"
          value={formatCurrency(month.total)}
          helper={`${month.count || 0} transactions recorded`}
          variant="yellow"
        />
        <StatCard
          icon={TrendingUp}
          label="Projected spending"
          value={formatCurrency(month.projectedMonthly)}
          helper={`${formatCurrency(month.dailyAverage)} daily average`}
          variant="indigo"
        />
        <StatCard
          icon={Target}
          label="Highest category"
          value={highestCategory?.category || "No data"}
          helper={
            highestCategory
              ? `${formatCurrency(highestCategory.amount)} across ${highestCategory.transactions} transactions`
              : "Add expenses to see this"
          }
          variant="red"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Saving Suggestions
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Smart recommendations based on your current activity.
              </p>
            </div>
            <Lightbulb className="h-5 w-5 text-amber-500" />
          </div>

          {suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((suggestion) => {
                const type = normalizeSuggestionType(suggestion.type);
                const style = suggestionStyles[type] || suggestionStyles.tip;
                const Icon = style.icon;

                return (
                  <div
                    key={suggestion.title}
                    className={`rounded-3xl border p-4 ${style.panel}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`rounded-2xl p-3 ${style.iconBox}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {suggestion.title}
                          </h3>
                          <Badge variant={style.badge}>{type}</Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                          {suggestion.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Lightbulb}
              title="No suggestions yet"
              description="Add more transactions to generate saving suggestions."
            />
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Monthly Comparison
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Current month compared with the previous month.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl bg-gray-50 p-4 dark:bg-gray-800/60">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This month
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(comparison.thisMonth)}
                  </p>
                </div>
                <div>
                  <p className="text-right text-sm text-gray-500 dark:text-gray-400">
                    Last month
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(comparison.lastMonth)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-3xl border border-gray-100 p-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-2xl p-3 ${
                    comparison.trend === "increased"
                      ? "bg-red-50 text-red-600 dark:bg-red-900/25 dark:text-red-300"
                      : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-300"
                  }`}
                >
                  {comparison.trend === "increased" ? (
                    <ArrowUpRight className="h-5 w-5" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Spending {comparison.trend || "same"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {comparison.percentageChange || 0}% change
                  </p>
                </div>
              </div>
              <p className="font-bold text-gray-900 dark:text-white">
                {formatCurrency(comparison.difference)}
              </p>
            </div>

            {budgetHealth ? (
              <div className="rounded-3xl border border-gray-100 p-4 dark:border-gray-800">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Budget health
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(budgetHealth.spent)} spent of{" "}
                      {formatCurrency(budgetHealth.limit)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      budgetHealth.status === "excellent"
                        ? "green"
                        : budgetHealth.status === "moderate"
                          ? "yellow"
                          : "red"
                    }
                  >
                    {budgetHealth.score}/100
                  </Badge>
                </div>
                <ProgressBar value={budgetHealth.score} />
              </div>
            ) : (
              <EmptyState
                icon={Target}
                title="Budget not connected"
                description="Set a budget to unlock budget health scoring."
              />
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-300">
              <Sparkles className="h-4 w-4" />
              Actionable saving plan
            </p>
            <h2 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
              Smart Saving Suggestions
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Practical next steps calculated from your balance, daily average,
              category movement, and budget health.
            </p>
          </div>
          <Badge variant={actionPlan.length > 0 ? "green" : "gray"}>
            {actionPlan.length} recommendations
          </Badge>
        </div>

        {actionPlan.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {actionPlan.map((item) => {
              const type = normalizeSuggestionType(item.type);
              const style = suggestionStyles[type] || suggestionStyles.tip;
              const Icon = style.icon;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-3xl border p-5 ${style.panel}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-2xl p-3 ${style.iconBox}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {item.title}
                        </h3>
                        <Badge variant={style.badge}>{item.confidence}</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                        {item.message}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white/70 p-3 dark:bg-gray-950/40">
                          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            <CircleDollarSign className="h-3.5 w-3.5" />
                            Potential impact
                          </p>
                          <p className="mt-1 font-bold text-gray-900 dark:text-white">
                            {item.impact}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/70 p-3 dark:bg-gray-950/40">
                          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            <CalendarCheck className="h-3.5 w-3.5" />
                            Next action
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                            {item.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No saving plan yet"
            description="Add income, expenses, and a budget to generate practical saving suggestions."
          />
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Category Movement
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Category spending compared with last month.
              </p>
            </div>
            <TrendingDown className="h-5 w-5 text-gray-400" />
          </div>

          {categoryInsights.length > 0 ? (
            <div className="space-y-3">
              {categoryInsights.slice(0, 6).map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4 dark:border-gray-800"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-white">
                      {item.category}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Last month: {formatCurrency(item.lastMonth)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(item.thisMonth)}
                    </p>
                    <Badge
                      variant={
                        item.trend === "increased"
                          ? "red"
                          : item.trend === "decreased"
                            ? "green"
                            : "gray"
                      }
                    >
                      {item.trend}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Receipt}
              title="No category movement"
              description="Add expenses across months to compare categories."
            />
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Recent Expense Signals
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Latest expenses used for insight generation.
            </p>
          </div>

          {recentExpenses.length > 0 ? (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4 dark:border-gray-800"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-white">
                      {expense.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {expense.category} - {formatDate(expense.date)}
                    </p>
                  </div>
                  <p className="font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Receipt}
              title="No recent expenses"
              description="Add expenses to build recent insight signals."
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Insights;
