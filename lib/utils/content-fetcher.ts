export interface FetchedContent {
  title: string;
  content: string;
  description: string;
  favicon: string | null;
  url: string;
}

export async function fetchUrlContent(url: string): Promise<FetchedContent> {
  const { extract } = await import("@extractus/article-extractor");
  const article = await extract(url);

  if (!article) {
    throw new Error(`Could not extract content from URL: ${url}`);
  }

  const textContent = (article.content ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let favicon: string | null = null;
  try {
    const parsed = new URL(url);
    favicon = `${parsed.origin}/favicon.ico`;
  } catch {
    // ignore
  }

  return {
    title: article.title ?? new URL(url).hostname,
    content: textContent,
    description: article.description ?? textContent.slice(0, 200),
    favicon,
    url,
  };
}
