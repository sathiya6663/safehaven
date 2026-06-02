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
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { messages, emotionalState, userType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Input validation
    const MAX_MESSAGES = 20;
    const MAX_MESSAGE_CHARS = 4_000;
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid input: messages array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const trimmedMessages = messages.slice(-MAX_MESSAGES).map((m: any) => ({
      role: m?.role === "assistant" ? "assistant" : "user",
      content: typeof m?.content === "string" ? m.content.slice(0, MAX_MESSAGE_CHARS) : "",
    })).filter((m) => m.content.length > 0);
    if (trimmedMessages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid input: empty messages" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const safeEmotionalState = typeof emotionalState === "string" ? emotionalState.slice(0, 80) : "neutral";

    // Fetch the actual user type from the database instead of trusting client
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single();

    const verifiedUserType = profile?.user_type || userType || 'adult';

    // Age-appropriate system prompts
    const systemPrompts = {
      minor: `You are a compassionate AI counselor specializing in supporting young people aged 8-17. 
Use simple, age-appropriate language. Be warm, encouraging, and patient. 
Focus on building confidence and resilience. Always prioritize safety.
If you detect severe distress, bullying, abuse, or self-harm thoughts, immediately flag this as a crisis.`,
      
      adult: `You are an empathetic AI counselor providing mental health support.
Use professional yet warm language. Provide evidence-based coping strategies.
Be trauma-informed and culturally sensitive. Empower and validate experiences.
If you detect severe distress, abuse, or self-harm thoughts, immediately flag this as a crisis.`,
      
      guardian: `You are a supportive AI counselor helping guardians navigate caregiving challenges.
Provide practical guidance on supporting dependents' mental health and safety.
Offer stress management techniques and resources for guardians.
If you detect concerns about dependent safety or guardian distress, flag appropriately.`,
    };

    const systemPrompt = systemPrompts[verifiedUserType as keyof typeof systemPrompts] || systemPrompts.adult;
    
    const crisisKeywords = [
      'suicide', 'kill myself', 'end my life', 'want to die', 'hurt myself',
      'self-harm', 'cutting', 'abuse', 'being hurt', 'touched inappropriately',
      'scared for my life', 'going to hurt', 'weapon'
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `${systemPrompt}\n\nCurrent emotional state: ${safeEmotionalState}. Adjust your tone accordingly.` 
          },
          ...trimmedMessages,
        ],
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI service error");
    }

    // Check for crisis keywords in the last user message
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const crisisDetected = crisisKeywords.some(keyword => lastUserMessage.includes(keyword));

    if (crisisDetected) {
      console.log("CRISIS DETECTED - User message contains crisis keywords");
      return new Response(response.body, {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/event-stream",
          "X-Crisis-Detected": "true" 
        },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Counseling chat error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
