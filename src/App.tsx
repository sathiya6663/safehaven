import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/counseling" element={<Counseling />} />
          <Route path="/counseling/session" element={<CounselingSession />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/sos" element={<SOS />} />
          
          {/* Phase 3: Safety Tools & Emergency Features */}
          <Route path="/safety-monitor" element={<SafetyMonitor />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/evidence-vault" element={<EvidenceVault />} />
          <Route path="/tracking" element={<Tracking />} />
          
          {/* Phase 4: Community & Advanced Features */}
          <Route path="/learning" element={<Learning />} />
          <Route path="/learning/story/:id" element={<LearningStory />} />
          <Route path="/learning/quiz/:id" element={<LearningQuiz />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/community" element={<Community />} />
          <Route path="/guardian-dashboard" element={<GuardianDashboard />} />
          <Route path="/help" element={<Help />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
