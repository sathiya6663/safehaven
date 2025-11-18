import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Welcome from "./pages/Welcome";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import Counseling from "./pages/Counseling";
import CounselingSession from "./pages/CounselingSession";
import Profile from "./pages/Profile";
import SOS from "./pages/SOS";
import SafetyMonitor from "./pages/SafetyMonitor";
import Emergency from "./pages/Emergency";
import EvidenceVault from "./pages/EvidenceVault";
import Tracking from "./pages/Tracking";
import Learning from "./pages/Learning";
import LearningStory from "./pages/LearningStory";
import LearningQuiz from "./pages/LearningQuiz";
import Legal from "./pages/Legal";
import Community from "./pages/Community";
import GuardianDashboard from "./pages/GuardianDashboard";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
