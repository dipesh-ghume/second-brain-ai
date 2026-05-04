const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url);
}

export function extractVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match?.[1] ?? null;
}

interface OEmbedResponse {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
}

async function fetchOEmbed(videoId: string): Promise<OEmbedResponse> {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const res = await fetch(oembedUrl);
  if (!res.ok) throw new Error(`oEmbed failed: ${res.status}`);
  return res.json();
}

async function fetchPageDescription(videoId: string): Promise<string> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const html = await res.text();

    // Extract description from the JSON embedded in the page
    const descMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
    if (descMatch?.[1]) {
      return descMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .slice(0, 4000);
    }

    // Fallback: meta description
    const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
    if (metaMatch?.[1]) {
      return metaMatch[1].slice(0, 2000);
    }
  } catch {
    // Page fetch is best-effort
  }
  return "";
}

export async function fetchYouTubeContent(url: string): Promise<{
  title: string;
  content: string;
  description: string;
  favicon: string;
}> {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  const [oembed, pageDescription] = await Promise.all([
    fetchOEmbed(videoId),
    fetchPageDescription(videoId),
  ]);

  const title = oembed.title || `YouTube Video ${videoId}`;
  const channel = oembed.author_name || "Unknown Channel";

  const contentParts = [
    `Video: ${title}`,
    `Channel: ${channel}`,
  ];

  if (pageDescription) {
    contentParts.push(`\nDescription:\n${pageDescription}`);
  }

  const content = contentParts.join("\n");

  return {
    title,
    content,
    description: pageDescription
      ? pageDescription.slice(0, 200)
      : `${title} by ${channel}`,
    favicon: "https://www.youtube.com/favicon.ico",
  };
}
