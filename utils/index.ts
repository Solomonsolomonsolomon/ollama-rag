import ollama from 'ollama';
import fs from 'fs'
const CHUNK_SIZE = 1000;  
import store from '../inMemoryVectorStore';

class Utils{
 public static async  generateEmbedding(input: string): Promise<number[]> {
    const response = await ollama.embed({ input, model: "mxbai-embed-large" });
     
    if (!response.embeddings || response.embeddings.length === 0) {
    
      throw new Error("Failed to generate embeddings.");
    }
  
    return response.embeddings[0];
  }

  public static chunkText(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;
  
    while (start < text.length) {
      let end = Math.min(start + CHUNK_SIZE, text.length);
  
      if (end < text.length) {
        const breakPoint = text.slice(start, end + 100).search(/[.!?]\s|\n\s*\n/);
        if (breakPoint >= 0) {
          end = start + breakPoint + 1;
        } else {
          const lastSpace = text.slice(start, end).lastIndexOf(' ');
          if (lastSpace > 0) {
            end = start + lastSpace + 1;
          }
        }
      }
  
      chunks.push(text.slice(start, end).trim());
  
      
      start = end; 
      if (start >= text.length) break;
    }
  
    return chunks;
  }
  


  public static async loadNovel(filePath: string, novelTitle: string): Promise<void> {
    console.log(`Loading novel: ${novelTitle}`);
  
    try {
      const novelText = fs.readFileSync(filePath, 'utf-8');
      const chunks = Utils.chunkText(novelText);
      console.log(`Chunked into ${chunks.length} segments. Generating embeddings...`);
  
      const BATCH_SIZE = 10; 
  
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
  
        for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
          const chunk = batch[batchIndex];
          const chunkIndex = i + batchIndex;
  
          try {  
            const vector = await Utils.generateEmbedding(chunk);
            store.push({ 
              text: chunk, 
              vector,
              metadata: {
                source: novelTitle,
                chunkIndex
              }
            });
  
            console.log(`Processed chunk ${chunkIndex + 1}/${chunks.length}`);
          } catch (err) {
            console.log(`error processing chunk ${chunkIndex+1}/${chunks.length}`)
            //console.error(`Error processing chunk ${chunkIndex + 1}:`, err);
          }
  
          //small delay to prevent API rate limit issues
         // await new Promise((resolve) => setTimeout(resolve, 1));
        }
      }
  
      console.log(`Novel "${novelTitle}" loaded with ${chunks.length} chunks.`);
    } catch (error) {
      console.error(`Error loading novel:`, error);
    }
  }
  



public static cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val ** 2, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val ** 2, 0));
    return dotProduct / (normA * normB);
  }




static async  addToStore(text: string, metadata?: { source?: string }) {
    const vector = await Utils.generateEmbedding(text);
    store.push({ text, vector, metadata });
    console.log(`Stored: "${text.substring(0, 50)}..."`);
  }
  
}

export default Utils;