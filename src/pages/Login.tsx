import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { login, loginWithMicrosoft } from "@/lib/api/endpoints/auth";
import { useToast } from "@/components/ui/use-toast";
import { saveAuth } from "@/lib/auth";
import { initializeMsal, loginWithMicrosoft as msalLogin } from "@/lib/auth/msalUtils";
import { MICROSOFT_CLIENT_ID } from "@/lib/auth/values";
import { Separator } from "@/components/ui/separator";
import { Sparkles, ShieldCheck, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FeatureHighlight = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const featureHighlights: FeatureHighlight[] = [
  {
    icon: ShieldCheck,
    title: "Enterprise security",
    description: "SSO-first authentication with continuous compliance monitoring.",
  },
  {
    icon: Sparkles,
    title: "Intelligent workflows",
    description: "Onboard, orchestrate, and iterate your AI agents in minutes.",
  },
  {
    icon: Clock,
    title: "Real-time visibility",
    description: "Track performance metrics and automate escalations instantly.",
  },
];

const FeatureHighlightCard = ({
  icon: Icon,
  title,
  description,
}: FeatureHighlight) => (
  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.6)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/10">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white transition-colors duration-300 group-hover:bg-white/30">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold tracking-tight text-white/90">{title}</p>
        <p className="text-xs text-white/70">{description}</p>
      </div>
    </div>
  </div>
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [microsoftSubmitting, setMicrosoftSubmitting] = useState(false);
  const [remember, setRemember] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize MSAL on component mount
  useEffect(() => {
    initializeMsal().catch((error) => {
      console.error("Failed to initialize MSAL:", error);
    });
  }, []);

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

  const handleMicrosoftLogin = async () => {
    setMicrosoftSubmitting(true);
    try {
      // Check if Azure client ID is configured
      const clientId = MICROSOFT_CLIENT_ID;
      if (!clientId) {
        toast({
          title: "Configuration Error",
          description: "Microsoft SSO is not configured. Please contact your administrator.",
          variant: "destructive",
        });
        setMicrosoftSubmitting(false);
        return;
      }

      // Login with Microsoft using MSAL
      const msalResponse = await msalLogin();
      
      if (!msalResponse) {
        throw new Error("Microsoft login failed");
      }

      // Extract user info from the token
      const account = msalResponse.account;
      const claims = (account?.idTokenClaims ?? {}) as Record<string, unknown>;
      const emailClaim =
        typeof claims.preferred_username === "string"
          ? claims.preferred_username
          : typeof claims.email === "string"
          ? claims.email
          : null;
      const nameClaim =
        typeof claims.name === "string" ? claims.name : null;

      const email = emailClaim || account?.username || "";
      const name = nameClaim || account?.name || "";

      // Send Microsoft token to backend
      const res = await loginWithMicrosoft({
        access_token: msalResponse.accessToken,
        id_token: msalResponse.idToken,
        email: email,
        name: name,
      });

      // Save auth if response contains access_token
      if (res?.access_token) {
        saveAuth(
          {
            access_token: res.access_token,
            token_type: res.token_type,
            user: res.user || {
              email: email,
              name: name,
            },
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
      console.error("Microsoft login error:", error);
      toast({
        title: "Microsoft login failed",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setMicrosoftSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_60%)]" />
        <div className="absolute left-1/2 top-[-15%] h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-primary/30 opacity-40 blur-[180px]" />
        <div className="absolute bottom-[-25%] right-[-20%] h-[520px] w-[520px] rounded-full bg-accent/35 opacity-50 blur-[200px]" />
        <div className="absolute top-[40%] left-[-10%] h-[420px] w-[420px] rounded-full bg-primary/20 opacity-40 blur-[160px]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(148,163,184,0.12),transparent_45%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center gap-16 px-6 py-16 sm:px-10 lg:flex-row lg:items-center">
        <div className="flex-1 max-w-2xl space-y-8 text-center lg:text-left">
          <span className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 shadow-lg lg:self-start">
            <Sparkles className="h-4 w-4 text-white/80" />
            MasterMind AI Platform
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Sign in to orchestrate your intelligent agent workforce
          </h1>
          <p className="mx-auto max-w-xl text-base text-slate-300 sm:text-lg">
            Unified access for operations, product, and leadership teams. Launch new automations, monitor conversations, and keep every workflow aligned with your governance model.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featureHighlights.map((feature) => (
              <FeatureHighlightCard key={feature.title} {...feature} />
            ))}
          </div>

          <div className="mx-auto flex max-w-md flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur lg:mx-0 lg:flex-row lg:items-center lg:gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
              <Clock className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-left">
              <p className="text-sm font-semibold text-white/90">99.95% platform uptime</p>
              <p className="text-xs text-white/70">
                Join teams who automate securely while maintaining full visibility and control.
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-md flex-1 justify-center">
          <div className="relative w-full">
            <div className="absolute -inset-[1.5px] rounded-[30px] bg-gradient-to-br from-white/80 via-primary/50 to-accent/40 opacity-70 blur-lg" />
            <Card className="relative rounded-[30px] border border-white/20 bg-white/95 text-slate-900 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.65)] backdrop-blur">
              <CardHeader className="space-y-3 pb-4">
                <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">
                  Welcome back
                </CardTitle>
                <CardDescription className="text-base text-slate-500">
                  Log in with your company email or continue with Microsoft SSO.
                </CardDescription>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  Enterprise-grade security with SOC 2 & GDPR compliance.
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-600">
                      Work email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base shadow-sm transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-slate-600">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base shadow-sm transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="remember"
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      <label htmlFor="remember" className="text-sm text-slate-500">
                        Remember me
                      </label>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm font-medium text-primary hover:text-primary/80"
                      onClick={() => navigate("/forgot-password")}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-accent text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-primary/50"
                    disabled={submitting || microsoftSubmitting}
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative">
                      {submitting ? "Signing in..." : "Sign in"}
                    </span>
                  </Button>
                </form>

                <div className="relative">
                  <Separator className="bg-slate-200" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    Or
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5"
                  onClick={handleMicrosoftLogin}
                  disabled={submitting || microsoftSubmitting}
                >
                  {microsoftSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 animate-spin text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg
                        width="21"
                        height="21"
                        viewBox="0 0 21 21"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect x="0.5" y="0.5" width="10" height="10" fill="#F25022" />
                        <rect x="10.5" y="0.5" width="10" height="10" fill="#7FBA00" />
                        <rect x="0.5" y="10.5" width="10" height="10" fill="#00A4EF" />
                        <rect x="10.5" y="10.5" width="10" height="10" fill="#FFB900" />
                      </svg>
                      Continue with Microsoft
                    </span>
                  )}
                </Button>

                <p className="text-center text-xs text-slate-400">
                  By logging in you agree to our{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    terms
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    privacy policy
                  </button>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
