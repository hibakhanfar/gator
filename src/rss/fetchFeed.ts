
import { XMLParser } from "fast-xml-parser";

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const response = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
    },
  });

  if (!response.ok) {
    throw new Error(`failedfetch feed: ${response.status}`);
  }

  const xml = await response.text();

  const parser = new XMLParser({
    processEntities: false,
  });

  const parsed = parser.parse(xml);
  const channel = parsed?.rss?.channel;

  if (!channel || typeof channel !== "object") {
    throw new Error("invalid rss feed-> missing channel");
  }

  const { title, link, description } = channel;

  if (
    typeof title !== "string" ||
    typeof link !== "string" ||
    typeof description !== "string"
  ) {
    throw new Error("invalid rss feed->missing channel_metadata");
  }

  const items = channel.item
  ? Array.isArray(channel.item)
    ? channel.item
    : [channel.item]
  : [];

  const validItems: RSSItem[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const { title, link, description, pubDate } = item as Record<
      string,
      unknown
    >;

    if (
      typeof title !== "string" ||
      typeof link !== "string" ||
      typeof description !== "string" ||
      typeof pubDate !== "string"
    ) {
      continue;
    }

    validItems.push({
      title,
      link,
      description,
      pubDate,
    });
  }

  return {
    channel: {
      title,
      link,
      description,
      item: validItems,
    },
  };
}
