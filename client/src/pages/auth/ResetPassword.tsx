import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PasswordInput,
  validatePassword,
} from "@/components/ui/password-input";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showValidation, setShowValidation] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    if (password !== confirmPassword) {
      errors.push("Passwords do not match");
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFormErrors([]);
    setShowValidation(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      await authService.resetPassword(token!, password);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.message || "An error occurred while resetting your password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {formErrors.length > 0 && (
          <Alert variant="destructive">
            <div className="space-y-1">
              {formErrors.map((err, index) => (
                <AlertDescription key={index}>{err}</AlertDescription>
              ))}
            </div>
          </Alert>
        )}

        {success ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Your password has been successfully reset.
              </AlertDescription>
            </Alert>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => navigate("/login")}
            >
              Return to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <PasswordInput
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                showValidation={showValidation}
              />
              <PasswordInput
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/login")}
            >
              Back to Login
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
