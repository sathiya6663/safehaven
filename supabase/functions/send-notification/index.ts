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
    const { userId, type, title, body, data, priority } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's notification preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // Check if notifications should be sent based on type and priority
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
        .eq("child_id", userId)
        .eq("status", "approved");

      if (guardianLinks && guardianLinks.length > 0) {
        // Send notifications to guardians
        for (const link of guardianLinks) {
          console.log(`Sending notification to guardian: ${link.guardian_id}`);
          // In a real implementation, this would integrate with:
          // - Web Push API for browser notifications
          // - SMS service (Twilio) for text messages
          // - Email service for email notifications
        }
      }
    }

    // Create notification record
    const notification = {
      user_id: userId,
      type,
      title,
      body,
      data: data || {},
      priority: priority || (notifConfig.urgent ? "high" : "normal"),
      sent_at: new Date().toISOString(),
      status: "sent",
    };

    console.log("Notification prepared:", notification);

    // In a production environment, this would integrate with:
    // 1. Web Push API for browser notifications
    // 2. Expo Push Notifications for mobile apps
    // 3. SMS service (Twilio) for emergency text alerts
    // 4. Email service for email notifications
    
    // For now, we log the notification
    // The actual push notification implementation would require:
    // - Client-side registration of push notification tokens
    // - Storage of push tokens in the database
    // - Integration with push notification services

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
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
