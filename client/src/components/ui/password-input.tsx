import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Button } from "./button";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showValidation?: boolean;
}

export const validatePassword = (
  password: string
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showValidation = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [validationResult, setValidationResult] = React.useState<{
      isValid: boolean;
      errors: string[];
    }>({
      isValid: true,
      errors: [],
    });

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    React.useEffect(() => {
      if (showValidation && props.value) {
        setValidationResult(validatePassword(props.value as string));
      }
    }, [props.value, showValidation]);

    return (
      <div className="relative">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            className={cn("pr-10", className)}
            ref={ref}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={togglePasswordVisibility}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="sr-only">
              {showPassword ? "Hide password" : "Show password"}
            </span>
          </Button>
        </div>

        {showValidation &&
          props.value &&
          validationResult.errors.length > 0 && (
            <div className="mt-2 text-sm text-red-500 space-y-1">
              {validationResult.errors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
