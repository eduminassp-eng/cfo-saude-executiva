import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { messages, healthContext, attachment } = await req.json();
    if (!messages || !Array.isArray(messages)) throw new Error("Missing messages");

    const systemPrompt = `Você é um assistente de saúde preventiva integrado ao Health CFO. Você tem acesso aos dados de saúde do usuário abaixo.

DADOS DO USUÁRIO:
${healthContext || "Nenhum dado disponível."}

REGRAS:
- Responda sempre em português do Brasil.
- Use os dados reais do usuário para contextualizar suas respostas.
- Seja preciso e baseado em evidências.
- Use markdown para formatar respostas (listas, negrito, headers).
- Sempre inclua o disclaimer: suas respostas são informativas e NÃO substituem orientação médica.
- Se perguntado sobre algo fora dos dados disponíveis, diga que não tem essa informação.
- Seja conciso mas completo. Use linguagem acessível.
- Quando relevante, sugira perguntas que o usuário pode fazer ao médico.
- Se o usuário anexar um resultado de exame (PDF ou imagem), analise os valores encontrados, compare com os dados existentes do usuário e destaque alterações relevantes.`;

    // Build the last user message with optional attachment
    const aiMessages = messages.map((m: any, i: number) => {
      // Only attach file to the last user message
      if (i === messages.length - 1 && m.role === "user" && attachment?.base64 && attachment?.mimeType) {
        return {
          role: "user",
          content: [
            { type: "text", text: m.content || "Analise este resultado de exame anexado." },
            { type: "image_url", image_url: { url: `data:${attachment.mimeType};base64,${attachment.base64}` } },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...aiMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("AI request failed");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("health-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
