import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { filePath } = await req.json();
    if (!filePath) throw new Error("Missing filePath");

    // Download file from storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from("lab-reports")
      .download(filePath);
    if (dlError || !fileData) throw new Error("Failed to download file: " + dlError?.message);

    // Convert to base64 for AI
    const arrayBuf = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuf)));
    const mimeType = filePath.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : filePath.toLowerCase().endsWith(".png")
      ? "image/png"
      : "image/jpeg";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a medical lab report reader. Extract biomarkers from lab reports.
Return ONLY a JSON array of objects with these fields:
- name: biomarker name in Portuguese (e.g. "Glicemia em Jejum")
- value: numeric value as a number
- unit: measurement unit (e.g. "mg/dL")
- referenceMin: minimum reference value (number or null)
- referenceMax: maximum reference value (number or null)

Examples of common biomarkers: Glicemia em Jejum, Hemoglobina Glicada (HbA1c), LDL Colesterol, HDL Colesterol, Triglicerídeos, Creatinina, Ureia, TSH, T4 Livre, Hemoglobina, Hematócrito, Leucócitos, Plaquetas, TGO (AST), TGP (ALT), Gama GT, Ácido Úrico, PCR, Vitamina D, Vitamina B12, Ferro Sérico, Ferritina, PSA Total, Testosterona Total, Insulina em Jejum.

Be precise. Only include items you can clearly identify as biomarker results with numeric values. Do NOT invent data.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all biomarkers from this lab report. Return only the JSON array." },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI extraction failed");
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "[]";

    // Parse JSON from AI response (may be wrapped in markdown code block)
    let biomarkers;
    try {
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      biomarkers = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      biomarkers = [];
    }

    // Validate each entry
    const validated = biomarkers
      .filter((b: any) => b.name && typeof b.value === "number" && b.unit)
      .map((b: any) => ({
        name: String(b.name).trim(),
        value: Number(b.value),
        unit: String(b.unit).trim(),
        referenceMin: typeof b.referenceMin === "number" ? b.referenceMin : null,
        referenceMax: typeof b.referenceMax === "number" ? b.referenceMax : null,
      }));

    return new Response(JSON.stringify({ biomarkers: validated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-biomarkers error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
