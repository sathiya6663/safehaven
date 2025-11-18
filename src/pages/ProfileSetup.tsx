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
import { useProfile } from "@/hooks/useProfile";
import { useEmergencyContacts } from "@/hooks/useEmergencyContacts";
import { toast } from "sonner";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const { addContact } = useEmergencyContacts();
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    phone: "",
    guardianEmail: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    enableNotifications: true,
    shareLocation: false,
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload avatar if selected
      if (avatarFile) {
        await uploadAvatar(avatarFile);
      }

      // Update profile
      await updateProfile({
        full_name: formData.displayName,
        bio: formData.bio,
        phone_number: formData.phone,
      });

      // Add emergency contact if provided
      if (formData.emergencyContactName && formData.emergencyContactPhone) {
        await addContact({
          contact_name: formData.emergencyContactName,
          contact_phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship || "Emergency Contact",
          is_primary: true,
        });
      }

      toast.success("Profile setup completed!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
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
                <AvatarImage src={avatarFile ? URL.createObjectURL(avatarFile) : profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10">
                  <User className="h-12 w-12 text-primary" />
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-medium cursor-pointer hover:bg-primary/90"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
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

          {/* Emergency Contact */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-heading font-semibold">Emergency Contact</h3>
            
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Contact Name</Label>
              <Input
                id="emergencyContactName"
                placeholder="Full name"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
              <Input
                id="emergencyContactPhone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactRelationship">Relationship</Label>
              <Input
                id="emergencyContactRelationship"
                placeholder="e.g., Parent, Sibling, Friend"
                value={formData.emergencyContactRelationship}
                onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
              />
            </div>
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
              disabled={saving}
            >
              Skip for Now
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "Saving..." : "Complete Setup"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
