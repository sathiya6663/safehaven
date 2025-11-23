import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, emotionalState, userType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Age-appropriate system prompts
    const systemPrompts = {
      child: `You are a compassionate AI counselor specializing in supporting children aged 8-17. 
Use simple, age-appropriate language. Be warm, encouraging, and patient. 
Focus on building confidence and resilience. Always prioritize safety.
If you detect severe distress, bullying, abuse, or self-harm thoughts, immediately flag this as a crisis.`,
      
      woman: `You are an empathetic AI counselor providing mental health support to women.
Use professional yet warm language. Provide evidence-based coping strategies.
Be trauma-informed and culturally sensitive. Empower and validate experiences.
If you detect severe distress, abuse, or self-harm thoughts, immediately flag this as a crisis.`,
      
      guardian: `You are a supportive AI counselor helping guardians navigate caregiving challenges.
Provide practical guidance on supporting children's mental health and safety.
Offer stress management techniques and resources for guardians.
If you detect concerns about child safety or guardian distress, flag appropriately.`,
    };

    const systemPrompt = systemPrompts[userType as keyof typeof systemPrompts] || systemPrompts.woman;
    
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
            content: `${systemPrompt}\n\nCurrent emotional state: ${emotionalState || 'neutral'}. Adjust your tone accordingly.` 
          },
          ...messages,
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    // Check for crisis keywords in the last user message
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const crisisDetected = crisisKeywords.some(keyword => lastUserMessage.includes(keyword));

    if (crisisDetected) {
      console.log("CRISIS DETECTED - User message contains crisis keywords");
      // Add crisis flag to response headers
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
