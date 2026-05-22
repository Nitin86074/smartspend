import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  PerspectiveCamera,
  Sparkles,
} from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Edit2,
  FileText,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../api/axios";
import {
  addExpense,
  addRecurringExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../api/expenseApi";
import { exportCSV, exportPDF } from "../api/exportApi";
import EmptyState from "../components/ui/EmptyState";
import { StatCardSkeleton, TableSkeleton } from "../components/ui/Skeleton";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate, formatDateForInput } from "../utils/formatDate";

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

const paymentMethods = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "UPI",
  "Net Banking",
  "Other",
];

const emptyForm = {
  title: "",
  amount: "",
  category: "Other",
  paymentMethod: "Cash",
  date: formatDateForInput(new Date()),
  notes: "",
  isRecurring: false,
  recurringFrequency: "monthly",
};

const initialFilters = {
  search: "",
  category: "All",
  startDate: "",
  endDate: "",
  sortBy: "date",
  order: "desc",
};

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

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

function ExpenseScene3D() {
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

      <Sparkles count={40} scale={12} size={2} color="#8b5cf6" speed={0.2} />
    </>
  );
}

function ExpenseBackground3D() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <Canvas dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <ExpenseScene3D />
        </Suspense>
      </Canvas>
    </div>
  );
}

const PremiumButton = ({
  children,
  icon: Icon,
  isLoading = false,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) => {
  const variants = {
    primary:
      "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.35)] hover:bg-indigo-500",
    secondary:
      "border border-white/10 bg-white/5 text-white backdrop-blur-md hover:bg-white/10",
    ghost: "text-gray-400 hover:bg-white/10 hover:text-white",
    danger:
      "border border-rose-500/30 bg-rose-600/20 text-rose-300 hover:bg-rose-600/35",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      disabled={isLoading || props.disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
      {children}
    </motion.button>
  );
};

const Pill = ({ children }) => (
  <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-gray-300 backdrop-blur-sm">
    {children}
  </span>
);

const StatCard = ({ icon: Icon, label, value, helper, line = "indigo" }) => {
  const tone = statLines[line] || statLines.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-2xl"
    >
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
      {helper && <p className="mt-2 truncate text-sm text-gray-500">{helper}</p>}
    </motion.div>
  );
};

const Field = ({ label, icon: Icon, error, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-gray-300">{label}</span>
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      )}
      {children}
    </div>
    {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
  </label>
);

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  const queryParams = useMemo(
    () => ({
      page,
      limit: 8,
      search: filters.search || undefined,
      category: filters.category !== "All" ? filters.category : undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      sortBy: filters.sortBy,
      order: filters.order,
    }),
    [filters, page],
  );

  const loadExpenses = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getExpenses(queryParams);
      setExpenses(response.data?.expenses || []);
      setPagination(response.data?.pagination || null);
      setSummary(response.data?.summary || null);
    } catch (err) {
      const message = getApiErrorMessage(err, "Expenses failed to load.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const resetForm = () => {
    setFormData(emptyForm);
    setFormErrors({});
    setEditingExpense(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title || "",
      amount: expense.amount || "",
      category: expense.category || "Other",
      paymentMethod: expense.paymentMethod || "Cash",
      date: formatDateForInput(expense.date),
      notes: expense.notes || "",
      isRecurring: Boolean(expense.isRecurring),
      recurringFrequency: expense.recurringFrequency || "monthly",
    });
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };

  const handleFormChange = (event) => {
    const { name, type, checked, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (formErrors[name]) {
      setFormErrors((current) => ({ ...current, [name]: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.title.trim()) nextErrors.title = "Title is required";
    if (!formData.amount || Number(formData.amount) <= 0) {
      nextErrors.amount = "Amount must be greater than 0";
    }
    if (!formData.date) nextErrors.date = "Date is required";

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    const payload = {
      title: formData.title.trim(),
      amount: Number(formData.amount),
      category: formData.category,
      paymentMethod: formData.paymentMethod,
      date: formData.date,
      notes: formData.notes.trim(),
    };

    setSubmitting(true);

    try {
      if (editingExpense) {
        await updateExpense(editingExpense._id, payload);
        toast.success("Expense updated successfully");
      } else if (formData.isRecurring) {
        await addRecurringExpense({
          ...payload,
          recurringFrequency: formData.recurringFrequency,
        });
        toast.success("Recurring expense added successfully");
      } else {
        await addExpense(payload);
        toast.success("Expense added successfully");
      }

      closeForm();
      loadExpenses();
    } catch (err) {
      const message = getApiErrorMessage(err, "Expense could not be saved.");
      toast.error(message);
      setFormErrors({ general: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (expense) => {
    const confirmed = window.confirm(`Delete "${expense.title}"?`);
    if (!confirmed) return;

    try {
      await deleteExpense(expense._id);
      toast.success("Expense deleted");
      loadExpenses();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Expense could not be deleted."));
    }
  };

  const handleExport = async (type) => {
    setExporting(type);

    try {
      const params = {
        category: filters.category !== "All" ? filters.category : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };

      if (type === "csv") {
        await exportCSV(params);
      } else {
        await exportPDF(params);
      }

      toast.success(`${type.toUpperCase()} export started`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Export failed."));
    } finally {
      setExporting("");
    }
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  const filteredTotal = summary?.filteredTotal || 0;
  const allTimeTotal = summary?.allTimeTotal || 0;
  const showing = summary?.showing || expenses.length;
  const highestExpense = expenses.reduce(
    (highest, expense) =>
      Number(expense.amount || 0) > Number(highest?.amount || 0) ? expense : highest,
    null,
  );
  const hasActiveFilters =
    filters.search ||
    filters.category !== "All" ||
    filters.startDate ||
    filters.endDate ||
    filters.sortBy !== initialFilters.sortBy ||
    filters.order !== initialFilters.order;

  return (
    <div className="relative min-h-[calc(100dvh-8rem)] overflow-hidden rounded-[28px] bg-[#0d1117] text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] selection:bg-indigo-500/30">
      <ExpenseBackground3D />

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 p-5 pb-24 sm:p-6 lg:p-8">
        <div className="mt-2 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-4xl font-extrabold tracking-normal text-transparent lg:text-5xl">
              Expenses
            </h1>
            <p className="text-lg text-gray-400">
              Manage and track your outgoing cash flow.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-wrap gap-3"
          >
            <PremiumButton
              icon={Download}
              variant="secondary"
              isLoading={exporting === "csv"}
              onClick={() => handleExport("csv")}
            >
              CSV
            </PremiumButton>
            <PremiumButton
              icon={FileText}
              variant="secondary"
              isLoading={exporting === "pdf"}
              onClick={() => handleExport("pdf")}
            >
              PDF
            </PremiumButton>
            <PremiumButton icon={Plus} onClick={openCreateForm}>
              Add Expense
            </PremiumButton>
          </motion.div>
        </div>

        {loading && !summary ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <StatCard
              icon={DollarSign}
              label="Filtered Total"
              value={formatCurrency(filteredTotal)}
              helper="Current filters"
              line="indigo"
            />
            <StatCard
              icon={TrendingDown}
              label="Highest Visible"
              value={formatCurrency(highestExpense?.amount || 0)}
              helper={highestExpense?.title || "No expense yet"}
              line="rose"
            />
            <StatCard
              icon={Wallet}
              label="All-time Spending"
              value={formatCurrency(allTimeTotal)}
              helper={`${showing} visible transactions`}
              line="emerald"
            />
          </div>
        )}

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-md"
        >
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr_auto]">
            <Field label="Search" icon={Search}>
              <input
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search expenses..."
                className={`${inputClass} pl-10`}
              />
            </Field>
            <Field label="Category" icon={Filter}>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className={`${inputClass} pl-10`}
              >
                <option value="All" className="bg-gray-900">
                  All Categories
                </option>
                {categories.map((category) => (
                  <option key={category} value={category} className="bg-gray-900">
                    {category}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start date" icon={Calendar}>
              <input
                name="startDate"
                type="date"
                value={filters.startDate}
                onChange={handleFilterChange}
                className={`${inputClass} pl-10 [color-scheme:dark]`}
              />
            </Field>
            <Field label="End date" icon={Calendar}>
              <input
                name="endDate"
                type="date"
                value={filters.endDate}
                onChange={handleFilterChange}
                className={`${inputClass} pl-10 [color-scheme:dark]`}
              />
            </Field>
            <Field label="Sort">
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className={inputClass}
              >
                <option value="date" className="bg-gray-900">
                  Date
                </option>
                <option value="amount" className="bg-gray-900">
                  Amount
                </option>
                <option value="title" className="bg-gray-900">
                  Title
                </option>
                <option value="category" className="bg-gray-900">
                  Category
                </option>
              </select>
            </Field>
            <div className="flex items-end gap-2">
              <PremiumButton
                variant="secondary"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    order: current.order === "desc" ? "asc" : "desc",
                  }))
                }
              >
                {filters.order === "desc" ? "Desc" : "Asc"}
              </PremiumButton>
              {hasActiveFilters && (
                <PremiumButton variant="ghost" icon={RefreshCw} onClick={clearFilters}>
                  Reset
                </PremiumButton>
              )}
            </div>
          </div>
        </motion.section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={6} />
            </div>
          ) : error ? (
            <div className="p-6">
              <EmptyState
                title="Could not load expenses"
                description={error}
                actionLabel="Retry"
                onAction={loadExpenses}
              />
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No expenses found"
                description="Create your first expense or adjust the filters."
                icon={CreditCard}
                actionLabel="Add your first expense"
                onAction={openCreateForm}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-sm uppercase tracking-wider text-gray-400">
                      <th className="p-5 font-semibold">Date</th>
                      <th className="p-5 font-semibold">Title</th>
                      <th className="p-5 font-semibold">Category</th>
                      <th className="p-5 font-semibold">Payment</th>
                      <th className="p-5 font-semibold">Amount</th>
                      <th className="p-5 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {expenses.map((expense, index) => (
                        <motion.tr
                          key={expense._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.03 }}
                          className="group border-b border-white/5 transition-colors hover:bg-white/5"
                        >
                          <td className="whitespace-nowrap p-5 text-gray-300">
                            {formatDate(expense.date)}
                          </td>
                          <td className="min-w-52 p-5">
                            <p className="font-medium text-white">{expense.title}</p>
                            {expense.notes && (
                              <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                                {expense.notes}
                              </p>
                            )}
                          </td>
                          <td className="p-5">
                            <div className="flex flex-wrap gap-2">
                              <Pill>{expense.category}</Pill>
                              {expense.isRecurring && <Pill>Recurring</Pill>}
                            </div>
                          </td>
                          <td className="p-5">
                            <Pill>{expense.paymentMethod || "Cash"}</Pill>
                          </td>
                          <td className="p-5 font-bold text-indigo-300">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="whitespace-nowrap p-5 text-right">
                            <button
                              type="button"
                              onClick={() => openEditForm(expense)}
                              className="inline-flex p-2 text-gray-400 transition-colors hover:text-indigo-400"
                              aria-label="Edit expense"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(expense)}
                              className="inline-flex p-2 text-gray-400 transition-colors hover:text-rose-400"
                              aria-label="Delete expense"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-400">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <PremiumButton
                      variant="secondary"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      Previous
                    </PremiumButton>
                    <PremiumButton
                      variant="secondary"
                      disabled={!pagination.hasNextPage}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                    </PremiumButton>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeForm}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#161b22]/95 shadow-2xl backdrop-blur-2xl"
            >
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              <div className="p-6 sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">
                    {editingExpense ? "Edit Expense" : "Add Expense"}
                  </h2>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-full p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Close form"
                  >
                    <X size={20} />
                  </button>
                </div>

                {formErrors.general && (
                  <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
                    {formErrors.general}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field label="Title" error={formErrors.title}>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      placeholder="E.g., Groceries"
                      className={`${inputClass} ${formErrors.title ? "border-rose-500" : ""}`}
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Amount" error={formErrors.amount} icon={DollarSign}>
                      <input
                        name="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.amount}
                        onChange={handleFormChange}
                        placeholder="0.00"
                        className={`${inputClass} pl-10 ${formErrors.amount ? "border-rose-500" : ""}`}
                      />
                    </Field>
                    <Field label="Date" error={formErrors.date}>
                      <input
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleFormChange}
                        className={`${inputClass} [color-scheme:dark] ${formErrors.date ? "border-rose-500" : ""}`}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Category">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleFormChange}
                        className={inputClass}
                      >
                        {categories.map((category) => (
                          <option key={category} value={category} className="bg-gray-900">
                            {category}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Payment method">
                      <select
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleFormChange}
                        className={inputClass}
                      >
                        {paymentMethods.map((method) => (
                          <option key={method} value={method} className="bg-gray-900">
                            {method}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Notes">
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleFormChange}
                      rows="2"
                      placeholder="Optional notes"
                      className={`${inputClass} resize-none`}
                    />
                  </Field>

                  {!editingExpense && (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <label className="flex items-center gap-3 text-sm font-medium text-gray-300">
                        <input
                          type="checkbox"
                          name="isRecurring"
                          checked={formData.isRecurring}
                          onChange={handleFormChange}
                          className="h-4 w-4 rounded border-white/20 bg-black/30 text-indigo-600 focus:ring-indigo-500"
                        />
                        Make this recurring
                      </label>

                      {formData.isRecurring && (
                        <div className="mt-4">
                          <Field label="Frequency">
                            <select
                              name="recurringFrequency"
                              value={formData.recurringFrequency}
                              onChange={handleFormChange}
                              className={inputClass}
                            >
                              <option value="daily" className="bg-gray-900">
                                Daily
                              </option>
                              <option value="weekly" className="bg-gray-900">
                                Weekly
                              </option>
                              <option value="monthly" className="bg-gray-900">
                                Monthly
                              </option>
                            </select>
                          </Field>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <PremiumButton variant="secondary" onClick={closeForm}>
                      Cancel
                    </PremiumButton>
                    <PremiumButton type="submit" isLoading={submitting}>
                      {editingExpense ? "Save Changes" : "Add Expense"}
                    </PremiumButton>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Expenses;
