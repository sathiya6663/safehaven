import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  MessageSquare,
  BookOpen,
  MapPin,
  Clock,
  Activity
} from "lucide-react";

export default function GuardianDashboard() {
  const childAccounts = [
    { id: 1, name: "Emma", initials: "E", age: 14, status: "safe" },
    { id: 2, name: "Alex", initials: "A", age: 12, status: "monitoring" },
  ];

  const [selectedChild, setSelectedChild] = useState(childAccounts[0]);

  const safetyAlerts = [
    {
      id: 1,
      type: "warning",
      message: "Suspicious message detected in social media",
      time: "2 hours ago",
      severity: "medium",
      child: "Emma",
    },
    {
      id: 2,
      type: "info",
      message: "Learning session completed: Understanding Boundaries",
      time: "5 hours ago",
      severity: "low",
      child: "Emma",
    },
    {
      id: 3,
      type: "blocked",
      message: "Inappropriate content blocked",
      time: "1 day ago",
      severity: "high",
      child: "Alex",
    },
  ];

  const activitySummary = {
    learningProgress: 75,
    completedLessons: 8,
    totalLessons: 12,
    safetyScore: 92,
    activeHours: "2.5 hrs today",
    lastActive: "30 minutes ago",
  };

  const recentLocations = [
    { id: 1, place: "Home", time: "Now", status: "safe" },
    { id: 2, place: "School", time: "8:00 AM - 3:00 PM", status: "safe" },
    { id: 3, place: "Library", time: "Yesterday, 4:00 PM", status: "safe" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Guardian Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor and support your child's safety</p>
        </div>

        {/* Child Selector */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {childAccounts.map((child) => (
            <Card
              key={child.id}
              className={`cursor-pointer transition-all min-w-[200px] ${
                selectedChild.id === child.id ? 'border-primary' : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedChild(child)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {child.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{child.name}</p>
                    <p className="text-sm text-muted-foreground">Age {child.age}</p>
                  </div>
                  <Badge
                    variant={child.status === "safe" ? "default" : "secondary"}
                    className="ml-auto"
                  >
                    {child.status === "safe" ? (
                      <><CheckCircle className="h-3 w-3 mr-1" />Safe</>
                    ) : (
                      <><Activity className="h-3 w-3 mr-1" />Monitoring</>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Safety Overview */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold">{activitySummary.safetyScore}%</p>
              <p className="text-sm text-muted-foreground">Safety Score</p>
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-primary">
                <TrendingUp className="h-3 w-3" />
                <span>+5% this week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-accent" />
              <p className="text-3xl font-bold">{activitySummary.completedLessons}/{activitySummary.totalLessons}</p>
              <p className="text-sm text-muted-foreground">Lessons Complete</p>
              <Progress value={activitySummary.learningProgress} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-secondary" />
              <p className="text-xl font-bold">{activitySummary.activeHours}</p>
              <p className="text-sm text-muted-foreground">Active Time</p>
              <p className="text-xs text-muted-foreground mt-2">
                Last seen: {activitySummary.lastActive}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-3 mt-4">
            {safetyAlerts
              .filter(alert => alert.child === selectedChild.name)
              .map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${
                        alert.severity === 'high' ? 'bg-emergency/10' : 
                        alert.severity === 'medium' ? 'bg-accent/10' : 
                        'bg-primary/10'
                      }`}>
                        {alert.type === 'blocked' ? (
                          <AlertTriangle className={`h-5 w-5 ${
                            alert.severity === 'high' ? 'text-emergency' : 
                            alert.severity === 'medium' ? 'text-accent' : 
                            'text-primary'
                          }`} />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-muted-foreground mt-1">{alert.time}</p>
                      </div>
                      <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>What {selectedChild.name} has been doing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Completed Learning Story</p>
                      <p className="text-sm text-muted-foreground">"Understanding Boundaries" - 5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <p className="font-medium">Community Interaction</p>
                      <p className="text-sm text-muted-foreground">Posted in "General Support" forum - 1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-secondary mt-0.5" />
                    <div>
                      <p className="font-medium">Safety Check Completed</p>
                      <p className="text-sm text-muted-foreground">All systems normal - 2 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="space-y-3 mt-4">
            {recentLocations.map((location) => (
              <Card key={location.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <MapPin className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{location.place}</p>
                      <p className="text-sm text-muted-foreground">{location.time}</p>
                    </div>
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {location.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Location tracking is enabled. {selectedChild.name} can share their location when needed.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Learning Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Safety Basics</span>
                      <span className="text-sm text-muted-foreground">100%</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Digital Safety</span>
                      <span className="text-sm text-muted-foreground">60%</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Building Resilience</span>
                      <span className="text-sm text-muted-foreground">30%</span>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg border">
                    <div className="text-2xl mb-1">🏆</div>
                    <p className="text-xs font-medium">First Steps</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border">
                    <div className="text-2xl mb-1">🔥</div>
                    <p className="text-xs font-medium">7 Day Streak</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border">
                    <div className="text-2xl mb-1">⭐</div>
                    <p className="text-xs font-medium">Quiz Master</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomTabBar />
    </div>
  );
}
