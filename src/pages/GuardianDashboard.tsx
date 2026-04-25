import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, CheckCircle, BookOpen, MapPin, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type Child = {
  id: string;
  child_id: string;
  name: string;
  initials: string;
};

export default function GuardianDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selected, setSelected] = useState<Child | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: links } = await supabase
        .from("guardian_child_links")
        .select("id, child_id")
        .eq("guardian_id", user.id)
        .eq("status", "approved");

      if (!links || links.length === 0) {
        setChildren([]);
        setLoading(false);
        return;
      }

      const childIds = links.map((l) => l.child_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", childIds);

      const list: Child[] = links.map((l) => {
        const p = profiles?.find((x) => x.user_id === l.child_id);
        const name = p?.full_name || p?.email || "Child";
        return {
          id: l.id,
          child_id: l.child_id,
          name,
          initials: name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase(),
        };
      });
      setChildren(list);
      setSelected(list[0] ?? null);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const [a, p, l] = await Promise.all([
        supabase.from("safety_alerts").select("*").eq("user_id", selected.child_id)
          .order("created_at", { ascending: false }).limit(20),
        supabase.from("learning_progress").select("*").eq("user_id", selected.child_id)
          .order("updated_at", { ascending: false }),
        supabase.from("location_tracking").select("*").eq("user_id", selected.child_id)
          .order("location_timestamp", { ascending: false }).limit(10),
      ]);
      setAlerts(a.data ?? []);
      setProgress(p.data ?? []);
      setLocations(l.data ?? []);
    })();
  }, [selected]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>
        <BottomTabBar />
      </div>
    );
  }

  const completed = progress.filter((p) => p.status === "completed").length;
  const total = progress.length;
  const learningPct = total ? Math.round((completed / total) * 100) : 0;
  const recentAlerts = alerts.filter((a) => new Date(a.created_at).getTime() > Date.now() - 7 * 86400000);
  const safetyScore = Math.max(20, 100 - (
    recentAlerts.filter((a) => a.severity === "critical").length * 20 +
    recentAlerts.filter((a) => a.severity === "high").length * 10 +
    recentAlerts.filter((a) => a.severity === "medium").length * 5
  ));

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Guardian Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor and support your dependents' safety</p>
        </div>

        {children.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                No linked children yet. Send a guardian invitation from your child's profile to start monitoring.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {children.map((child) => (
                <Card
                  key={child.id}
                  className={`cursor-pointer transition-all min-w-[200px] ${
                    selected?.id === child.id ? "border-primary" : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelected(child)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">{child.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{child.name}</p>
                      </div>
                      <Badge variant={recentAlerts.length === 0 ? "default" : "secondary"} className="ml-auto">
                        {recentAlerts.length === 0 ? (
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

            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold">{safetyScore}%</p>
                  <p className="text-sm text-muted-foreground">Safety Score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-accent" />
                  <p className="text-3xl font-bold">{completed}/{total || 0}</p>
                  <p className="text-sm text-muted-foreground">Lessons Complete</p>
                  <Progress value={learningPct} className="h-2 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-secondary" />
                  <p className="text-3xl font-bold">{recentAlerts.length}</p>
                  <p className="text-sm text-muted-foreground">Alerts (7d)</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="alerts" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>

              <TabsContent value="alerts" className="space-y-3 mt-4">
                {alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No alerts.</p>
                ) : alerts.map((alert) => (
                  <Card key={alert.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${
                          alert.severity === "critical" || alert.severity === "high" ? "bg-emergency/10" :
                          alert.severity === "medium" ? "bg-accent/10" : "bg-primary/10"
                        }`}>
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{alert.title}</p>
                          {alert.description && <p className="text-sm text-muted-foreground">{alert.description}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={alert.severity === "high" || alert.severity === "critical" ? "destructive" : "secondary"}>
                          {alert.severity}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="location" className="space-y-3 mt-4">
                {locations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No location updates.</p>
                ) : locations.map((loc) => (
                  <Card key={loc.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <MapPin className="h-6 w-6 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium">
                            {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(loc.location_timestamp ?? loc.created_at).toLocaleString()}
                          </p>
                        </div>
                        {loc.is_emergency && <Badge variant="destructive">Emergency</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="progress" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Learning Progress</CardTitle>
                    <CardDescription>{selected?.name}'s learning modules</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {progress.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No progress yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {progress.map((m) => (
                          <div key={m.id}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{m.module_title}</span>
                              <span className="text-sm text-muted-foreground">{m.progress_percentage ?? 0}%</span>
                            </div>
                            <Progress value={m.progress_percentage ?? 0} className="h-2" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
      <BottomTabBar />
    </div>
  );
}
