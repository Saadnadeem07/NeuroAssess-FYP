import api from "./api";
import { AxiosError } from "axios";

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
  confirm_password?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  // Server returns the principal under `data` on login/verify-otp.
  // Shape is role-specific so we keep it permissive on the client.
  data?: {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
    isApproved?: boolean;
    [key: string]: unknown;
  } | null;
  // Email-not-verified flow: server uses error envelope with statusCode 403
  // and `details.id`; the SPA reads it from the thrown error there.
  requiresEmailVerification?: boolean;
  emailVerified?: boolean;
  id?: string;
  token?: string;
}

export type UserRole = "patient" | "psychiatrist" | "admin";

class AuthService {
  private currentRole: UserRole | null = null;

  constructor() {
    const saved = localStorage.getItem("currentRole") as UserRole | null;
    if (saved) this.currentRole = saved;
  }

  setRole(role: UserRole): void {
    this.currentRole = role;
    localStorage.setItem("currentRole", role);
  }

  getRole(): UserRole | null {
    return this.currentRole;
  }

  async registerPatient(data: PatientRegisterData): Promise<LoginResponse> {
    const response = await api.post("/auth/patient/register", data);
    if (response.data.success) this.setRole("patient");
    return response.data;
  }

  async registerPsychiatrist(data: PsychiatristRegisterData): Promise<LoginResponse> {
    const response = await api.post("/auth/psychiatrist/register", data);
    if (response.data.success) this.setRole("psychiatrist");
    return response.data;
  }

  async login(role: UserRole, email: string, password: string): Promise<LoginResponse> {
    const response = await api.post(`/auth/${role}/login`, { email, password });
    if (response.data.success) this.setRole(role);
    return response.data;
  }

  async verifyOTP(role: UserRole, id: string, otp: string): Promise<LoginResponse> {
    const response = await api.post(`/auth/${role}/verify-otp`, { id, otp });
    if (response.data.success) this.setRole(role);
    return response.data;
  }

  async resendOTP(role: UserRole, id: string): Promise<LoginResponse> {
    const response = await api.post(`/auth/${role}/resend-otp`, { id });
    return response.data;
  }

  async getCurrentUser(): Promise<Record<string, unknown> | null> {
    const role = this.getRole();
    if (!role) return null;
    try {
      const response = await api.get(`/auth/${role}/me`);
      return response.data?.success ? response.data.data : null;
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        this.currentRole = null;
        localStorage.removeItem("currentRole");
      }
      return null;
    }
  }

  async forgotPassword(role: UserRole, email: string): Promise<void> {
    const response = await api.post(`/auth/${role}/forgot-password`, { email });
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to send reset email");
    }
  }

  async resetPassword(role: UserRole, token: string, newPassword: string): Promise<void> {
    const response = await api.post(`/auth/${role}/reset-password`, { token, newPassword });
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to reset password");
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore — cookies will be cleared by the server, and we always wipe local state below.
    }
    this.currentRole = null;
    localStorage.removeItem("currentRole");
  }
}

export const authService = new AuthService();
export default authService;
