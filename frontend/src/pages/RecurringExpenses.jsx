import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  PauseCircle,
  Plus,
  RefreshCw,
  Repeat,
  WalletCards,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../api/axios";
import {
  addRecurringExpense,
  getRecurringExpenses,
  toggleRecurringExpense,
} from "../api/expenseApi";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { TableSkeleton } from "../components/ui/Skeleton";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";

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
  category: "Bills & Utilities",
  paymentMethod: "UPI",
  recurringFrequency: "monthly",
  notes: "",
};

const dueStatusMeta = {
  overdue: { label: "Overdue", variant: "red" },
  due_today: { label: "Due today", variant: "yellow" },
  due_soon: { label: "Due soon", variant: "yellow" },
  upcoming: { label: "Upcoming", variant: "green" },
};

const frequencyLabel = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const getDueText = (expense) => {
  if (expense.dueStatus === "overdue") {
    return `${Math.abs(expense.daysUntilDue || 0)} day(s) overdue`;
  }

  if (expense.dueStatus === "due_today") return "Due today";

  if (typeof expense.daysUntilDue === "number") {
    return `Due in ${expense.daysUntilDue} day(s)`;
  }

  return "Next due date ready";
};

const RecurringExpenses = () => {
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  const activeCount = useMemo(
    () => recurringExpenses.filter((expense) => expense.isActive).length,
    [recurringExpenses]
  );

  const dueSoonCount = useMemo(
    () =>
      recurringExpenses.filter((expense) =>
        ["overdue", "due_today", "due_soon"].includes(expense.dueStatus)
      ).length,
    [recurringExpenses]
  );

  const loadRecurringExpenses = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getRecurringExpenses();
      setRecurringExpenses(response.data?.recurringExpenses || []);
      setSummary(response.data?.summary || null);
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "Recurring expenses failed to load."
      );
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecurringExpenses();
  }, []);

  const openForm = () => {
    setFormData(emptyForm);
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(emptyForm);
    setFormErrors({});
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));

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

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      await addRecurringExpense({
        title: formData.title.trim(),
        amount: Number(formData.amount),
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        recurringFrequency: formData.recurringFrequency,
        notes: formData.notes.trim(),
      });

      toast.success("Recurring expense created");
      closeForm();
      loadRecurringExpenses();
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "Recurring expense could not be created."
      );
      setFormErrors({ general: message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (expense) => {
    setTogglingId(expense._id);

    try {
      const response = await toggleRecurringExpense(expense._id);
      toast.success(response.message || "Recurring expense updated");
      loadRecurringExpenses();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Recurring expense status could not be changed.")
      );
    } finally {
      setTogglingId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-300">
            <Repeat className="h-4 w-4" />
            Automatic spending
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Recurring Expenses
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Track subscriptions, bills, and repeated payments so your monthly
            plan does not miss silent spending.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={loadRecurringExpenses}>
            Refresh
          </Button>
          <Button icon={Plus} onClick={openForm}>
            Add recurring
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total recurring
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.totalRecurring || recurringExpenses.length}
              </p>
            </div>
            <Repeat className="h-5 w-5 text-primary-500" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Estimated monthly cost
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary?.estimatedMonthlyCost || 0)}
              </p>
            </div>
            <WalletCards className="h-5 w-5 text-emerald-500" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Active payments
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {activeCount}
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Needs attention
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {dueSoonCount}
              </p>
            </div>
            <Clock3 className="h-5 w-5 text-amber-500" />
          </div>
        </Card>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-gray-100 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Add recurring expense
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Use this for rent, subscriptions, utilities, and other repeated
                payments.
              </p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-2xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label="Close form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {formErrors.general && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300">
              {formErrors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Input
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="Netflix, rent, electricity bill"
                error={formErrors.title}
              />
            </div>
            <Input
              label="Amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={handleFormChange}
              placeholder="999"
              error={formErrors.amount}
            />
            <Select
              label="Frequency"
              name="recurringFrequency"
              value={formData.recurringFrequency}
              onChange={handleFormChange}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>

            <Select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleFormChange}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
            <Select
              label="Payment method"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleFormChange}
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </Select>
            <div className="lg:col-span-2">
              <Input
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Optional payment note"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 lg:col-span-4">
              <Button variant="secondary" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Create recurring expense
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : error ? (
          <div className="p-5">
            <EmptyState title="Could not load recurring expenses" description={error} />
          </div>
        ) : recurringExpenses.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Repeat}
              title="No recurring expenses yet"
              description="Add subscriptions, bills, or repeated payments to make your monthly plan more realistic."
              actionLabel="Add recurring"
              onAction={openForm}
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-4">Expense</th>
                    <th className="px-5 py-4">Schedule</th>
                    <th className="px-5 py-4">Next due</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Amount</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {recurringExpenses.map((expense) => {
                    const dueMeta = dueStatusMeta[expense.dueStatus] || dueStatusMeta.upcoming;

                    return (
                      <tr
                        key={expense._id}
                        className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-5 py-4">
                          <div className="max-w-xs">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {expense.title}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="indigo">{expense.category}</Badge>
                              <Badge variant="gray">{expense.paymentMethod}</Badge>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="blue">
                            {frequencyLabel[expense.recurringFrequency] ||
                              expense.recurringFrequency}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <CalendarClock className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium">
                                {formatDate(expense.nextDueDate)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {getDueText(expense)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={dueMeta.variant}>{dueMeta.label}</Badge>
                            <Badge variant={expense.isActive ? "green" : "gray"}>
                              {expense.isActive ? "Active" : "Paused"}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            variant={expense.isActive ? "secondary" : "primary"}
                            size="sm"
                            icon={expense.isActive ? PauseCircle : CheckCircle2}
                            isLoading={togglingId === expense._id}
                            onClick={() => handleToggle(expense)}
                          >
                            {expense.isActive ? "Pause" : "Activate"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {recurringExpenses.map((expense) => {
                const dueMeta = dueStatusMeta[expense.dueStatus] || dueStatusMeta.upcoming;

                return (
                  <div
                    key={expense._id}
                    className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900 dark:text-white">
                          {expense.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {frequencyLabel[expense.recurringFrequency] ||
                            expense.recurringFrequency}{" "}
                          payment
                        </p>
                      </div>
                      <p className="flex-shrink-0 font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="indigo">{expense.category}</Badge>
                      <Badge variant="gray">{expense.paymentMethod}</Badge>
                      <Badge variant={dueMeta.variant}>{dueMeta.label}</Badge>
                      <Badge variant={expense.isActive ? "green" : "gray"}>
                        {expense.isActive ? "Active" : "Paused"}
                      </Badge>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-gray-950">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Next due
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {formatDate(expense.nextDueDate)} - {getDueText(expense)}
                        </p>
                      </div>
                      <Button
                        variant={expense.isActive ? "secondary" : "primary"}
                        size="sm"
                        icon={expense.isActive ? PauseCircle : CheckCircle2}
                        isLoading={togglingId === expense._id}
                        onClick={() => handleToggle(expense)}
                      >
                        {expense.isActive ? "Pause" : "Activate"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default RecurringExpenses;
