import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    phone: "",
    guardianEmail: "",
    enableNotifications: true,
    shareLocation: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save profile data in Phase 6
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showSOS={false} />
      
      <div className="container px-4 py-8 max-w-md mx-auto pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground">Help us personalize your SafeHaven experience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10">
                  <User className="h-12 w-12 text-primary" />
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-medium"
                onClick={() => {
                  // TODO: Implement photo upload in Phase 6
                  console.log("Upload photo");
                }}
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Add profile photo (optional)</p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="How should we call you?"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">About You (Optional)</Label>
            <Textarea
              id="bio"
              placeholder="Tell us a bit about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {/* Guardian Email (for children) */}
          <div className="space-y-2">
            <Label htmlFor="guardianEmail">Guardian Email (If under 18)</Label>
            <Input
              id="guardianEmail"
              type="email"
              placeholder="guardian@email.com"
              value={formData.guardianEmail}
              onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              We'll send an invitation to link your accounts
            </p>
          </div>

          {/* Safety Preferences */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-heading font-semibold">Safety Preferences</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Enable Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get alerts for safety events
                </p>
              </div>
              <Switch
                id="notifications"
                checked={formData.enableNotifications}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="location">Share Location</Label>
                <p className="text-xs text-muted-foreground">
                  Allow trusted contacts to see your location
                </p>
              </div>
              <Switch
                id="location"
                checked={formData.shareLocation}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, shareLocation: checked })
                }
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/dashboard")}
            >
              Skip for Now
            </Button>
            <Button type="submit" className="flex-1">
              Complete Setup
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
