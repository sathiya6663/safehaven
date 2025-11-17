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
  Play
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Learning() {
  const navigate = useNavigate();

  const userProgress = {
    level: 5,
    xp: 1250,
    xpToNextLevel: 1500,
    streak: 7,
    totalBadges: 12,
    completedStories: 8,
  };

  const badges = [
    { id: 1, name: "First Steps", icon: Star, earned: true, description: "Complete your first lesson" },
    { id: 2, name: "Week Warrior", icon: Flame, earned: true, description: "7 day learning streak" },
    { id: 3, name: "Safety Scholar", icon: Award, earned: true, description: "Master 5 safety topics" },
    { id: 4, name: "Quiz Champion", icon: Trophy, earned: false, description: "Score 100% on 3 quizzes" },
  ];

  const stories = [
    {
      id: 1,
      title: "Understanding Boundaries",
      category: "Safety Basics",
      progress: 100,
      difficulty: "Beginner",
      duration: "10 min",
      completed: true,
    },
    {
      id: 2,
      title: "Online Safety Guide",
      category: "Digital Safety",
      progress: 60,
      difficulty: "Beginner",
      duration: "15 min",
      completed: false,
    },
    {
      id: 3,
      title: "Building Confidence",
      category: "Resilience",
      progress: 0,
      difficulty: "Intermediate",
      duration: "20 min",
      completed: false,
    },
    {
      id: 4,
      title: "Recognizing Warning Signs",
      category: "Awareness",
      progress: 0,
      difficulty: "Intermediate",
      duration: "18 min",
      completed: false,
      locked: true,
    },
  ];

  const quizzes = [
    { id: 1, title: "Safety Basics Quiz", questions: 10, bestScore: 90, attempts: 3 },
    { id: 2, title: "Online Safety Quiz", questions: 15, bestScore: 85, attempts: 2 },
    { id: 3, title: "Boundaries Quiz", questions: 12, bestScore: null, attempts: 0 },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Learning Center</h1>
          <p className="text-muted-foreground">Learn, grow, and stay safe through interactive stories</p>
        </div>

        {/* Progress Overview */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Level {userProgress.level}
                </CardTitle>
                <CardDescription>
                  {userProgress.xpToNextLevel - userProgress.xp} XP to next level
                </CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-accent">
                    <Flame className="h-5 w-5" />
                    <span className="text-2xl font-bold">{userProgress.streak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-primary">
                    <Award className="h-5 w-5" />
                    <span className="text-2xl font-bold">{userProgress.totalBadges}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Badges</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={(userProgress.xp / userProgress.xpToNextLevel) * 100} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {userProgress.xp} / {userProgress.xpToNextLevel} XP
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
                        ? 'border-primary/50 bg-primary/5' 
                        : 'border-muted bg-muted/30 opacity-60'
                    }`}
                  >
                    <Icon className={`h-8 w-8 mx-auto mb-2 ${
                      badge.earned ? 'text-primary' : 'text-muted-foreground'
                    }`} />
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

          <TabsContent value="stories" className="space-y-4 mt-4">
            {stories.map((story) => (
              <Card 
                key={story.id} 
                className={`hover:border-primary/50 transition-colors ${
                  story.locked ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      story.completed ? 'bg-primary/10' : 'bg-muted'
                    }`}>
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
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{story.duration}</span>
                      </div>
                      
                      {story.progress > 0 && !story.completed && (
                        <div className="mt-3">
                          <Progress value={story.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {story.progress}% complete
                          </p>
                        </div>
                      )}
                      
                      <Button 
                        className="mt-3"
                        variant={story.completed ? "outline" : "default"}
                        size="sm"
                        disabled={story.locked}
                        onClick={() => navigate(`/learning/story/${story.id}`)}
                      >
                        {story.locked ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Locked
                          </>
                        ) : story.completed ? (
                          "Review"
                        ) : story.progress > 0 ? (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Continue
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-4 mt-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{quiz.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {quiz.questions} questions
                      </p>
                      {quiz.bestScore !== null && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3" />
                            Best: {quiz.bestScore}%
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {quiz.attempts} {quiz.attempts === 1 ? 'attempt' : 'attempts'}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => navigate(`/learning/quiz/${quiz.id}`)}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      {quiz.attempts > 0 ? 'Retake' : 'Start'}
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
