import  { Application,Request,Response } from "express";
import fs from "fs";
import path from "path";
import ollama from "ollama";
import store, { Embedding } from "./inMemoryVectorStore";
import contextPrompt from "./prompts/contextPrompt";
import Utils from "./utils";
import http from 'http';
import app from "./app";
const server=http.createServer(app);
const TOP_K = 5;
const DATA_FOLDER = "./data";
const PORT = 3000;

async function retrieveRelevant(input: string, topK: number = TOP_K): Promise<Embedding[]> {
  const inputVector = await Utils.generateEmbedding(input);

  const withSimilarities = store.map(item => ({
    ...item,
    similarity: Utils.cosineSimilarity(item.vector, inputVector)
  }));

  withSimilarities.sort((a, b) => b.similarity - a.similarity);
  return withSimilarities.slice(0, topK);
}


async function generateResponse(query: string) {
  console.log(`\nQuery: "${query}"`);
  const relevantResults = await retrieveRelevant(query);
  const contextParts = relevantResults.map((result, i) => {
    const sourceInfo = result.metadata?.source
      ? `[Source: ${result.metadata.source}, Chunk: ${result.metadata.chunkIndex}]`
      : "";
    return `RELEVANT TEXT ${i + 1} ${sourceInfo}:\n${result.text}`;
  });
  const context = contextParts.join("\n\n");

  console.log("\nTop relevant chunks:");
  relevantResults.forEach((result, i) => {
    console.log(`${i + 1}. ${result.metadata?.source || "Unknown"} (Similarity: ${(result as any).similarity.toFixed(4)})`);
  });

  const response = await ollama.generate({
    model: "llama3.2",
    prompt: contextPrompt(context, query),
  });

  console.log("\nResponse:", response.response);
  return response.response;
}

async function loadContext() {
  const files = fs.readdirSync(DATA_FOLDER);
  for (const file of files) {
    const filePath = path.join(DATA_FOLDER, file);
    await Utils.loadNovel(filePath, file);
  }
}

app.post("/ask", async (req: Request, res: Response): Promise<void> => {
    try {
      const { query } = req.body;
      if (!query) {
        res.status(400).json({ error: "Query is required" });
        return;
      }
      const response = await generateResponse(query);
      console.log(response,'response')
      res.json(JSON.parse(response));
    } catch (error) {
      console.error("Error generating response:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });


(async () => {
  await loadContext();  
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();
