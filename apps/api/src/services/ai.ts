export class AiService {
  static async analyzeMarket(question: string) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Analyze the following prediction market question: "${question}". Return a JSON object with:
                      - category: (choose one of POLITICS, CRYPTO, AI, SPORTS, ECON, GENERAL)
                      - confidenceScore: (float between 0.0 and 1.0 representing how clearly resolvable the question is)
                      - suggestedClosingDate: (ISO timestamp, default to 30 days from now if not specified)
                      - aiSentimentProbability: (float between 0.0 and 1.0 showing probability of YES resolving)
                      - verdictSummary: (short string describing the analysis)
                      Return ONLY the raw JSON string.`
                    }
                  ]
                }
              ]
            })
          }
        );

        if (response.ok) {
          const raw = await response.json();
          const text = raw.candidates?.[0]?.content?.parts?.[0]?.text || "";
          
          // Extract JSON block from markdown if present
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              category: parsed.category || "GENERAL",
              confidenceScore: parsed.confidenceScore || 0.85,
              suggestedClosingDate: parsed.suggestedClosingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              aiSentimentProbability: parsed.aiSentimentProbability || 0.50,
              verdictSummary: parsed.verdictSummary || `Analyzed via Gemini.`
            };
          }
        }
      } catch (err: any) {
        console.warn("[Gemini API] Failed to query model, running fallback parser:", err.message);
      }
    }

    // Fallback Parser
    const tokens = question.toLowerCase().split(" ");
    let category = "GENERAL";
    let initialProbability = 0.50;

    if (tokens.includes("btc") || tokens.includes("eth") || tokens.includes("crypto")) {
      category = "CRYPTO";
      initialProbability = 0.62;
    } else if (tokens.includes("election") || tokens.includes("president") || tokens.includes("senate")) {
      category = "POLITICS";
      initialProbability = 0.45;
    } else if (tokens.includes("gpt") || tokens.includes("ai") || tokens.includes("openai")) {
      category = "AI";
      initialProbability = 0.70;
    }

    return {
      category,
      confidenceScore: 0.85,
      suggestedClosingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      aiSentimentProbability: initialProbability,
      verdictSummary: `[Sandbox Fallback] Analyzed question: "${question}". Categorized under ${category}. Propose starting probability at ${Math.round(initialProbability * 100)}%.`
    };
  }

  static async draftMarket(prompt: string) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Read the following prediction market draft prompt: "${prompt}". Draft a prediction market proposal. Return a JSON object with:
                      - question: (a short, clear, resolvable prediction question, e.g. "Will BTC close above $100K on December 31, 2026?")
                      - closesAt: (ISO timestamp representing when the market closes, default to 30 days from now if not clear)
                      - oracleId: (e.g. "oracle:consensus" or a link/source, e.g. "https://api.coingecko.com")
                      - category: (choose one of POLITICS, CRYPTO, AI, SPORTS, ECON, GENERAL)
                      - explanation: (1-2 sentences explaining the resolution parameters)
                      Return ONLY the raw JSON string.`
                    }
                  ]
                }
              ]
            })
          }
        );

        if (response.ok) {
          const raw = await response.json();
          const text = raw.candidates?.[0]?.content?.parts?.[0]?.text || "";
          
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              question: parsed.question || `Will the prompt topic resolve in favor?`,
              closesAt: parsed.closesAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              oracleId: parsed.oracleId || "oracle:consensus",
              category: parsed.category || "GENERAL",
              explanation: parsed.explanation || "Drafted based on prompt topic."
            };
          }
        }
      } catch (err: any) {
        console.warn("[Gemini API] Failed to draft market, running fallback generator:", err.message);
      }
    }

    const cleanPrompt = prompt.trim();
    return {
      question: cleanPrompt.endsWith("?") ? cleanPrompt : `Will ${cleanPrompt} happen this year?`,
      closesAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      oracleId: "oracle:consensus",
      category: "GENERAL",
      explanation: `Drafted in sandbox fallback mode for prompt: "${prompt}".`
    };
  }
}
