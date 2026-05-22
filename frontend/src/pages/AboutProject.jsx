import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Code2,
  CircleDollarSign,
  Database,
  FileText,
  Layers3,
  LockKeyhole,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";

const highlights = [
  {
    icon: WalletCards,
    title: "Complete Finance Workflow",
    description:
      "SmartSpend covers income, expenses, budgets, recurring payments, analytics, insights, and exports in one connected product.",
  },
  {
    icon: Brain,
    title: "Smart Insight Layer",
    description:
      "The app turns raw transactions into highest-category signals, budget health, monthly comparisons, and saving suggestions.",
  },
  {
    icon: ShieldCheck,
    title: "Production-Style Backend",
    description:
      "JWT auth, protected routes, validation, global error handling, rate limiting, logging, and MongoDB persistence make the API demo-ready.",
  },
  {
    icon: BarChart3,
    title: "Modern SaaS Frontend",
    description:
      "The dashboard uses responsive layouts, reusable UI components, dark mode, skeleton loading, empty states, charts, and polished navigation.",
  },
];

const techStack = [
  { label: "React", group: "Frontend" },
  { label: "Tailwind CSS", group: "Frontend" },
  { label: "React Router", group: "Frontend" },
  { label: "Axios", group: "Frontend" },
  { label: "Recharts", group: "Frontend" },
  { label: "Framer Motion", group: "Frontend" },
  { label: "Node.js", group: "Backend" },
  { label: "Express", group: "Backend" },
  { label: "MongoDB", group: "Database" },
  { label: "JWT", group: "Security" },
  { label: "PDFKit", group: "Export" },
  { label: "Winston", group: "Logging" },
];

const modules = [
  "Authentication and protected routes",
  "Expense CRUD with filtering, sorting, and pagination",
  "Income tracking and balance calculation",
  "Monthly and category-wise budgets",
  "Recurring expense management",
  "Analytics charts and trend reporting",
  "Smart insights and saving suggestions",
  "CSV and PDF report exports",
  "API documentation and clean error responses",
];

const demoTalkingPoints = [
  "This is not a static UI. The frontend is connected to a protected backend API.",
  "The dashboard has real SaaS patterns: sidebar, navbar, cards, tables, filters, loading states, and dark mode.",
  "The backend protects data with JWT auth and returns consistent success/error responses.",
  "The reporting flow supports both visual analytics and downloadable PDF/CSV exports.",
];

const howItWorks = [
  {
    icon: LockKeyhole,
    title: "User authenticates",
    text: "The user logs in or registers. The backend creates a secure HTTP-only session cookie for protected API calls.",
  },
  {
    icon: CircleDollarSign,
    title: "Finance data is recorded",
    text: "Expenses, income, recurring payments, budgets, and accounts are saved through protected Express routes.",
  },
  {
    icon: Database,
    title: "MongoDB stores records",
    text: "Each finance record is linked to the logged-in user, so dashboard data remains user-specific.",
  },
  {
    icon: Brain,
    title: "Insights are calculated",
    text: "Controllers compare income, spending, budgets, categories, and monthly trends to generate smart signals.",
  },
  {
    icon: BarChart3,
    title: "Frontend visualizes results",
    text: "React pages turn API data into cards, charts, badges, tables, warnings, and empty or loading states.",
  },
  {
    icon: FileText,
    title: "Reports are exported",
    text: "The backend generates downloadable CSV and PDF reports so the product has a real reporting workflow.",
  },
];

const AboutProject = () => {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div>
            <Badge variant="indigo">Portfolio project</Badge>
            <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
              SmartSpend is an AI powered expense management system built like a
              modern SaaS dashboard.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300 sm:text-base">
              It helps users track money, control budgets, understand spending
              patterns, and export reports. The goal is to show full-stack
              product thinking: clean UI, protected APIs, real data workflows,
              validation, analytics, and demo-ready polish.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-700"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="http://localhost:5000/api/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                API docs
                <FileText className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard icon={Layers3} label="Product Modules" value="9+" />
            <MetricCard icon={LockKeyhole} label="Auth" value="JWT" />
            <MetricCard icon={Database} label="Database" value="MongoDB" />
            <MetricCard icon={Rocket} label="Demo Status" value="Polished" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlights.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} className="p-5" interactive>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-900/25 dark:text-primary-300">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="font-bold text-gray-950 dark:text-white">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                {item.description}
              </p>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                Core Modules
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                What the project currently supports.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {modules.map((module) => (
              <div
                key={module}
                className="flex items-start gap-3 rounded-2xl border border-gray-100 p-3 dark:border-gray-800"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {module}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/25 dark:text-primary-300">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                Tech Stack
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Technologies used across frontend, backend, database, and
                reporting.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {techStack.map((tech) => (
              <div
                key={tech.label}
                className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800"
              >
                <p className="font-bold text-gray-950 dark:text-white">
                  {tech.label}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {tech.group}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-300">
              <Layers3 className="h-4 w-4" />
              How SmartSpend works
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
              From authentication to financial intelligence.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
              This section explains the project flow in a way you can speak
              confidently during a demo, viva, or interview.
            </p>
          </div>
          <Badge variant="blue">End-to-end flow</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {howItWorks.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="rounded-3xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950"
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-900/25 dark:text-primary-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-bold text-gray-300 dark:text-gray-700">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="font-bold text-gray-950 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {step.text}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-900/25 dark:text-amber-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                Demo Talking Points
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use these points when explaining SmartSpend.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {demoTalkingPoints.map((point) => (
              <div
                key={point}
                className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60"
              >
                <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/25 dark:text-blue-300">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                Architecture Story
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Simple way to explain the system.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <ArchitectureStep label="1" text="React frontend sends requests through a central Axios API layer." />
            <ArchitectureStep label="2" text="HTTP-only session cookies protect dashboard routes and backend APIs." />
            <ArchitectureStep label="3" text="Express controllers handle finance logic and validation." />
            <ArchitectureStep label="4" text="MongoDB stores users, expenses, income, budgets, accounts, and recurring records." />
          </div>
        </Card>
      </section>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950">
    <Icon className="h-5 w-5 text-primary-600 dark:text-primary-300" />
    <p className="mt-5 text-2xl font-bold text-gray-950 dark:text-white">
      {value}
    </p>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{label}</p>
  </div>
);

const ArchitectureStep = ({ label, text }) => (
  <div className="flex gap-3 rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white">
      {label}
    </div>
    <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
      {text}
    </p>
  </div>
);

export default AboutProject;
