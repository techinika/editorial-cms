declare module "@heyputer/puter.js" {
  export interface PuterAI {
    chat(prompt: string, options?: { model?: string }): Promise<string>;
  }

  export interface PuterError {
    message: string;
    code: string;
  }

  export interface Puter {
    ai: PuterAI;
    setAuthToken(token: string): void;
    resetAuthToken(): void;
  }

  const puter: Puter;
  export default puter;
}