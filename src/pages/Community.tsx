import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Users,
  MessageSquare,
  Plus,
  UserCheck,
  Calendar,
  Heart,
  EyeOff,
  Eye,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  "General Support",
  "Success Stories",
  "Questions & Advice",
  "Resources",
];

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  likes_count: number;
  replies_count: number;
  created_at: string;
  user_id: string;
  moderation_status: string | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Post feed state
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // New post form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch posts ────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select(
          "id, title, content, category, is_anonymous, likes_count, replies_count, created_at, user_id, moderation_status"
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load posts";
      setFetchError(msg);
      console.error("Community fetch error:", err);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ── Real-time subscription – prepend new posts as they arrive ──────────────
  useEffect(() => {
    const channel = supabase
      .channel("community_posts_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts" },
        (payload) => {
          const newPost = payload.new as Post;
          setPosts((prev) => {
            // Avoid duplicates (optimistic insert already added it)
            if (prev.some((p) => p.id === newPost.id)) return prev;
            return [newPost, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Create post ────────────────────────────────────────────────────────────
  const handleCreatePost = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to post.",
        variant: "destructive",
      });
      return;
    }
    if (!newTitle.trim()) {
      toast({ title: "Title required", description: "Please add a title.", variant: "destructive" });
      return;
    }
    if (!newContent.trim()) {
      toast({ title: "Content required", description: "Please write something.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    // Optimistic insert — show immediately in the list
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticPost: Post = {
      id: optimisticId,
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      is_anonymous: isAnonymous,
      likes_count: 0,
      replies_count: 0,
      created_at: new Date().toISOString(),
      user_id: user.id,
      moderation_status: null,
    };
    setPosts((prev) => [optimisticPost, ...prev]);

    try {
      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          content: newContent.trim(),
          category: newCategory,
          is_anonymous: isAnonymous,
          likes_count: 0,
          replies_count: 0,
          moderation_status: "approved",
        })
        .select(
          "id, title, content, category, is_anonymous, likes_count, replies_count, created_at, user_id, moderation_status"
        )
        .single();

      if (error) throw error;

      // Replace optimistic entry with real DB row
      setPosts((prev) =>
        prev.map((p) => (p.id === optimisticId ? (data as Post) : p))
      );

      toast({ title: "Posted!", description: "Your post is live." });

      // Reset form and close dialog
      setNewTitle("");
      setNewContent("");
      setNewCategory(CATEGORIES[0]);
      setIsAnonymous(true);
      setDialogOpen(false);
    } catch (err) {
      // Roll back optimistic insert on failure
      setPosts((prev) => prev.filter((p) => p.id !== optimisticId));
      const msg = err instanceof Error ? err.message : "Failed to create post";
      toast({ title: "Post failed", description: msg, variant: "destructive" });
      console.error("Create post error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Like / unlike ──────────────────────────────────────────────────────────
  const handleLike = async (postId: string) => {
    if (!user) return;
    const alreadyLiked = likedIds.has(postId);

    // Optimistic update
    setLikedIds((prev) => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes_count: (p.likes_count ?? 0) + (alreadyLiked ? -1 : 1) }
          : p
      )
    );

    const { error } = await supabase
      .from("community_posts")
      .update({ likes_count: posts.find((p) => p.id === postId)!.likes_count! + (alreadyLiked ? -1 : 1) })
      .eq("id", postId);

    if (error) {
      // Roll back
      setLikedIds((prev) => {
        const next = new Set(prev);
        alreadyLiked ? next.add(postId) : next.delete(postId);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likes_count: (p.likes_count ?? 0) + (alreadyLiked ? 1 : -1) }
            : p
        )
      );
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalPosts = posts.length;
  const categoryCounts = CATEGORIES.map((cat) => ({
    name: cat,
    count: posts.filter((p) => p.category === cat).length,
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Community
            </h1>
            <p className="text-muted-foreground">Connect, share, and support each other</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                {/* Anonymous toggle */}
                <Button
                  variant={isAnonymous ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsAnonymous((v) => !v)}
                  type="button"
                >
                  {isAnonymous ? (
                    <><EyeOff className="h-4 w-4 mr-2" />Posting Anonymously</>
                  ) : (
                    <><Eye className="h-4 w-4 mr-2" />Posting as You</>
                  )}
                </Button>

                {/* Category */}
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Title */}
                <Input
                  placeholder="Post title *"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={200}
                />

                {/* Content */}
                <Textarea
                  placeholder="What's on your mind? *"
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  maxLength={2000}
                />

                <Button
                  className="w-full"
                  onClick={handleCreatePost}
                  disabled={submitting || !newTitle.trim() || !newContent.trim()}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {submitting ? "Posting…" : "Post to Community"}
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
              <p className="text-2xl font-bold">
                {loadingPosts ? "—" : totalPosts}
              </p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold">
                {loadingPosts
                  ? "—"
                  : posts.reduce((s, p) => s + (p.replies_count ?? 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Replies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Heart className="h-6 w-6 mx-auto mb-2 text-secondary" />
              <p className="text-2xl font-bold">
                {loadingPosts
                  ? "—"
                  : posts.reduce((s, p) => s + (p.likes_count ?? 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Likes</p>
            </CardContent>
          </Card>
        </div>

        {/* Main tabs */}
        <Tabs defaultValue="forums" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="forums">Forums</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          {/* ── Forums tab ── */}
          <TabsContent value="forums" className="space-y-4 mt-4">
            {/* Category grid */}
            <div className="grid grid-cols-2 gap-3">
              {categoryCounts.map((cat) => (
                <Card key={cat.name} className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground">{cat.count} posts</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Post feed */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Posts</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchPosts}
                  disabled={loadingPosts}
                  aria-label="Refresh posts"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingPosts ? "animate-spin" : ""}`} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Error */}
                {fetchError && (
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Failed to load posts</p>
                      <p className="text-xs text-destructive/80 mt-0.5">{fetchError}</p>
                      <Button size="sm" variant="outline" className="mt-2" onClick={fetchPosts}>
                        Retry
                      </Button>
                    </div>
                  </div>
                )}

                {/* Loading */}
                {loadingPosts && !fetchError && (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {/* Empty */}
                {!loadingPosts && !fetchError && posts.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground space-y-2">
                    <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/40" />
                    <p className="font-medium text-foreground">No posts yet</p>
                    <p className="text-sm">Be the first to post something!</p>
                  </div>
                )}

                {/* Posts */}
                {!loadingPosts &&
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline">{post.category}</Badge>
                            {post.is_anonymous && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <EyeOff className="h-3 w-3" />
                                Anonymous
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {timeAgo(post.created_at)}
                            </span>
                          </div>
                          <h4 className="font-semibold mb-1 break-words">{post.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                            {post.content}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {post.replies_count ?? 0}
                        </span>
                        <button
                          className={`flex items-center gap-1 transition-colors ${
                            likedIds.has(post.id)
                              ? "text-pink-500"
                              : "hover:text-pink-500"
                          }`}
                          onClick={() => handleLike(post.id)}
                          disabled={!user}
                          aria-label={likedIds.has(post.id) ? "Unlike" : "Like"}
                        >
                          <Heart
                            className="h-4 w-4"
                            fill={likedIds.has(post.id) ? "currentColor" : "none"}
                          />
                          {post.likes_count ?? 0}
                        </button>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Groups tab ── */}
          <TabsContent value="groups" className="space-y-3 mt-4">
            {[
              { name: "Daily Check-in Circle", members: 156, online: 23, desc: "Share daily reflections and support each other" },
              { name: "Strength Together", members: 89, online: 12, desc: "Building resilience and confidence as a community" },
              { name: "Young Voices", members: 203, online: 34, desc: "A safe space for young people to connect and share" },
            ].map((group) => (
              <Card key={group.name} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{group.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{group.desc}</p>
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

          {/* ── Events tab ── */}
          <TabsContent value="events" className="space-y-3 mt-4">
            {[
              { title: "Expert Q&A: Safety & Boundaries", date: "Tomorrow, 6:00 PM", host: "Dr. Sarah Johnson", attendees: 45 },
              { title: "Peer Support Session", date: "Friday, 3:00 PM", host: "Community Moderators", attendees: 67 },
            ].map((event) => (
              <Card key={event.title} className="hover:border-primary/50 transition-colors">
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
