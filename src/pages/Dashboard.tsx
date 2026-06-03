import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, BookOpen, Shield, MessageCircle, MapPin, Calendar, TrendingUp, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { RiskScoreCard } from "@/components/RiskScoreCard";
import { RecentAlerts } from "@/components/RecentAlerts";
import { MoodTrackerChart } from "@/components/MoodTrackerChart";
import { ProgressCards } from "@/components/ProgressCards";
import { SessionHistoryComponent } from "@/components/SessionHistoryComponent";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MOODS: { emoji: string; label: string; state: "happy" | "calm" | "neutral" | "anxious" | "sad" }[] = [
  { emoji: "😊", label: "Happy", state: "happy" },
  { emoji: "😐", label: "Okay", state: "neutral" },
  { emoji: "😔", label: "Down", state: "sad" },
  { emoji: "😰", label: "Anxious", state: "anxious" },
  { emoji: "😢", label: "Sad", state: "sad" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 5
      ? "Good night"
      : currentHour < 12
        ? "Good morning"
        : currentHour < 17
          ? "Good afternoon"
          : currentHour < 21
            ? "Good evening"
            : "Good night";

  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [savingMood, setSavingMood] = useState(false);

  // Load today's mood check-in
  useEffect(() => {
    if (!user) return;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    (async () => {
      const { data: todayRes } = await supabase
        .from("counseling_sessions")
        .select("emotional_state, created_at")
        .eq("user_id", user.id)
        .eq("topic", "Daily Check-in")
        .gte("created_at", startOfDay.toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (todayRes && todayRes.length > 0) {
        setTodayMood(todayRes[0].emotional_state ?? null);
      }
    })();
  }, [user]);

  const handleMood = async (mood: typeof MOODS[number]) => {
    if (!user || savingMood) return;
    setSavingMood(true);
    const { error } = await supabase.from("counseling_sessions").insert({
      user_id: user.id,
      session_date: new Date().toISOString(),
      topic: "Daily Check-in",
      emotional_state: mood.state,
      duration_minutes: 0,
    });
    setSavingMood(false);
    if (error) {
      toast.error("Couldn't save check-in", { description: error.message });
      return;
    }
    setTodayMood(mood.state);
    toast.success(`Logged: ${mood.label} ${mood.emoji}`);
  };

  const displayName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="container px-4 py-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold mb-1">
            {greeting}{displayName ? `, ${displayName}` : ""}! 👋
          </h1>
          <p className="text-muted-foreground">How are you feeling today?</p>
        </div>

        <RiskScoreCard />

        <Card className="p-5 gradient-primary">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-primary-foreground">Daily Check-in</h3>
            {todayMood && (
              <span className="flex items-center gap-1 text-xs text-primary-foreground/90">
                <Check className="h-3 w-3" /> Logged today
              </span>
            )}
          </div>
          <p className="text-sm text-primary-foreground/90 mb-4">
            {todayMood
              ? "You can update your mood by tapping a different emoji."
              : "Take a moment to reflect on your emotions"}
          </p>
          <div className="flex gap-2">
            {MOODS.map((mood) => {
              const selected = todayMood === mood.state;
              return (
                <button
                  key={mood.label}
                  type="button"
                  disabled={savingMood}
                  onClick={() => handleMood(mood)}
                  aria-label={`Log mood: ${mood.label}`}
                  className={cn(
                    "flex-1 p-3 rounded-lg transition-all text-2xl backdrop-blur disabled:opacity-50",
                    selected
                      ? "bg-primary-foreground/40 ring-2 ring-primary-foreground scale-105"
                      : "bg-primary-foreground/20 hover:bg-primary-foreground/30 active:scale-95",
                  )}
                >
                  {mood.emoji}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/counseling")}>
            <Heart className="h-8 w-8 text-secondary mb-2" />
            <h3 className="font-heading font-semibold text-sm mb-1">AI Counselor</h3>
            <p className="text-xs text-muted-foreground">Get support now</p>
          </Card>
          <Card className="p-4 hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/learning")}>
            <BookOpen className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-heading font-semibold text-sm mb-1">Learn</h3>
            <p className="text-xs text-muted-foreground">Build confidence</p>
          </Card>
          <Card className="p-4 hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/safety-monitor")}>
            <Shield className="h-8 w-8 text-accent mb-2" />
            <h3 className="font-heading font-semibold text-sm mb-1">Safety Tools</h3>
            <p className="text-xs text-muted-foreground">Stay protected</p>
          </Card>
          <Card className="p-4 hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/community")}>
            <MessageCircle className="h-8 w-8 text-secondary mb-2" />
            <h3 className="font-heading font-semibold text-sm mb-1">Community</h3>
            <p className="text-xs text-muted-foreground">Connect safely</p>
          </Card>
        </div>

        {profile?.location && (
          <Card className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-heading font-semibold mb-1">Your Location</h3>
                <p className="text-sm text-muted-foreground">{profile.location}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Real-time Progress Cards */}
        <div>
          <h2 className="font-heading font-semibold mb-3 text-lg">Your Progress</h2>
          <ProgressCards />
        </div>

        {/* Mood Tracker with real data */}
        <MoodTrackerChart />

        {/* Recent Sessions with real data */}
        <SessionHistoryComponent />

        {/* Safety Score Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold">Weekly Safety Summary</h3>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Your risk score is calculated in real-time based on your mood entries, emotional state, and safety alerts.
            The system analyzes your patterns to provide personalized recommendations.
          </p>
          <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/risk-alert')}>
            View Risk Analysis
          </Button>
        </Card>

        <RecentAlerts limit={5} />
      </div>

      <BottomTabBar />
    </div>
  );
}
