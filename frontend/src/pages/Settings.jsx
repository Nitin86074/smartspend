import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/axios";
import { changePassword, deleteAccount, updateProfile } from "../api/authApi";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/formatCurrency";

const currencies = [
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
];

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const PreferenceRow = ({ description, icon: Icon, label, right }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
    <div className="flex min-w-0 items-center gap-3">
      <div className="rounded-2xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/25 dark:text-primary-300">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
    {right}
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    currency: user?.currency || "INR",
    monthlyBudget: user?.monthlyBudget || "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [deleteData, setDeleteData] = useState({
    password: "",
    confirmation: "",
  });
  const [deleteErrors, setDeleteErrors] = useState({});
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);

  const isGoogleAccount = user?.authProvider === "google";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));

    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: "" }));
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((current) => ({ ...current, [name]: value }));

    if (passwordErrors[name] || passwordErrors.general) {
      setPasswordErrors((current) => ({ ...current, [name]: "", general: "" }));
    }
  };

  const handleDeleteChange = (event) => {
    const { name, value } = event.target;
    setDeleteData((current) => ({ ...current, [name]: value }));

    if (deleteErrors[name] || deleteErrors.general) {
      setDeleteErrors((current) => ({ ...current, [name]: "", general: "" }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Name is required";
    }

    if (formData.monthlyBudget && Number(formData.monthlyBudget) < 0) {
      nextErrors.monthlyBudget = "Monthly budget cannot be negative";
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

    setSaving(true);

    try {
      const response = await updateProfile({
        name: formData.name.trim(),
        currency: formData.currency,
        monthlyBudget: Number(formData.monthlyBudget || 0),
      });

      if (response.success) {
        updateUser(response.user);
        toast.success("Profile updated successfully");
      }
    } catch (err) {
      const message = getApiErrorMessage(err, "Profile could not be updated.");
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!passwordData.currentPassword) {
      nextErrors.currentPassword = "Current password is required";
    }

    if (passwordData.newPassword.length < 6) {
      nextErrors.newPassword = "New password must be at least 6 characters";
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(nextErrors).length > 0) {
      setPasswordErrors(nextErrors);
      return;
    }

    setChangingPassword(true);

    try {
      const response = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success(response.message || "Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      const message = getApiErrorMessage(err, "Password could not be changed.");
      setPasswordErrors({ general: message });
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  const validateDeleteRequest = () => {
    const nextErrors = {};
    const expectedConfirmation = isGoogleAccount ? user?.email : "DELETE";

    if (!deleteData.confirmation.trim()) {
      nextErrors.confirmation = isGoogleAccount
        ? "Type your email address to confirm"
        : "Type DELETE to confirm";
    } else if (deleteData.confirmation.trim() !== expectedConfirmation) {
      nextErrors.confirmation = isGoogleAccount
        ? "Confirmation must match your email address"
        : "Confirmation must be exactly DELETE";
    }

    if (!isGoogleAccount && !deleteData.password) {
      nextErrors.password = "Password is required";
    }

    if (Object.keys(nextErrors).length > 0) {
      setDeleteErrors(nextErrors);
      return false;
    }

    return true;
  };

  const handleDeleteAccount = (event) => {
    event.preventDefault();

    if (!validateDeleteRequest()) return;

    setShowDeleteWarning(true);
  };

  const confirmDeleteAccount = async () => {
    setDeletingAccount(true);
    setShowDeleteWarning(false);

    try {
      const response = await deleteAccount({
        password: deleteData.password,
        confirmation: deleteData.confirmation.trim(),
      });

      await logout();
      toast.success(response.message || "Account deleted successfully");
      navigate("/register");
    } catch (err) {
      const message = getApiErrorMessage(err, "Account could not be deleted.");
      setDeleteErrors({ general: message });
      toast.error(message);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      {showDeleteWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900/60 dark:bg-gray-900">
            <div className="mb-5 flex gap-3">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Permanently delete account?
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  This action cannot be undone. Your profile, accounts, budgets,
                  income records, and expenses will be permanently removed.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
              Only continue if you have backed up anything you need.
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteWarning(false)}
                disabled={deletingAccount}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                icon={Trash2}
                isLoading={deletingAccount}
                onClick={confirmDeleteAccount}
              >
                Delete forever
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-300">
          <SettingsIcon className="h-4 w-4" />
          Account preferences
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Manage your profile, display preferences, account defaults, and sign
          out from SmartSpend.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-600 text-white shadow-lg shadow-primary-600/20">
              <span className="text-2xl font-bold">{getInitials(user?.name)}</span>
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
              {user?.name || "SmartSpend User"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {user?.email || "No email available"}
            </p>

            <div className="mt-6 grid w-full gap-3 text-left">
              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Preferred currency
                </p>
                <p className="mt-1 font-bold text-gray-900 dark:text-white">
                  {user?.currency || "INR"}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Profile monthly budget
                </p>
                <p className="mt-1 font-bold text-gray-900 dark:text-white">
                  {formatCurrency(user?.monthlyBudget || 0, user?.currency || "INR")}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Profile Information
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              These details are stored in your backend user profile.
            </p>
          </div>

          {errors.general && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <Input
              icon={User}
              label="Full name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
            />
            <Select
              label="Currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
            >
              {currencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </Select>
            <Input
              icon={Wallet}
              label="Profile monthly budget"
              name="monthlyBudget"
              type="number"
              min="0"
              value={formData.monthlyBudget}
              onChange={handleChange}
              error={errors.monthlyBudget}
            />
            <div className="flex items-end">
              <Button type="submit" icon={Save} isLoading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Preferences
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Local interface preferences for your current browser.
            </p>
          </div>

          <div className="space-y-3">
            <PreferenceRow
              icon={Bell}
              label="Budget alerts"
              description="Frontend alert preferences placeholder for future notifications."
              right={
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  Coming soon
                </span>
              }
            />
            <PreferenceRow
              icon={ShieldCheck}
              label="Session security"
              description="Your session uses a secure HTTP-only cookie and is cleared when you sign out."
              right={
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Active
                </span>
              }
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Change Password
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Update the password used for manual SmartSpend login.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswords((current) => !current)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {showPasswords ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showPasswords ? "Hide" : "Show"}
            </button>
          </div>

          {isGoogleAccount ? (
            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5 dark:border-blue-900/50 dark:bg-blue-900/10">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-blue-600 dark:text-blue-300" />
                <div>
                  <h3 className="font-bold text-blue-700 dark:text-blue-300">
                    Google account security
                  </h3>
                  <p className="mt-1 text-sm text-blue-700/80 dark:text-blue-200/80">
                    This account signs in with Google, so password changes are
                    handled in your Google account settings.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordErrors.general && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300">
                  {passwordErrors.general}
                </div>
              )}

              <Input
                icon={Lock}
                label="Current password"
                name="currentPassword"
                type={showPasswords ? "text" : "password"}
                autoComplete="current-password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.currentPassword}
              />
              <Input
                icon={KeyRound}
                label="New password"
                name="newPassword"
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.newPassword}
              />
              <Input
                icon={KeyRound}
                label="Confirm new password"
                name="confirmPassword"
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.confirmPassword}
              />

              <Button
                type="submit"
                icon={ShieldCheck}
                isLoading={changingPassword}
              >
                Change password
              </Button>
            </form>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-300">
            <AlertTriangle className="h-4 w-4" />
            Danger zone
          </p>
          <h2 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
            Account Actions
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sign out from this device or permanently delete your SmartSpend
            account and finance data.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/50">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Sign out
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This clears your local token and returns you to the login page.
                </p>
              </div>
              <Button variant="secondary" icon={LogOut} onClick={handleLogout}>
                Sign out
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-red-100 bg-red-50/70 p-5 dark:border-red-900/50 dark:bg-red-900/10">
            <div className="mb-4">
              <h3 className="font-bold text-red-700 dark:text-red-300">
                Delete account
              </h3>
              <p className="mt-1 text-sm text-red-600/80 dark:text-red-300/80">
                This permanently removes your profile, accounts, budgets,
                income, and expenses.
              </p>
            </div>

            {deleteErrors.general && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {deleteErrors.general}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              {!isGoogleAccount && (
                <Input
                  icon={Lock}
                  label="Current password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={deleteData.password}
                  onChange={handleDeleteChange}
                  error={deleteErrors.password}
                />
              )}
              <Input
                icon={AlertTriangle}
                label={
                  isGoogleAccount
                    ? `Type ${user?.email || "your email"} to confirm`
                    : "Type DELETE to confirm"
                }
                name="confirmation"
                value={deleteData.confirmation}
                onChange={handleDeleteChange}
                error={deleteErrors.confirmation}
              />
              <Button
                type="submit"
                variant="danger"
                icon={Trash2}
                isLoading={deletingAccount}
                disabled={
                  deletingAccount ||
                  deleteData.confirmation.trim() !==
                    (isGoogleAccount ? user?.email : "DELETE")
                }
              >
                Delete account
              </Button>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
