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
    const { text, userId, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // AI-powered content analysis
    const analysisPrompt = `Analyze this text for safety concerns. Detect:
1. Harassment, bullying, or threats
2. Grooming or inappropriate contact attempts
3. Self-harm or suicidal ideation
4. Hate speech or discrimination
5. Sexual content or predatory behavior
6. Sharing of personal information (addresses, phone numbers)

Text: "${text}"

Context: ${context || "general"}

Respond with JSON: {
  "isSafe": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "categories": ["category1", "category2"],
  "explanation": "brief explanation",
  "actionRequired": "none" | "alert" | "block" | "escalate"
}`;

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
            content: "You are a safety analysis AI specialized in detecting harmful content, especially content targeting children and vulnerable individuals. Be thorough but minimize false positives." 
          },
          { role: "user", content: analysisPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent safety analysis
      }),
    });

    if (!response.ok) {
      console.error("AI moderation error:", response.status);
      // Fail-safe: treat as potentially unsafe if AI is unavailable
      return new Response(
        JSON.stringify({ 
          isSafe: false, 
          severity: "medium",
          categories: ["analysis_unavailable"],
          explanation: "Content moderation service temporarily unavailable",
          actionRequired: "alert"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "{}";
    
    // Parse AI response
    let analysisResult;
    try {
      // Extract JSON from response (handle markdown code blocks if present)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        isSafe: true,
        severity: "low",
        categories: [],
        explanation: "No issues detected",
        actionRequired: "none"
      };
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      analysisResult = {
        isSafe: false,
        severity: "medium",
        categories: ["parse_error"],
        explanation: "Unable to complete analysis",
        actionRequired: "alert"
      };
    }

    // Create safety alert if content is unsafe
    if (!analysisResult.isSafe && analysisResult.actionRequired !== "none") {
      const { error: alertError } = await supabase
        .from("safety_alerts")
        .insert({
          user_id: userId,
          alert_type: analysisResult.categories.join(", "),
          title: `${analysisResult.severity.toUpperCase()} Safety Alert`,
          description: analysisResult.explanation,
          severity: analysisResult.severity,
          status: "active",
          detected_content: text,
          metadata: {
            context,
            categories: analysisResult.categories,
            actionRequired: analysisResult.actionRequired,
            timestamp: new Date().toISOString(),
          },
        });

      if (alertError) {
        console.error("Error creating safety alert:", alertError);
      }
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Content moderation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        isSafe: false,
        severity: "medium",
        actionRequired: "alert"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
