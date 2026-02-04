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
import { useNavigate } from "react-router-dom";
import { login } from "@/lib/api/endpoints/auth";
import { useToast } from "@/components/ui/use-toast";
import { saveAuth } from "@/lib/auth";
// Microsoft SSO imports (commented out for simplified flow)
// import {
//   initializeMsal,
//   loginWithMicrosoft as msalLogin,
// } from "@/lib/auth/msalUtils";
// import { MICROSOFT_CLIENT_ID } from "@/lib/auth/values";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Clock, GraduationCap } from "lucide-react";
import evansLogo from "@/assets/evans-logo.png";
import masteryLogo from "@/assets/mastery-logo.png";
import useAppStore from "@/zustand";
import type { LucideIcon } from "lucide-react";

type FeatureHighlight = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const featureHighlights: FeatureHighlight[] = [
  {
    icon: Sparkles,
    title: "Role-based journeys",
    description:
      "Carrier, customer, and agent personas with curated practice paths.",
  },
  {
    icon: GraduationCap,
    title: "Guided simulations",
    description:
      "Practice live conversations with AI coaches tuned to real scenarios.",
  },
  {
    icon: Clock,
    title: "Progress intelligence",
    description:
      "Track mastery scores, unlock certifications, and stay on schedule.",
  },
];

const FeatureHighlightCard = ({
  icon: Icon,
  title,
  description,
}: FeatureHighlight) => (
  <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/50 p-4 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-card/80 hover:shadow-xl">
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
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
  const storedRole = useAppStore((state) => state.selectedRole);

  // Initialize MSAL on component mount
  // useEffect(() => {
  //   initializeMsal().catch((error) => {
  //     console.error("Failed to initialize MSAL:", error);
  //   });
  // }, []);

  // Default role for direct login flow
  const defaultRole = {
    id: "695b8cc6566a1ea150da303c",
    title: "Carrier Representative",
    description: "Coordinate with carriers, oversee loads, and keep freight moving on schedule.",
    color: "primary" as const,
    role: "carrier_representative",
  };

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
      
      // Set default role if none selected for simplified flow
      if (!storedRole) {
        useAppStore.getState().setSelectedRole(defaultRole);
      }
      
      toast({
        title: "Logged in",
        description: res?.message || "Welcome back!",
      });
      
      // Go directly to dashboard
      navigate("/dashboard");
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

  // const handleMicrosoftLogin = async () => {
  //   setMicrosoftSubmitting(true);
  //   try {
  //     // Check if Azure client ID is configured
  //     const clientId = MICROSOFT_CLIENT_ID;
  //     if (!clientId) {
  //       toast({
  //         title: "Configuration Error",
  //         description: "Microsoft SSO is not configured. Please contact your administrator.",
  //         variant: "destructive",
  //       });
  //       setMicrosoftSubmitting(false);
  //       return;
  //     }

  //     // Login with Microsoft using MSAL
  //     const msalResponse = await msalLogin();

  //     if (!msalResponse) {
  //       throw new Error("Microsoft login failed");
  //     }

  //     // Extract user info from the token
  //     const account = msalResponse.account;
  //     const claims = (account?.idTokenClaims ?? {}) as Record<string, unknown>;
  //     const emailClaim =
  //       typeof claims.preferred_username === "string"
  //         ? claims.preferred_username
  //         : typeof claims.email === "string"
  //         ? claims.email
  //         : null;
  //     const nameClaim =
  //       typeof claims.name === "string" ? claims.name : null;

  //     const email = emailClaim || account?.username || "";
  //     const name = nameClaim || account?.name || "";

  //     // Send Microsoft token to backend
  //     const res = await loginWithMicrosoft({
  //       access_token: msalResponse.accessToken,
  //       id_token: msalResponse.idToken,
  //       email: email,
  //       name: name,
  //     });

  //     // Save auth if response contains access_token
  //     if (res?.access_token) {
  //       saveAuth(
  //         {
  //           access_token: res.access_token,
  //           token_type: res.token_type,
  //           user: res.user || {
  //             email: email,
  //             name: name,
  //           },
  //         },
  //         remember
  //       );
  //     }

  //     toast({
  //       title: "Logged in",
  //       description: res?.message || "Welcome back!",
  //     });
  //     navigate("/role-selection");
  //   } catch (error: any) {
  //     console.error("Microsoft login error:", error);
  //     toast({
  //       title: "Microsoft login failed",
  //       description: error?.message || "Please try again",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setMicrosoftSubmitting(false);
  //   }
  // };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* Background gradients - theme aware */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.15),_transparent_60%)]" />
        <div className="absolute left-1/2 top-[-15%] h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-primary/20 opacity-40 blur-[180px]" />
        <div className="absolute bottom-[-25%] right-[-20%] h-[520px] w-[520px] rounded-full bg-accent/25 opacity-50 blur-[200px]" />
        <div className="absolute top-[40%] left-[-10%] h-[420px] w-[420px] rounded-full bg-primary/15 opacity-40 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center gap-10 px-6 py-12 sm:px-10 lg:flex-row lg:items-center lg:gap-16">
        <div className="flex-1 max-w-2xl space-y-8 text-center lg:text-left">
          {/* Brand Logos Section */}
          <div className="flex flex-col items-center lg:items-start gap-6 mb-8">
            {/* Primary Brand - Mastery */}
            <div className="flex flex-col items-center lg:items-start gap-2">
              <img 
                src={masteryLogo} 
                alt="Mastery" 
                className="h-16 sm:h-20 lg:h-24 w-auto" 
              />
            </div>
            
            {/* Secondary Brand - Evans */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
              <span className="text-muted-foreground text-xs sm:text-sm font-medium">Powered by</span>
              <div className="flex items-center gap-2">
                <img
                  src={evansLogo}
                  alt="Evans Network of Companies"
                  className="h-8 sm:h-10 lg:h-12 w-auto"
                />
                <span className="text-foreground/80 text-sm sm:text-base font-medium">
                  Evans Network of Companies
                </span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
            AI-Powered Training for Logistics Professionals
          </h1>
          <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0">
            Practice real conversations, watch curated lessons, and track your progress with our AI coaching platform.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {featureHighlights.map((feature) => (
              <FeatureHighlightCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>

        <div className="flex w-full max-w-md flex-1 justify-center">
          <div className="relative w-full">
            <div className="absolute -inset-[1.5px] rounded-[30px] bg-gradient-to-br from-primary/60 via-primary/30 to-accent/40 opacity-70 blur-lg" />
            <Card className="relative rounded-[30px] border border-border bg-card shadow-2xl backdrop-blur">
              <CardHeader className="space-y-3 pb-4">
                <CardTitle className="text-3xl font-semibold tracking-tight text-card-foreground">
                  Sign In
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Enter your credentials to access your training dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-foreground"
                    >
                      Work email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 rounded-2xl border border-input bg-background px-4 text-base shadow-sm transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-foreground"
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
                      className="h-12 rounded-2xl border border-input bg-background px-4 text-base shadow-sm transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="remember"
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm text-muted-foreground"
                      >
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
                    className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-accent text-base font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-primary/50"
                    disabled={submitting || microsoftSubmitting}
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative">
                      {submitting ? "Signing in..." : "Sign in"}
                    </span>
                  </Button>
                </form>

                {/* <Button
                  type="button"
                  variant="outline"
                  className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-primary/30 bg-transparent text-base font-semibold text-primary transition-all duration-300 hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => navigate("/demo-roles")}
                >
                  <span className="relative">Try Demo</span>
                </Button> */}

                <div className="relative">
                  <Separator className="bg-border" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Or
                  </span>
                </div>

                <p className="text-center text-xs text-muted-foreground">
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
