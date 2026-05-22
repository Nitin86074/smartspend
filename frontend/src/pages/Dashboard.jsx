import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  PerspectiveCamera,
  Sparkles as ThreeSparkles,
} from "@react-three/drei";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CalendarDays,
  CircleDollarSign,
  Coffee,
  GraduationCap,
  Lightbulb,
  PieChart as PieChartIcon,
  ReceiptText,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";
import { getApiErrorMessage } from "../api/axios";
import { getExpenses, getExpenseStats } from "../api/expenseApi";
import { getIncome } from "../api/incomeApi";
import { getInsights } from "../api/insightApi";
import EmptyState from "../components/ui/EmptyState";
import { DashboardSkeleton } from "../components/ui/Skeleton";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";

const categoryColors = [
  "#4F46E5",
  "#10B981",
  "#EC4899",
  "#8B5CF6",
  "#6366F1",
  "#F43F5E",
  "#14B8A6",
  "#F59E0B",
];

const cardMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

const toNumber = (value) => Number(value || 0);

const getFirstName = (name) => name?.split(" ")?.[0] || "there";

const statLines = {
  emerald: {
    icon: "bg-emerald-500/20 text-emerald-300",
    line: "bg-gradient-to-r from-transparent via-emerald-400 to-transparent",
  },
  indigo: {
    icon: "bg-indigo-500/20 text-indigo-300",
    line: "bg-gradient-to-r from-transparent via-indigo-500 to-transparent",
  },
  rose: {
    icon: "bg-rose-500/20 text-rose-300",
    line: "bg-gradient-to-r from-transparent via-rose-500 to-transparent",
  },
};

function DashboardScene3D() {
  const meshRef = useRef();

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.1;
    meshRef.current.rotation.y += delta * 0.15;
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 10]} intensity={1} color="#a5b4fc" />
      <Float
        speed={1.5}
        rotationIntensity={0.5}
        floatIntensity={1}
        position={[-6, 2, -5]}
      >
        <mesh ref={meshRef}>
          <torusGeometry args={[2, 0.5, 16, 100]} />
          <MeshDistortMaterial
            color="#4f46e5"
            speed={2}
            distort={0.2}
            radius={1}
            opacity={0.6}
            transparent
          />
        </mesh>
      </Float>

      <Float
        speed={2}
        rotationIntensity={1}
        floatIntensity={2}
        position={[6, -3, -3]}
      >
        <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#ec4899" opacity={0.3} transparent />
        </mesh>
      </Float>

      <ThreeSparkles count={40} scale={12} size={2} color="#8b5cf6" speed={0.2} />
    </>
  );
}

function DashboardBackground3D() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <Canvas dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <DashboardScene3D />
        </Suspense>
      </Canvas>
    </div>
  );
}

const GlassCard = ({ children, className = "" }) => (
  <motion.section
    {...cardMotion}
    whileHover={{ y: -4 }}
    className={`rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:bg-white/[0.07] hover:shadow-2xl ${className}`}
  >
    {children}
  </motion.section>
);

const StatCard = ({ icon: Icon, label, value, helper, line = "indigo" }) => {
  const tone = statLines[line] || statLines.indigo;

  return (
    <GlassCard className="relative overflow-hidden p-6">
      <div className={`absolute left-0 top-0 h-1 w-full opacity-60 ${tone.line}`} />
      <div className="mb-4 flex items-center gap-4">
        <div className={`rounded-2xl p-3 ${tone.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-medium uppercase tracking-wider text-gray-400">
          {label}
        </h3>
      </div>
      <div className="truncate text-3xl font-extrabold text-white">{value}</div>
      <p className="mt-2 truncate text-sm text-gray-500">{helper}</p>
    </GlassCard>
  );
};

const SectionHeader = ({ icon: Icon, title, description, tone = "text-indigo-300" }) => (
  <div className="mb-5 flex items-center justify-between gap-4">
    <div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm text-gray-400">{description}</p>
    </div>
    <Icon className={`h-5 w-5 ${tone}`} />
  </div>
);

const MiniSignalCard = ({ icon: Icon, label, value, helper }) => (
  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
    <p className="flex items-center gap-2 text-sm font-semibold text-gray-400">
      <Icon className="h-4 w-4 text-indigo-300" />
      {label}
    </p>
    <p className="mt-2 text-xl font-bold text-white">{value}</p>
    <p className="mt-1 text-sm text-gray-500">{helper}</p>
  </div>
);

const TransactionIcon = ({ type }) => {
  const isIncome = type === "income";

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
        isIncome
          ? "bg-emerald-500/20 text-emerald-300"
          : "bg-rose-500/20 text-rose-300"
      }`}
    >
      {isIncome ? <ArrowUpRight className="h-5 w-5" /> : <Coffee className="h-5 w-5" />}
    </div>
  );
};

const MoneyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#161b22]/95 px-3 py-2 text-sm text-white shadow-xl backdrop-blur-xl">
      <p className="font-semibold text-white">{label}</p>
      <p className="mt-1 text-gray-300">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
};

const CategoryChart = ({ data }) => (
  <GlassCard className="p-5 lg:col-span-7">
    <SectionHeader
      icon={PieChartIcon}
      title="Category Expense Chart"
      description="Spending grouped by category for the current data set."
      tone="text-indigo-300"
    />

    {data.length === 0 ? (
      <EmptyState
        icon={PieChartIcon}
        title="No category data"
        description="Add expenses to see category spending."
      />
    ) : (
      <div className="grid gap-6 xl:grid-cols-[240px_1fr]">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                innerRadius={62}
                nameKey="name"
                outerRadius={100}
                paddingAngle={2}
              >
                {data.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip content={<MoneyTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="min-h-64">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} tickLine={false} axisLine={false} width={44} />
              <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                {data.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )}
  </GlassCard>
);

const TrendChart = ({ data }) => (
  <GlassCard className="p-5 lg:col-span-5">
    <SectionHeader
      icon={GraduationCap}
      title="Balance Pulse"
      description="Income, expenses, and balance from live totals."
      tone="text-emerald-300"
    />
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<MoneyTooltip />} />
          <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} fill="url(#balanceGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </GlassCard>
);

const RecentTransactions = ({ searchTerm, onSearchChange, transactions }) => (
  <GlassCard className="p-5 lg:col-span-7">
    <SectionHeader
      icon={ReceiptText}
      title="Recent Transactions"
      description="Latest income and expenses from your account."
      tone="text-rose-300"
    />

    <div className="relative mb-6">
      <input
        type="text"
        placeholder="Search transactions..."
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />
      <div className="pointer-events-none absolute left-3 top-3.5 text-gray-500">
        <Search size={18} />
      </div>
    </div>

    {transactions.length === 0 ? (
      searchTerm ? (
        <div className="py-10 text-center text-sm text-gray-500">
          No transactions found for "{searchTerm}"
        </div>
      ) : (
        <EmptyState
          icon={ReceiptText}
          title="No transactions yet"
          description="Add income or expenses to populate your dashboard."
        />
      )
    ) : (
      <div className="space-y-3">
        {transactions.map((transaction) => {
          const isIncome = transaction.type === "income";

          return (
            <motion.div
              key={transaction.id}
              whileHover={{ x: 4 }}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
            >
              <div className="flex min-w-0 items-center gap-3">
                <TransactionIcon type={transaction.type} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {transaction.title}
                  </p>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {transaction.category || "Other"} - {formatDate(transaction.date)}
                  </p>
                </div>
              </div>
              <p
                className={`shrink-0 text-right font-bold ${
                  isIncome
                    ? "text-emerald-300"
                    : "text-rose-300"
                }`}
              >
                {isIncome ? "+" : "-"}
                {formatCurrency(Math.abs(transaction.amount))}
              </p>
            </motion.div>
          );
        })}
      </div>
    )}
  </GlassCard>
);

const AISuggestions = ({ suggestions }) => (
  <GlassCard className="p-5 lg:col-span-5">
    <SectionHeader
      icon={Brain}
      title="AI Suggestions"
      description="Personalized guidance from SmartSpend insights."
      tone="text-pink-300"
    />

    {suggestions.length === 0 ? (
      <EmptyState
        icon={Lightbulb}
        title="No AI suggestions yet"
        description="Add more financial activity to generate suggestions."
      />
    ) : (
      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <motion.div
            key={suggestion.id || suggestion.title || suggestion.message}
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pink-500/20 text-pink-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                {suggestion.title && (
                  <p className="font-bold text-white">
                    {suggestion.title}
                  </p>
                )}
                <p className="mt-1 text-sm leading-6 text-gray-400">
                  {suggestion.message || suggestion.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </GlassCard>
);

const buildRecentTransactions = (expenses = [], incomes = []) => {
  const expenseTransactions = expenses.map((item, index) => ({
    id: `expense-${item._id || item.date || index}`,
    title: item.title || "Expense",
    amount: toNumber(item.amount),
    category: item.category,
    date: item.date,
    type: "expense",
  }));

  const incomeTransactions = incomes.map((item, index) => ({
    id: `income-${item._id || item.date || index}`,
    title: item.title || "Income",
    amount: toNumber(item.amount),
    category: item.category,
    date: item.date,
    type: "income",
  }));

  return [...expenseTransactions, ...incomeTransactions]
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
};

const buildSuggestions = (insights) => {
  const apiSuggestions = insights?.suggestions || [];

  if (apiSuggestions.length > 0) return apiSuggestions.slice(0, 3);

  return [];
};

const Dashboard = ({ searchTerm = "", onSearchChange = () => {} }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      const [incomeResult, expenseStatsResult, expensesResult, insightsResult] =
        await Promise.allSettled([
          getIncome({ limit: 5 }),
          getExpenseStats(),
          getExpenses({ limit: 5, sortBy: "date", order: "desc" }),
          getInsights(),
        ]);

      if (!isMounted) return;

      const income =
        incomeResult.status === "fulfilled" ? incomeResult.value?.data : null;
      const expenseStats =
        expenseStatsResult.status === "fulfilled"
          ? expenseStatsResult.value?.stats
          : null;
      const recentExpenses =
        expensesResult.status === "fulfilled"
          ? expensesResult.value?.data?.expenses || []
          : [];
      const insights =
        insightsResult.status === "fulfilled" ? insightsResult.value?.data : null;

      if (
        incomeResult.status === "rejected" &&
        expenseStatsResult.status === "rejected" &&
        expensesResult.status === "rejected" &&
        insightsResult.status === "rejected"
      ) {
        setError(
          getApiErrorMessage(
            incomeResult.reason,
            "Dashboard data failed to load."
          )
        );
      }

      setData({ expenseStats, income, insights, recentExpenses });
      setLoading(false);
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const dashboard = useMemo(() => {
    const incomeSummary = data?.income?.summary;
    const insightsMonth = data?.insights?.thisMonth;
    const expenseMonth = data?.expenseStats?.thisMonth;

    const totalIncome = toNumber(
      incomeSummary?.thisMonth?.income ?? insightsMonth?.income
    );
    const totalExpense = toNumber(
      expenseMonth?.total ?? insightsMonth?.total
    );
    const balance = toNumber(
      incomeSummary?.thisMonth?.balance ?? insightsMonth?.balance ?? totalIncome - totalExpense
    );
    const categoryBase = data?.expenseStats?.categoryBreakdown || [];
    const categoryTotal = categoryBase.reduce(
      (total, item) => total + toNumber(item.total),
      0
    );
    const categories = categoryBase.slice(0, 8).map((item, index) => ({
      name: item.category || "Other",
      amount: toNumber(item.total),
      count: item.count || 0,
      color: categoryColors[index % categoryColors.length],
      percent:
        categoryTotal > 0
          ? Math.round((toNumber(item.total) / categoryTotal) * 100)
          : 0,
    }));

    const transactions = buildRecentTransactions(
      data?.recentExpenses || [],
      data?.income?.incomes || []
    );

    return {
      totalIncome,
      totalExpense,
      balance,
      categories,
      transactions,
      suggestions: buildSuggestions(data?.insights),
      transactionCount:
        expenseMonth?.count || insightsMonth?.count || transactions.length,
      topCategory: data?.insights?.highestSpendingCategory,
      trend: [
        { name: "Income", value: totalIncome },
        { name: "Expense", value: totalExpense },
        { name: "Balance", value: balance },
      ],
    };
  }, [data]);

  const filteredExpenses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!data?.recentExpenses) return [];
    if (!term) return data.recentExpenses;

    return data.recentExpenses.filter((expense) => {
      const title = expense.title?.toLowerCase() || "";
      const category = expense.category?.toLowerCase() || "";

      return title.includes(term) || category.includes(term);
    });
  }, [data, searchTerm]);

  const filteredTransactions = useMemo(
    () => buildRecentTransactions(filteredExpenses, data?.income?.incomes || []),
    [data?.income?.incomes, filteredExpenses]
  );

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <EmptyState
        icon={Brain}
        title="Dashboard could not load"
        description={error}
      />
    );
  }

  return (
    <div className="relative min-h-[calc(100dvh-8rem)] overflow-hidden rounded-[28px] bg-[#0d1117] text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] selection:bg-indigo-500/30">
      <DashboardBackground3D />

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 p-5 pb-24 sm:p-6 lg:p-8">
        <div className="mt-2 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-400">
              <CalendarDays className="h-4 w-4 text-gray-400" />
              Student finance dashboard
            </p>
            <h1 className="mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-4xl font-extrabold tracking-normal text-transparent lg:text-5xl">
              Welcome back, {getFirstName(user?.name)}
            </h1>
            <p className="text-lg text-gray-400">
              Track your income, spending, balance, recent activity, and saving signals in one clean workspace.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 shadow-xl backdrop-blur-md sm:block"
          >
            {formatDate(new Date())}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            icon={ArrowUpRight}
            label="Total Income"
            value={formatCurrency(dashboard.totalIncome)}
            helper="Income recorded this month"
            line="emerald"
          />
          <StatCard
            icon={ArrowDownRight}
            label="Total Expense"
            value={formatCurrency(dashboard.totalExpense)}
            helper={`${dashboard.transactionCount || 0} expense transactions`}
            line="rose"
          />
          <StatCard
            icon={Wallet}
            label="Balance"
            value={formatCurrency(dashboard.balance)}
            helper={dashboard.balance >= 0 ? "Available after expenses" : "Expenses exceed income"}
            line="indigo"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <RecentTransactions
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            transactions={filteredTransactions}
          />
          <AISuggestions suggestions={dashboard.suggestions} />
          <CategoryChart data={dashboard.categories} />
          <TrendChart data={dashboard.trend} />

          <GlassCard className="p-5 lg:col-span-12">
            <div className="grid gap-4 md:grid-cols-3">
              <MiniSignalCard
                icon={CircleDollarSign}
                label="Top Category"
                value={dashboard.topCategory?.category || dashboard.categories[0]?.name || "No data"}
                helper={
                  dashboard.topCategory
                    ? formatCurrency(dashboard.topCategory.amount)
                    : "Add expenses to identify a top category."
                }
              />
              <MiniSignalCard
                icon={ReceiptText}
                label="Recent Activity"
                value={`${dashboard.transactions.length} items`}
                helper="Latest income and expense entries."
              />
              <MiniSignalCard
                icon={Sparkles}
                label="AI Signals"
                value={`${dashboard.suggestions.length} suggestions`}
                helper="Generated by the existing insights API."
              />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
