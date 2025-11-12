import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Transaction {
  description: string;
  amount: number;
  date: string;
  category?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { fileContent, fileName, analysisMode } = await req.json();

    console.log("Processing file:", fileName, "Mode:", analysisMode);

    const lines = fileContent.split("\n").filter((line: string) => line.trim());
    const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase());

    const descIndex = headers.findIndex((h: string) => h.includes("descr") || h.includes("description"));
    const amountIndex = headers.findIndex((h: string) => h.includes("valor") || h.includes("amount"));
    const dateIndex = headers.findIndex((h: string) => h.includes("data") || h.includes("date"));
    const categoryIndex = headers.findIndex((h: string) => h.includes("categ"));

    if (descIndex === -1 || amountIndex === -1 || dateIndex === -1) {
      throw new Error("Formato de arquivo inválido. Verifique as colunas obrigatórias.");
    }

    const transactions: Transaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v: string) => v.trim());
      if (values.length < 3) continue;

      transactions.push({
        description: values[descIndex] || "",
        amount: parseFloat(values[amountIndex]?.replace(/[^\d.-]/g, "") || "0"),
        date: values[dateIndex] || new Date().toISOString().split("T")[0],
        category: categoryIndex !== -1 ? values[categoryIndex] : undefined,
      });
    }

    console.log(`Parsed ${transactions.length} transactions`);

    const { data: categories } = await supabase
      .from("categories")
      .select("id, name");

    const categoryMap = new Map(categories?.map((c) => [c.name.toLowerCase(), c.id]) || []);

    let processedCount = 0;

    for (const transaction of transactions) {
      let categoryId: string | null = null;

      if (analysisMode === "labeled" && transaction.category) {
        categoryId = categoryMap.get(transaction.category.toLowerCase()) || null;
      } else if (analysisMode === "ai") {
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: `Você é um assistente de categorização financeira. Categorize a transação em uma das seguintes categorias: ${Array.from(categoryMap.keys()).join(", ")}. Responda APENAS com o nome da categoria, sem pontuação ou explicação.`,
                },
                {
                  role: "user",
                  content: `Categorize esta transação: "${transaction.description}" no valor de R$ ${transaction.amount}`,
                },
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const suggestedCategory = aiData.choices[0]?.message?.content?.trim().toLowerCase();
            categoryId = categoryMap.get(suggestedCategory) || categoryMap.get("outros") || null;
          }
        } catch (error) {
          console.error("AI categorization error:", error);
          categoryId = categoryMap.get("outros") || null;
        }
      }

      if (!categoryId) {
        categoryId = categoryMap.get("outros") || null;
      }

      if (categoryId) {
        const { error: insertError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            category_id: categoryId,
            description: transaction.description,
            amount: transaction.amount,
            transaction_date: transaction.date,
            file_name: fileName,
          });

        if (!insertError) {
          processedCount++;
        } else {
          console.error("Insert error:", insertError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionsCount: processedCount,
        message: `${processedCount} transações processadas com sucesso`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});