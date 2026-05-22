import { Suspense, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  PerspectiveCamera,
  Sparkles,
  SpotLight,
  Text,
} from "@react-three/drei";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ShieldCheck,
  Target,
} from "lucide-react";
import toast from "react-hot-toast";
import { registerUser, verifyOtp } from "../api/authApi";
import { getApiErrorMessage } from "../api/axios";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

const strengthLabels = {
  1: { label: "Weak", color: "bg-red-500" },
  2: { label: "Fair", color: "bg-amber-500" },
  3: { label: "Good", color: "bg-blue-500" },
  4: { label: "Strong", color: "bg-emerald-500" },
};

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "bg-gray-700" };

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  return { score, ...strengthLabels[Math.max(1, score)] };
};

const RESEND_COOLDOWN_SECONDS = 30;

const isGmailAddress = (email) => email.trim().toLowerCase().endsWith("@gmail.com");

function DataCrystalLattice() {
  const crystalRef = useRef();

  useFrame((state, delta) => {
    if (!crystalRef.current) return;

    crystalRef.current.rotation.x += delta * 0.1;
    crystalRef.current.rotation.y += delta * 0.05;

    const time = state.clock.getElapsedTime();
    const hue = (time * 0.1) % 1;
    crystalRef.current.children[0]?.material?.color.setHSL(hue, 0.7, 0.6);
  });

  return (
    <group ref={crystalRef}>
      <mesh>
        <dodecahedronGeometry args={[1.5, 1]} />
        <MeshDistortMaterial
          distort={0.4}
          speed={2}
          color="#8b5cf6"
          envMapIntensity={0.5}
          clearcoat={0.8}
          clearcoatRoughness={0.15}
          attenuationDistance={1}
          reflectivity={0.9}
        />
      </mesh>

      {Array.from({ length: 20 }).map((_, index) => (
        <Float
          key={index}
          speed={2}
          rotationIntensity={1}
          floatIntensity={1.5}
          position={[
            Math.sin(index) * 3,
            Math.cos(index) * 2,
            Math.sin(index * 1.5) * 1,
          ]}
        >
          <mesh>
            <octahedronGeometry args={[0.2]} />
            <meshStandardMaterial
              color="#4f46e5"
              emissive="#4f46e5"
              emissiveIntensity={0.6}
            />
          </mesh>
        </Float>
      ))}

      <Text
        position={[0, -2, 0.2]}
        fontSize={0.25}
        color="#a5b4fc"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1xlFd2JQEk.woff2"
      >
        D A T A . S I G N A L S
      </Text>

      <Sparkles count={50} scale={8} size={2.5} color="#c084fc" />
    </group>
  );
}

const fieldClass = (hasError, extra = "") =>
  `w-full rounded-xl border bg-black/25 px-5 py-3.5 text-white shadow-inner transition-colors placeholder:text-gray-600 focus:outline-none focus:ring-1 ${
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500"
  } ${extra}`;

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [errors, setErrors] = useState({});

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMatch =
    formData.confirmPassword && formData.password === formData.confirmPassword;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));

    if (errors[name] || errors.general) {
      setErrors((current) => ({ ...current, [name]: "", general: "" }));
    }
  };

  useEffect(() => {
    if (!resendCountdown) return undefined;

    const timer = window.setTimeout(() => {
      setResendCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = "Enter a valid email address";
    } else if (!isGmailAddress(formData.email)) {
      nextErrors.email = "Use a @gmail.com address";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.success) {
        setPendingEmail(response.data?.email || formData.email.trim());
        setVerificationCode("");
        setResendCountdown(response.data?.resendAfterSeconds || RESEND_COOLDOWN_SECONDS);
        toast.success(response.message || "Verification code sent");
      }
    } catch (error) {
      const message = getApiErrorMessage(error, "Registration failed. Try again.");
      toast.error(message);
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (event) => {
    event.preventDefault();

    if (verificationCode.trim().length !== 6) {
      setErrors({ verification: "Enter the 6 digit code from Gmail" });
      return;
    }

    setLoading(true);

    try {
      const response = await verifyOtp({
        name: formData.name.trim(),
        email: pendingEmail,
        password: formData.password,
        otp: verificationCode.trim(),
      });

      if (response.success) {
        login(response.user);
        toast.success("Gmail verified successfully");
        navigate("/dashboard");
      }
    } catch (error) {
      const message = getApiErrorMessage(error, "Verification failed.");
      toast.error(message);
      setErrors({ verification: message });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;

    setResending(true);

    try {
      const response = await registerUser({
        name: formData.name.trim(),
        email: pendingEmail,
        password: formData.password,
      });
      setVerificationCode("");
      setResendCountdown(response.data?.resendAfterSeconds || RESEND_COOLDOWN_SECONDS);
      toast.success(response.message || "Verification code resent");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not resend code."));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#0d1117] text-white selection:bg-indigo-500/30">
      <section className="relative order-2 hidden flex-1 flex-col items-center justify-center overflow-hidden border-l border-white/5 bg-black/20 p-12 lg:flex">
        <div className="absolute inset-0 z-0">
          <Canvas>
            <PerspectiveCamera makeDefault position={[0, 0, 7]} />
            <ambientLight intensity={0.2} />
            <Suspense fallback={null}>
              <DataCrystalLattice />
              <SpotLight
                position={[10, 10, 10]}
                angle={0.3}
                penumbra={1}
                intensity={1}
                color="#a5b4fc"
                castShadow
              />
              <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
            </Suspense>
          </Canvas>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 mt-24 max-w-xl text-center lg:text-left"
        >
          <h1 className="mb-8 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent lg:text-6xl">
            Turn every transaction into a useful money signal.
          </h1>
          <p className="mb-12 text-xl leading-relaxed text-gray-400">
            SmartSpend brings expense tracking, budgets, income, analytics, exports, and AI-style
            insights into one focused dashboard.
          </p>

          <ul className="space-y-6 text-lg text-gray-300">
            {[
              "Clean dashboard for spending and income",
              "Budget warnings before limits become surprises",
              "Analytics charts for interview-ready demos",
            ].map((feature, index) => (
              <motion.li
                key={feature}
                className="flex items-center gap-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-600/10 text-emerald-400 shadow-xl">
                  <CheckCircle2 size={20} />
                </span>
                <span>{feature}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </section>

      <motion.section
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="order-1 flex min-h-screen w-full flex-1 items-center justify-center p-6 lg:p-12"
      >
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:p-12">
          {pendingEmail ? (
            <>
              <div className="mb-10 text-center">
                <div className="mb-3 inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-400 backdrop-blur-sm">
                  <Mail size={16} className="mr-2" />
                  Gmail verification
                </div>
                <h2 className="text-4xl font-bold tracking-tight text-white">Check your Gmail</h2>
                <p className="mt-3 text-base leading-relaxed text-gray-400">
                  We sent a 6 digit code to{" "}
                  <span className="font-semibold text-white">{pendingEmail}</span>. Enter it to
                  activate your account.
                </p>
              </div>

              <form onSubmit={handleVerifyEmail} className="space-y-5">
                <label className="block" htmlFor="verificationCode">
                  <span className="mb-2 block text-sm font-medium text-gray-300">
                    Verification code
                  </span>
                  <input
                    id="verificationCode"
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    value={verificationCode}
                    onChange={(event) => {
                      setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                      setErrors((current) => ({ ...current, verification: "" }));
                    }}
                    placeholder="123456"
                    className={`${fieldClass(errors.verification)} text-center text-lg font-bold tracking-[0.35em]`}
                  />
                  {errors.verification && (
                    <p className="mt-1.5 text-xs font-medium text-red-400">
                      {errors.verification}
                    </p>
                  )}
                </label>

                <Button
                  type="submit"
                  isLoading={loading}
                  className="w-full border-none bg-indigo-600 py-4 font-semibold text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:bg-indigo-500"
                >
                  Verify and continue
                  {!loading && <ShieldCheck className="h-5 w-5" />}
                </Button>
                <Button
                  variant="secondary"
                  isLoading={resending}
                  disabled={resendCountdown > 0}
                  onClick={handleResendCode}
                  className="w-full border border-white/10 bg-white/10 py-4 font-semibold text-white hover:bg-white/15"
                >
                  {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : "Resend code"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingEmail("");
                    setVerificationCode("");
                    setResendCountdown(0);
                  }}
                  className="w-full text-sm font-semibold text-gray-500 transition hover:text-gray-300"
                >
                  Use a different Gmail
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-10 text-center">
                <div className="mb-3 inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-400 backdrop-blur-sm">
                  <Target size={16} className="mr-2" />
                  Free account setup
                </div>
                <h2 className="text-4xl font-bold tracking-tight text-white">Create account</h2>
                <p className="mt-3 text-base leading-relaxed text-gray-400">
                  Build your personal dashboard for expenses, budgets, income, and smart insights.
                </p>
              </div>

              <GoogleAuthButton
                label="Sign up with Google"
                setError={(message) => setErrors({ general: message })}
              />

              <div className="my-8 flex items-center">
                <div className="flex-grow border-t border-white/10" />
                <span className="px-3 text-xs font-medium tracking-wider text-gray-500">
                  OR CREATE MANUALLY
                </span>
                <div className="flex-grow border-t border-white/10" />
              </div>

              {errors.general && (
                <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
                {[
                  {
                    id: "name",
                    label: "Full name",
                    placeholder: "Alex Morgan",
                    type: "text",
                    autoComplete: "name",
                  },
                  {
                    id: "email",
                    label: "Email address",
                    placeholder: "you@gmail.com",
                    type: "email",
                    autoComplete: "off",
                  },
                ].map((field) => (
                  <div key={field.id}>
                    <label
                      className="mb-2 block text-sm font-medium text-gray-300"
                      htmlFor={field.id}
                    >
                      {field.label}
                    </label>
                    <input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      value={formData[field.id]}
                      onChange={handleChange}
                      className={fieldClass(errors[field.id])}
                    />
                    {errors[field.id] && (
                      <p className="mt-1.5 text-xs font-medium text-red-400">
                        {errors[field.id]}
                      </p>
                    )}
                  </div>
                ))}

                {[
                  {
                    id: "password",
                    label: "Password",
                    placeholder: "At least 6 characters",
                    show: showPassword,
                    setShow: setShowPassword,
                  },
                  {
                    id: "confirmPassword",
                    label: "Confirm password",
                    placeholder: "Repeat your password",
                    show: showConfirmPassword,
                    setShow: setShowConfirmPassword,
                  },
                ].map((field) => (
                  <div key={field.id}>
                    <label
                      className="mb-2 block text-sm font-medium text-gray-300"
                      htmlFor={field.id}
                    >
                      {field.label}
                    </label>
                    <div className="relative">
                      <input
                        id={field.id}
                        name={field.id}
                        type={field.show ? "text" : "password"}
                        placeholder={field.placeholder}
                        autoComplete="new-password"
                        value={formData[field.id]}
                        onChange={handleChange}
                        className={fieldClass(
                          errors[field.id],
                          passwordsMatch && field.id === "confirmPassword"
                            ? "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500 pr-12"
                            : "pr-12",
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => field.setShow((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-600 transition-colors hover:text-gray-300"
                        aria-label={field.show ? "Hide password" : "Show password"}
                      >
                        {field.show ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {field.id === "password" && formData.password && (
                      <div className="mt-2">
                        <div className="grid grid-cols-4 gap-1">
                          {[1, 2, 3, 4].map((level) => (
                            <span
                              key={level}
                              className={`h-1 rounded-full ${
                                level <= passwordStrength.score
                                  ? passwordStrength.color
                                  : "bg-white/10"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Password strength:{" "}
                          <span className="font-semibold">{passwordStrength.label}</span>
                        </p>
                      </div>
                    )}

                    {errors[field.id] && (
                      <p className="mt-1.5 text-xs font-medium text-red-400">
                        {errors[field.id]}
                      </p>
                    )}
                    {field.id === "confirmPassword" && passwordsMatch && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Passwords match
                      </p>
                    )}
                  </div>
                ))}

                <Button
                  type="submit"
                  disabled={loading}
                  className="group w-full border-none bg-indigo-600 py-4 font-semibold text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:bg-indigo-500"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-10 text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
                >
                  Sign in instead
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default Register;
