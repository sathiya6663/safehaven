import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Shield,
  Bell,
  Phone,
  Mail,
  Lock,
  Eye,
  LogOut,
  Camera,
  Settings,
  Heart,
  Languages,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    notifications: true,
    locationSharing: false,
    dataCollection: true,
    aiMonitoring: true,
    emergencyAlerts: true,
  });

  const emergencyContacts = [
    { id: 1, name: "Mom", phone: "+1 (555) 123-4567", relationship: "Parent" },
    { id: 2, name: "Best Friend", phone: "+1 (555) 987-6543", relationship: "Friend" },
  ];

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="container px-4 py-6 max-w-2xl mx-auto">
        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-medium">
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-heading font-bold mb-1">Sarah Johnson</h2>
              <p className="text-sm text-muted-foreground mb-2">sarah.j@email.com</p>
              <div className="flex gap-2">
                <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  Member since Jan 2024
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Settings Tabs */}
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card className="p-5">
              <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" defaultValue="Sarah Johnson" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="sarah.j@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" defaultValue="25" />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Language</Label>
                    <p className="text-sm text-muted-foreground">English (US)</p>
                  </div>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">Light Mode</p>
                  </div>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Account Security
              </h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  Two-Factor Authentication
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-4">
            <Card className="p-5">
              <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive alerts and updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, notifications: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Emergency Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Critical safety notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.emergencyAlerts}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, emergencyAlerts: checked })
                    }
                  />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Privacy Controls
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Location Sharing</Label>
                    <p className="text-xs text-muted-foreground">
                      Share location with trusted contacts
                    </p>
                  </div>
                  <Switch
                    checked={settings.locationSharing}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, locationSharing: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>AI Safety Monitoring</Label>
                    <p className="text-xs text-muted-foreground">
                      Monitor for harmful content
                    </p>
                  </div>
                  <Switch
                    checked={settings.aiMonitoring}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, aiMonitoring: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Anonymous Data Collection</Label>
                    <p className="text-xs text-muted-foreground">
                      Help improve SafeHaven
                    </p>
                  </div>
                  <Switch
                    checked={settings.dataCollection}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, dataCollection: checked })
                    }
                  />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-heading font-semibold mb-4">Data Management</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Download My Data
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive">
                  Delete Account
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Emergency Tab */}
          <TabsContent value="emergency" className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Emergency Contacts
                </h3>
                <Button size="sm">Add Contact</Button>
              </div>
              <div className="space-y-3">
                {emergencyContacts.map((contact) => (
                  <Card key={contact.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Guardian Access
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Link your account with a guardian for additional safety oversight
              </p>
              <Button variant="outline" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Send Guardian Invitation
              </Button>
            </Card>

            <Card className="p-5 bg-emergency/5 border-emergency/20">
              <h3 className="font-heading font-semibold mb-2 flex items-center gap-2">
                <Heart className="h-5 w-5 text-emergency" />
                Crisis Resources
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Quick access to emergency support services
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  National Suicide Prevention Lifeline
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Crisis Text Line
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Local Emergency Services
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
}
