import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Volume2, VolumeX, Trophy, Star } from "lucide-react";

export default function LearningStory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentScene, setCurrentScene] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [earnedXP, setEarnedXP] = useState(0);

  const story = {
    id: id,
    title: "Understanding Boundaries",
    category: "Safety Basics",
    totalScenes: 5,
    scenes: [
      {
        id: 0,
        narration: "Let's learn about personal boundaries and why they're important for your safety and well-being.",
        illustration: "🏠",
        choices: [
          { id: 1, text: "I'm ready to learn!", xp: 10 },
        ],
      },
      {
        id: 1,
        narration: "Personal boundaries are like invisible lines that protect your personal space, feelings, and comfort. Everyone has the right to set boundaries.",
        illustration: "🛡️",
        choices: [
          { id: 2, text: "That makes sense", xp: 10 },
          { id: 2, text: "Tell me more", xp: 15 },
        ],
      },
      {
        id: 2,
        narration: "Good boundaries help you feel safe and respected. If someone makes you uncomfortable, it's okay to say 'no' or 'stop'.",
        illustration: "✋",
        choices: [
          { id: 3, text: "I understand", xp: 10 },
          { id: 3, text: "What if they get upset?", xp: 20 },
        ],
      },
      {
        id: 3,
        narration: "Your safety and comfort are more important than worrying about someone else's reaction. True friends will respect your boundaries.",
        illustration: "🤝",
        choices: [
          { id: 4, text: "That's helpful to know", xp: 15 },
        ],
      },
      {
        id: 4,
        narration: "Remember: You have the right to say no. Your feelings matter. It's okay to ask for help. You deserve to be treated with respect.",
        illustration: "⭐",
        choices: [
          { id: 5, text: "I'll remember this!", xp: 25 },
        ],
      },
    ],
  };

  const currentSceneData = story.scenes[currentScene];
  const progress = ((currentScene + 1) / story.totalScenes) * 100;
  const isComplete = currentScene >= story.scenes.length - 1 && selectedChoice !== null;

  const handleChoice = (choice: any) => {
    setSelectedChoice(choice.id);
    setEarnedXP(prev => prev + choice.xp);
    
    setTimeout(() => {
      if (currentScene < story.scenes.length - 1) {
        setCurrentScene(currentScene + 1);
        setSelectedChoice(null);
      }
    }, 1000);
  };

  const handleComplete = () => {
    // TODO: Save progress in Phase 6
    navigate('/learning');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container px-4 py-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/learning')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{story.title}</span>
            <Badge variant="outline">{story.category}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            Scene {currentScene + 1} of {story.totalScenes}
          </p>
        </div>

        {/* Story Content */}
        {!isComplete ? (
          <Card className="border-primary/20">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="text-8xl animate-scale-in">
                  {currentSceneData.illustration}
                </div>
                <p className="text-lg leading-relaxed animate-fade-in">
                  {currentSceneData.narration}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/20 bg-gradient-primary">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <Trophy className="h-20 w-20 text-primary mx-auto animate-scale-in" />
              <div className="space-y-2 animate-fade-in">
                <h2 className="text-2xl font-heading font-bold">Story Complete!</h2>
                <p className="text-muted-foreground">
                  You've learned about setting healthy boundaries
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 animate-fade-in">
                <Star className="h-5 w-5 text-accent fill-accent" />
                <span className="text-xl font-bold">+{earnedXP} XP</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Choices */}
        {!isComplete && (
          <div className="space-y-3">
            {currentSceneData.choices.map((choice) => (
              <Button
                key={choice.id}
                variant={selectedChoice === choice.id ? "default" : "outline"}
                size="lg"
                className="w-full justify-between h-auto py-4 animate-fade-in"
                onClick={() => handleChoice(choice)}
                disabled={selectedChoice !== null}
              >
                <span>{choice.text}</span>
                <Badge variant="secondary">+{choice.xp} XP</Badge>
              </Button>
            ))}
          </div>
        )}

        {/* Complete Button */}
        {isComplete && (
          <Button
            size="lg"
            className="w-full animate-fade-in"
            onClick={handleComplete}
          >
            Continue Learning
          </Button>
        )}
      </div>
    </div>
  );
}
