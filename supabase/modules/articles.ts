import { JoinedArticle, ArticleFormData, Article, Block, TOCEntry } from "@/types/article";
import { supabaseAdminClient } from "../supabase";

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const generateBlockId = (): string => {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateHeadingSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const parseHtmlToBlocks = (html: string): Block[] => {
  if (!html || !html.trim()) return [];
  
  const blocks: Block[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const root = doc.body;
  
  const processElement = (el: Element): Block | null => {
    const tagName = el.tagName.toLowerCase();
    const text = el.textContent?.trim() || "";
    
    if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
      const level = parseInt(tagName.replace("h", ""));
      return { id: generateBlockId(), type: "heading" as const, content: text, level };
    }
    if (tagName === "img") {
      const src = el.getAttribute("src") || "";
      return { id: generateBlockId(), type: "image" as const, content: el.getAttribute("alt") || "", url: src };
    }
    if (tagName === "pre") {
      const codeEl = el.querySelector("code");
      return { 
        id: generateBlockId(), 
        type: "code" as const, 
        content: codeEl?.textContent || text,
        language: codeEl?.getAttribute("class")?.replace("language-", "") || ""
      };
    }
    if (tagName === "blockquote") {
      return { id: generateBlockId(), type: "quote" as const, content: text };
    }
    if (tagName === "ul" || tagName === "ol") {
      const items = Array.from(el.querySelectorAll("li")).map(li => li.textContent?.trim() || "");
      return { id: generateBlockId(), type: "list" as const, content: JSON.stringify({ ordered: tagName === "ol", items }) };
    }
    if (tagName === "p" || text) {
      if (!text) return null;
      return { id: generateBlockId(), type: "paragraph" as const, content: text };
    }
    return null;
  };
  
  const traverse = (parent: Element) => {
    for (const child of Array.from(parent.children)) {
      const block = processElement(child);
      if (block) blocks.push(block);
      else if (["div", "section", "article"].includes(child.tagName.toLowerCase())) {
        traverse(child);
      }
    }
  };
  
  traverse(root);
  return blocks;
};

const extractTOC = (blocks: Block[]): TOCEntry[] => {
  return blocks
    .filter(b => b.type === "heading")
    .map(b => ({
      slug: generateHeadingSlug(b.content),
      level: b.level || 2,
      title: b.content
    }));
};

const articleSelect = `
  *,
  author:authors!author_id (id, name, image_url, created_at, lang, bio, external_link, username),
  category:categories (id, name),
  thumbnailAsset:assets!thumbnail_id (id, created_at, updated_at, name, url, type, views, author_id)
`;

export const createArticle = async (
  data: ArticleFormData,
): Promise<Article | null> => {
  try {
    const slug = data.slug || generateSlug(data.title);
    
    let blocks = data.blocks || [];
    let table_of_contents = [] as TOCEntry[];
    
    if (data.content && blocks.length === 0) {
      blocks = parseHtmlToBlocks(data.content);
      table_of_contents = extractTOC(blocks);
    } else if (data.content) {
      table_of_contents = extractTOC(blocks);
    }

    const { data: article, error } = await supabaseAdminClient
      .from("articles")
      .insert({
        title: data.title,
        slug,
        content: data.content,
        blocks,
        table_of_contents,
        image: data.image || null,
        category_id: data.category_id || null,
        tags: data.tags || null,
        summary: data.summary || null,
        read_time: data.read_time || null,
        lang: data.lang || "english",
        status: data.status || "draft",
        author_id: data.author_id || null,
        author_name: data.author_name || null,
        drafted_at: data.status === "draft" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating article:", error);
      return null;
    }

    return article as Article;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const updateArticle = async (
  id: string,
  data: Partial<ArticleFormData>,
  publishedByUserId?: string,
): Promise<Article | null> => {
  try {
    const updateData: Record<string, unknown> = { ...data };

    if (data.title && !data.slug) {
      updateData.slug = generateSlug(data.title);
    }

    if (data.status === "draft" && !data.drafted_at) {
      updateData.drafted_at = new Date().toISOString();
    }

    if (data.status === "published" && !data.published_at) {
      updateData.published_at = new Date().toISOString();
      if (publishedByUserId) {
        updateData.published_by = publishedByUserId;
      }
    }
    
    if (data.content && data.blocks) {
      updateData.blocks = data.blocks;
      updateData.table_of_contents = extractTOC(data.blocks);
    } else if (data.content && !data.blocks) {
      const blocks = parseHtmlToBlocks(data.content);
      updateData.blocks = blocks;
      updateData.table_of_contents = extractTOC(blocks);
    }

    const { data: article, error } = await supabaseAdminClient
      .from("articles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating article:", error);
      return null;
    }

    return article as Article;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const getArticleById = async (
  id: string,
): Promise<JoinedArticle | null> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("articles")
      .select(articleSelect)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching article:", error);
      return null;
    }

    return data as unknown as JoinedArticle;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return null;
  }
};

export const getArticles = async (
  page = 0,
  limit = 12,
): Promise<JoinedArticle[]> => {
  const from = page * limit;
  const to = from + limit - 1;

  try {
    const { data, error } = await supabaseAdminClient
      .from("articles")
      .select(articleSelect)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching articles:", error);
      return [];
    }

    return data as unknown as JoinedArticle[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getArticlesByStatus = async (
  status: "draft" | "published",
  page = 0,
  limit = 15,
): Promise<JoinedArticle[]> => {
  const from = page * limit;
  const to = from + limit - 1;

  try {
    const { data, error } = await supabaseAdminClient
      .from("articles")
      .select(articleSelect)
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error(`Error fetching ${status} articles:`, error);
      return [];
    }

    return data as unknown as JoinedArticle[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const searchArticles = async (
  query: string,
): Promise<JoinedArticle[]> => {
  if (!query.trim()) {
    return getArticles(0, 12);
  }

  try {
    const { data, error } = await supabaseAdminClient
      .from("articles")
      .select(articleSelect)
      .or(
        `title.ilike.%${query}%,summary.ilike.%${query}%,tags.ilike.%${query}%`,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching articles:", error);
      return [];
    }

    return data as unknown as JoinedArticle[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const deleteArticle = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabaseAdminClient
      .from("articles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting article:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return false;
  }
};

export const getUserOwnArticles = async (
  userId: string,
  limit = 10,
): Promise<JoinedArticle[]> => {
  try {
    const { data, error } = await supabaseAdminClient
      .from("articles")
      .select(articleSelect)
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching user articles:", error);
      return [];
    }

    return data as unknown as JoinedArticle[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getArticlesWithPendingFeedback = async (): Promise<
  JoinedArticle[]
> => {
  try {
    const { data: articlesWithFeedback, error: feedbackError } = await supabaseAdminClient
      .from("article_feedback")
      .select("article_id")
      .eq("resolved", false);

    if (feedbackError) {
      console.error("Error fetching pending feedback:", feedbackError);
      return [];
    }

    if (!articlesWithFeedback || articlesWithFeedback.length === 0) {
      return [];
    }

    const articleIds = Array.from(
      new Set(articlesWithFeedback.map((f) => f.article_id)),
    );

    const { data, error } = await supabaseAdminClient
      .from("articles")
      .select(articleSelect)
      .in("id", articleIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching articles with pending feedback:", error);
      return [];
    }

    return data as unknown as JoinedArticle[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const getArticlesWithPendingFeedbackUser = async (
  userId: string,
  isAdmin: boolean,
): Promise<JoinedArticle[]> => {
  try {
    let articleIdsQuery;

    if (isAdmin) {
      const { data: allFeedback } = await supabaseAdminClient
        .from("article_feedback")
        .select("article_id")
        .eq("resolved", false);

      if (!allFeedback || allFeedback.length === 0) return [];
      articleIdsQuery = Array.from(
        new Set(allFeedback.map((f) => f.article_id)),
      );
    } else {
      const { data: userFeedback } = await supabaseAdminClient
        .from("article_feedback")
        .select("article_id")
        .eq("resolved", false);

      if (!userFeedback || userFeedback.length === 0) return [];
      const articleIds = Array.from(
        new Set(userFeedback.map((f) => f.article_id)),
      );

      if (articleIds.length === 0) return [];

      const { data: userArticles } = await supabaseAdminClient
        .from("articles")
        .select("id")
        .eq("author_id", userId);

      if (!userArticles) return [];
      const ownedArticleIds = userArticles.map((a) => a.id);
      articleIdsQuery = articleIds.filter((id) =>
        ownedArticleIds.includes(id),
      );
    }

    if (!articleIdsQuery || articleIdsQuery.length === 0) return [];

    const { data, error } = await supabaseAdminClient
      .from("articles")
      .select(articleSelect)
      .in("id", articleIdsQuery)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching articles with pending feedback:", error);
      return [];
    }

    return data as unknown as JoinedArticle[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export type ArticleFilter = {
  status?: "draft" | "published" | "cancelled";
  category_id?: string;
  author_id?: string;
};

export const getFilteredArticles = async (
  filter: ArticleFilter,
  page = 0,
  limit = 12,
): Promise<JoinedArticle[]> => {
  const from = page * limit;
  const to = from + limit - 1;

  try {
    let query = supabaseAdminClient
      .from("articles")
      .select(articleSelect)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filter.status) {
      query = query.eq("status", filter.status);
    }

    if (filter.category_id) {
      query = query.eq("category_id", filter.category_id);
    }

    if (filter.author_id) {
      query = query.eq("author_id", filter.author_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching filtered articles:", error);
      return [];
    }

    return data as unknown as JoinedArticle[];
  } catch (err) {
    console.error("An unexpected error occurred:", err);
    return [];
  }
};

export const publishArticle = async (
  id: string,
  publishedByUserId: string,
): Promise<Article | null> => {
  return updateArticle(id, {
    status: "published",
    published_at: new Date().toISOString(),
    published_by: publishedByUserId,
  });
};