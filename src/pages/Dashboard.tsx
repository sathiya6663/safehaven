import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, BookOpen, Shield, MessageCircle } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="container px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-heading font-bold mb-1">Welcome back!</h1>
          <p className="text-muted-foreground">How are you feeling today?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 hover:shadow-medium transition-shadow cursor-pointer">
            <Heart className="h-8 w-8 text-secondary mb-2" />
            <h3 className="font-heading font-semibold text-sm mb-1">Talk to AI</h3>
            <p className="text-xs text-muted-foreground">Get support now</p>
          </Card>
          
          <Card className="p-4 hover:shadow-medium transition-shadow cursor-pointer">
            <BookOpen className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-heading font-semibold text-sm mb-1">Learn</h3>
            <p className="text-xs text-muted-foreground">Build confidence</p>
          </Card>
          
          <Card className="p-4 hover:shadow-medium transition-shadow cursor-pointer">
            <Shield className="h-8 w-8 text-accent mb-2" />
            <h3 className="font-heading font-semibold text-sm mb-1">Safety Tools</h3>
            <p className="text-xs text-muted-foreground">Stay protected</p>
          </Card>
          
          <Card className="p-4 hover:shadow-medium transition-shadow cursor-pointer">
            <MessageCircle className="h-8 w-8 text-secondary mb-2" />
            <h3 className="font-heading font-semibold text-sm mb-1">Community</h3>
            <p className="text-xs text-muted-foreground">Connect safely</p>
          </Card>
        </div>

        {/* Daily Check-in */}
        <Card className="p-5">
          <h3 className="font-heading font-semibold mb-3">Daily Check-in</h3>
          <p className="text-sm text-muted-foreground mb-4">
            How are you feeling today?
          </p>
          <div className="flex gap-2">
            {["😊", "😐", "😔", "😰", "😢"].map((emoji, i) => (
              <button
                key={i}
                className="flex-1 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-2xl"
              >
                {emoji}
              </button>
            ))}
          </div>
        </Card>

        {/* Safety Score */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold">Safety Score</h3>
            <span className="text-2xl font-bold text-primary">85%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: "85%" }} />
          </div>
          <p className="text-xs text-muted-foreground">
            Great! Your safety settings are well configured.
          </p>
        </Card>
      </div>

      <BottomTabBar />
    </div>
  );
}
