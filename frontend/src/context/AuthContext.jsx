import { createContext, useContext, useEffect, useState } from "react";
import { getMe, logoutUser } from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    setUser(null);
    localStorage.removeItem("smartspend_user");
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Local cleanup still matters if the server is unreachable.
    } finally {
      clearSession();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await getMe();

        if (response.success) {
          setUser(response.user);
          localStorage.setItem("smartspend_user", JSON.stringify(response.user));
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("smartspend_user", JSON.stringify(userData));
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("smartspend_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};

export default AuthContext;
