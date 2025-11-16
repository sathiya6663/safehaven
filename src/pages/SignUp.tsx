import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/layout/Header";
import { User, Baby, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type UserType = "woman" | "child" | "guardian";

export default function SignUp() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    emergencyContact: "",
    agreedToTerms: false,
  });

  const userTypes = [
    { id: "woman" as UserType, label: "Woman", icon: User, description: "18+ years" },
    { id: "child" as UserType, label: "Child", icon: Baby, description: "8-17 years" },
    { id: "guardian" as UserType, label: "Guardian", icon: Users, description: "Parent/Caregiver" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual signup logic in Phase 5
    navigate("/profile-setup");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showSOS={false} />
      
      <div className="container px-4 py-8 max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join SafeHaven for a safer tomorrow</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Type Selection */}
          <div className="space-y-3">
            <Label>I am a...</Label>
            <div className="grid gap-3">
              {userTypes.map(({ id, label, icon: Icon, description }) => (
                <Card
                  key={id}
                  className={cn(
                    "p-4 cursor-pointer transition-all border-2",
                    userType === id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setUserType(id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      userType === id ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        userType === id ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {/* Age Verification */}
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="Your age"
              min="8"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Must be 8 years or older to use SafeHaven
            </p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          {/* Emergency Contact */}
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact (Optional)</Label>
            <Input
              id="emergencyContact"
              type="tel"
              placeholder="Phone number"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
            />
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={formData.agreedToTerms}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, agreedToTerms: checked as boolean })
              }
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!userType || !formData.agreedToTerms}
          >
            Create Account
          </Button>

          {/* Sign In Link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signin")}
              className="text-primary hover:underline"
            >
              Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
