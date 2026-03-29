import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import CoursePreview from "./pages/CoursePreview";
import Course from "./pages/Course";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ParentDashboard from "./pages/ParentDashboard";
import ManageChildren from "./pages/ManageChildren";
import NotFound from "./pages/NotFound";
import BookArmourOfGod from "./pages/BookArmourOfGod";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AgeVerification from "./pages/AgeVerification";
import AdminDashboard from "./pages/AdminDashboard";
import CookieConsent from "./components/CookieConsent";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (profile?.is_admin) return <>{children}</>;
  if (profile && !profile.age_verified) {
    return <Navigate to="/verify-age" replace />;
  }
  return <>{children}</>;
}

function AdminGuard() {
  const { profile } = useAuth();
  if (!profile?.is_admin) return <Navigate to="/" replace />;
  return <AdminDashboard />;
}

/** Redirects authenticated-but-unverified users to /verify-age from any public page */
function AgeGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const exempt = ["/verify-age", "/privacy", "/terms", "/reset-password"];
  if (!loading && user && profile && !profile.is_admin && !profile.age_verified && !exempt.includes(location.pathname)) {
    return <Navigate to="/verify-age" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AgeGate>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/courses/:courseId" element={<CoursePreview />} />
              <Route path="/books/armour-of-god" element={<BookArmourOfGod />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/verify-age" element={<AgeVerification />} />

              {/* Protected */}
              <Route path="/family" element={<ProtectedRoute><ManageChildren /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/course" element={<ProtectedRoute><Course /></ProtectedRoute>} />
              <Route path="/parent" element={<ProtectedRoute><ParentDashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminGuard /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AgeGate>
          <CookieConsent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
