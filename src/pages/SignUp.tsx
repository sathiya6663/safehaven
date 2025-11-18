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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type UserType = "woman" | "child" | "guardian";

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const [userType, setUserType] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    agreedToTerms: false,
  });
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate("/dashboard");
  }

  const userTypes = [
    { id: "woman" as UserType, label: "Woman", icon: User, description: "18+ years" },
    { id: "child" as UserType, label: "Child", icon: Baby, description: "8-17 years" },
    { id: "guardian" as UserType, label: "Guardian", icon: Users, description: "Parent/Caregiver" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userType) {
      toast.error("Please select an account type");
      return;
    }

    if (!formData.agreedToTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // Age verification
    const age = parseInt(formData.age);
    if (isNaN(age) || age < 8) {
      toast.error("You must be at least 8 years old");
      return;
    }

    if (userType === 'child' && age >= 18) {
      toast.error("Child accounts are for users under 18");
      return;
    }

    if ((userType === 'woman' || userType === 'guardian') && age < 18) {
      toast.error("You must be 18 or older for this account type");
      return;
    }

    setLoading(true);
    const { error } = await signUp(formData.email, formData.password, userType);

    if (error) {
      toast.error(error.message || "Failed to create account");
      setLoading(false);
      return;
    }

    toast.success("Account created! Please check your email to verify.");
    setLoading(false);
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
