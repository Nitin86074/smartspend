import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { initSentry } from "./sentry";
import "./index.css";
import App from "./App.jsx";

initSentry();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1f2937",
              color: "#f9fafb",
              borderRadius: "12px",
              border: "1px solid #374151",
              fontSize: "14px",
            },
            success: {
              iconTheme: {
                primary: "#6366f1",
                secondary: "#fff",
              },
            },
          }}
        />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
