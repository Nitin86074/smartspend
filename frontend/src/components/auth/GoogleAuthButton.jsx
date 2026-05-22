import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { googleAuth } from "../../api/authApi";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const GoogleAuthButton = ({ label = "Continue with Google", setError }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const isConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const handleSuccess = async (credentialResponse) => {
    try {
      const response = await googleAuth(credentialResponse.credential);

      if (response.success) {
        login(response.user);
        toast.success(`Welcome, ${response.user.name}`);
        navigate("/dashboard");
      }
    } catch (error) {
      const message = getApiErrorMessage(error, "Google sign-in failed.");
      toast.error(message);
      setError?.(message);
    }
  };

  if (!isConfigured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
        Google login needs VITE_GOOGLE_CLIENT_ID in frontend .env.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-950">
      <GoogleLogin
        text={label === "Sign up with Google" ? "signup_with" : "continue_with"}
        shape="pill"
        size="large"
        width="100%"
        onSuccess={handleSuccess}
        onError={() => {
          const message = "Google sign-in was cancelled or failed.";
          toast.error(message);
          setError?.(message);
        }}
      />
    </div>
  );
};

export default GoogleAuthButton;
