import { useState, useEffect, useRef } from "react";
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
  Heart,
  Languages,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useEmergencyContacts } from "@/hooks/useEmergencyContacts";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Profile() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile, uploadAvatar } = useProfile();
  const {
    contacts,
    loading: contactsLoading,
    addContact,
    updateContact,
    deleteContact,
  } = useEmergencyContacts();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: "",
    phone_number: "",
    bio: "",
    location: "",
  });

  const [settings, setSettings] = useState({
    notifications: true,
    locationSharing: false,
    dataCollection: true,
    aiMonitoring: true,
    emergencyAlerts: true,
  });

  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    relationship: "",
    is_primary: false,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone_number: profile.phone_number ?? "",
        bio: profile.bio ?? "",
        location: profile.location ?? "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    const { error } = await updateProfile(form);
    if (!error) {
      toast({ title: "Profile saved" });
    }
  };

  const handleAvatarPick = () => fileInputRef.current?.click();
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadAvatar(file);
  };

  const openAddContact = () => {
    setEditingContactId(null);
    setContactForm({
      contact_name: "",
      contact_phone: "",
      contact_email: "",
      relationship: "",
      is_primary: false,
    });
    setContactDialogOpen(true);
  };

  const openEditContact = (id: string) => {
    const c = contacts.find((x) => x.id === id);
    if (!c) return;
    setEditingContactId(id);
    setContactForm({
      contact_name: c.contact_name,
      contact_phone: c.contact_phone,
      contact_email: c.contact_email ?? "",
      relationship: c.relationship,
      is_primary: c.is_primary ?? false,
    });
    setContactDialogOpen(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.contact_name || !contactForm.contact_phone || !contactForm.relationship) {
      toast({ title: "Missing info", description: "Name, phone, and relationship required", variant: "destructive" });
      return;
    }
    if (editingContactId) {
      await updateContact(editingContactId, contactForm);
    } else {
      await addContact(contactForm);
    }
    setContactDialogOpen(false);
  };

  const initials = (profile?.full_name ?? user?.email ?? "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="container px-4 py-6 max-w-2xl mx-auto">
        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url ?? ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {initials || <User className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarPick}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-medium"
                aria-label="Change avatar"
              >
                <Camera className="h-3 w-3" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-heading font-bold mb-1">
                {profile?.full_name || "Add your name"}
              </h2>
              <p className="text-sm text-muted-foreground mb-2">{profile?.email ?? user?.email}</p>
              {profile?.created_at && (
                <div className="flex gap-2">
                  <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    Member since {new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card className="p-5">
              <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile?.email ?? user?.email ?? ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
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
                    <p className="text-xs text-muted-foreground">Receive alerts and updates</p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Emergency Alerts</Label>
                    <p className="text-xs text-muted-foreground">Critical safety notifications</p>
                  </div>
                  <Switch
                    checked={settings.emergencyAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, emergencyAlerts: checked })}
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
                    <p className="text-xs text-muted-foreground">Share location with trusted contacts</p>
                  </div>
                  <Switch
                    checked={settings.locationSharing}
                    onCheckedChange={(checked) => setSettings({ ...settings, locationSharing: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>AI Safety Monitoring</Label>
                    <p className="text-xs text-muted-foreground">Monitor for harmful content</p>
                  </div>
                  <Switch
                    checked={settings.aiMonitoring}
                    onCheckedChange={(checked) => setSettings({ ...settings, aiMonitoring: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Anonymous Data Collection</Label>
                    <p className="text-xs text-muted-foreground">Help improve SafeHaven</p>
                  </div>
                  <Switch
                    checked={settings.dataCollection}
                    onCheckedChange={(checked) => setSettings({ ...settings, dataCollection: checked })}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Emergency Contacts
                </h3>
                <Button size="sm" onClick={openAddContact}>Add Contact</Button>
              </div>
              {contactsLoading ? (
                <LoadingSpinner />
              ) : contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No emergency contacts yet. Add one to get started.</p>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <Card key={contact.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {contact.contact_name}
                            {contact.is_primary && (
                              <span className="ml-2 text-xs text-primary">(Primary)</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{contact.contact_phone}</p>
                          <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditContact(contact.id)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => deleteContact(contact.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
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

        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Emergency Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContactId ? "Edit Contact" : "Add Emergency Contact"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={contactForm.contact_name}
                onChange={(e) => setContactForm({ ...contactForm, contact_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={contactForm.contact_phone}
                onChange={(e) => setContactForm({ ...contactForm, contact_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email (optional)</Label>
              <Input
                type="email"
                value={contactForm.contact_email}
                onChange={(e) => setContactForm({ ...contactForm, contact_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Input
                value={contactForm.relationship}
                onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Primary Contact</Label>
              <Switch
                checked={contactForm.is_primary}
                onCheckedChange={(v) => setContactForm({ ...contactForm, is_primary: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveContact}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomTabBar />
    </div>
  );
}
