import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  PerspectiveCamera,
  Sphere,
} from "@react-three/drei";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { loginUser } from "../api/authApi";
import { getApiErrorMessage } from "../api/axios";
import ForgotPasswordModal from "../components/auth/ForgotPasswordModal";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <Canvas dpr={[1, 1.6]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />

        <Float
          speed={1.2}
          rotationIntensity={0.5}
          floatIntensity={1.5}
          position={[-4, 0, -2]}
        >
          <Sphere args={[1.5, 64, 64]} scale={2}>
            <MeshDistortMaterial
              color="#4f46e5"
              speed={2}
              distort={0.3}
              radius={1}
            />
          </Sphere>
        </Float>

        <Float
          speed={1.5}
          rotationIntensity={1}
          floatIntensity={1}
          position={[4, -1, -3]}
        >
          <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
            <boxGeometry args={[1.2, 1.2, 1.2]} />
            <meshStandardMaterial color="#8b5cf6" />
          </mesh>
        </Float>
      </Canvas>
    </div>
  );
}

const validateCredentials = (credentials) => {
  const nextErrors = {};

  if (!credentials.email.trim()) {
    nextErrors.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
    nextErrors.email = "Please enter a valid email address";
  }

  if (!credentials.password) {
    nextErrors.password = "Password is required";
  }

  return nextErrors;
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [autofillEnabled, setAutofillEnabled] = useState(false);

  useEffect(() => {
    if (authError) setAuthError("");
  }, [credentials, authError]);

  const enableCredentialAutofill = () => {
    setAutofillEnabled(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setCredentials((current) => ({ ...current, [name]: value }));

    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: "" }));
    }
  };

  const submitLogin = async (nextCredentials) => {
    setIsLoading(true);
    setAuthError("");

    try {
      const response = await loginUser(nextCredentials);

      if (response.success) {
        login(response.user);
        toast.success(`Welcome back, ${response.user.name}`);
        navigate(from, { replace: true });
      }
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Failed to sign in. Please check your credentials."
      );

      setAuthError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationErrors = validateCredentials(credentials);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    submitLogin(credentials);
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#0d1117] text-white selection:bg-indigo-500/30">
      <AnimatedBackground />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,rgba(13,17,23,0.18)_0%,rgba(13,17,23,0.7)_74%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center gap-12 p-6 lg:flex-row lg:justify-between lg:gap-24">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-12 max-w-xl flex-1 text-center lg:mt-0 lg:text-left"
        >
          <h1 className="mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-5xl font-extrabold tracking-normal text-transparent lg:text-6xl">
            Know where your money goes before it becomes a problem.
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-gray-400">
            Track spending, compare budgets, export reports, and turn daily
            transactions into clear financial signals.
          </p>

          <div className="relative hidden h-48 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
            <svg
              className="absolute inset-0 h-full w-full opacity-20"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0 100 L50 40 L100 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-indigo-500"
              />
              <path
                d="M0 40 L50 100 L100 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-purple-500"
              />
            </svg>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:p-10">
            <div className="mb-8">
              <div className="mb-3 inline-flex items-center text-sm font-medium text-indigo-400">
                <ShieldCheck size={16} className="mr-2" />
                Secure sign in
              </div>
              <h2 className="text-3xl font-bold text-white">Welcome back</h2>
              <p className="mt-2 text-sm text-gray-400">
                Sign in to continue managing your income, budgets, and expenses.
              </p>
            </div>

            <GoogleAuthButton
              setError={setAuthError}
              label="Continue with Google"
            />

            <div className="my-6 flex items-center">
              <div className="flex-grow border-t border-white/10" />
              <span className="px-3 text-xs font-medium tracking-wider text-gray-500">
                OR USE EMAIL
              </span>
              <div className="flex-grow border-t border-white/10" />
            </div>

            {authError && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400">
                {authError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                  htmlFor="email"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={credentials.email}
                  onChange={handleChange}
                  onPointerDown={enableCredentialAutofill}
                  onFocus={enableCredentialAutofill}
                  autoComplete={autofillEnabled ? "username" : "off"}
                  className={`w-full rounded-xl border bg-black/20 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    errors.email
                      ? "border-red-500"
                      : "border-white/10 focus:border-indigo-500"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={handleChange}
                    autoComplete={autofillEnabled ? "current-password" : "new-password"}
                    className={`w-full rounded-xl border bg-black/20 py-3 pl-4 pr-12 text-white placeholder-gray-500 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      errors.password
                        ? "border-red-500"
                        : "border-white/10 focus:border-indigo-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-xl border-none bg-indigo-600 py-3.5 font-semibold text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all hover:bg-indigo-500"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-400">
              New to SmartSpend?{" "}
              <Link
                to="/register"
                className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Create an account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialEmail={credentials.email}
      />
    </div>
  );
};

export default Login;
