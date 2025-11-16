import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/layout/Header";
import { AlertCircle } from "lucide-react";

export default function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual signin logic in Phase 5
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showSOS={false} />
      
      <div className="container px-4 py-8 max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your SafeHaven account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => {
                  // TODO: Implement forgot password in Phase 5
                  console.log("Forgot password");
                }}
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="rememberMe"
              checked={formData.rememberMe}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, rememberMe: checked as boolean })
              }
            />
            <label htmlFor="rememberMe" className="text-sm text-muted-foreground">
              Remember me
            </label>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg">
            Sign In
          </Button>

          {/* Emergency Access */}
          <Card className="p-4 bg-emergency/5 border-emergency/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-emergency shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm mb-1">Emergency Access</p>
                <p className="text-xs text-muted-foreground mb-3">
                  If you're in immediate danger and need access without your password
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-emergency/50 text-emergency hover:bg-emergency/10"
                  onClick={() => {
                    // TODO: Implement emergency access in Phase 5
                    console.log("Emergency access");
                  }}
                >
                  Emergency Access
                </Button>
              </div>
            </div>
          </Card>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-primary hover:underline"
            >
              Sign Up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
