import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Volume2, VolumeX, Trophy, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// ── Story catalogue (keyed by route id) ────────────────────────────────────
const STORY_CATALOGUE: Record<string, {
  title: string;
  category: string;
  scenes: { narration: string; illustration: string; choices: { text: string; xp: number; next: number }[] }[];
}> = {
  "1": {
    title: "Understanding Boundaries",
    category: "Safety Basics",
    scenes: [
      { narration: "Let's learn about personal boundaries and why they're important for your safety and well-being.", illustration: "🏠", choices: [{ text: "I'm ready to learn!", xp: 10, next: 1 }] },
      { narration: "Personal boundaries are like invisible lines that protect your personal space, feelings, and comfort. Everyone has the right to set boundaries.", illustration: "🛡️", choices: [{ text: "That makes sense", xp: 10, next: 2 }, { text: "Tell me more", xp: 15, next: 2 }] },
      { narration: "Good boundaries help you feel safe and respected. If someone makes you uncomfortable, it's okay to say 'no' or 'stop'.", illustration: "✋", choices: [{ text: "I understand", xp: 10, next: 3 }, { text: "What if they get upset?", xp: 20, next: 3 }] },
      { narration: "Your safety and comfort are more important than worrying about someone else's reaction. True friends will respect your boundaries.", illustration: "🤝", choices: [{ text: "That's helpful to know", xp: 15, next: 4 }] },
      { narration: "Remember: You have the right to say no. Your feelings matter. It's okay to ask for help. You deserve to be treated with respect.", illustration: "⭐", choices: [{ text: "I'll remember this!", xp: 25, next: -1 }] },
    ],
  },
  "2": {
    title: "Online Safety Guide",
    category: "Digital Safety",
    scenes: [
      { narration: "The internet is a powerful tool, but it's important to stay safe online.", illustration: "💻", choices: [{ text: "Let's get started!", xp: 10, next: 1 }] },
      { narration: "Never share personal information like your address, school, or phone number with strangers online.", illustration: "🔒", choices: [{ text: "Understood", xp: 10, next: 2 }, { text: "What counts as personal info?", xp: 15, next: 2 }] },
      { narration: "If something online makes you feel uncomfortable, you can block and report the person. You don't have to respond.", illustration: "🚫", choices: [{ text: "Good to know", xp: 15, next: 3 }] },
      { narration: "Talk to a trusted adult if you see anything online that worries you. They can help you stay safe.", illustration: "👨‍👩‍👧", choices: [{ text: "I'll do that", xp: 20, next: -1 }] },
    ],
  },
  "3": {
    title: "Building Confidence",
    category: "Resilience",
    scenes: [
      { narration: "Confidence is believing in yourself and your ability to handle challenges.", illustration: "💪", choices: [{ text: "Tell me more!", xp: 10, next: 1 }] },
      { narration: "Everyone has strengths. Recognizing your own strengths is the first step to building confidence.", illustration: "🌟", choices: [{ text: "I have strengths!", xp: 15, next: 2 }, { text: "I'm not sure I do", xp: 10, next: 2 }] },
      { narration: "It's okay to make mistakes — they're how we learn. Each challenge you face makes you stronger.", illustration: "🌱", choices: [{ text: "Mistakes help me grow", xp: 20, next: 3 }] },
      { narration: "Surround yourself with people who support and encourage you. Their positivity will help you believe in yourself.", illustration: "🤗", choices: [{ text: "I'll remember this", xp: 25, next: -1 }] },
    ],
  },
};

export default function LearningStory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentScene, setCurrentScene] = useState(0);
  const [audioEnabled, setAudioEnabled]  = useState(true);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [earnedXP, setEarnedXP] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [saving, setSaving] = useState(false);

  const story = STORY_CATALOGUE[id ?? "1"] ?? STORY_CATALOGUE["1"];
  const scenes = story.scenes;
  const currentSceneData = scenes[currentScene];
  const progress = Math.round(((currentScene + 1) / scenes.length) * 100);

  // ── Save progress to Supabase on every scene advance ─────────────────────
  const saveProgress = async (sceneIndex: number, completed: boolean, totalXP: number) => {
    if (!user) return;
    const progressPct = Math.round(((sceneIndex + 1) / scenes.length) * 100);

    // Check if row already exists
    const { data: existing } = await supabase
      .from("learning_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("module_id", String(id))
      .eq("module_type", "story")
      .maybeSingle();

    const payload = {
      user_id:             user.id,
      module_id:           String(id),
      module_type:         "story",
      module_title:        story.title,
      status:              completed ? "completed" : "in_progress",
      progress_percentage: completed ? 100 : progressPct,
      completed_at:        completed ? new Date().toISOString() : null,
      last_accessed:       new Date().toISOString(),
      time_spent_minutes:  Math.ceil(totalXP / 10),
      badges_earned:       completed ? ["story_complete"] : [],
      updated_at:          new Date().toISOString(),
    };

    if (existing?.id) {
      await supabase.from("learning_progress").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("learning_progress").insert(payload);
    }
  };

  // Restore progress on mount
  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data } = await supabase
        .from("learning_progress")
        .select("progress_percentage, status")
        .eq("user_id", user.id)
        .eq("module_id", id)
        .eq("module_type", "story")
        .maybeSingle();

      if (data?.status === "completed") {
        // Already completed — show completion screen
        setCurrentScene(scenes.length - 1);
        setIsComplete(true);
      } else if (data?.progress_percentage) {
        // Resume from where they left off
        const resumeScene = Math.min(
          Math.floor((data.progress_percentage / 100) * scenes.length),
          scenes.length - 1
        );
        setCurrentScene(resumeScene);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  const handleChoice = (choice: { text: string; xp: number; next: number }, choiceIndex: number) => {
    if (selectedChoice !== null) return;
    setSelectedChoice(choiceIndex);
    const newXP = earnedXP + choice.xp;
    setEarnedXP(newXP);

    const nextScene = choice.next;
    const completed = nextScene === -1;

    // Save immediately
    saveProgress(currentScene, completed, newXP);

    setTimeout(() => {
      if (completed) {
        setIsComplete(true);
      } else {
        setCurrentScene(nextScene);
        setSelectedChoice(null);
      }
    }, 800);
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await saveProgress(scenes.length - 1, true, earnedXP);
      toast({ title: "Progress saved!", description: `${story.title} marked as complete. +${earnedXP} XP` });
    } catch {
      toast({ title: "Couldn't save progress", variant: "destructive" });
    } finally {
      setSaving(false);
      navigate("/learning");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container px-4 py-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/learning")}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAudioEnabled(!audioEnabled)}>
            {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{story.title}</span>
            <Badge variant="outline">{story.category}</Badge>
          </div>
          <Progress value={isComplete ? 100 : progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {isComplete ? "Complete!" : `Scene ${currentScene + 1} of ${scenes.length}`}
          </p>
        </div>

        {/* Story card or Completion card */}
        {!isComplete ? (
          <Card className="border-primary/20">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="text-8xl">{currentSceneData.illustration}</div>
                <p className="text-lg leading-relaxed">{currentSceneData.narration}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/20">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <Trophy className="h-20 w-20 text-primary mx-auto" />
              <div className="space-y-2">
                <h2 className="text-2xl font-heading font-bold">Story Complete!</h2>
                <p className="text-muted-foreground">You've learned: {story.title}</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Star className="h-5 w-5 text-accent fill-accent" />
                <span className="text-xl font-bold">+{earnedXP} XP earned</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Choices */}
        {!isComplete && (
          <div className="space-y-3">
            {currentSceneData.choices.map((choice, i) => (
              <Button
                key={i}
                variant={selectedChoice === i ? "default" : "outline"}
                size="lg"
                className="w-full justify-between h-auto py-4"
                onClick={() => handleChoice(choice, i)}
                disabled={selectedChoice !== null}
              >
                <span>{choice.text}</span>
                <Badge variant="secondary">+{choice.xp} XP</Badge>
              </Button>
            ))}
          </div>
        )}

        {/* Continue button */}
        {isComplete && (
          <Button size="lg" className="w-full" onClick={handleComplete} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {saving ? "Saving…" : "Continue Learning"}
          </Button>
        )}
      </div>
    </div>
  );
}
