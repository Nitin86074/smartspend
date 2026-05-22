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
  DollarSign,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../api/axios";
import { addIncome, deleteIncome, getIncome } from "../api/incomeApi";
import EmptyState from "../components/ui/EmptyState";
import { TableSkeleton } from "../components/ui/Skeleton";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate, formatDateForInput } from "../utils/formatDate";

const categories = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Rental",
  "Gift",
  "Other",
];

const emptyForm = {
  title: "",
  amount: "",
  category: "Salary",
  date: formatDateForInput(new Date()),
  notes: "",
  isRecurring: false,
};

const initialFilters = {
  category: "All",
  startDate: "",
  endDate: "",
};

const categoryVariant = {
  Salary: "green",
  Freelance: "blue",
  Business: "indigo",
  Investment: "yellow",
  Rental: "blue",
  Gift: "green",
  Other: "gray",
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

function IncomeScene3D() {
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

function IncomeBackground3D() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <Canvas dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <IncomeScene3D />
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

const Income = () => {
  const [income, setIncome] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const queryParams = useMemo(
    () => ({
      page,
      limit: 8,
      category: filters.category !== "All" ? filters.category : undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    }),
    [filters, page]
  );

  const loadIncome = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getIncome(queryParams);
      setIncome(response.data?.incomes || []);
      setSummary(response.data?.summary || null);
      setPagination(response.data?.pagination || null);
    } catch (err) {
      const message = getApiErrorMessage(err, "Income failed to load.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const resetForm = () => {
    setFormData(emptyForm);
    setFormErrors({});
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };

  const handleFormChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (formErrors[name]) {
      setFormErrors((current) => ({ ...current, [name]: "" }));
    }
  };

  const validate = () => {
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

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      await addIncome({
        title: formData.title.trim(),
        amount: Number(formData.amount),
        category: formData.category,
        date: formData.date,
        notes: formData.notes.trim(),
        isRecurring: formData.isRecurring,
      });

      toast.success("Income added successfully");
      setShowForm(false);
      resetForm();
      loadIncome();
    } catch (err) {
      const message = getApiErrorMessage(err, "Income could not be saved.");
      setFormErrors({ general: message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete "${item.title}"?`);
    if (!confirmed) return;

    try {
      await deleteIncome(item._id);
      toast.success("Income deleted");
      loadIncome();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Income could not be deleted."));
    }
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  const totalIncome = summary?.totalIncome ?? income.reduce((sum, item) => sum + Number(item.amount), 0);
  const highestIncome = income.reduce(
    (max, item) => Math.max(max, Number(item.amount)),
    0
  );

  return (
    <div className="relative min-h-[calc(100dvh-8rem)] overflow-hidden rounded-[28px] bg-[#0d1117] text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] selection:bg-indigo-500/30">
      <IncomeBackground3D />

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 p-5 pb-24 sm:p-6 lg:p-8">
        <div className="mt-2 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-4xl font-extrabold tracking-normal text-transparent lg:text-5xl">
              Income
            </h1>
            <p className="text-lg text-gray-400">
              Track earnings, recurring revenue, and incoming cash flow.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-wrap gap-3"
          >
            <PremiumButton variant="secondary" icon={RefreshCw} onClick={clearFilters}>
              Reset
            </PremiumButton>
            <PremiumButton icon={Plus} onClick={() => setShowForm(true)}>
              Add Income
            </PremiumButton>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            icon={DollarSign}
            label="All Income"
            value={formatCurrency(totalIncome)}
            helper="Latest earnings summarized from your records"
            line="emerald"
          />
          <StatCard
            icon={Wallet}
            label="Highest Entry"
            value={formatCurrency(highestIncome)}
            helper="Your largest income source in view"
            line="indigo"
          />
          <StatCard
            icon={RefreshCw}
            label="Recurring Status"
            value={`${income.filter((item) => item.isRecurring).length} / ${income.length || 1}`}
            helper="Recurring income sources in the current view"
            line="rose"
          />
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-md"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <Field label="Category">
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className={inputClass}
              >
                <option value="All" className="bg-gray-900">
                  All categories
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
            <div className="flex items-end">
              <PremiumButton variant="ghost" icon={RefreshCw} onClick={clearFilters}>
                Reset
              </PremiumButton>
            </div>
          </div>
        </motion.section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-4 border-b border-white/10 bg-white/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Income records</p>
              <h2 className="mt-1 text-lg font-semibold text-white">All logged income</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <PremiumButton icon={Plus} onClick={() => setShowForm(true)}>
                Add Income
              </PremiumButton>
              <Pill>{income.length} entries</Pill>
            </div>
          </div>

          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={6} />
            </div>
          ) : error ? (
            <div className="p-6">
              <EmptyState title="Could not load income" description={error} />
            </div>
          ) : income.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Wallet}
                title="No income found"
                description="Add your first income source or adjust the filters."
                actionLabel="Add income"
                onAction={() => setShowForm(true)}
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-sm uppercase tracking-wider text-gray-400">
                      <th className="p-5 font-semibold">Income</th>
                      <th className="p-5 font-semibold">Category</th>
                      <th className="p-5 font-semibold">Date</th>
                      <th className="p-5 font-semibold">Recurring</th>
                      <th className="p-5 text-right font-semibold">Amount</th>
                      <th className="p-5 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {income.map((item) => (
                      <motion.tr
                        key={item._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group border-b border-white/5 transition-colors hover:bg-white/5"
                      >
                        <td className="min-w-52 p-5">
                          <p className="font-medium text-white">{item.title}</p>
                          {item.notes && (
                            <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                              {item.notes}
                            </p>
                          )}
                        </td>
                        <td className="p-5">
                          <Pill variant={categoryVariant[item.category] || "gray"}>
                            {item.category}
                          </Pill>
                        </td>
                        <td className="whitespace-nowrap p-5 text-gray-300">
                          {formatDate(item.date)}
                        </td>
                        <td className="p-5">
                          <Pill>{item.isRecurring ? "Recurring" : "One-time"}</Pill>
                        </td>
                        <td className="p-5 text-right font-bold text-emerald-300">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="whitespace-nowrap p-5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="inline-flex p-2 text-gray-400 transition-colors hover:text-rose-400"
                            aria-label="Delete income"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 lg:hidden">
                {income.map((item) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {formatDate(item.date)}
                        </p>
                      </div>
                      <p className="font-bold text-emerald-300">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                    {item.notes && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                        {item.notes}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill variant={categoryVariant[item.category] || "gray"}>
                        {item.category}
                      </Pill>
                      <Pill>{item.isRecurring ? "Recurring" : "One-time"}</Pill>
                    </div>
                    <div className="mt-4">
                      <PremiumButton
                        variant="danger"
                        icon={Trash2}
                        onClick={() => handleDelete(item)}
                      >
                        Delete
                      </PremiumButton>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-400">
                Page {pagination.currentPage} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <PremiumButton
                  variant="secondary"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </PremiumButton>
                <PremiumButton
                  variant="secondary"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </PremiumButton>
              </div>
            </div>
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
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
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
                  <div>
                    <h2 className="text-2xl font-bold text-white">Add Income</h2>
                    <p className="mt-1 text-sm text-gray-400">
                      Save salary, freelance work, business revenue, gifts, or other earnings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
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
                      placeholder="April salary, freelance project"
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
                        placeholder="50000"
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
                    <Field label="Recurring income">
                      <label className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-medium text-gray-300">
                        <input
                          type="checkbox"
                          name="isRecurring"
                          checked={formData.isRecurring}
                          onChange={handleFormChange}
                          className="h-4 w-4 rounded border-white/20 bg-black/30 text-indigo-600 focus:ring-indigo-500"
                        />
                        Recurring income
                      </label>
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

                  <div className="flex justify-end gap-3 pt-4">
                    <PremiumButton
                      variant="secondary"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </PremiumButton>
                    <PremiumButton type="submit" isLoading={submitting}>
                      Save Income
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

export default Income;
