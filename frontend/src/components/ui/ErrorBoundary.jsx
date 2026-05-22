import { Component } from "react";
import { Sentry } from "../../sentry";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Button from "./Button";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("SmartSpend UI error:", error, info);
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: info.componentStack,
        },
      },
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 text-gray-900 dark:bg-gray-950 dark:text-white">
        <section className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-card dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-900/25 dark:text-red-300">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
            SmartSpend hit an unexpected interface error. You can reload the
            page or return to the landing page.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button icon={RefreshCw} onClick={this.handleReload}>
              Reload page
            </Button>
            <Button variant="secondary" icon={Home} onClick={this.handleHome}>
              Go home
            </Button>
          </div>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
