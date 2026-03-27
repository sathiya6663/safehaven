import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { type, title, body, data, priority } = await req.json();
    
    // Use service role for database operations
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's notification preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      throw new Error("User profile not found");
    }

    const notificationTypes = {
      emergency: { sendAlways: true, urgent: true },
      safety_alert: { sendAlways: true, urgent: true },
      counseling_reminder: { sendAlways: false, urgent: false },
      guardian_alert: { sendAlways: true, urgent: true },
      journey_update: { sendAlways: false, urgent: false },
      system: { sendAlways: false, urgent: false },
    };

    const notifConfig = notificationTypes[type as keyof typeof notificationTypes] || { sendAlways: false, urgent: false };

    // For guardian alerts, also notify linked guardians
    if (type === "guardian_alert" || type === "safety_alert") {
      const { data: guardianLinks } = await supabase
        .from("guardian_child_links")
        .select("guardian_id")
        .eq("child_id", user.id)
        .eq("status", "approved");

      if (guardianLinks && guardianLinks.length > 0) {
        for (const link of guardianLinks) {
          console.log(`Sending notification to guardian: ${link.guardian_id}`);
        }
      }
    }

    const notification = {
      user_id: user.id,
      type,
      title,
      body,
      data: data || {},
      priority: priority || (notifConfig.urgent ? "high" : "normal"),
      sent_at: new Date().toISOString(),
      status: "sent",
    };

    console.log("Notification prepared:", notification);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification,
        message: "Notification sent successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
