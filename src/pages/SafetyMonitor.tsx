import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, CheckCircle, Settings, Eye, EyeOff, TrendingUp } from "lucide-react";

export default function SafetyMonitor() {
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [guardianVisibility, setGuardianVisibility] = useState(true);

  const safetyScore = 85;
  
  const alerts = [
    { id: 1, type: "warning", message: "Suspicious message detected in chat", time: "2 hours ago", severity: "medium" },
    { id: 2, type: "blocked", message: "Inappropriate content blocked", time: "5 hours ago", severity: "high" },
    { id: 3, type: "info", message: "New safety check completed", time: "1 day ago", severity: "low" },
  ];

  const blockedContent = {
    today: 3,
    thisWeek: 12,
    thisMonth: 45,
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Safety Monitor</h1>
            <p className="text-muted-foreground">Real-time protection and alerts</p>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Monitoring Status */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${monitoringEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Shield className={`h-6 w-6 ${monitoringEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <CardTitle>AI Safety Monitoring</CardTitle>
                  <CardDescription>
                    {monitoringEnabled ? "Active and protecting you" : "Currently disabled"}
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={monitoringEnabled}
                onCheckedChange={setMonitoringEnabled}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Safety Score */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Safety Score</CardTitle>
              <Badge variant={safetyScore >= 80 ? "default" : safetyScore >= 60 ? "secondary" : "destructive"}>
                {safetyScore}%
              </Badge>
            </div>
            <CardDescription>Based on recent activity and protection measures</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={safetyScore} className="h-3" />
            <div className="flex items-center gap-2 mt-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">+5% from last week</p>
            </div>
          </CardContent>
        </Card>

        {/* Blocked Content Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Content Protection</CardTitle>
            <CardDescription>Harmful content blocked automatically</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{blockedContent.today}</p>
                <p className="text-sm text-muted-foreground mt-1">Today</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{blockedContent.thisWeek}</p>
                <p className="text-sm text-muted-foreground mt-1">This Week</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{blockedContent.thisMonth}</p>
                <p className="text-sm text-muted-foreground mt-1">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Settings Tabs */}
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="alerts">Alert History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="alerts" className="space-y-4 mt-4">
            {alerts.map((alert) => (
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

          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Monitoring Preferences</CardTitle>
                <CardDescription>Customize your safety monitoring settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Text Message Monitoring</Label>
                    <p className="text-sm text-muted-foreground">Scan messages for harmful content</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Social Media Monitoring</Label>
                    <p className="text-sm text-muted-foreground">Monitor social media interactions</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Real-time Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified immediately of threats</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label>Guardian Visibility</Label>
                      {guardianVisibility ? (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Allow guardians to view alerts</p>
                  </div>
                  <Switch 
                    checked={guardianVisibility}
                    onCheckedChange={setGuardianVisibility}
                  />
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
