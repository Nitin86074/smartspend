import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, PerspectiveCamera, Sparkles } from "@react-three/drei";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../api/axios";
import { getBudget, setBudget } from "../api/budgetApi";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { formatCurrency } from "../utils/formatCurrency";
import { getMonthName } from "../utils/formatDate";

const categories = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Health & Medical",
  "Bills & Utilities",
  "Education",
  "Travel",
  "Personal Care",
  "Other",
];

const statusVariant = {
  safe: "green",
  warning: "yellow",
  exceeded: "red",
};

const statusIcon = {
  safe: CheckCircle2,
  warning: AlertTriangle,
  exceeded: AlertTriangle,
};

function BudgetScene3D() {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += delta * 0.08;
      groupRef.current.rotation.y += delta * 0.12;
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.18;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={2} color="#818cf8" />
      <spotLight position={[-10, 10, -10]} angle={0.3} penumbra={1} intensity={1.4} color="#c084fc" />

      <group ref={groupRef} position={[5, 0, -5]}>
        <mesh>
          <sphereGeometry args={[1.5, 64, 64]} />
          <MeshDistortMaterial color="#4f46e5" speed={2} distort={0.18} radius={1} opacity={0.78} transparent />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[2.5, 1]} />
          <meshStandardMaterial color="#c084fc" wireframe opacity={0.28} transparent />
        </mesh>
      </group>

      <Float speed={1.3} rotationIntensity={1} floatIntensity={1.5} position={[-6, 3, -6]}>
        <mesh rotation={[3.14159 / 4, 0, 0]}>
          <torusGeometry args={[1.5, 0.05, 16, 100]} />
          <meshStandardMaterial color="#8b5cf6" opacity={0.38} transparent />
        </mesh>
      </Float>

      <Sparkles count={50} scale={15} size={2} color="#a5b4fc" speed={0.3} opacity={0.5} />
    </>
  );
}

function BudgetBackground3D() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <Canvas>
        <BudgetScene3D />
      </Canvas>
    </div>
  );
}

const LoaderIcon = () => <div className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />;

const PremiumButton = ({ children, icon: Icon, isLoading = false, variant = "primary", className = "", type = "button", onClick, ...props }) => {
  const base = "px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border-none ";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]",
    secondary: "bg-white/5 hover:bg-white/10 text-white backdrop-blur-md border border-white/10",
    danger: "bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30",
  };

  return (
    <motion.button whileTap={{ scale: 0.97 }} type={type} onClick={onClick} className={`${base} ${variants[variant]} ${className}`} disabled={isLoading} {...props}>
      {isLoading ? <LoaderIcon /> : Icon && <Icon size={18} />}
      {children}
    </motion.button>
  );
};

const ProgressBar = ({ value = 0, status = "safe" }) => {
  const color =
    status === "exceeded"
      ? "bg-rose-500"
      : status === "warning"
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="h-3 overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
};

const emptyCategoryBudget = {
  category: "Food & Dining",
  limit: "",
};

const Budget = () => {
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({ monthlyLimit: "", categoryBudgets: [] });

  const loadBudget = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getBudget();
      setBudgetData(response.data);
      setFormData({
        monthlyLimit: response.data?.budget?.monthlyLimit || "",
        categoryBudgets: response.data?.categoryComparison?.map((item) => ({ category: item.category, limit: item.limit })) || [],
      });
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setBudgetData(null);
        setShowForm(true);
      } else {
        const message = getApiErrorMessage(err, "Budget failed to load.");
        setError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, []);

  const openForm = () => {
    setFormData({
      monthlyLimit: budgetData?.budget?.monthlyLimit || "",
      categoryBudgets: budgetData?.categoryComparison?.map((item) => ({ category: item.category, limit: item.limit })) || [],
    });
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => setShowForm(false);

  const handleMonthlyLimitChange = (event) => {
    setFormData((current) => ({ ...current, monthlyLimit: event.target.value }));
    if (formErrors.monthlyLimit) setFormErrors((current) => ({ ...current, monthlyLimit: "" }));
  };

  const handleCategoryBudgetChange = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      categoryBudgets: current.categoryBudgets.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addCategoryBudget = () => {
    setFormData((current) => ({ ...current, categoryBudgets: [...current.categoryBudgets, emptyCategoryBudget] }));
  };

  const removeCategoryBudget = (index) => {
    setFormData((current) => ({
      ...current,
      categoryBudgets: current.categoryBudgets.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.monthlyLimit || Number(formData.monthlyLimit) <= 0) {
      nextErrors.monthlyLimit = "Monthly budget must be greater than 0";
    }

    const invalidCategory = formData.categoryBudgets.find((item) => !item.limit || Number(item.limit) <= 0);
    if (invalidCategory) {
      nextErrors.categoryBudgets = "Every category budget must be greater than 0";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await setBudget({
        monthlyLimit: Number(formData.monthlyLimit),
        categoryBudgets: formData.categoryBudgets.map((item) => ({ category: item.category, limit: Number(item.limit) })),
      });
      toast.success("Budget saved successfully");
      closeForm();
      loadBudget();
    } catch (err) {
      const message = getApiErrorMessage(err, "Budget could not be saved.");
      setFormErrors({ general: message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const summary = budgetData?.summary;
  const budget = budgetData?.budget;

  const StatusIcon = statusIcon[summary?.status] || CheckCircle2;

  return (
    <div className="relative min-h-screen bg-[#0d1117] text-white overflow-x-hidden selection:bg-indigo-500/30 font-sans">
      <BudgetBackground3D />

      <div className="relative z-10 max-w-7xl mx-auto p-6 pb-24">
        <div className="mb-8 rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200 shadow-sm">
                <Wallet className="h-4 w-4 text-indigo-300" />
                Budget command center
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Premium budget control with real-time clarity
              </h1>
              <p className="text-lg leading-8 text-gray-300">
                Set monthly goals, align category targets, and stay ahead of overspending with a polished budgeting experience.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <PremiumButton icon={Edit2} onClick={openForm}>
                {budgetData ? "Refine budget" : "Create budget"}
              </PremiumButton>
              {budgetData && (
                <Badge variant={statusVariant[summary?.status] || "gray"} className="uppercase tracking-[0.24em] text-xs">
                  {summary?.status || "Safe"}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {error && (
          <Card className="mb-6 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5 text-rose-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Unable to load budget</p>
                <p className="text-sm text-rose-100/80">{error}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          {loading ? (
            <div className="rounded-3xl border border-gray-100 bg-white/5 p-5 text-gray-400 shadow-card dark:border-gray-800 dark:bg-gray-900/50">
              Loading budget...
            </div>
          ) : showForm ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-gray-100 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {budgetData ? "Update budget" : "Create budget"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Monthly budget is required. Category budgets are optional but
                    useful for detailed warnings.
                  </p>
                </div>
                {budgetData && (
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-2xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
                    aria-label="Close form"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {formErrors.general && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300">
                  {formErrors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Monthly budget limit"
                  type="number"
                  min="1"
                  value={formData.monthlyLimit}
                  onChange={handleMonthlyLimitChange}
                  placeholder="30000"
                  error={formErrors.monthlyLimit}
                />

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Category budgets
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Add limits for categories you want to monitor closely.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={Plus}
                      onClick={addCategoryBudget}
                    >
                      Add category
                    </Button>
                  </div>

                  {formErrors.categoryBudgets && (
                    <p className="mb-3 text-sm font-medium text-red-500">
                      {formErrors.categoryBudgets}
                    </p>
                  )}

                  <div className="space-y-3">
                    {formData.categoryBudgets.map((item, index) => (
                      <div
                        key={`${item.category}-${index}`}
                        className="grid gap-3 rounded-2xl border border-gray-100 p-3 dark:border-gray-800 md:grid-cols-[1fr_1fr_auto]"
                      >
                        <Select
                          label="Category"
                          value={item.category}
                          onChange={(event) =>
                            handleCategoryBudgetChange(index, "category", event.target.value)
                          }
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </Select>
                        <Input
                          label="Limit"
                          type="number"
                          min="1"
                          value={item.limit}
                          onChange={(event) =>
                            handleCategoryBudgetChange(index, "limit", event.target.value)
                          }
                          placeholder="5000"
                        />
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="danger"
                            icon={Trash2}
                            onClick={() => removeCategoryBudget(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}

                    {formData.categoryBudgets.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                        No category budgets yet. Your monthly limit will still work.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {budgetData && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" isLoading={submitting}>
                    Save budget
                  </Button>
                </div>
              </form>
            </motion.div>
          ) : null}

          {!budgetData ? (
        <EmptyState
          icon={PiggyBank}
          title="No budget set yet"
          description="Create a monthly budget to unlock progress tracking and spending warnings."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-5 md:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Monthly limit
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(budget?.monthlyLimit)}
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {getMonthName(budget?.month)} {budget?.year}
                  </p>
                </div>
                <div className="rounded-2xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/25 dark:text-primary-300">
                  <Target className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Spent
              </p>
              <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary?.totalSpent)}
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Remaining
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary?.remaining)}
              </p>
            </Card>
          </div>

          <Card className="p-5">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Budget vs Actual
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Overall spending progress for this month.
                </p>
              </div>
              <Badge variant={statusVariant[summary?.status] || "gray"}>
                {summary?.status}
              </Badge>
            </div>

            <div className="rounded-3xl bg-gray-50 p-5 dark:bg-gray-800/50">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 text-primary-600 dark:bg-gray-900 dark:text-primary-300">
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {summary?.percentage || 0}% used
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(summary?.totalSpent)} of{" "}
                      {formatCurrency(budget?.monthlyLimit)}
                    </p>
                  </div>
                </div>
                {summary?.isExceeded && (
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Over by {formatCurrency(summary?.overSpent)}
                  </p>
                )}
              </div>
              <ProgressBar value={summary?.percentage} status={summary?.status} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Category-wise Budget
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Each category limit compared with actual spending.
              </p>
            </div>

            {budgetData.categoryComparison?.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {budgetData.categoryComparison.map((item) => (
                  <div
                    key={item.category}
                    className="rounded-3xl border border-gray-100 p-4 dark:border-gray-800"
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {item.category}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(item.spent)} spent of{" "}
                          {formatCurrency(item.limit)}
                        </p>
                      </div>
                      <Badge variant={statusVariant[item.status] || "gray"}>
                        {item.status}
                      </Badge>
                    </div>
                    <ProgressBar value={item.percentage} status={item.status} />
                    <div className="mt-3 flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{item.percentage}% used</span>
                      <span>{formatCurrency(item.remaining)} left</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Target}
                title="No category budgets"
                description="Add category limits to see detailed budget tracking."
              />
            )}
          </Card>
        </>
      )}
    </div>
  </div>
</div>
  );
};

export default Budget;
