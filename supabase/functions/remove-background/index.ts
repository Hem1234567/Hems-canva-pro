import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Use Gemini vision to analyze the image and generate a description for background removal guidance
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an image analysis AI. Analyze the provided image and return a JSON object describing the main subject and background. Return ONLY valid JSON with this structure:
{
  "subject": "description of main subject",
  "subjectBounds": { "x": 0.1, "y": 0.1, "width": 0.8, "height": 0.8 },
  "backgroundColor": "#hexcolor",
  "hasComplexBackground": true/false,
  "recommendation": "brief recommendation for background removal"
}
The subjectBounds should be normalized 0-1 values representing where the main subject is located.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image for background removal. Identify the main subject and its approximate bounds." },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_image",
              description: "Return structured analysis of image for background removal",
              parameters: {
                type: "object",
                properties: {
                  subject: { type: "string", description: "Description of main subject" },
                  subjectBounds: {
                    type: "object",
                    properties: {
                      x: { type: "number" },
                      y: { type: "number" },
                      width: { type: "number" },
                      height: { type: "number" }
                    },
                    required: ["x", "y", "width", "height"]
                  },
                  backgroundColor: { type: "string" },
                  hasComplexBackground: { type: "boolean" },
                  recommendation: { type: "string" }
                },
                required: ["subject", "subjectBounds", "backgroundColor", "hasComplexBackground", "recommendation"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_image" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let analysis;
    
    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing from content
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { 
        subject: "unknown", 
        subjectBounds: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
        backgroundColor: "#ffffff",
        hasComplexBackground: false,
        recommendation: "Could not analyze image"
      };
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("remove-background error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
