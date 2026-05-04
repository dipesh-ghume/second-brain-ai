/**
 * Parser for the Netscape Bookmark HTML format.
 * All major browsers (Chrome, Firefox, Edge, Safari, Brave)
 * export bookmarks in this standard format.
 */

export interface ParsedBookmark {
  url: string;
  title: string;
  addDate?: number;
  folder?: string;
}

export interface ParseResult {
  bookmarks: ParsedBookmark[];
  folders: string[];
  totalParsed: number;
}

export function parseBookmarkHtml(html: string): ParseResult {
  const bookmarks: ParsedBookmark[] = [];
  const folders = new Set<string>();
  const folderStack: string[] = [];

  const lines = html.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Track folder hierarchy via <DT><H3> tags
    const folderMatch = trimmed.match(/<H3[^>]*>([^<]+)<\/H3>/i);
    if (folderMatch) {
      const folderName = decodeHtmlEntities(folderMatch[1].trim());
      folderStack.push(folderName);
      folders.add(folderStack.join(" / "));
      continue;
    }

    // Closing a folder list
    if (trimmed.toUpperCase() === "</DL><P>" || trimmed.toUpperCase() === "</DL>") {
      folderStack.pop();
      continue;
    }

    // Parse actual bookmark links: <DT><A HREF="..." ...>Title</A>
    const linkMatch = trimmed.match(
      /<A\s+([^>]*)>([^<]*)<\/A>/i
    );
    if (!linkMatch) continue;

    const attrs = linkMatch[1];
    const title = decodeHtmlEntities(linkMatch[2].trim());

    const hrefMatch = attrs.match(/HREF="([^"]*)"/i);
    if (!hrefMatch) continue;

    const url = hrefMatch[1];

    // Skip non-http bookmarks (javascript:, chrome://, about:, etc.)
    if (!url.startsWith("http://") && !url.startsWith("https://")) continue;

    const addDateMatch = attrs.match(/ADD_DATE="(\d+)"/i);
    const addDate = addDateMatch ? parseInt(addDateMatch[1], 10) : undefined;

    const folder = folderStack.length > 0
      ? folderStack.join(" / ")
      : undefined;

    bookmarks.push({ url, title, addDate, folder });
  }

  return {
    bookmarks,
    folders: Array.from(folders),
    totalParsed: bookmarks.length,
  };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}
