interface Embedding {
    text: string;
    vector: number[];
    metadata?: {
      source?: string;
      chunkIndex?: number;
    };
  }
  
  let store: Embedding[] = [];
export {Embedding}

  export default store;