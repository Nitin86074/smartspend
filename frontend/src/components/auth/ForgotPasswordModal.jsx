import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { forgotPassword, resetPassword } from "../../api/authApi";
import { getApiErrorMessage } from "../../api/axios";
import Button from "../ui/Button";

const ForgotPasswordModal = ({ initialEmail = "", isOpen, onClose }) => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
    }
  }, [initialEmail, isOpen]);

  const resetState = () => {
    setStep("email");
    setEmail(initialEmail);
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setLoading(false);
    setErrors({});
  };

  const closeModal = () => {
    resetState();
    onClose();
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: "Enter a valid email address" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await forgotPassword(email.trim());
      toast.success(response.message || "Reset code sent to Gmail");
      setStep("reset");
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not send reset code.");
      toast.error(message);
      setErrors({ email: message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (code.trim().length !== 6) {
      nextErrors.code = "Enter the 6 digit reset code";
    }

    if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await resetPassword({
        email: email.trim(),
        code: code.trim(),
        password,
      });

      toast.success(response.message || "Password reset successfully");
      closeModal();
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not reset password.");
      toast.error(message);
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 px-4 py-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
                  {step === "email" ? (
                    <Mail className="h-5 w-5" />
                  ) : (
                    <KeyRound className="h-5 w-5" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {step === "email" ? "Reset password" : "Enter reset code"}
                </h3>
                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {step === "email"
                    ? "We will send a 6 digit reset code to your verified Gmail."
                    : "Use the code from Gmail and choose a new password."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Close reset password"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errors.general && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300">
                {errors.general}
              </div>
            )}

            {step === "email" ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gmail address
                  </span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setErrors({});
                      }}
                      placeholder="you@gmail.com"
                      autoComplete="email"
                      className={`input pl-10 ${errors.email ? "border-red-400 focus:ring-red-400" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">
                      {errors.email}
                    </p>
                  )}
                </label>

                <Button
                  type="submit"
                  className="w-full"
                  icon={CheckCircle}
                  isLoading={loading}
                >
                  Send reset code
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reset code
                  </span>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={code}
                      onChange={(event) => {
                        setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                        setErrors({});
                      }}
                      placeholder="6 digit code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className={`input pl-10 ${errors.code ? "border-red-400 focus:ring-red-400" : ""}`}
                    />
                  </div>
                  {errors.code && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">
                      {errors.code}
                    </p>
                  )}
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    New password
                  </span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setErrors({});
                      }}
                      placeholder="Create new password"
                      autoComplete="new-password"
                      className={`input pl-10 pr-11 ${errors.password ? "border-red-400 focus:ring-red-400" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">
                      {errors.password}
                    </p>
                  )}
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm password
                  </span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setErrors({});
                      }}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                      className={`input pl-10 ${errors.confirmPassword ? "border-red-400 focus:ring-red-400" : ""}`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">
                      {errors.confirmPassword}
                    </p>
                  )}
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep("email")}
                  >
                    Change email
                  </Button>
                  <Button
                    type="submit"
                    icon={CheckCircle}
                    isLoading={loading}
                  >
                    Reset password
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ForgotPasswordModal;
