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
    const { emotionalState, userType, recentTopics } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const ageAppropriate = userType === "child" 
      ? "age-appropriate for children (8-17 years old)" 
      : "suitable for adults";

    const prompt = `Generate 3-5 personalized coping strategies for someone experiencing ${emotionalState}.
    
User type: ${userType}
Recent topics discussed: ${recentTopics?.join(", ") || "general stress"}

Requirements:
- Make strategies ${ageAppropriate}
- Include practical, actionable techniques
- Provide brief, clear instructions (2-3 sentences each)
- Focus on evidence-based methods
- Include variety: breathing, mindfulness, physical activity, creative expression

Respond with JSON array: [
  {
    "title": "Strategy name",
    "icon": "heart" | "brain" | "lightbulb" | "activity" | "music",
    "description": "Brief description",
    "instructions": "Step-by-step instructions"
  }
]`;

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
            content: "You are a mental health expert specializing in evidence-based coping strategies. Provide practical, safe, and effective techniques." 
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        // Return fallback strategies
        return new Response(
          JSON.stringify([
            {
              title: "Deep Breathing",
              icon: "heart",
              description: "Calm your mind and body",
              instructions: "Breathe in for 4 counts, hold for 7, exhale for 8. Repeat 4 times."
            },
            {
              title: "Grounding Exercise",
              icon: "brain",
              description: "Connect with the present moment",
              instructions: "Name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste."
            },
            {
              title: "Positive Affirmation",
              icon: "lightbulb",
              description: "Build self-confidence",
              instructions: "Say to yourself: 'I am capable, I am strong, I can handle this situation.'"
            }
          ]),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI service error");
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "[]";
    
    // Parse AI response
    let strategies;
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      strategies = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      // Return fallback strategies
      strategies = [
        {
          title: "Mindful Breathing",
          icon: "heart",
          description: "Center yourself with breath",
          instructions: "Find a quiet spot. Close your eyes. Take slow, deep breaths focusing on the sensation of air moving in and out."
        }
      ];
    }

    return new Response(JSON.stringify(strategies), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Coping strategies error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
