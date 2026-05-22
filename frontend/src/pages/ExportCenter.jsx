import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../api/axios";
import { exportCSV, exportPDF } from "../api/exportApi";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

const categories = [
  "All",
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
  "All",
  "Cash",
  "Credit Card",
  "Debit Card",
  "UPI",
  "Net Banking",
  "Other",
];

const initialFilters = {
  category: "All",
  paymentMethod: "All",
  startDate: "",
  endDate: "",
};

const ExportCard = ({
  description,
  icon: Icon,
  isLoading,
  onClick,
  title,
  tone = "primary",
}) => {
  const tones = {
    green:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-300",
    primary:
      "bg-primary-50 text-primary-600 dark:bg-primary-900/25 dark:text-primary-300",
  };

  return (
    <Card className="p-5" interactive>
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              {description}
            </p>
          </div>
          <div className={`rounded-2xl p-3 ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <Button
          className="mt-6 w-full"
          icon={Download}
          isLoading={isLoading}
          onClick={onClick}
          variant={tone === "green" ? "secondary" : "primary"}
        >
          Download {title}
        </Button>
      </div>
    </Card>
  );
};

const ExportCenter = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [exporting, setExporting] = useState("");

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const buildParams = () => ({
    category: filters.category !== "All" ? filters.category : undefined,
    paymentMethod:
      filters.paymentMethod !== "All" ? filters.paymentMethod : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });

  const handleExport = async (type) => {
    setExporting(type);

    try {
      if (type === "pdf") {
        await exportPDF(buildParams());
      } else {
        await exportCSV(buildParams());
      }

      toast.success(`${type.toUpperCase()} download started`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, `${type.toUpperCase()} export failed.`));
    } finally {
      setExporting("");
    }
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "category" || key === "paymentMethod") return value !== "All";
    return Boolean(value);
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-300">
            <FileText className="h-4 w-4" />
            Report downloads
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Export Center
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Download clean SmartSpend reports for review, college demo,
            portfolio screenshots, or offline record keeping.
          </p>
        </div>

        <Badge variant={activeFilterCount > 0 ? "blue" : "gray"}>
          {activeFilterCount} active filters
        </Badge>
      </div>

      <Card className="p-5">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <Filter className="h-5 w-5 text-primary-600 dark:text-primary-300" />
              Export Filters
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Filters apply to both PDF and CSV downloads.
            </p>
          </div>
          <Button variant="ghost" icon={RefreshCw} onClick={resetFilters}>
            Reset
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Category"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "All" ? "All categories" : category}
              </option>
            ))}
          </Select>

          <Select
            label="Payment method"
            name="paymentMethod"
            value={filters.paymentMethod}
            onChange={handleFilterChange}
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method === "All" ? "All methods" : method}
              </option>
            ))}
          </Select>

          <Input
            icon={Calendar}
            label="Start date"
            name="startDate"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange}
          />

          <Input
            icon={Calendar}
            label="End date"
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ExportCard
          icon={FileText}
          title="PDF Report"
          description="A polished expense report with summary, category breakdown, and transaction table. Best for demos and sharing."
          isLoading={exporting === "pdf"}
          onClick={() => handleExport("pdf")}
        />
        <ExportCard
          icon={FileSpreadsheet}
          title="CSV File"
          description="A spreadsheet-friendly export of expense records. Best for analysis, backup, and manual checking."
          isLoading={exporting === "csv"}
          onClick={() => handleExport("csv")}
          tone="green"
        />
      </div>

      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <p className="mt-3 font-semibold text-gray-900 dark:text-white">
              Uses secure token auth
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Downloads use your logged-in session token.
            </p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
            <ShieldCheck className="h-5 w-5 text-primary-500" />
            <p className="mt-3 font-semibold text-gray-900 dark:text-white">
              Exports your own data
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Backend routes are protected per user.
            </p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
            <Download className="h-5 w-5 text-amber-500" />
            <p className="mt-3 font-semibold text-gray-900 dark:text-white">
              Browser download
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The file is generated by the API and downloaded automatically.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExportCenter;
