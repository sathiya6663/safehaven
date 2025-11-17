import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, XCircle, Trophy } from "lucide-react";

export default function LearningQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const quiz = {
    id: id,
    title: "Safety Basics Quiz",
    questions: [
      {
        id: 1,
        question: "What should you do if someone makes you feel uncomfortable?",
        options: [
          { id: "a", text: "Stay quiet to avoid conflict", correct: false },
          { id: "b", text: "Tell them to stop and seek help if needed", correct: true },
          { id: "c", text: "Ignore your feelings", correct: false },
          { id: "d", text: "Blame yourself", correct: false },
        ],
      },
      {
        id: 2,
        question: "Who can you talk to if you need help?",
        options: [
          { id: "a", text: "Only your parents", correct: false },
          { id: "b", text: "Only your teachers", correct: false },
          { id: "c", text: "Any trusted adult or support service", correct: true },
          { id: "d", text: "No one, handle it alone", correct: false },
        ],
      },
      {
        id: 3,
        question: "What are personal boundaries?",
        options: [
          { id: "a", text: "Physical fences around your home", correct: false },
          { id: "b", text: "Limits you set to protect your comfort and safety", correct: true },
          { id: "c", text: "Rules only adults need to follow", correct: false },
          { id: "d", text: "Something that doesn't matter", correct: false },
        ],
      },
    ],
  };

  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  const handleSubmit = () => {
    const correctOption = currentQ.options.find(opt => opt.id === selectedAnswer);
    if (correctOption?.correct) {
      setScore(score + 1);
    }
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer("");
      setShowResult(false);
    } else {
      setIsComplete(true);
    }
  };

  const finalScore = Math.round((score / quiz.questions.length) * 100);

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        <div className="container px-4 py-6 max-w-3xl mx-auto space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/learning')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Learning
          </Button>

          <Card className="border-primary/20 bg-gradient-primary">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <Trophy className={`h-24 w-24 mx-auto animate-scale-in ${
                finalScore >= 80 ? 'text-primary' : finalScore >= 60 ? 'text-accent' : 'text-muted-foreground'
              }`} />
              <div className="space-y-2 animate-fade-in">
                <h2 className="text-3xl font-heading font-bold">Quiz Complete!</h2>
                <p className="text-xl">Your Score: {finalScore}%</p>
                <p className="text-muted-foreground">
                  {finalScore >= 80 
                    ? "Excellent work! You've mastered this topic." 
                    : finalScore >= 60 
                    ? "Good job! Review the material to improve further." 
                    : "Keep learning! Try reviewing the lessons and retake the quiz."}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/learning')}>
                  Back to Learning
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Retake Quiz
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Your Answers</h3>
              <div className="space-y-3">
                {quiz.questions.map((q, idx) => (
                  <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="shrink-0">
                      {idx < score ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Question {idx + 1}</p>
                      <p className="text-sm text-muted-foreground mt-1">{q.question}</p>
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
          <Badge variant="outline">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{quiz.title}</span>
            <span className="text-muted-foreground">Score: {score}/{quiz.questions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <Card className="border-primary/20">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-xl font-semibold mb-6">{currentQ.question}</h2>
            
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="space-y-3">
                {currentQ.options.map((option) => {
                  const isSelected = selectedAnswer === option.id;
                  const showCorrect = showResult && option.correct;
                  const showIncorrect = showResult && isSelected && !option.correct;

                  return (
                    <div
                      key={option.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                        showCorrect 
                          ? 'border-primary bg-primary/5' 
                          : showIncorrect 
                          ? 'border-destructive bg-destructive/5' 
                          : isSelected 
                          ? 'border-primary' 
                          : 'border-muted hover:border-muted-foreground'
                      }`}
                    >
                      <RadioGroupItem value={option.id} id={option.id} disabled={showResult} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        {option.text}
                      </Label>
                      {showCorrect && <CheckCircle className="h-5 w-5 text-primary" />}
                      {showIncorrect && <XCircle className="h-5 w-5 text-destructive" />}
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Actions */}
        {!showResult ? (
          <Button
            size="lg"
            className="w-full"
            disabled={!selectedAnswer}
            onClick={handleSubmit}
          >
            Submit Answer
          </Button>
        ) : (
          <div className="space-y-4">
            {currentQ.options.find(opt => opt.id === selectedAnswer)?.correct ? (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-semibold">Correct!</p>
                      <p className="text-sm text-muted-foreground">Well done, keep it up!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-6 w-6 text-destructive" />
                    <div>
                      <p className="font-semibold">Not quite right</p>
                      <p className="text-sm text-muted-foreground">Review the correct answer above</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <Button size="lg" className="w-full" onClick={handleNext}>
              {currentQuestion < quiz.questions.length - 1 ? 'Next Question' : 'See Results'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
