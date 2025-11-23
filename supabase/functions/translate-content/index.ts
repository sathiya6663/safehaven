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
    const { text, targetLanguage, contentType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Content type specific instructions
    const contextInstructions = {
      legal: "This is legal information. Maintain accuracy and formal tone. Use proper legal terminology.",
      counseling: "This is mental health content. Use compassionate, supportive language. Preserve emotional nuance.",
      educational: "This is educational content for children/young adults. Use clear, simple language.",
      emergency: "This is emergency safety information. Keep it concise and urgent. Clarity is critical.",
      general: "General content. Maintain the original tone and meaning."
    };

    const instruction = contextInstructions[contentType as keyof typeof contextInstructions] || contextInstructions.general;

    const prompt = `Translate the following text to ${targetLanguage}.

${instruction}

Original text:
${text}

Provide ONLY the translated text, nothing else.`;

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
            content: "You are a professional translator with expertise in maintaining context, tone, and cultural sensitivity. Provide accurate translations that preserve meaning and emotional nuance." 
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Translation service busy. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Translation service unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Translation service error");
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content?.trim() || text;

    return new Response(
      JSON.stringify({ 
        originalText: text,
        translatedText,
        targetLanguage,
        contentType 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
