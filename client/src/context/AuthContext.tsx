import { createContext, useContext, useEffect, useState } from "react";
import {
  authService,
  PatientRegisterData,
  PsychiatristRegisterData,
  AdminRegisterData,
  UserRole,
} from "../services/auth";

interface User {
  _id: string;
  name: string;
  email: string;
  [key: string]: any; // For role-specific fields
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  currentRole: UserRole | null;
  setRole: (role: UserRole) => void;
  loginPatient: (email: string, password: string) => Promise<any>;
  loginPsychiatrist: (email: string, password: string) => Promise<any>;
  loginAdmin: (email: string, password: string) => Promise<any>;
  registerPatient: (data: PatientRegisterData) => Promise<any>;
  registerPsychiatrist: (data: PsychiatristRegisterData) => Promise<any>;
  registerAdmin: (data: AdminRegisterData) => Promise<any>;
  logout: () => Promise<void>;
  setUserAfterOTPVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  currentRole: null,
  setRole: () => {},
  loginPatient: async () => ({}),
  loginPsychiatrist: async () => ({}),
  loginAdmin: async () => ({}),
  registerPatient: async () => ({}),
  registerPsychiatrist: async () => ({}),
  registerAdmin: async () => ({}),
  logout: async () => {},
  setUserAfterOTPVerification: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedRole = localStorage.getItem(
          "currentRole"
        ) as UserRole | null;

        if (savedRole) {
          console.log(`Initializing auth with saved role: ${savedRole}`);
          setCurrentRole(savedRole);
          authService.setRole(savedRole);

          try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
              console.log(
                `Successfully retrieved user for role ${savedRole}:`,
                currentUser
              );
              setUser(currentUser);
            } else {
              console.warn(
                `Failed to get user for role ${savedRole}, clearing role`
              );
              // If we couldn't get the user, the token might be invalid
              localStorage.removeItem("currentRole");
              localStorage.removeItem("token");
              setCurrentRole(null);
            }
          } catch (error) {
            console.error(`Error getting user for role ${savedRole}:`, error);
            // Clear invalid auth state
            localStorage.removeItem("currentRole");
            localStorage.removeItem("token");
            setCurrentRole(null);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        localStorage.removeItem("currentRole");
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for userUpdated events
    const handleUserUpdated = (event: CustomEvent) => {
      const { user: updatedUser } = event.detail;
      console.log("User updated event received:", updatedUser);
      setUser(updatedUser);
    };

    window.addEventListener("userUpdated", handleUserUpdated as EventListener);

    return () => {
      window.removeEventListener(
        "userUpdated",
        handleUserUpdated as EventListener
      );
    };
  }, []);

  const setRole = (role: UserRole) => {
    setCurrentRole(role);
    authService.setRole(role);
  };

  const loginPatient = async (email: string, password: string) => {
    try {
      const response = await authService.login("patient", email, password);
      console.log("Patient login response:", response);

      if (response.success) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }

      return response;
    } catch (error) {
      console.error("Patient login error:", error);
      throw error;
    }
  };

  const loginPsychiatrist = async (email: string, password: string) => {
    try {
      const response = await authService.login("psychiatrist", email, password);
      console.log("Psychiatrist login response:", response);

      if (response.success) {
        // Store token in localStorage if it exists in the response
        if (response.token) {
          localStorage.setItem("token", response.token);
        }
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }

      return response;
    } catch (error) {
      console.error("Psychiatrist login error:", error);
      throw error;
    }
  };

  const loginAdmin = async (email: string, password: string) => {
    try {
      const response = await authService.login("admin", email, password);
      console.log("Admin login response:", response);

      if (response.success) {
        if (response.token) {
          localStorage.setItem("token", response.token);
        }
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }

      return response;
    } catch (error) {
      console.error("Admin login error:", error);
      throw error;
    }
  };

  const registerPatient = async (data: PatientRegisterData) => {
    try {
      const response = await authService.registerPatient(data);
      return response;
    } catch (error) {
      console.error("Patient registration error:", error);
      throw error;
    }
  };

  const registerPsychiatrist = async (data: PsychiatristRegisterData) => {
    try {
      const response = await authService.registerPsychiatrist(data);
      return response;
    } catch (error) {
      console.error("Psychiatrist registration error:", error);
      throw error;
    }
  };

  const registerAdmin = async (data: AdminRegisterData) => {
    try {
      const response = await authService.registerAdmin(data);
      return response;
    } catch (error) {
      console.error("Admin registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem("token");
    setUser(null);
    setCurrentRole(null);
  };

  const setUserAfterOTPVerification = async () => {
    try {
      console.log("Setting user after OTP verification");
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Error setting user after OTP verification:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        currentRole,
        setRole,
        loginPatient,
        loginPsychiatrist,
        loginAdmin,
        registerPatient,
        registerPsychiatrist,
        registerAdmin,
        logout,
        setUserAfterOTPVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
