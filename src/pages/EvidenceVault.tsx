import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Lock, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Mic,
  Camera,
  Share2,
  Download,
  Trash2,
  Clock,
  MapPin,
  Shield
} from "lucide-react";

interface Evidence {
  id: number;
  name: string;
  type: "document" | "image" | "video" | "audio";
  category: string;
  date: string;
  location: string;
  size: string;
  encrypted: boolean;
}

export default function EvidenceVault() {
  const [isRecording, setIsRecording] = useState(false);

  const evidence: Evidence[] = [
    {
      id: 1,
      name: "Screenshot_20240115.png",
      type: "image",
      category: "Messages",
      date: "2024-01-15 14:30",
      location: "New York, NY",
      size: "2.4 MB",
      encrypted: true,
    },
    {
      id: 2,
      name: "Voice_Note_012.mp3",
      type: "audio",
      category: "Conversations",
      date: "2024-01-14 18:45",
      location: "New York, NY",
      size: "1.8 MB",
      encrypted: true,
    },
    {
      id: 3,
      name: "Incident_Report.pdf",
      type: "document",
      category: "Reports",
      date: "2024-01-13 09:15",
      location: "New York, NY",
      size: "445 KB",
      encrypted: true,
    },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image": return ImageIcon;
      case "video": return Video;
      case "audio": return Mic;
      case "document": return FileText;
      default: return FileText;
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case "image": return "text-primary";
      case "video": return "text-accent";
      case "audio": return "text-secondary";
      case "document": return "text-foreground";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
              <Lock className="h-8 w-8 text-primary" />
              Evidence Vault
            </h1>
            <p className="text-muted-foreground">Securely store and manage evidence</p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Encrypted
          </Badge>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Add Evidence</CardTitle>
            <CardDescription>Capture or upload files securely</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                    <Upload className="h-6 w-6 text-primary" />
                    <span className="text-sm">Upload File</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Evidence</DialogTitle>
                    <DialogDescription>
                      All files are encrypted and stored securely
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="file">Select File</Label>
                      <Input id="file" type="file" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="messages">Messages</SelectItem>
                          <SelectItem value="conversations">Conversations</SelectItem>
                          <SelectItem value="reports">Reports</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input id="description" placeholder="Add notes about this evidence" />
                    </div>
                    <Button className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Securely
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => {
                  // TODO: Implement camera capture in Phase 7
                  console.log("Opening camera");
                }}
              >
                <Camera className="h-6 w-6 text-primary" />
                <span className="text-sm">Photo</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => {
                  setIsRecording(!isRecording);
                  // TODO: Implement audio recording in Phase 7
                  console.log(isRecording ? "Stop recording" : "Start recording");
                }}
              >
                <Mic className={`h-6 w-6 ${isRecording ? 'text-emergency animate-pulse' : 'text-primary'}`} />
                <span className="text-sm">{isRecording ? "Recording..." : "Audio"}</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => {
                  // TODO: Implement video recording in Phase 7
                  console.log("Opening video recorder");
                }}
              >
                <Video className="h-6 w-6 text-primary" />
                <span className="text-sm">Video</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Evidence Files */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="document">Docs</TabsTrigger>
          </TabsList>

          {["all", "image", "video", "audio", "document"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {evidence
                .filter(item => tab === "all" || item.type === tab)
                .map((item) => {
                  const Icon = getFileIcon(item.type);
                  return (
                    <Card key={item.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-muted">
                            <Icon className={`h-6 w-6 ${getFileColor(item.type)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-semibold truncate">{item.name}</h3>
                                <Badge variant="outline" className="mt-1">
                                  {item.category}
                                </Badge>
                              </div>
                              {item.encrypted && (
                                <Badge variant="secondary" className="gap-1 shrink-0">
                                  <Lock className="h-3 w-3" />
                                  Encrypted
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {item.location}
                              </span>
                              <span>{item.size}</span>
                            </div>
                            
                            <div className="flex gap-2 mt-4">
                              <Button size="sm" variant="outline">
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <BottomTabBar />
    </div>
  );
}
