import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, TrendingUp, BookOpen, AlertCircle, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

export default function Counseling() {
  const navigate = useNavigate();
  
  // Mock data - will be replaced with actual data from Supabase
  const sessionHistory = [
    { id: 1, date: "2024-01-15", duration: "25 min", mood: "😊", topic: "Stress Management" },
    { id: 2, date: "2024-01-13", duration: "30 min", mood: "😐", topic: "Daily Check-in" },
    { id: 3, date: "2024-01-10", duration: "20 min", mood: "😔", topic: "Anxiety Support" },
  ];

  const moodData = [
    { day: "Mon", score: 7 },
    { day: "Tue", score: 6 },
    { day: "Wed", score: 8 },
    { day: "Thu", score: 7 },
    { day: "Fri", score: 9 },
    { day: "Sat", score: 8 },
    { day: "Sun", score: 7 },
  ];

  const selfHelpTools = [
    { icon: Heart, title: "Breathing Exercise", description: "5-minute calm breathing" },
    { icon: BookOpen, title: "Journaling Prompt", description: "Express your feelings" },
    { icon: TrendingUp, title: "Gratitude Practice", description: "Find three positives" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="container px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Virtual Counselor Section */}
        <Card className="p-6 gradient-primary">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16 border-2 border-primary-foreground">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary-foreground text-primary text-xl">
                AI
              </AvatarFallback>
            </Avatar>
            <div className="text-primary-foreground">
              <h2 className="text-xl font-heading font-bold mb-1">Your AI Counselor</h2>
              <p className="text-sm opacity-90">Here to support you 24/7</p>
            </div>
          </div>
          <Button 
            size="lg" 
            variant="secondary" 
            className="w-full"
            onClick={() => navigate("/counseling/session")}
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Start New Session
          </Button>
        </Card>

        {/* Crisis Support */}
        <Card className="p-4 bg-emergency/10 border-emergency/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-emergency shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-sm mb-1">Need Immediate Help?</h3>
              <p className="text-xs text-muted-foreground mb-3">
                If you're in crisis or need urgent support
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-emergency/50 text-emergency">
                  Crisis Hotline
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate("/sos")}>
                  Emergency SOS
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Mood Tracking */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold">Weekly Mood Tracker</h3>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-end justify-between h-32 mb-3">
            {moodData.map((item, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div 
                  className="w-8 bg-primary rounded-t"
                  style={{ height: `${item.score * 10}%` }}
                />
                <span className="text-xs text-muted-foreground">{item.day}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Your average mood this week: <span className="text-primary font-semibold">7.4/10</span>
          </p>
        </Card>

        {/* Session History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold">Recent Sessions</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="space-y-3">
            {sessionHistory.map((session) => (
              <Card key={session.id} className="p-4 hover:shadow-medium transition-shadow cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{session.mood}</div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{session.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.date} · {session.duration}
                    </p>
                  </div>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Self-Help Tools */}
        <div>
          <h3 className="font-heading font-semibold mb-3">Self-Help Tools</h3>
          <div className="grid gap-3">
            {selfHelpTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <Card key={index} className="p-4 hover:shadow-medium transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-secondary/10">
                      <Icon className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tool.title}</p>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Progress Stats */}
        <Card className="p-5">
          <h3 className="font-heading font-semibold mb-4">Your Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Sessions Completed</span>
                <span className="font-semibold">12/20</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Coping Skills Learned</span>
                <span className="font-semibold">8/15</span>
              </div>
              <Progress value={53} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Wellness Goals</span>
                <span className="font-semibold">5/8</span>
              </div>
              <Progress value={62} className="h-2" />
            </div>
          </div>
        </Card>
      </div>

      <BottomTabBar />
    </div>
  );
}
