import type { Block, TOCEntry } from "@/types/article";

export type { Block, TOCEntry };

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const generateBlockId = (): string => {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const parseHtmlToBlocks = (html: string): Block[] => {
  const blocks: Block[] = [];
  if (!html || !html.trim()) return blocks;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const root = doc.body;

  const processNode = (node: Node): Block | null => {
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6": {
        const level = parseInt(tagName.replace("h", ""));
        const title = element.textContent?.trim() || "";
        return {
          id: generateBlockId(),
          type: "heading",
          content: title,
          level,
        };
      }
      case "img": {
        const src = element.getAttribute("src") || "";
        const alt = element.getAttribute("alt") || "";
        return {
          id: generateBlockId(),
          type: "image",
          content: alt,
          url: src,
        };
      }
      case "pre": {
        const code = element.querySelector("code");
        const codeText = code?.textContent || element.textContent || "";
        const lang = code?.getAttribute("class")?.replace("language-", "") || "";
        return {
          id: generateBlockId(),
          type: "code",
          content: codeText,
          language: lang,
        };
      }
      case "blockquote": {
        const quoteText = element.textContent?.trim() || "";
        return {
          id: generateBlockId(),
          type: "quote",
          content: quoteText,
        };
      }
      case "ul":
      case "ol": {
        const items = Array.from(element.querySelectorAll("li")).map(
          (li) => li.textContent?.trim() || ""
        );
        return {
          id: generateBlockId(),
          type: "list",
          content: JSON.stringify({ ordered: tagName === "ol", items }),
        };
      }
      case "p": {
        const text = element.textContent?.trim() || "";
        if (!text) return null;
        return {
          id: generateBlockId(),
          type: "paragraph",
          content: text,
        };
      }
      default: {
        if (element.textContent?.trim()) {
          return {
            id: generateBlockId(),
            type: "paragraph",
            content: element.textContent.trim(),
          };
        }
        return null;
      }
    }
  };

  const traverse = (node: Node) => {
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;
        const tagName = element.tagName.toLowerCase();

        if (["div", "section", "article"].includes(tagName)) {
          traverse(child);
        } else {
          const block = processNode(child);
          if (block) blocks.push(block);
        }
      }
    }
  };

  traverse(root);
  return blocks;
};

export const extractTOC = (blocks: Block[]): TOCEntry[] => {
  return blocks
    .filter((block) => block.type === "heading")
    .map((block) => ({
      slug: generateSlug(block.content),
      level: block.level || 2,
      title: block.content,
    }));
};

export const generateHeadingSlug = (text: string): string => {
  return generateSlug(text);
};

export const blocksToHtml = (blocks: Block[]): string => {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `<h${block.level}>${block.content}</h${block.level}>`;
        case "image":
          return `<img src="${block.url}" alt="${block.content}" />`;
        case "code":
          return `<pre><code class="language-${block.language}">${block.content}</code></pre>`;
        case "quote":
          return `<blockquote>${block.content}</blockquote>`;
        case "list": {
          try {
            const { ordered, items } = JSON.parse(block.content);
            const tag = ordered ? "ol" : "ul";
            const listItems = items.map((item: string) => `<li>${item}</li>`).join("");
            return `<${tag}>${listItems}</${tag}>`;
          } catch {
            return "";
          }
        }
        case "paragraph":
        default:
          return `<p>${block.content}</p>`;
      }
    })
    .join("\n");
};

export const htmlToBlocks = (html: string): { blocks: Block[]; toc: TOCEntry[] } => {
  const blocks = parseHtmlToBlocks(html);
  const toc = extractTOC(blocks);
  return { blocks, toc };
};

export const isLegacyContent = (content: string): boolean => {
  return content.includes("<p>") || content.includes("<h") || content.includes("<img");
};

export const convertLegacyContent = (content: string): { blocks: Block[]; toc: TOCEntry[] } => {
  return htmlToBlocks(content);
};