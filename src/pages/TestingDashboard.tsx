import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Bug, Lightbulb, MessageCircle, Star, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface FeedbackItem {
  id: string;
  feedback_type: string;
  message: string;
  rating: number | null;
  page_url: string;
  created_at: string;
  status: string;
  user_id: string;
}

interface AnalyticsEvent {
  id: string;
  event_name: string;
  event_data: any;
  page_url: string;
  user_type: string;
  created_at: string;
  session_id?: string;
  user_id?: string;
}

interface DashboardStats {
  totalFeedback: number;
  bugReports: number;
  featureRequests: number;
  averageRating: number;
  activeUsers: number;
  topPages: { page: string; visits: number }[];
  recentErrors: number;
}

export default function TestingDashboard() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch feedback using type assertion for new table
      const { data: feedbackData } = await (supabase as any)
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch analytics events using type assertion for new table
      const { data: eventsData } = await (supabase as any)
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      const typedFeedback = (feedbackData || []) as FeedbackItem[];
      const typedEvents = (eventsData || []) as AnalyticsEvent[];

      setFeedback(typedFeedback);
      setEvents(typedEvents);

      // Calculate stats
      if (typedFeedback && typedEvents) {
        const bugReports = typedFeedback.filter(f => f.feedback_type === 'bug').length;
        const featureRequests = typedFeedback.filter(f => f.feedback_type === 'feature').length;
        const ratings = typedFeedback.filter(f => f.rating !== null).map(f => f.rating as number);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
          : 0;

        // Count unique users from events
        const uniqueUsers = new Set(typedEvents.map(e => e.user_id || e.session_id)).size;

        // Top pages
        const pageCounts: Record<string, number> = {};
        typedEvents
          .filter(e => e.event_name === 'page_view')
          .forEach(e => {
            const page = e.page_url || '/';
            pageCounts[page] = (pageCounts[page] || 0) + 1;
          });
        const topPages = Object.entries(pageCounts)
          .map(([page, visits]) => ({ page, visits }))
          .sort((a, b) => b.visits - a.visits)
          .slice(0, 5);

        // Recent errors
        const recentErrors = typedEvents.filter(
          e => e.event_name === 'error_occurred' && 
          new Date(e.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
        ).length;

        setStats({
          totalFeedback: typedFeedback.length,
          bugReports,
          featureRequests,
          averageRating,
          activeUsers: uniqueUsers,
          topPages,
          recentErrors,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any)
      .from('user_feedback')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    }
  };

  const filteredFeedback = feedback.filter(f => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (typeFilter !== 'all' && f.feedback_type !== typeFilter) return false;
    return true;
  });

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4 text-destructive" />;
      case 'feature': return <Lightbulb className="h-4 w-4 text-secondary" />;
      case 'rating': return <Star className="h-4 w-4 text-primary" />;
      default: return <MessageCircle className="h-4 w-4 text-primary" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <Badge variant="default">New</Badge>;
      case 'in_progress': return <Badge variant="secondary">In Progress</Badge>;
      case 'resolved': return <Badge variant="outline" className="text-primary">Resolved</Badge>;
      case 'wont_fix': return <Badge variant="outline" className="text-muted-foreground">Won't Fix</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header />
      
      <div className="container px-4 py-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">UAT Testing Dashboard</h1>
          <p className="text-muted-foreground">Monitor user feedback and analytics during testing</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalFeedback}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Bug Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{stats.bugReports}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {stats.averageRating.toFixed(1)}
                  <Star className="h-5 w-5 fill-primary text-primary" />
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Errors Alert */}
        {stats && stats.recentErrors > 0 && (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-medium">{stats.recentErrors} errors in the last 24 hours</p>
                <p className="text-sm text-muted-foreground">Check the analytics tab for details</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="feedback" className="w-full">
          <TabsList>
            <TabsTrigger value="feedback">Feedback ({feedback.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="pages">Top Pages</TabsTrigger>
          </TabsList>

          <TabsContent value="feedback" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="wont_fix">Won't Fix</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bug">Bug Reports</SelectItem>
                  <SelectItem value="feature">Feature Requests</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="rating">Ratings</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={fetchData}>
                Refresh
              </Button>
            </div>

            {/* Feedback List */}
            <div className="space-y-3">
              {filteredFeedback.map(item => (
                <Card key={item.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getFeedbackIcon(item.feedback_type)}
                          <span className="font-medium capitalize">{item.feedback_type}</span>
                          {item.rating && (
                            <span className="flex items-center gap-1 text-sm">
                              {item.rating}/5 <Star className="h-3 w-3 fill-primary text-primary" />
                            </span>
                          )}
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-sm">{item.message || 'No message provided'}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Page: {item.page_url}</span>
                          <span>{format(new Date(item.created_at), 'PPp')}</span>
                        </div>
                      </div>
                      <Select 
                        value={item.status} 
                        onValueChange={(value) => updateFeedbackStatus(item.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="wont_fix">Won't Fix</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredFeedback.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No feedback matching your filters
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
                <CardDescription>Last 50 tracked events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {events.slice(0, 50).map(event => (
                    <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{event.event_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.page_url} • {event.user_type || 'Unknown'}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.created_at), 'HH:mm:ss')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Most Visited Pages</CardTitle>
                <CardDescription>During the testing period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.topPages.map((page, index) => (
                    <div key={page.page} className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-muted-foreground w-8">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{page.page}</p>
                        <div className="h-2 bg-muted rounded-full mt-1">
                          <div 
                            className="h-2 bg-primary rounded-full"
                            style={{ width: `${(page.visits / (stats?.topPages[0].visits || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-medium">{page.visits} visits</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
