export interface FetchedContent {
  title: string;
  content: string;
  description: string;
  favicon: string | null;
  url: string;
}

export async function fetchUrlContent(url: string): Promise<FetchedContent> {
  // Try article extractor first (best for articles, blog posts)
  try {
    const { extract } = await import("@extractus/article-extractor");
    const article = await extract(url);

    if (article && (article.content || article.title)) {
      const textContent = (article.content ?? "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      let favicon: string | null = null;
      try {
        const parsed = new URL(url);
        favicon = `${parsed.origin}/favicon.ico`;
      } catch { /* ignore */ }

      return {
        title: article.title ?? new URL(url).hostname,
        content: textContent || article.description || url,
        description: article.description ?? textContent.slice(0, 200),
        favicon,
        url,
      };
    }
  } catch { /* fall through to basic fetch */ }

  // Fallback: fetch raw HTML and extract basic metadata
  return fetchBasicMetadata(url);
}

async function fetchBasicMetadata(url: string): Promise<FetchedContent> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SecondBrainBot/1.0)" },
    redirect: "follow",
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }

  const html = await res.text();
  const title = extractTag(html, "title") || extractMeta(html, "og:title") || new URL(url).hostname;
  const description = extractMeta(html, "description") || extractMeta(html, "og:description") || "";

  let favicon: string | null = null;
  try {
    const parsed = new URL(url);
    favicon = `${parsed.origin}/favicon.ico`;
  } catch { /* ignore */ }

  const content = description || title;

  return { title, content, description: description || content.slice(0, 200), favicon, url };
}

function extractTag(html: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i");
  const match = html.match(regex);
  return match?.[1]?.trim() ?? "";
}

function extractMeta(html: string, name: string): string {
  // Match <meta name="..." content="..."> or <meta property="..." content="...">
  const patterns = [
    new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']${name}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}
