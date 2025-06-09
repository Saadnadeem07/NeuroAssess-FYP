/**
 * This file is responsible for handling authentication-related operations
 * such as login, registration, and logout. It provides functions to interact
 * with the backend API to perform these operations and manage user sessions.
 */

import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // This is important for cookies to be sent
  timeout: 15000, // 15 seconds timeout
});

// Add interceptors for debugging
api.interceptors.request.use(
  (config) => {
    console.log("Auth API Request:", config.url);
    return config;
  },
  (error) => {
    console.error("Auth API Request Error:", error);
    return Promise.reject(error);
  }
);

// Common interfaces
export interface BaseRegisterData {
  name: string;
  email: string;
  password: string;
}

export interface PatientRegisterData extends BaseRegisterData {
  dateOfBirth?: string;
  gender?: string;
}

export interface PsychiatristRegisterData extends BaseRegisterData {
  phone_number: string;
  gender?: string;
  date_of_birth: string;
  country_of_nationality: string;
  country_of_graduation: string;
  date_of_graduation: string;
  institute_name: string;
  license_number: string;
  degrees: string;
  years_of_experience: number;
  expertise: string;
  bio: string;
  certificateUrl: string;
  confirm_password?: string; // Only for frontend validation
}

export interface AdminRegisterData extends BaseRegisterData {
  permissions?: string[];
  adminLevel?: string;
  secretKey?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  requiresEmailVerification?: boolean;
  id?: string;
  token?: string;
  message?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    _id: string;
    name: string;
    email: string;
    token: string;
    otp?: string;
    [key: string]: string | number | boolean | object | null | undefined; // More specific than 'any'
  };
}

export type UserRole = "patient" | "psychiatrist" | "admin";

class AuthService {
  private currentRole: UserRole | null = null;

  constructor() {
    // Initialize role from localStorage if available
    const savedRole = localStorage.getItem("currentRole") as UserRole | null;
    if (savedRole) {
      this.currentRole = savedRole;
    }
  }

  // Set the current role
  setRole(role: UserRole): void {
    this.currentRole = role;
    localStorage.setItem("currentRole", role);
  }

  // Get the current role
  getRole(): UserRole | null {
    return this.currentRole;
  }

  // Register a patient
  async registerPatient(data: PatientRegisterData): Promise<LoginResponse> {
    try {
      console.log("Registering patient:", data);
      const response = await api.post("/auth/patient/register", data);
      console.log("Patient registration response:", response.data);

      if (response.data.success) {
        this.setRole("patient");
        localStorage.setItem("token", response.data.data.token);
      }

      return response.data;
    } catch (error) {
      this.handleError(error as Error | AxiosError, "Patient registration");
      throw error;
    }
  }

  // Register a psychiatrist
  async registerPsychiatrist(
    data: PsychiatristRegisterData
  ): Promise<LoginResponse> {
    try {
      console.log("Registering psychiatrist:", data);
      const response = await api.post("/auth/psychiatrist/register", data);
      console.log("Psychiatrist registration response:", response.data);

      if (response.data.success) {
        this.setRole("psychiatrist");
        localStorage.setItem("token", response.data.data.token);
      }

      return response.data;
    } catch (error) {
      this.handleError(
        error as Error | AxiosError,
        "Psychiatrist registration"
      );
      throw error;
    }
  }

  // Register an admin
  async registerAdmin(data: AdminRegisterData): Promise<LoginResponse> {
    try {
      console.log("Registering admin:", data);
      const response = await api.post("/auth/admin/register", data);
      console.log("Admin registration response:", response.data);

      if (response.data.success) {
        this.setRole("admin");
        localStorage.setItem("token", response.data.data.token);
      }

      return response.data;
    } catch (error) {
      this.handleError(error as Error | AxiosError, "Admin registration");
      throw error;
    }
  }

  // Login based on role
  async login(
    role: UserRole,
    email: string,
    password: string
  ): Promise<LoginResponse> {
    try {
      console.log(`Logging in as ${role}:`, email);
      const response = await api.post(`/auth/${role}/login`, {
        email,
        password,
      });
      console.log(`${role} login response:`, response.data);

      if (response.data.success) {
        this.setRole(role);

        // Store role in localStorage
        localStorage.setItem("currentRole", role);

        // Store token if it exists in the response
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        } else if (response.data.data && response.data.data.token) {
          localStorage.setItem("token", response.data.data.token);
        }
      }

      return response.data;
    } catch (error) {
      this.handleError(error as Error | AxiosError, `${role} login`);
      throw error;
    }
  }

  // Verify OTP based on role
  async verifyOTP(
    role: UserRole,
    id: string,
    otp: string
  ): Promise<LoginResponse> {
    try {
      console.log(`Verifying OTP for ${role}:`, id, otp);
      const response = await api.post(`/auth/${role}/verify-otp`, { id, otp });
      console.log(`${role} OTP verification response:`, response.data);

      if (response.data.success) {
        this.setRole(role);
        localStorage.setItem("token", response.data.data.token);
      }

      return response.data;
    } catch (error) {
      this.handleError(error as Error | AxiosError, `${role} OTP verification`);
      throw error;
    }
  }

  // Resend OTP based on role
  async resendOTP(role: UserRole, id: string): Promise<LoginResponse> {
    try {
      console.log(`Resending OTP for ${role}:`, id);
      const response = await api.post(`/auth/${role}/resend-otp`, { id });
      console.log(`${role} resend OTP response:`, response.data);
      return response.data;
    } catch (error) {
      this.handleError(error as Error | AxiosError, `${role} resend OTP`);
      throw error;
    }
  }

  // Get current user based on role
  async getCurrentUser() {
    try {
      const role = this.getRole();
      if (!role) {
        console.warn("No role selected for getCurrentUser");
        throw new Error("No role selected");
      }

      // Check if token exists
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found for getCurrentUser");
        throw new Error("No authentication token");
      }

      console.log(`Getting current ${role} from ${API_URL}/auth/${role}/me`);
      const response = await api.get(`/auth/${role}/me`, {
        timeout: 10000, // Increase timeout to 10 seconds
      });
      
      console.log(`Current ${role} response:`, response.data);
      
      if (!response.data.success) {
        console.warn(`Failed to get current ${role} user:`, response.data.message);
        return null;
      }
      
      return response.data.data;
    } catch (error) {
      console.error("Error getting current user:", error);

      // Log more detailed error information
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error("Response error data:", error.response.data);
          console.error("Response status:", error.response.status);
          
          // If unauthorized, clear token and role
          if (error.response.status === 401) {
            console.warn("Unauthorized access, clearing auth data");
            localStorage.removeItem("token");
            localStorage.removeItem("currentRole");
            this.currentRole = null;
          }
        } else if (error.request) {
          console.error("No response received:", error.request);
        }
        console.error("Error config:", error.config);
      }

      return null;
    }
  }

  // Forgot password based on role
  async forgotPassword(role: UserRole, email: string): Promise<void> {
    try {
      const response = await api.post(`/auth/${role}/forgot-password`, {
        email,
      });
      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to send reset password email"
        );
      }
    } catch (error) {
      this.handleError(error as Error | AxiosError, `${role} forgot password`);
      throw error;
    }
  }

  // Reset password based on role
  async resetPassword(
    role: UserRole,
    token: string,
    newPassword: string
  ): Promise<void> {
    try {
      const response = await api.post(`/auth/${role}/reset-password`, {
        token,
        newPassword,
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to reset password");
      }
    } catch (error) {
      this.handleError(error as Error | AxiosError, `${role} reset password`);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      await api.get("/auth/logout");
      localStorage.removeItem("token");
      localStorage.removeItem("currentRole");
      this.currentRole = null;
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local storage even if the API call fails
      localStorage.removeItem("token");
      localStorage.removeItem("currentRole");
      this.currentRole = null;
    }
  }

  // Helper method to handle errors
  private handleError(error: Error | AxiosError, context: string): void {
    console.error(`${context} error:`, error);

    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("Response error data:", error.response.data);
        console.error("Response status:", error.response.status);
      } else if (error.request) {
        console.error("No response received:", error.request);
      }
      console.error("Error config:", error.config);
    }
  }
}

export const authService = new AuthService();
export default authService;
