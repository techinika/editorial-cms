declare module "@heyputer/puter.js/src/init.cjs" {
  export function init(authToken?: string): Puter;
  
  export interface PuterAI {
    chat(prompt: string, options?: { model?: string }): Promise<string | PuterError>;
  }

  export interface PuterError {
    message: string;
    code: string;
  }

  export interface Puter {
    ai: PuterAI;
  }
}