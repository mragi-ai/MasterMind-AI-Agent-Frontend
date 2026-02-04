import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import RoleSelection from "./pages/RoleSelection";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "@/components/ProtectedRoute";
import VideoLessons from "./pages/VideoLessons";
import VideoViewer from "./pages/VideoViewer";
// Demo pages - commented out for now
// import DemoRoles from "./pages/DemoRoles";
// import DemoChat from "./pages/DemoChat";
// import DemoCall from "./pages/DemoCall";
import Call from "./pages/Call";
import UserProfile from "./pages/UserProfile";

const App = () => (
  <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requireAuth={false}>
                <Login />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/video-lessons"
            element={
              <ProtectedRoute>
                <VideoLessons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/video-viewer"
            element={
              <ProtectedRoute>
                <VideoViewer />
              </ProtectedRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/role-selection"
            element={
              <ProtectedRoute>
                <RoleSelection />
              </ProtectedRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Demo routes - commented out for now */}
          {/* <Route path="/demo-roles" element={<DemoRoles />} /> */}
          {/* <Route path="/demo-chat" element={<DemoChat />} /> */}
          {/* <Route path="/demo-call" element={<DemoCall />} /> */}
          <Route
            path="/call"
            element={
              <ProtectedRoute>
                <Call />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </ThemeProvider>
);

export default App;
