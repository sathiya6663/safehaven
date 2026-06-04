import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, XCircle, Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// ── Quiz catalogue ──────────────────────────────────────────────────────────
const QUIZ_CATALOGUE: Record<string, {
  title: string;
  questions: { id: number; question: string; options: { id: string; text: string; correct: boolean }[] }[];
}> = {
  "1": {
    title: "Safety Basics Quiz",
    questions: [
      { id: 1, question: "What should you do if someone makes you feel uncomfortable?", options: [{ id: "a", text: "Stay quiet to avoid conflict", correct: false }, { id: "b", text: "Tell them to stop and seek help if needed", correct: true }, { id: "c", text: "Ignore your feelings", correct: false }, { id: "d", text: "Blame yourself", correct: false }] },
      { id: 2, question: "Who can you talk to if you need help?", options: [{ id: "a", text: "Only your parents", correct: false }, { id: "b", text: "Only your teachers", correct: false }, { id: "c", text: "Any trusted adult or support service", correct: true }, { id: "d", text: "No one, handle it alone", correct: false }] },
      { id: 3, question: "What are personal boundaries?", options: [{ id: "a", text: "Physical fences around your home", correct: false }, { id: "b", text: "Limits you set to protect your comfort and safety", correct: true }, { id: "c", text: "Rules only adults need to follow", correct: false }, { id: "d", text: "Something that doesn't matter", correct: false }] },
    ],
  },
  "2": {
    title: "Online Safety Quiz",
    questions: [
      { id: 1, question: "What should you never share online with strangers?", options: [{ id: "a", text: "Your favourite movie", correct: false }, { id: "b", text: "Your home address", correct: true }, { id: "c", text: "Your pet's name", correct: false }, { id: "d", text: "Your hobbies", correct: false }] },
      { id: 2, question: "What should you do if someone online makes you uncomfortable?", options: [{ id: "a", text: "Keep talking to them", correct: false }, { id: "b", text: "Share your location so they can help", correct: false }, { id: "c", text: "Block, report, and tell a trusted adult", correct: true }, { id: "d", text: "Ignore it and hope they stop", correct: false }] },
      { id: 3, question: "Which of these is a strong password?", options: [{ id: "a", text: "password123", correct: false }, { id: "b", text: "Your name + birthday", correct: false }, { id: "c", text: "A random mix of letters, numbers, and symbols", correct: true }, { id: "d", text: "Your school name", correct: false }] },
    ],
  },
  "3": {
    title: "Boundaries Quiz",
    questions: [
      { id: 1, question: "What is a personal boundary?", options: [{ id: "a", text: "A wall around your house", correct: false }, { id: "b", text: "A limit you set to protect your feelings and safety", correct: true }, { id: "c", text: "A rule set by your parents", correct: false }, { id: "d", text: "Something only adults can have", correct: false }] },
      { id: 2, question: "How should a friend react when you set a boundary?", options: [{ id: "a", text: "Get angry and ignore you", correct: false }, { id: "b", text: "Pressure you to change your mind", correct: false }, { id: "c", text: "Respect and support your decision", correct: true }, { id: "d", text: "Tell others about it", correct: false }] },
      { id: 3, question: "What should you do if someone keeps crossing your boundaries?", options: [{ id: "a", text: "Do nothing and accept it", correct: false }, { id: "b", text: "Blame yourself", correct: false }, { id: "c", text: "Speak up and seek help from a trusted adult", correct: true }, { id: "d", text: "Stop setting boundaries", correct: false }] },
    ],
  },
};

export default function LearningQuiz() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const quiz = QUIZ_CATALOGUE[id ?? "1"] ?? QUIZ_CATALOGUE["1"];
  const questions = quiz.questions;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [saving, setSaving] = useState(false);
  const [previousBest, setPreviousBest] = useState<number | null>(null);

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Load previous best score on mount
  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data } = await supabase
        .from("learning_progress")
        .select("quiz_score")
        .eq("user_id", user.id)
        .eq("module_id", id)
        .eq("module_type", "quiz")
        .maybeSingle();
      if (data?.quiz_score != null) setPreviousBest(data.quiz_score);
    })();
  }, [user, id]);

  // Save quiz result to Supabase
  const saveQuizResult = async (finalScore: number) => {
    if (!user) return;
    setSaving(true);
    try {
      // Check if row exists
      const { data: existing } = await supabase
        .from("learning_progress")
        .select("id, quiz_score")
        .eq("user_id", user.id)
        .eq("module_id", String(id))
        .eq("module_type", "quiz")
        .maybeSingle();

      const isBetter = existing?.quiz_score == null || finalScore > existing.quiz_score;

      const payload = {
        user_id:             user.id,
        module_id:           String(id),
        module_type:         "quiz",
        module_title:        quiz.title,
        status:              "completed",
        progress_percentage: 100,
        quiz_score:          isBetter ? finalScore : (existing?.quiz_score ?? finalScore),
        completed_at:        new Date().toISOString(),
        last_accessed:       new Date().toISOString(),
        badges_earned:       finalScore === 100 ? ["perfect_score", "quiz_complete"] : ["quiz_complete"],
        updated_at:          new Date().toISOString(),
      };

      if (existing?.id) {
        await supabase.from("learning_progress").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("learning_progress").insert(payload);
      }

      toast({
        title: "Score saved!",
        description: `${quiz.title}: ${finalScore}%${isBetter && existing?.quiz_score ? " — new personal best!" : ""}`,
      });
    } catch {
      toast({ title: "Couldn't save score", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    const correct = currentQ.options.find((o) => o.id === selectedAnswer)?.correct ?? false;
    const newScore = correct ? score + 1 : score;
    if (correct) setScore(newScore);
    setAnswers((prev) => [...prev, correct]);
    setShowResult(true);
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((q) => q + 1);
      setSelectedAnswer("");
      setShowResult(false);
    } else {
      // Last question — compute final score and save
      const finalScore = Math.round((score / questions.length) * 100);
      setIsComplete(true);
      await saveQuizResult(finalScore);
    }
  };

  const finalScore = Math.round((score / questions.length) * 100);

  // ── Completion screen ─────────────────────────────────────────────────────
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        <div className="container px-4 py-6 max-w-3xl mx-auto space-y-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/learning")}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Learning
          </Button>

          <Card className="border-primary/20">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              {saving ? (
                <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
              ) : (
                <Trophy className={`h-24 w-24 mx-auto ${
                  finalScore >= 80 ? "text-primary" : finalScore >= 60 ? "text-accent" : "text-muted-foreground"
                }`} />
              )}
              <div className="space-y-2">
                <h2 className="text-3xl font-heading font-bold">Quiz Complete!</h2>
                <p className="text-xl">Your Score: {finalScore}%</p>
                {previousBest !== null && finalScore > previousBest && (
                  <Badge variant="default" className="text-sm">🎉 New Personal Best!</Badge>
                )}
                <p className="text-muted-foreground">
                  {finalScore >= 80
                    ? "Excellent work! You've mastered this topic."
                    : finalScore >= 60
                    ? "Good job! Review the material to improve further."
                    : "Keep learning! Try reviewing the lessons and retake the quiz."}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/learning")} disabled={saving}>
                  Back to Learning
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()} disabled={saving}>
                  Retake Quiz
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Answer review */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Review</h3>
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    {answers[idx] ? (
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Q{idx + 1}: {q.question}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Correct: {q.options.find((o) => o.correct)?.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Quiz screen ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container px-4 py-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/learning")}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <Badge variant="outline">Question {currentQuestion + 1} of {questions.length}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{quiz.title}</span>
            <span className="text-muted-foreground">Score: {score}/{questions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
          {previousBest !== null && (
            <p className="text-xs text-muted-foreground">Previous best: {previousBest}%</p>
          )}
        </div>

        <Card className="border-primary/20">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-xl font-semibold mb-6">{currentQ.question}</h2>
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="space-y-3">
                {currentQ.options.map((option) => {
                  const isSelected   = selectedAnswer === option.id;
                  const showCorrect  = showResult && option.correct;
                  const showWrong    = showResult && isSelected && !option.correct;
                  return (
                    <div
                      key={option.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                        showCorrect  ? "border-primary bg-primary/5"      :
                        showWrong    ? "border-destructive bg-destructive/5" :
                        isSelected   ? "border-primary"                   :
                        "border-muted hover:border-muted-foreground"
                      }`}
                    >
                      <RadioGroupItem value={option.id} id={option.id} disabled={showResult} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">{option.text}</Label>
                      {showCorrect && <CheckCircle className="h-5 w-5 text-primary" />}
                      {showWrong   && <XCircle className="h-5 w-5 text-destructive" />}
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {!showResult ? (
          <Button size="lg" className="w-full" disabled={!selectedAnswer} onClick={handleSubmit}>
            Submit Answer
          </Button>
        ) : (
          <div className="space-y-4">
            {currentQ.options.find((o) => o.id === selectedAnswer)?.correct ? (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  <div><p className="font-semibold">Correct!</p><p className="text-sm text-muted-foreground">Well done, keep it up!</p></div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <XCircle className="h-6 w-6 text-destructive" />
                  <div><p className="font-semibold">Not quite right</p><p className="text-sm text-muted-foreground">Review the correct answer above</p></div>
                </CardContent>
              </Card>
            )}
            <Button size="lg" className="w-full" onClick={handleNext}>
              {currentQuestion < questions.length - 1 ? "Next Question" : "See Results"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
