import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Brain,
  Car,
  CheckCircle2,
  LineChart,
  PlaneTakeoff,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import { getBudget } from "../api/budgetApi";
import { getApiErrorMessage } from "../api/axios";
import { getExpenseStats } from "../api/expenseApi";
import { getIncome } from "../api/incomeApi";
import { getInsights } from "../api/insightApi";
import EmptyState from "../components/ui/EmptyState";
import { DashboardSkeleton } from "../components/ui/Skeleton";
import { formatCurrency } from "../utils/formatCurrency";

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "short" });
const FULL_MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

const toNumber = (value) => Number(value || 0);

const getMonthLabel = (date) => FULL_MONTH_FORMATTER.format(new Date(date));

const getLastSixMonthLabels = () => {
  const now = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: getMonthLabel(date),
      label: MONTH_FORMATTER.format(date).toUpperCase(),
    };
  });
};

const buildMonthlyGrowth = (expenseTrend = [], incomes = []) => {
  const months = getLastSixMonthLabels();
  const expenseByMonth = expenseTrend.reduce((acc, item) => {
    acc[item.month] = toNumber(item.total);
    return acc;
  }, {});
  const incomeByMonth = incomes.reduce((acc, item) => {
    const label = getMonthLabel(item.date);
    acc[label] = (acc[label] || 0) + toNumber(item.amount);
    return acc;
  }, {});

  return months.map((month) => {
    const income = incomeByMonth[month.key] || 0;
    const expense = expenseByMonth[month.key] || 0;

    return {
      ...month,
      income,
      expense,
      savings: income - expense,
    };
  });
};

const getHealthLabel = (score) => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Strong";
  if (score >= 40) return "Building";
  return "Needs focus";
};

const getHealthScore = ({ balance, budgetHealth, income, projectedMonthly }) => {
  if (budgetHealth?.score !== undefined) return Math.max(0, Math.min(100, budgetHealth.score));

  if (income <= 0) return balance > 0 ? 65 : 35;

  const savingsRate = Math.max(-1, Math.min(1, balance / income));
  const baseScore = 55 + savingsRate * 45;
  const projectionPenalty =
    projectedMonthly > income && income > 0
      ? Math.min(25, ((projectedMonthly - income) / income) * 25)
      : 0;

  return Math.max(0, Math.min(100, Math.round(baseScore - projectionPenalty)));
};

const GlassPanel = ({ children, className = "" }) => (
  <motion.section
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className={`rounded-xl border border-white/10 bg-[#0d1117]/55 shadow-[0_0_20px_rgba(79,70,229,0.16)] backdrop-blur-3xl ${className}`}
  >
    {children}
  </motion.section>
);

const FinancialHealth = ({ delta, score }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <GlassPanel className="relative flex flex-col items-center justify-center overflow-hidden p-6 md:col-span-4">
      <h2 className="mb-6 flex w-full items-center justify-between text-sm font-semibold uppercase tracking-[0.05em] text-slate-400">
        Financial Health
        <Target className="h-4 w-4 text-violet-300" />
      </h2>

      <div className="relative mb-4 flex h-48 w-48 items-center justify-center">
        <div className="absolute inset-5 rounded-full bg-indigo-500/10 blur-xl" />
        <svg className="relative z-10 h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            fill="none"
            r={radius}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            fill="none"
            r={radius}
            stroke="url(#growth-health-gradient)"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth="8"
          />
          <defs>
            <linearGradient id="growth-health-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#d2bbff" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute z-20 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-white drop-shadow-[0_0_10px_rgba(195,192,255,0.5)]">
            {score}
          </span>
          <span className="mt-1 text-sm font-semibold uppercase tracking-[0.05em] text-indigo-200">
            {getHealthLabel(score)}
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
        <span
          className={`h-2 w-2 rounded-full ${delta >= 0 ? "bg-pink-300" : "bg-amber-300"}`}
        />
        <span className="text-xs font-semibold text-slate-400">
          {delta >= 0 ? "+" : ""}
          {delta} pts vs last month estimate
        </span>
      </div>
    </GlassPanel>
  );
};

const SavingsTrajectory = ({ monthlyGrowth, savedTotal }) => {
  const maxValue = Math.max(
    ...monthlyGrowth.map((item) => Math.max(item.income, item.expense, Math.abs(item.savings))),
    1,
  );

  return (
    <GlassPanel className="relative flex flex-col overflow-hidden p-6 md:col-span-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.05em] text-slate-400">
            Savings Trajectory
            <TrendingUp className="h-4 w-4 text-indigo-200" />
          </h2>
          <div className="text-2xl font-semibold text-white">
            {formatCurrency(savedTotal)}{" "}
            <span className="text-base font-normal text-slate-400">net saved across 6 months</span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-indigo-300/20 bg-indigo-300/10 px-3 py-1 text-xs font-semibold text-indigo-200">
          <Sparkles className="h-4 w-4" />
          {savedTotal >= 0 ? "On Track" : "Needs Plan"}
        </div>
      </div>

      <div className="relative mt-auto flex h-48 flex-1 items-end gap-3">
        <div className="absolute inset-0 z-0 flex flex-col justify-between">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-0 w-full border-b border-white/5" />
          ))}
        </div>
        <div className="z-10 flex h-full w-full items-end justify-between gap-3 px-2">
          {monthlyGrowth.map((item, index) => {
            const savings = Math.max(0, item.savings);
            const height = Math.max(8, Math.round((savings / maxValue) * 100));
            const isLatest = index === monthlyGrowth.length - 1;

            return (
              <div
                key={item.key}
                className={`w-[12%] rounded-t-sm border-t transition-colors ${
                  isLatest
                    ? "border-violet-200 bg-gradient-to-t from-indigo-500/25 to-violet-300/70 shadow-[0_0_20px_rgba(210,187,255,0.35)]"
                    : item.savings > 0
                      ? "border-indigo-300/50 bg-indigo-400/35"
                      : "border-white/10 bg-white/10"
                }`}
                style={{ height: `${height}%` }}
                title={`${item.label}: ${formatCurrency(item.savings)} saved`}
              />
            );
          })}
        </div>
      </div>

      <div className="z-10 mt-4 flex w-full justify-between px-2">
        {monthlyGrowth.map((item, index) => (
          <span
            key={item.key}
            className={`text-[10px] font-bold uppercase tracking-[0.05em] ${
              index === monthlyGrowth.length - 1 ? "text-indigo-200" : "text-slate-500"
            }`}
          >
            {item.label}
          </span>
        ))}
      </div>
    </GlassPanel>
  );
};

const GoalCard = ({ goal, icon: Icon, tone = "violet" }) => {
  const toneClasses = {
    pink: "from-pink-300 to-indigo-300 text-pink-200 shadow-pink-300/40",
    violet: "from-indigo-400 to-violet-300 text-violet-200 shadow-violet-300/40",
  };

  return (
    <GlassPanel className="group flex cursor-pointer flex-col gap-4 p-4 transition-all hover:bg-white/[0.07]">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/10">
          <Icon className={`h-5 w-5 ${tone === "pink" ? "text-pink-200" : "text-violet-200"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold uppercase tracking-[0.05em] text-slate-100">
            {goal.title}
          </h4>
          <p className="mt-1 truncate text-xs text-slate-400">{goal.helper}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-white drop-shadow-[0_0_10px_rgba(195,192,255,0.35)]">
            {formatCurrency(goal.current)}
          </div>
          <p className="text-xs font-semibold text-slate-400">of {formatCurrency(goal.target)}</p>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${toneClasses[tone]}`}
          style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%` }}
        />
      </div>
    </GlassPanel>
  );
};

const GrowthAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadGrowthAnalytics = async () => {
      setLoading(true);
      setError("");

      const [expenseResult, incomeResult, insightResult, budgetResult] =
        await Promise.allSettled([
          getExpenseStats(),
          getIncome({ limit: 500 }),
          getInsights(),
          getBudget(),
        ]);

      if (!isMounted) return;

      const expenses =
        expenseResult.status === "fulfilled" ? expenseResult.value?.stats : null;
      const income =
        incomeResult.status === "fulfilled" ? incomeResult.value?.data : null;
      const insights =
        insightResult.status === "fulfilled" ? insightResult.value?.data : null;
      const budget =
        budgetResult.status === "fulfilled" ? budgetResult.value?.data : null;

      if (
        expenseResult.status === "rejected" &&
        incomeResult.status === "rejected" &&
        insightResult.status === "rejected"
      ) {
        const message = getApiErrorMessage(
          expenseResult.reason,
          "Growth analytics failed to load.",
        );
        setError(message);
        toast.error(message);
      }

      setData({ budget, expenses, income, insights });
      setLoading(false);
    };

    loadGrowthAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  const growth = useMemo(() => {
    const monthlyGrowth = buildMonthlyGrowth(
      data?.expenses?.monthlyTrend || [],
      data?.income?.incomes || [],
    );
    const thisMonthIncome =
      data?.income?.summary?.thisMonth?.income || data?.insights?.thisMonth?.income || 0;
    const thisMonthExpense =
      data?.expenses?.thisMonth?.total || data?.insights?.thisMonth?.total || 0;
    const balance =
      data?.income?.summary?.thisMonth?.balance ||
      data?.insights?.thisMonth?.balance ||
      thisMonthIncome - thisMonthExpense;
    const projectedMonthly = data?.insights?.thisMonth?.projectedMonthly || thisMonthExpense;
    const budgetHealth = data?.insights?.budgetHealth;
    const score = Math.round(
      getHealthScore({
        balance,
        budgetHealth,
        income: thisMonthIncome,
        projectedMonthly,
      }),
    );
    const comparison = data?.insights?.monthComparison;
    const previousScore = Math.max(
      0,
      Math.min(
        100,
        score -
          (comparison?.trend === "decreased"
            ? 5
            : comparison?.trend === "increased"
              ? -5
              : 0),
      ),
    );
    const savedTotal = monthlyGrowth.reduce(
      (total, item) => total + Math.max(0, item.savings),
      0,
    );
    const budgetGoals =
      data?.budget?.categoryComparison?.slice(0, 2).map((item, index) => ({
        title: `${item.category} Budget`,
        helper: `${item.percentage || 0}% used this month`,
        current: item.spent,
        target: item.limit,
        progress: item.percentage,
        icon: index === 0 ? Car : PlaneTakeoff,
        tone: index === 0 ? "violet" : "pink",
      })) || [];
    const fallbackGoals = [
      {
        title: "Monthly Savings",
        helper: "Income left after expenses",
        current: Math.max(0, balance),
        target: Math.max(thisMonthIncome || 1, Math.abs(balance), 1),
        progress:
          thisMonthIncome > 0 ? Math.round((Math.max(0, balance) / thisMonthIncome) * 100) : 0,
        icon: Wallet,
        tone: "violet",
      },
      {
        title: "Spending Control",
        helper: "Projected spend vs income",
        current: Math.max(0, thisMonthIncome - projectedMonthly),
        target: Math.max(thisMonthIncome || projectedMonthly || 1, 1),
        progress:
          thisMonthIncome > 0
            ? Math.round((Math.max(0, thisMonthIncome - projectedMonthly) / thisMonthIncome) * 100)
            : 0,
        icon: Target,
        tone: "pink",
      },
    ];
    const goals = budgetGoals.length > 0 ? budgetGoals : fallbackGoals;
    const firstSuggestion = data?.insights?.suggestions?.[0];

    return {
      balance,
      delta: score - previousScore,
      goals,
      monthlyGrowth,
      savedTotal,
      score,
      insight:
        firstSuggestion?.message ||
        firstSuggestion?.description ||
        (balance > 0
          ? `You have a surplus of ${formatCurrency(balance)} this month. Consider moving part of it into a savings goal or investment bucket.`
          : "Your current month is running tight. Review the largest spending category and set a category budget to improve next month's health score."),
    };
  }, [data]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <EmptyState
        icon={LineChart}
        title="Could not load growth analytics"
        description={error}
      />
    );
  }

  return (
    <div className="min-h-[calc(100dvh-8rem)] overflow-hidden rounded-[28px] border border-white/10 bg-[#10141a] p-4 text-[#dfe2eb] shadow-[0_24px_70px_rgba(15,23,42,0.20)] sm:p-6 lg:p-8">
      <div className="mb-8">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.05em] text-indigo-300">
          <LineChart className="h-4 w-4" />
          Growth signals
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal text-white sm:text-4xl">
          Growth Analytics
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Track your financial velocity, savings trajectory, budget progress, and future-facing
          insights from your live SmartSpend data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <FinancialHealth delta={growth.delta} score={growth.score} />
        <SavingsTrajectory monthlyGrowth={growth.monthlyGrowth} savedTotal={growth.savedTotal} />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Active Goals</h2>
          <Link
            to="/budget"
            className="flex items-center gap-1 text-sm font-semibold text-indigo-200 transition hover:text-violet-200"
          >
            Add Goal
            <Plus className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {growth.goals.map((goal) => (
            <GoalCard
              key={goal.title}
              goal={goal}
              icon={goal.icon || Target}
              tone={goal.tone}
            />
          ))}
        </div>
      </div>

      <GlassPanel className="relative mt-8 flex flex-col items-center gap-6 overflow-hidden border-indigo-300/20 p-6 md:flex-row">
        <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border border-indigo-300/30 bg-black/30">
          <Brain className="h-7 w-7 animate-pulse text-indigo-200" />
          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#10141a] bg-pink-300" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-[0.12em] text-indigo-200">
            AI Insight
          </h3>
          <p className="text-sm leading-6 text-slate-200">{growth.insight}</p>
        </div>
        <Link
          to="/budget"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(79,70,229,0.35)] transition hover:brightness-110 md:w-auto"
        >
          <CheckCircle2 className="h-4 w-4" />
          Apply Strategy
        </Link>
      </GlassPanel>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {growth.monthlyGrowth.slice(-3).map((item) => (
          <GlassPanel key={item.key} className="p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-400">
              <ArrowUpRight className="h-4 w-4 text-indigo-200" />
              {item.key}
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(item.savings)}</p>
            <p className="mt-1 text-xs text-slate-500">
              {formatCurrency(item.income)} income minus {formatCurrency(item.expense)} expenses
            </p>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
};

export default GrowthAnalytics;
