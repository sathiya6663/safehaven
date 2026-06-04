import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Trophy,
  Star,
  Target,
  Award,
  Flame,
  CheckCircle,
  Lock,
  Play,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// XP awarded per completed module
const XP_PER_STORY = 100;
const XP_PER_QUIZ  = 75;
const XP_PER_LEVEL = 250;

const STORY_CATALOG = [
  { id: 1, title: "Understanding Boundaries",  category: "Safety Basics", difficulty: "Beginner",     duration: "10 min" },
  { id: 2, title: "Online Safety Guide",        category: "Digital Safety", difficulty: "Beginner",     duration: "15 min" },
  { id: 3, title: "Building Confidence",        category: "Resilience",    difficulty: "Intermediate", duration: "20 min" },
  { id: 4, title: "Recognizing Warning Signs",  category: "Awareness",     difficulty: "Intermediate", duration: "18 min", locked: true },
];

const QUIZ_CATALOG = [
  { id: 1, title: "Safety Basics Quiz",  questions: 3 },
  { id: 2, title: "Online Safety Quiz",  questions: 3 },
  { id: 3, title: "Boundaries Quiz",     questions: 3 },
];

export default function Learning() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [progressRows, setProgressRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch all progress rows from Supabase ──────────────────────────────
  const fetchProgress = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("learning_progress")
      .select("*")
      .eq("user_id", user.id);
    if (!error) setProgressRows(data ?? []);
    setLoading(false);
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Re-fetch when tab/window gets focus (covers back-navigation from story/quiz)
  useEffect(() => {
    const onFocus = () => fetchProgress();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchProgress]);

  // Real-time subscription — any INSERT or UPDATE to learning_progress triggers a refresh
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`learning_progress_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "learning_progress",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchProgress()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchProgress]);

  // ── Derived stats ──────────────────────────────────────────────────────
  const completedStories = progressRows.filter(
    (r) => r.module_type === "story" && r.status === "completed"
  ).length;

  const completedQuizzes = progressRows.filter(
    (r) => r.module_type === "quiz" && r.status === "completed"
  ).length;

  const xp = completedStories * XP_PER_STORY + completedQuizzes * XP_PER_QUIZ;
  const level = Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
  const xpIntoLevel = xp % XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL;

  // Streak: count consecutive calendar days (today backwards) that have a last_accessed entry
  const accessedDays = new Set(
    progressRows
      .map((r) => r.last_accessed && new Date(r.last_accessed).toDateString())
      .filter(Boolean) as string[]
  );
  let streak = 0;
  const cursor = new Date();
  while (accessedDays.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const totalBadgesCount = progressRows.reduce(
    (sum, r) => sum + (Array.isArray(r.badges_earned) ? r.badges_earned.length : 0),
    0
  );

  // ── Badges ──────────────────────────────────────────────────────────────
  const badges = [
    { id: 1, name: "First Steps",     icon: Star,   earned: completedStories >= 1,  description: "Complete your first lesson" },
    { id: 2, name: "Week Warrior",    icon: Flame,  earned: streak >= 7,            description: "7 day learning streak" },
    { id: 3, name: "Safety Scholar",  icon: Award,  earned: completedStories >= 3,  description: "Complete 3 safety stories" },
    { id: 4, name: "Quiz Champion",   icon: Trophy, earned: progressRows.some((r) => (r.quiz_score ?? 0) >= 100), description: "Score 100% on a quiz" },
  ];

  // ── Stories list with live progress ────────────────────────────────────
  const stories = STORY_CATALOG.map((s) => {
    const row = progressRows.find(
      (r) => r.module_type === "story" && r.module_id === String(s.id)
    );
    return {
      ...s,
      progress:  row?.progress_percentage ?? 0,
      completed: row?.status === "completed",
    };
  });

  // ── Quizzes list with live scores ───────────────────────────────────────
  const quizzes = QUIZ_CATALOG.map((q) => {
    const row = progressRows.find(
      (r) => r.module_type === "quiz" && r.module_id === String(q.id)
    );
    return {
      ...q,
      bestScore: row?.quiz_score ?? null,
      completed: row?.status === "completed",
    };
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Learning Center</h1>
            <p className="text-muted-foreground">Learn, grow, and stay safe through interactive stories</p>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchProgress} aria-label="Refresh progress">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Progress Overview */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Level {level}
                </CardTitle>
                <CardDescription>
                  {xpToNextLevel - xpIntoLevel} XP to next level
                </CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-accent">
                    <Flame className="h-5 w-5" />
                    <span className="text-2xl font-bold">{streak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-primary">
                    <Award className="h-5 w-5" />
                    <span className="text-2xl font-bold">{totalBadgesCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Badges</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={(xpIntoLevel / xpToNextLevel) * 100} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {xp} / {level * XP_PER_LEVEL} XP total · {completedStories} stories · {completedQuizzes} quizzes completed
            </p>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>Earn badges as you learn and grow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-lg border text-center transition-all ${
                      badge.earned
                        ? "border-primary/50 bg-primary/5"
                        : "border-muted bg-muted/30 opacity-60"
                    }`}
                  >
                    <Icon className={`h-8 w-8 mx-auto mb-2 ${badge.earned ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-semibold text-sm">{badge.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Learning Content */}
        <Tabs defaultValue="stories" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          </TabsList>

          {/* Stories */}
          <TabsContent value="stories" className="space-y-4 mt-4">
            {stories.map((story) => (
              <Card
                key={story.id}
                className={`hover:border-primary/50 transition-colors ${story.locked ? "opacity-60" : ""}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${story.completed ? "bg-primary/10" : "bg-muted"}`}>
                      {story.locked ? (
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      ) : story.completed ? (
                        <CheckCircle className="h-6 w-6 text-primary" />
                      ) : (
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{story.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{story.category}</Badge>
                            <Badge variant="secondary">{story.difficulty}</Badge>
                            {story.completed && (
                              <Badge variant="default" className="text-xs">+{XP_PER_STORY} XP</Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground shrink-0">{story.duration}</span>
                      </div>

                      {story.progress > 0 && !story.completed && (
                        <div className="mt-3">
                          <Progress value={story.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">{story.progress}% complete</p>
                        </div>
                      )}

                      <Button
                        className="mt-3"
                        variant={story.completed ? "outline" : "default"}
                        size="sm"
                        disabled={!!story.locked}
                        onClick={() => navigate(`/learning/story/${story.id}`)}
                      >
                        {story.locked ? (
                          <><Lock className="h-4 w-4 mr-2" />Locked</>
                        ) : story.completed ? (
                          "Review"
                        ) : story.progress > 0 ? (
                          <><Play className="h-4 w-4 mr-2" />Continue</>
                        ) : (
                          <><Play className="h-4 w-4 mr-2" />Start</>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Quizzes */}
          <TabsContent value="quizzes" className="space-y-4 mt-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{quiz.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{quiz.questions} questions</p>
                      {quiz.bestScore !== null && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3" />
                            Best: {quiz.bestScore}%
                          </Badge>
                          {quiz.completed && (
                            <Badge variant="default" className="text-xs">+{XP_PER_QUIZ} XP</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Button size="sm" onClick={() => navigate(`/learning/quiz/${quiz.id}`)}>
                      <Target className="h-4 w-4 mr-2" />
                      {quiz.completed ? "Retake" : "Start"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      <BottomTabBar />
    </div>
  );
}
