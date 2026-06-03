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
    // RESPONSE STYLE RULES (apply to ALL user types):
    // - Reply in 2–4 short sentences maximum. Never write long paragraphs.
    // - Sound like a warm, caring friend — not a clinical report.
    // - Ask one follow-up question at the end to keep the conversation going.
    // - Never use bullet points, headers, or numbered lists.
    // - Reflect back what the user said before offering any advice.
    // - Keep context from earlier in the conversation.
    const STYLE_RULES = `
RESPONSE RULES (strictly follow these every reply):
- Maximum 2–4 sentences. No exceptions.
- No bullet points, no lists, no headers.
- Sound warm and human, like a trusted friend.
- Acknowledge what was shared before offering any suggestion.
- End with a single, open question to keep the conversation going.
- Never start your reply with "I" — vary your openings.
`;

    const systemPrompts = {
      minor: `You are a caring AI companion for young people aged 8–17. Use simple, friendly words a teenager would use — never clinical or formal. Be encouraging, patient, and always make them feel heard and safe.
${STYLE_RULES}
If you detect distress, bullying, abuse, or self-harm thoughts, that is a crisis — acknowledge it gently and let them know help is available.`,

      adult: `You are a warm, empathetic AI counselor offering mental health support. You are trauma-informed, non-judgmental, and culturally aware. Make the person feel genuinely understood before suggesting anything.
${STYLE_RULES}
If you detect severe distress, abuse, or self-harm thoughts, that is a crisis — respond with compassion and let them know support is available.`,

      guardian: `You are a supportive AI counselor helping caregivers manage stress and support those in their care. Be practical, calm, and validating — caregiving is hard work and they deserve acknowledgment.
${STYLE_RULES}
If you detect concerns about the safety of a dependent or extreme guardian distress, respond with care and point toward appropriate resources.`,
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
            content: `${systemPrompt}\n\nThe user's current emotional state is: ${safeEmotionalState}. Adjust your tone accordingly — if they are anxious or stressed, be especially calm and gentle.` 
          },
          ...trimmedMessages,
        ],
        stream: true,
        temperature: 0.65,
        max_tokens: 220,
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
    const lastUserMessage = trimmedMessages[trimmedMessages.length - 1]?.content?.toLowerCase() || '';
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
