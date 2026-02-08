import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Suspense, lazy } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Lazy load pages
const Welcome = lazy(() => import("./pages/Welcome"));
const SignUp = lazy(() => import("./pages/SignUp"));
const SignIn = lazy(() => import("./pages/SignIn"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Counseling = lazy(() => import("./pages/Counseling"));
const CounselingSession = lazy(() => import("./pages/CounselingSession"));
const Profile = lazy(() => import("./pages/Profile"));
const SOS = lazy(() => import("./pages/SOS"));
const SafetyMonitor = lazy(() => import("./pages/SafetyMonitor"));
const Emergency = lazy(() => import("./pages/Emergency"));
const EvidenceVault = lazy(() => import("./pages/EvidenceVault"));
const Tracking = lazy(() => import("./pages/Tracking"));
const Learning = lazy(() => import("./pages/Learning"));
const LearningStory = lazy(() => import("./pages/LearningStory"));
const LearningQuiz = lazy(() => import("./pages/LearningQuiz"));
const Legal = lazy(() => import("./pages/Legal"));
const Community = lazy(() => import("./pages/Community"));
const GuardianDashboard = lazy(() => import("./pages/GuardianDashboard"));
const Help = lazy(() => import("./pages/Help"));
const TestingDashboard = lazy(() => import("./pages/TestingDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
              </div>
            }>
              <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/sos" element={<SOS />} />
            <Route path="/help" element={<Help />} />
            <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/counseling" element={<ProtectedRoute><Counseling /></ProtectedRoute>} />
            <Route path="/counseling/session" element={<ProtectedRoute><CounselingSession /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            
            {/* Phase 3: Safety Tools & Emergency Features */}
            <Route path="/safety-monitor" element={<ProtectedRoute><SafetyMonitor /></ProtectedRoute>} />
            <Route path="/emergency" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
            <Route path="/evidence-vault" element={<ProtectedRoute><EvidenceVault /></ProtectedRoute>} />
            <Route path="/tracking" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
            
            {/* Phase 4: Community & Advanced Features */}
            <Route path="/learning" element={<ProtectedRoute><Learning /></ProtectedRoute>} />
            <Route path="/learning/story/:id" element={<ProtectedRoute><LearningStory /></ProtectedRoute>} />
            <Route path="/learning/quiz/:id" element={<ProtectedRoute><LearningQuiz /></ProtectedRoute>} />
            <Route path="/legal" element={<ProtectedRoute><Legal /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/guardian-dashboard" element={<ProtectedRoute allowedTypes={['guardian']}><GuardianDashboard /></ProtectedRoute>} />
            <Route path="/testing-dashboard" element={<ProtectedRoute><TestingDashboard /></ProtectedRoute>} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
