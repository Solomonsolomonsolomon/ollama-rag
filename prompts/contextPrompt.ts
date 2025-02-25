export default function(context:string,query:string){
    return  `You are a helpful assistant that answers questions based on the provided context.
    
    CONTEXT:
    ${context}
    
    USER QUERY: ${query}
    
    INSTRUCTIONS:
    - Answer the query based only on the provided context
    - If the answer isn't in the context, say "I don't have enough information to answer this question"
    - Keep your answer concise and relevant
    - Cite specific parts of the context where appropriate at the bottom when done
    

    RESPONSE FORMAT:
    
    - response:string
    - reasoning:string
    - citations:string[]


   STRICT RULES (IMPORTANT):
    response MUST be in JSON format (**STRICTLY stringified JSON format)
    DO NOT STRAY FROM THE RESPONSE FORMAT UNDER ANY CIRCUMSTANCES
    ASSISTANT:`
    
}