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
import { Badge } from "@/components/ui/badge";
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
  Sun,
  Moon,
  Monitor,
  CheckCircle,
  XCircle,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Copy,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useStealth } from "@/contexts/StealthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useProfile } from "@/hooks/useProfile";
import { useEmergencyContacts } from "@/hooks/useEmergencyContacts";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { supportedLanguages } from "@/utils/translation";
import { isValidPhone, INDIA_EMERGENCY, dialNumber } from "@/lib/india-emergency";

export default function Profile() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { enableStealth } = useStealth();
  const { profile, loading, updateProfile, uploadAvatar } = useProfile();
  const {
    contacts,
    loading: contactsLoading,
    addContact,
    updateContact,
    deleteContact,
  } = useEmergencyContacts();

  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: "",
    phone_number: "",
    bio: "",
    location: "",
  });

  // ── Privacy settings — loaded from localStorage (user-keyed) ─────────────
  // Falls back to safe defaults. Persisted immediately on every change.
  const SETTINGS_KEY = `safehaven_settings_${user?.id ?? "anon"}`;

  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          notifications:    parsed.notifications    ?? true,
          locationSharing:  parsed.locationSharing  ?? false,
          dataCollection:   parsed.dataCollection   ?? true,
          aiMonitoring:     parsed.aiMonitoring      ?? true,
          emergencyAlerts:  parsed.emergencyAlerts   ?? true,
        };
      }
    } catch { /* ignore */ }
    return {
      notifications:   true,
      locationSharing: false,
      dataCollection:  true,
      aiMonitoring:    true,
      emergencyAlerts: true,
    };
  });

  // Persist settings whenever they change
  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch { /* ignore quota errors */ }
    // Best-effort sync to Supabase user metadata for cross-device consistency
    if (user) {
      supabase.auth.updateUser({
        data: { privacy_settings: next },
      }).catch(() => { /* non-critical */ });
    }
  };

  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    relationship: "",
    is_primary: false,
  });

  // Change-password dialog state
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ next: "", confirm: "" });
  const [pwdSaving, setPwdSaving] = useState(false);

  // ── Two-Factor Authentication (TOTP via Supabase MFA) ─────────────────────
  const [twoFactorStatus, setTwoFactorStatus] = useState<"loading" | "enabled" | "disabled">("loading");
  const [twoFactorDialogOpen, setTwoFactorDialogOpen] = useState(false);
  const [twoFactorMode, setTwoFactorMode] = useState<"enroll" | "unenroll">("enroll");
  // Enrollment
  const [totpQR, setTotpQR] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [twoFactorSaving, setTwoFactorSaving] = useState(false);

  // Language state — synced with profile.preferred_language
  const [language, setLanguage] = useState<string>(() => localStorage.getItem("preferredLanguage") || "en");

  // Load settings from Supabase user metadata (cross-device sync)
  useEffect(() => {
    if (!user) return;
    supabase.auth.getUser().then(({ data }) => {
      const stored = data?.user?.user_metadata?.privacy_settings;
      if (stored && typeof stored === "object") {
        const merged = {
          notifications:   stored.notifications   ?? settings.notifications,
          locationSharing: stored.locationSharing ?? settings.locationSharing,
          dataCollection:  stored.dataCollection  ?? settings.dataCollection,
          aiMonitoring:    stored.aiMonitoring     ?? settings.aiMonitoring,
          emergencyAlerts: stored.emergencyAlerts  ?? settings.emergencyAlerts,
        };
        setSettings(merged);
        // Also update localStorage to stay in sync
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
        } catch { /* ignore */ }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone_number: profile.phone_number ?? "",
        bio: profile.bio ?? "",
        location: profile.location ?? "",
      });
      const lang = (profile as any).preferred_language as string | undefined;
      if (lang && lang !== language) {
        setLanguage(lang);
        applyLanguageToDocument(lang);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  function applyLanguageToDocument(code: string) {
    const lang = supportedLanguages.find((l) => l.code === code);
    document.documentElement.lang = code;
    document.documentElement.dir = lang?.rtl ? "rtl" : "ltr";
    localStorage.setItem("preferredLanguage", code);
  }

  const handleLanguageChange = async (code: string) => {
    setLanguage(code);
    applyLanguageToDocument(code);
    await updateProfile({ preferred_language: code } as any);
    toast({ title: "Language updated", description: supportedLanguages.find((l) => l.code === code)?.name });
  };

  const handleChangePassword = async () => {
    if (pwdForm.next.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (pwdForm.next !== pwdForm.confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setPwdSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwdForm.next });
    setPwdSaving(false);
    if (error) {
      toast({ title: "Couldn't change password", description: error.message, variant: "destructive" });
      return;
    }
    setPwdDialogOpen(false);
    setPwdForm({ next: "", confirm: "" });
    toast({ title: "Password updated" });
  };

  // ── Guardian invitation state ──────────────────────────────────────────────
  const [guardianDialogOpen, setGuardianDialogOpen]     = useState(false);
  const [guardianEmail, setGuardianEmail]               = useState("");
  const [guardianSending, setGuardianSending]           = useState(false);
  const [guardianLinks, setGuardianLinks]               = useState<{
    id: string; guardian_name: string; guardian_email: string; status: string; created_at: string;
  }[]>([]);

  // Load existing guardian links for this user (as child)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: links } = await supabase
        .from("guardian_child_links")
        .select("id, guardian_id, status, created_at")
        .eq("child_id", user.id)
        .order("created_at", { ascending: false });

      if (!links || links.length === 0) { setGuardianLinks([]); return; }

      const guardianIds = links.map((l) => l.guardian_id);
      const { data: gProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", guardianIds);

      setGuardianLinks(
        links.map((l) => {
          const p = gProfiles?.find((x) => x.user_id === l.guardian_id);
          return {
            id: l.id,
            guardian_name: p?.full_name || p?.email || "Unknown",
            guardian_email: p?.email || "",
            status: l.status,
            created_at: l.created_at ?? "",
          };
        })
      );
    })();
  }, [user]);

  const handleSendGuardianInvitation = async () => {
    if (!user || !guardianEmail.trim()) return;
    setGuardianSending(true);

    // 1. Look up the guardian by email in profiles
    const { data: guardianProfile } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, user_type")
      .eq("email", guardianEmail.trim().toLowerCase())
      .maybeSingle();

    if (!guardianProfile) {
      toast({
        title: "User not found",
        description: "No SafeHaven account with that email address.",
        variant: "destructive",
      });
      setGuardianSending(false);
      return;
    }

    if (guardianProfile.user_id === user.id) {
      toast({ title: "You can't invite yourself.", variant: "destructive" });
      setGuardianSending(false);
      return;
    }

    // 2. Check if a link already exists
    const { data: existing } = await supabase
      .from("guardian_child_links")
      .select("id, status")
      .eq("guardian_id", guardianProfile.user_id)
      .eq("child_id", user.id)
      .maybeSingle();

    if (existing) {
      toast({
        title: existing.status === "approved" ? "Already linked" : "Invitation already sent",
        description: `Status: ${existing.status}`,
        variant: "destructive",
      });
      setGuardianSending(false);
      return;
    }

    // 3. Create the pending link
    const { error } = await supabase
      .from("guardian_child_links")
      .insert({
        guardian_id: guardianProfile.user_id,
        child_id: user.id,
        status: "pending",
        permissions: { alerts: true, location: true, progress: true },
      });

    setGuardianSending(false);

    if (error) {
      toast({ title: "Failed to send invitation", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Invitation sent!",
      description: `${guardianProfile.full_name || guardianEmail} will see it in their Guardian Dashboard.`,
    });
    setGuardianEmail("");
    setGuardianDialogOpen(false);

    // Refresh links list
    const newLink = {
      id: Date.now().toString(),
      guardian_name: guardianProfile.full_name || guardianProfile.email || "Guardian",
      guardian_email: guardianProfile.email || "",
      status: "pending",
      created_at: new Date().toISOString(),
    };
    setGuardianLinks((prev) => [newLink, ...prev]);
  };

  const handleRevokeGuardian = async (linkId: string) => {
    const { error } = await supabase.from("guardian_child_links").delete().eq("id", linkId);
    if (error) {
      toast({ title: "Couldn't remove guardian", description: error.message, variant: "destructive" });
      return;
    }
    setGuardianLinks((prev) => prev.filter((l) => l.id !== linkId));
    toast({ title: "Guardian access removed." });
  };
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        const verified = data.totp?.find((f) => f.status === "verified");
        setTwoFactorStatus(verified ? "enabled" : "disabled");
        if (verified) setTotpFactorId(verified.id);
      } catch {
        setTwoFactorStatus("disabled");
      }
    })();
  }, [user]);

  // ── 2FA: start enrollment (get QR code) ─────────────────────────────────
  const handleOpenEnroll = async () => {
    setTwoFactorMode("enroll");
    setTotpCode("");
    setTotpQR(null);
    setTotpSecret(null);
    setTwoFactorDialogOpen(true);
    setTwoFactorSaving(true);
    try {
      // Clean up any existing unverified/pending TOTP factors first
      // (causes "factor already exists" error on repeated enroll attempts)
      const { data: existing } = await supabase.auth.mfa.listFactors();
      const pendingFactors = existing?.totp?.filter((f) => f.status !== "verified") ?? [];
      for (const f of pendingFactors) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "SafeHaven Authenticator",
      });
      if (error) throw error;
      setTotpFactorId(data.id);
      setTotpQR(data.totp.qr_code);
      setTotpSecret(data.totp.secret);
    } catch (err) {
      toast({
        title: "Couldn't start 2FA setup",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      setTwoFactorDialogOpen(false);
    } finally {
      setTwoFactorSaving(false);
    }
  };

  // ── 2FA: verify TOTP code and activate ───────────────────────────────────
  const handleVerifyAndActivate = async () => {
    if (!totpFactorId || totpCode.length < 6) {
      toast({ title: "Enter the 6-digit code from your authenticator app", variant: "destructive" });
      return;
    }
    setTwoFactorSaving(true);
    try {
      // Create a challenge then verify
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: totpFactorId });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: totpFactorId,
        challengeId: challengeData.id,
        code: totpCode,
      });
      if (verifyErr) throw verifyErr;

      setTwoFactorStatus("enabled");
      setTwoFactorDialogOpen(false);
      setTotpCode("");
      toast({ title: "Two-factor authentication enabled", description: "Your account is now more secure." });
    } catch (err) {
      toast({
        title: "Invalid code",
        description: "The code didn't match. Check your authenticator app and try again.",
        variant: "destructive",
      });
    } finally {
      setTwoFactorSaving(false);
    }
  };

  // ── 2FA: unenroll (disable) ──────────────────────────────────────────────
  const handleDisable2FA = async () => {
    if (!totpFactorId) return;
    setTwoFactorSaving(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactorId });
      if (error) throw error;
      setTwoFactorStatus("disabled");
      setTotpFactorId(null);
      setTwoFactorDialogOpen(false);
      toast({ title: "Two-factor authentication disabled." });
    } catch (err) {
      toast({
        title: "Couldn't disable 2FA",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setTwoFactorSaving(false);
    }
  };

  const handleSave = async () => {    const { error } = await updateProfile(form);
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
    if (!contactForm.contact_name.trim() || !contactForm.contact_phone.trim() || !contactForm.relationship.trim()) {
      toast({ title: "Missing info", description: "Name, phone, and relationship required", variant: "destructive" });
      return;
    }
    if (!isValidPhone(contactForm.contact_phone)) {
      toast({
        title: "Invalid phone number",
        description: "Use a valid Indian mobile (e.g. +91 98765 43210) or international E.164 number.",
        variant: "destructive",
      });
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
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label>Language</Label>
                    <p className="text-sm text-muted-foreground">
                      Applied across the app
                    </p>
                  </div>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {supportedLanguages.map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                          <span className="flex items-center gap-2">
                            <span>{l.flag}</span>
                            <span>{l.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">Persists across devices</p>
                  </div>
                  <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light"><span className="flex items-center gap-2"><Sun className="h-4 w-4" /> Light</span></SelectItem>
                      <SelectItem value="dark"><span className="flex items-center gap-2"><Moon className="h-4 w-4" /> Dark</span></SelectItem>
                      <SelectItem value="system"><span className="flex items-center gap-2"><Monitor className="h-4 w-4" /> System</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Account Security
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setPwdDialogOpen(true)}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>

                {/* ── Two-Factor Authentication ── */}
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Two-Factor Authentication</p>
                        <p className="text-xs text-muted-foreground">
                          Extra security via authenticator app (Google Authenticator, Authy)
                        </p>
                      </div>
                    </div>
                    {twoFactorStatus === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : twoFactorStatus === "enabled" ? (
                      <Badge variant="default" className="gap-1 bg-green-600">
                        <CheckCircle className="h-3 w-3" />Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />Disabled
                      </Badge>
                    )}
                  </div>

                  {twoFactorStatus === "enabled" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive border-destructive/40 hover:bg-destructive/5"
                      onClick={() => { setTwoFactorMode("unenroll"); setTwoFactorDialogOpen(true); }}
                    >
                      <ShieldOff className="mr-2 h-4 w-4" />
                      Disable Two-Factor Authentication
                    </Button>
                  ) : twoFactorStatus === "disabled" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleOpenEnroll}
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Enable Two-Factor Authentication
                    </Button>
                  ) : null}
                </div>
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
                    onCheckedChange={(checked) => updateSetting("notifications", checked)}
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
                    onCheckedChange={(checked) => updateSetting("emergencyAlerts", checked)}
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
                    onCheckedChange={(checked) => updateSetting("locationSharing", checked)}
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
                    onCheckedChange={(checked) => updateSetting("aiMonitoring", checked)}
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
                    onCheckedChange={(checked) => updateSetting("dataCollection", checked)}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-heading font-semibold mb-2 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Stealth Mode
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Disguises SafeHaven as a calculator. To exit, press and hold the
                <span className="font-medium"> "=" </span> button for 2 seconds.
                If your session has expired, you'll be asked to sign in again.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  enableStealth();
                  toast({
                    title: "Stealth mode on",
                    description: 'Hold "=" for 2 seconds to return.',
                  });
                }}
              >
                Activate Stealth Mode
              </Button>
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Guardian Access
                </h3>
                <Button size="sm" onClick={() => setGuardianDialogOpen(true)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Invite Guardian
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                A guardian can monitor your safety alerts, location and progress.
              </p>

              {guardianLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No guardian linked yet.</p>
              ) : (
                <div className="space-y-2">
                  {guardianLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{link.guardian_name}</p>
                        <p className="text-xs text-muted-foreground">{link.guardian_email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          link.status === "approved"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}>
                          {link.status === "approved" ? "Active" : "Pending"}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive h-7 px-2"
                          onClick={() => handleRevokeGuardian(link.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5 bg-emergency/5 border-emergency/20">
              <h3 className="font-heading font-semibold mb-2 flex items-center gap-2">
                <Heart className="h-5 w-5 text-emergency" />
                Crisis Resources (India)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tap to call instantly. Available 24/7.
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => dialNumber(INDIA_EMERGENCY.NATIONAL)}>
                  <Phone className="mr-2 h-4 w-4" /> National Emergency · {INDIA_EMERGENCY.NATIONAL}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => dialNumber(INDIA_EMERGENCY.WOMEN_HELPLINE)}>
                  <Phone className="mr-2 h-4 w-4" /> Women Helpline · {INDIA_EMERGENCY.WOMEN_HELPLINE}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => dialNumber(INDIA_EMERGENCY.CHILD_HELPLINE)}>
                  <Phone className="mr-2 h-4 w-4" /> Child Helpline · {INDIA_EMERGENCY.CHILD_HELPLINE}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => dialNumber(INDIA_EMERGENCY.CRISIS_MENTAL_HEALTH)}>
                  <Phone className="mr-2 h-4 w-4" /> iCall Mental-Health Support
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

      {/* Change Password Dialog */}
      <Dialog open={pwdDialogOpen} onOpenChange={setPwdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-pwd">New password</Label>
              <Input
                id="new-pwd"
                type="password"
                autoComplete="new-password"
                value={pwdForm.next}
                onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pwd">Confirm new password</Label>
              <Input
                id="confirm-pwd"
                type="password"
                autoComplete="new-password"
                value={pwdForm.confirm}
                onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Use at least 8 characters. You'll stay signed in on this device.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdDialogOpen(false)} disabled={pwdSaving}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={pwdSaving}>
              {pwdSaving ? "Saving…" : "Update password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 2FA Enroll Dialog ── */}
      <Dialog open={twoFactorDialogOpen && twoFactorMode === "enroll"} onOpenChange={(v) => { if (!v) setTwoFactorDialogOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with Google Authenticator or Authy, then enter the 6-digit code.
            </DialogDescription>
          </DialogHeader>

          {twoFactorSaving && !totpQR ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : totpQR ? (
            <div className="space-y-4">
              {/* QR code */}
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <img src={totpQR} alt="TOTP QR code" className="w-48 h-48" />
              </div>

              {/* Manual entry secret */}
              {totpSecret && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Can't scan? Enter this code manually:</p>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-sm break-all">
                    <span className="flex-1 select-all">{totpSecret}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(totpSecret);
                        toast({ title: "Secret copied" });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Verification code input */}
              <div className="space-y-2">
                <Label htmlFor="totp-code">Verification Code</Label>
                <Input
                  id="totp-code"
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="text-center text-xl tracking-widest font-mono"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTwoFactorDialogOpen(false)} disabled={twoFactorSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleVerifyAndActivate}
              disabled={twoFactorSaving || totpCode.length < 6}
            >
              {twoFactorSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 2FA Unenroll Dialog ── */}
      <Dialog open={twoFactorDialogOpen && twoFactorMode === "unenroll"} onOpenChange={(v) => { if (!v) setTwoFactorDialogOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-destructive" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              This will remove the extra layer of security from your account. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTwoFactorDialogOpen(false)} disabled={twoFactorSaving}>
              Keep 2FA Enabled
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={twoFactorSaving}
            >
              {twoFactorSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldOff className="h-4 w-4 mr-2" />}
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomTabBar />
    </div>
  );
}
