import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Users, 
  MessageSquare, 
  Plus,
  UserCheck,
  Calendar,
  Heart,
  Eye,
  EyeOff,
  Send
} from "lucide-react";

export default function Community() {
  const [isAnonymous, setIsAnonymous] = useState(true);

  const forumCategories = [
    { id: 1, name: "General Support", posts: 245, color: "bg-primary" },
    { id: 2, name: "Success Stories", posts: 89, color: "bg-accent" },
    { id: 3, name: "Questions & Advice", posts: 167, color: "bg-secondary" },
    { id: 4, name: "Resources", posts: 94, color: "bg-primary" },
  ];

  const recentPosts = [
    {
      id: 1,
      title: "How I built confidence after difficult times",
      author: "Anonymous User",
      category: "Success Stories",
      replies: 12,
      likes: 28,
      time: "2 hours ago",
    },
    {
      id: 2,
      title: "Tips for staying safe while traveling alone",
      author: "SafetyFirst",
      category: "Questions & Advice",
      replies: 8,
      likes: 15,
      time: "5 hours ago",
    },
    {
      id: 3,
      title: "Support groups in my area - how to find them?",
      author: "Seeker123",
      category: "General Support",
      replies: 6,
      likes: 10,
      time: "1 day ago",
    },
  ];

  const supportGroups = [
    {
      id: 1,
      name: "Daily Check-in Circle",
      members: 156,
      online: 23,
      description: "Share daily reflections and support each other",
    },
    {
      id: 2,
      name: "Strength Together",
      members: 89,
      online: 12,
      description: "Building resilience and confidence as a community",
    },
    {
      id: 3,
      name: "Young Voices",
      members: 203,
      online: 34,
      description: "A safe space for young people to connect and share",
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: "Expert Q&A: Safety & Boundaries",
      date: "Tomorrow, 6:00 PM",
      host: "Dr. Sarah Johnson",
      attendees: 45,
    },
    {
      id: 2,
      title: "Peer Support Session",
      date: "Friday, 3:00 PM",
      host: "Community Moderators",
      attendees: 67,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Community
            </h1>
            <p className="text-muted-foreground">Connect, share, and support each other</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Post</DialogTitle>
                <DialogDescription>
                  Share your thoughts, questions, or experiences with the community
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={isAnonymous ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                  >
                    {isAnonymous ? (
                      <><EyeOff className="h-4 w-4 mr-2" />Post Anonymously</>
                    ) : (
                      <><Eye className="h-4 w-4 mr-2" />Show Name</>
                    )}
                  </Button>
                </div>
                <Input placeholder="Post title" />
                <Textarea placeholder="What's on your mind?" rows={4} />
                <Button className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Post to Community
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">1.2K</p>
              <p className="text-sm text-muted-foreground">Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold">595</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <UserCheck className="h-6 w-6 mx-auto mb-2 text-secondary" />
              <p className="text-2xl font-bold">89</p>
              <p className="text-sm text-muted-foreground">Online</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="forums" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="forums">Forums</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="forums" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              {forumCategories.map((category) => (
                <Card key={category.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className={`w-12 h-12 rounded-lg ${category.color}/10 flex items-center justify-center mb-3`}>
                      <MessageSquare className={`h-6 w-6 ${category.color.replace('bg-', 'text-')}`} />
                    </div>
                    <h3 className="font-semibold mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.posts} posts</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Posts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentPosts.map((post) => (
                  <div key={post.id} className="p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{post.category}</Badge>
                          <span className="text-xs text-muted-foreground">{post.time}</span>
                        </div>
                        <h4 className="font-semibold mb-1">{post.title}</h4>
                        <p className="text-sm text-muted-foreground">by {post.author}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {post.replies}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {post.likes}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="space-y-3 mt-4">
            {supportGroups.map((group) => (
              <Card key={group.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{group.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {group.members} members
                        </span>
                        <Badge variant="secondary" className="gap-1">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          {group.online} online
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm">Join</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="events" className="space-y-3 mt-4">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{event.date}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Host: {event.host}</span>
                        <Badge variant="secondary">{event.attendees} attending</Badge>
                      </div>
                      <Button size="sm" className="mt-3">Register</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm text-center text-muted-foreground">
                  More events coming soon! Join our groups to stay updated.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomTabBar />
    </div>
  );
}
