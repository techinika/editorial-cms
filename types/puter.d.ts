declare module "@heyputer/puter.js" {
  export interface PuterAI {
    chat(prompt: string, options?: { model?: string }): Promise<string>;
  }

  export interface Puter {
    ai: PuterAI;
  }

  const puter: Puter;
  export default puter;
}