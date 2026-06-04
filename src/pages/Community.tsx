import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  Heart,
  EyeOff,
  Eye,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
  Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ── Constants ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "General Support",
  "Success Stories",
  "Questions & Advice",
  "Resources",
] as const;

type Category = typeof CATEGORIES[number];

// ── Types ──────────────────────────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Feed state
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Per-post liked state persisted in localStorage
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(`community_liked_${user?.id ?? "anon"}`);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Active category filter (null = show all)
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  // New post form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<Category>(CATEGORIES[0]);
  const [submitting, setSubmitting] = useState(false);

  // ── Persist liked IDs to localStorage ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(
        `community_liked_${user.id}`,
        JSON.stringify(Array.from(likedIds))
      );
    } catch { /* ignore quota errors */ }
  }, [likedIds, user]);

  // ── Fetch posts (no limit — load all) ──────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    setFetchError(null);
    try {
      let query = supabase
        .from("community_posts")
        .select(
          "id, title, content, category, is_anonymous, likes_count, replies_count, created_at, user_id, moderation_status"
        )
        .order("created_at", { ascending: false });

      // Apply category filter if active
      if (activeCategory) {
        query = query.eq("category", activeCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPosts(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load posts";
      setFetchError(msg);
      console.error("Community fetch error:", err);
    } finally {
      setLoadingPosts(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ── Real-time: INSERT and UPDATE ───────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("community_posts_all")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts" },
        (payload) => {
          const newPost = payload.new as Post;
          // Only prepend if it matches current filter
          if (activeCategory && newPost.category !== activeCategory) return;
          setPosts((prev) => {
            if (prev.some((p) => p.id === newPost.id)) return prev;
            return [newPost, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "community_posts" },
        (payload) => {
          const updated = payload.new as Post;
          setPosts((prev) =>
            prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeCategory]);

  // ── Create post ────────────────────────────────────────────────────────────
  const handleCreatePost = async () => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    if (!newTitle.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    if (!newContent.trim()) {
      toast({ title: "Content required", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: Post = {
      id: tempId,
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      is_anonymous: isAnonymous,
      likes_count: 0,
      replies_count: 0,
      created_at: new Date().toISOString(),
      user_id: user.id,
      moderation_status: "approved",
    };

    // Only show optimistic if it matches current filter
    if (!activeCategory || activeCategory === newCategory) {
      setPosts((prev) => [optimistic, ...prev]);
    }

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

      // Replace temp with real row
      setPosts((prev) =>
        prev.map((p) => (p.id === tempId ? (data as Post) : p))
      );

      toast({ title: "Posted!", description: "Your post is live." });
      setNewTitle("");
      setNewContent("");
      setNewCategory(CATEGORIES[0]);
      setIsAnonymous(true);
      setDialogOpen(false);
    } catch (err) {
      setPosts((prev) => prev.filter((p) => p.id !== tempId));
      const msg = err instanceof Error ? err.message : "Failed to create post";
      toast({ title: "Post failed", description: msg, variant: "destructive" });
      console.error("Create post error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Like / unlike (uses DB RPC to avoid stale closure bug) ────────────────
  const handleLike = async (post: Post) => {
    if (!user) {
      toast({ title: "Sign in to like posts", variant: "destructive" });
      return;
    }

    const alreadyLiked = likedIds.has(post.id);
    const newCount = Math.max(0, (post.likes_count ?? 0) + (alreadyLiked ? -1 : 1));

    // Optimistic update
    setLikedIds((prev) => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(post.id) : next.add(post.id);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, likes_count: newCount } : p))
    );

    // Persist to DB using the computed newCount (avoids stale closure)
    const { error } = await supabase
      .from("community_posts")
      .update({ likes_count: newCount })
      .eq("id", post.id);

    if (error) {
      // Roll back on failure
      setLikedIds((prev) => {
        const next = new Set(prev);
        alreadyLiked ? next.add(post.id) : next.delete(post.id);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, likes_count: post.likes_count } : p))
      );
      toast({ title: "Like failed", variant: "destructive" });
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalReplies = posts.reduce((s, p) => s + (p.replies_count ?? 0), 0);
  const totalLikes   = posts.reduce((s, p) => s + (p.likes_count ?? 0), 0);
  const categoryCounts = CATEGORIES.map((cat) => ({
    cat,
    count: posts.filter((p) => p.category === cat).length,
  }));

  // Posts visible in feed (already filtered by DB query, but double-check)
  const visiblePosts = activeCategory
    ? posts.filter((p) => p.category === activeCategory)
    : posts;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">

        {/* Page header */}
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
                  Share your thoughts, questions, or experiences
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Button
                  variant={isAnonymous ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsAnonymous((v) => !v)}
                  type="button"
                >
                  {isAnonymous
                    ? <><EyeOff className="h-4 w-4 mr-2" />Posting Anonymously</>
                    : <><Eye className="h-4 w-4 mr-2" />Posting as You</>}
                </Button>
                <Select value={newCategory} onValueChange={(v) => setNewCategory(v as Category)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Post title *"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={200}
                />
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
                  {submitting
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Posting…</>
                    : <><Send className="h-4 w-4 mr-2" />Post to Community</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{loadingPosts ? "—" : posts.length}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold">{loadingPosts ? "—" : totalReplies}</p>
              <p className="text-sm text-muted-foreground">Replies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Heart className="h-6 w-6 mx-auto mb-2 text-secondary" />
              <p className="text-2xl font-bold">{loadingPosts ? "—" : totalLikes}</p>
              <p className="text-sm text-muted-foreground">Likes</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Category filter bar ─────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filter by category</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(null)}
            >
              All
            </Button>
            {CATEGORIES.map((cat) => {
              const count = categoryCounts.find((c) => c.cat === cat)?.count ?? 0;
              return (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                  className="gap-1"
                >
                  {cat}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* ── Post feed ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">
              {activeCategory ? activeCategory : "All Posts"}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchPosts}
              disabled={loadingPosts}
              aria-label="Refresh posts"
            >
              <RefreshCw className={cn("h-4 w-4", loadingPosts && "animate-spin")} />
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
            {!loadingPosts && !fetchError && visiblePosts.length === 0 && (
              <div className="text-center py-10 space-y-2 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto opacity-40" />
                <p className="font-medium text-foreground">
                  {activeCategory ? `No posts in "${activeCategory}" yet` : "No posts yet"}
                </p>
                <p className="text-sm">Be the first to post!</p>
              </div>
            )}

            {/* Posts list */}
            {!loadingPosts &&
              visiblePosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">{post.category}</Badge>
                    {post.is_anonymous && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <EyeOff className="h-3 w-3" />Anonymous
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {timeAgo(post.created_at)}
                    </span>
                  </div>
                  <h4 className="font-semibold break-words mt-1">{post.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 break-words mt-0.5">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {post.replies_count ?? 0}
                    </span>
                    <button
                      className={cn(
                        "flex items-center gap-1 transition-colors",
                        likedIds.has(post.id) ? "text-pink-500" : "hover:text-pink-500"
                      )}
                      onClick={() => handleLike(post)}
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

        {/* ── Community Groups ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Community Groups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Daily Check-in Circle", members: 156, online: 23, desc: "Share daily reflections and support each other" },
              { name: "Strength Together",      members: 89,  online: 12, desc: "Building resilience and confidence as a community" },
              { name: "Young Voices",           members: 203, online: 34, desc: "A safe space for young people to connect and share" },
            ].map((group) => (
              <div key={group.name} className="flex items-start justify-between p-3 rounded-lg border gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-0.5">{group.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{group.desc}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />{group.members} members
                    </span>
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                      {group.online} online
                    </Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline">Join</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Upcoming Events ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { title: "Expert Q&A: Safety & Boundaries", date: "Tomorrow, 6:00 PM", host: "Dr. Sarah Johnson", attendees: 45 },
              { title: "Peer Support Session",            date: "Friday, 3:00 PM",   host: "Community Moderators", attendees: 67 },
            ].map((event) => (
              <div key={event.title} className="flex items-start gap-4 p-3 rounded-lg border">
                <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{event.date}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="text-muted-foreground">Host: {event.host}</span>
                    <Badge variant="secondary">{event.attendees} attending</Badge>
                  </div>
                  <Button size="sm" className="mt-2">Register</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>

      <BottomTabBar />
    </div>
  );
}
