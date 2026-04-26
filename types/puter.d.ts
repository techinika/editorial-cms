declare module "@heyputer/puter.js" {
  export function init(authToken?: string): Puter;
  
  export interface PuterAI {
    chat(prompt: string, options?: { model?: string }): Promise<string>;
  }

  export interface PuterError {
    message: string;
    code: string;
  }

  export interface Puter {
    ai: PuterAI;
  }

  const puter: Puter;
  export default puter;
}

declare module "@heyputer/puter.js/src/init.cjs" {
  export function init(authToken?: string): Puter;
  
  export interface PuterAI {
    chat(prompt: string, options?: { model?: string }): Promise<string>;
  }

  export interface PuterError {
    message: string;
    code: string;
  }

  export interface Puter {
    ai: PuterAI;
  }
}