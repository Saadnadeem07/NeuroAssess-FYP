import { createContext, useContext, useEffect, useState } from "react";
import {
  authService,
  LoginResponse,
  PatientRegisterData,
  PsychiatristRegisterData,
  UserRole,
} from "../services/auth";

interface User {
  _id: string;
  name: string;
  email: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  currentRole: UserRole | null;
  setRole: (role: UserRole) => void;
  loginPatient: (email: string, password: string) => Promise<LoginResponse>;
  loginPsychiatrist: (email: string, password: string) => Promise<LoginResponse>;
  loginAdmin: (email: string, password: string) => Promise<LoginResponse>;
  registerPatient: (data: PatientRegisterData) => Promise<LoginResponse>;
  registerPsychiatrist: (data: PsychiatristRegisterData) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  setUserAfterOTPVerification: () => Promise<void>;
}

const NOT_READY: LoginResponse = { success: false };
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  currentRole: null,
  setRole: () => {},
  loginPatient: async () => NOT_READY,
  loginPsychiatrist: async () => NOT_READY,
  loginAdmin: async () => NOT_READY,
  registerPatient: async () => NOT_READY,
  registerPsychiatrist: async () => NOT_READY,
  logout: async () => {},
  setUserAfterOTPVerification: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const savedRole = localStorage.getItem("currentRole") as UserRole | null;
        if (savedRole) {
          setCurrentRole(savedRole);
          authService.setRole(savedRole);
          const currentUser = (await authService.getCurrentUser()) as User | null;
          if (currentUser) {
            setUser(currentUser);
          } else {
            localStorage.removeItem("currentRole");
            setCurrentRole(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    init();

    const handleLogout = () => {
      setUser(null);
      setCurrentRole(null);
      localStorage.removeItem("currentRole");
    };
    window.addEventListener("auth:logout", handleLogout);

    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []);

  const setRole = (role: UserRole) => {
    setCurrentRole(role);
    authService.setRole(role);
  };

  const loginAs = async (
    role: UserRole,
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    const response = await authService.login(role, email, password);
    if (response.success) {
      const me = (await authService.getCurrentUser()) as User | null;
      if (me) setUser(me);
    }
    return response;
  };

  const loginPatient = (email: string, password: string) => loginAs("patient", email, password);
  const loginPsychiatrist = (email: string, password: string) => loginAs("psychiatrist", email, password);
  const loginAdmin = (email: string, password: string) => loginAs("admin", email, password);

  const registerPatient = (data: PatientRegisterData) => authService.registerPatient(data);
  const registerPsychiatrist = (data: PsychiatristRegisterData) =>
    authService.registerPsychiatrist(data);

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setCurrentRole(null);
  };

  const setUserAfterOTPVerification = async () => {
    const me = (await authService.getCurrentUser()) as User | null;
    setUser(me);
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
        logout,
        setUserAfterOTPVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
