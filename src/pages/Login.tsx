import { useState } from "react";
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
import { login } from "@/lib/api/endpoints/auth";
import { useToast } from "@/components/ui/use-toast";
import { saveAuth } from "@/lib/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [remember, setRemember] = useState(false);
  const isMobile = useIsMobile();

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await login({ email, password });
      console.log("Login response:", JSON.stringify(res));

      // Expecting: { access_token, token_type, user }
      if (res?.access_token) {
        saveAuth(
          {
            access_token: res.access_token,
            token_type: res.token_type,
            user: res.user,
          },
          remember
        );
      }
      toast({
        title: "Logged in",
        description: res?.message || "Welcome back!",
      });
      navigate("/role-selection");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background/98 to-background/95 relative overflow-hidden">
      {/* Aurora background effect */}
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
      <Card
        className={cn(
          "w-full backdrop-blur-sm glass-effect border-2 border-primary/20 shadow-custom-lg",
          "bg-gradient-to-br from-background/95 via-background/90 to-background/85",
          isMobile ? "max-w-[90%]" : "max-w-[400px]"
        )}
      >
        <CardHeader className="space-y-3">
          <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground/90"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 px-4 border-primary/20 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 px-4 border-gray-200/70 bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary/20"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Remember me
                </label>
              </div>
              <Button
                type="button"
                variant="link"
                className="text-sm px-0 text-primary hover:text-primary/80 transition-colors"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </Button>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] font-medium"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Additional background elements matching website theme */}
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
