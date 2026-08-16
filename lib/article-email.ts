const SITE_URL = "https://techinika.com";

interface ArticleForEmail {
  title: string;
  slug: string;
  summary: string | null;
  image: string | null;
}

export function generateArticleCardsHtml(articles: ArticleForEmail[]): string {
  if (articles.length === 0) return "";

  const cards = articles
    .map(
      (article) => `
    <tr>
      <td style="padding:0 0 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          ${article.image ? `
          <tr>
            <td>
              <img src="${article.image}" alt="${article.title}" style="width:100%;height:180px;object-fit:cover;display:block;" />
            </td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding:20px;">
              <h3 style="margin:0 0 8px;font-size:17px;font-weight:600;color:#1a202c;">
                <a href="${SITE_URL}/${article.slug}" style="color:#1a202c;text-decoration:none;">${article.title}</a>
              </h3>
              ${article.summary ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#6b7280;">${article.summary}</p>` : ""}
              <a href="${SITE_URL}/${article.slug}" style="display:inline-block;font-size:13px;font-weight:600;color:#3182ce;text-decoration:none;">Read more &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    )
    .join("");

  return `
<h2 style="margin:0 0 16px;font-size:18px;color:#1a202c;">Featured Articles</h2>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  ${cards}
</table>
  `.trim();
}
