import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();

  const navigate = useNavigate();

  // Password validation logic
  const passwordValidation = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /\d/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      match:
        newPassword.length > 0 &&
        confirmPassword.length > 0 &&
        newPassword === confirmPassword,
    };
  }, [newPassword, confirmPassword]);

  const allValid =
    passwordValidation.length &&
    passwordValidation.upper &&
    passwordValidation.lower &&
    passwordValidation.number &&
    passwordValidation.special &&
    passwordValidation.match;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) {
      alert("Please fix password validation errors before continuing.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 🔐 Simulate password reset API call
      console.log("Password reset request:", { newPassword });
      await new Promise((res) => setTimeout(res, 1500));

      toast("Password successfully reset!");
      navigate("/");
    } catch (error) {
      console.error("Password reset failed:", error);
      alert("Failed to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background/98 to-background/95 relative overflow-hidden">
      {/* Aurora glowing background */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "10s", animationDelay: "-3s" }}
        />
      </div>

      {/* Main Reset Card */}
      <Card
        className={cn(
          "w-full backdrop-blur-sm glass-effect border-2 border-primary/20 shadow-custom-lg",
          "bg-gradient-to-br from-background/95 via-background/90 to-background/85",
          isMobile ? "max-w-[90%]" : "max-w-[420px]"
        )}
      >
        <CardHeader className="space-y-3">
          <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Reset Password
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Create a strong password that meets the requirements below
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* New Password Field */}
            <div className="space-y-2 relative">
              <label
                htmlFor="newPassword"
                className="text-sm font-medium text-foreground/90"
              >
                New Password
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-11 px-4 pr-10 border-primary/20 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-primary transition-colors"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2 relative">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-foreground/90"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-11 px-4 pr-10 border-primary/20 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-primary transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Validation Section */}
            <div className="space-y-1 pt-2 text-sm">
              <p className="font-medium text-foreground/80 mb-1">
                Password must contain:
              </p>
              <ValidationItem
                valid={passwordValidation.length}
                text="At least 8 characters"
              />
              <ValidationItem
                valid={passwordValidation.upper}
                text="One uppercase letter (A–Z)"
              />
              <ValidationItem
                valid={passwordValidation.lower}
                text="One lowercase letter (a–z)"
              />
              <ValidationItem
                valid={passwordValidation.number}
                text="One number (0–9)"
              />
              <ValidationItem
                valid={passwordValidation.special}
                text="One special character (!@#$...)"
              />
              <ValidationItem
                valid={passwordValidation.match}
                text="Passwords match"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !allValid}
              className={cn(
                "w-full h-11 text-primary-foreground font-medium transition-all duration-300",
                allValid
                  ? "bg-gradient-to-br from-primary to-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>

            {/* Back to Login */}
            <div className="text-center pt-2">
              <Button
                type="button"
                variant="link"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
                onClick={() => navigate("/")}
              >
                Back to Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Floating background shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute top-1/4 right-1/4 w-64 h-64 bg-accent/8 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-2s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-primary/8 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-3s" }}
        />
      </div>
    </div>
  );
}

/** ✅ Inline reusable validation row */
function ValidationItem({ valid, text }: { valid: boolean; text: string }) {
  return (
    <div
      className={cn(
        "flex items-center space-x-2 transition-colors",
        valid ? "text-green-500" : "text-red-500"
      )}
    >
      {valid ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <XCircle className="w-4 h-4" />
      )}
      <span>{text}</span>
    </div>
  );
}
