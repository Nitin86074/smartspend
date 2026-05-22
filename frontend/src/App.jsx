import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import PublicRoute from "./components/layout/PublicRoute";
import ScrollToTop from "./components/layout/ScrollToTop";
import Skeleton from "./components/ui/Skeleton";

const AboutProject = lazy(() => import("./pages/AboutProject"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Budget = lazy(() => import("./pages/Budget"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ExportCenter = lazy(() => import("./pages/ExportCenter"));
const Expenses = lazy(() => import("./pages/Expenses"));
const GrowthAnalytics = lazy(() => import("./pages/GrowthAnalytics"));
const Income = lazy(() => import("./pages/Income"));
const Insights = lazy(() => import("./pages/Insights"));
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const MonthlyReport = lazy(() => import("./pages/MonthlyReport"));
const RecurringExpenses = lazy(() => import("./pages/RecurringExpenses"));
const Register = lazy(() => import("./pages/Register"));
const Settings = lazy(() => import("./pages/Settings"));

const protectedRoutes = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/about", element: <AboutProject /> },
  { path: "/expenses", element: <Expenses /> },
  { path: "/income", element: <Income /> },
  { path: "/budget", element: <Budget /> },
  { path: "/analytics", element: <Analytics /> },
  { path: "/growth-analytics", element: <GrowthAnalytics /> },
  { path: "/insights", element: <Insights /> },
  { path: "/recurring", element: <RecurringExpenses /> },
  { path: "/reports/monthly", element: <MonthlyReport /> },
  { path: "/export", element: <ExportCenter /> },
  { path: "/settings", element: <Settings /> },
];

const RouteFallback = () => (
  <div className="space-y-6 p-4 sm:p-6">
    <div className="space-y-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-72 max-w-full" />
      <Skeleton className="h-4 w-[32rem] max-w-full" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-36 rounded-2xl" />
      ))}
    </div>
    <Skeleton className="h-80 rounded-2xl" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about-project" element={<AboutProject />} />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {protectedRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <ProtectedRoute>
                  <DashboardLayout>{route.element}</DashboardLayout>
                </ProtectedRoute>
              }
            />
          ))}

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
