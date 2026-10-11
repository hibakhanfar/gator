import {
  getNextFeedToFetch,
  markFeedFetched,
} from "./db/queries/feeds.js";
import { createPost } from "./db/queries/posts.js";
import { fetchFeed } from "../rss/fetchFeed.js";

export async function scrapeFeeds(): Promise<void> {
  const feed = await getNextFeedToFetch();

  if (!feed) {
    console.log("no feed found to fetch");
    return;
  }

  console.log(`fetch feed: ${feed.name} (${feed.url})`);

  const rssFeed = await fetchFeed(feed.url);

  await markFeedFetched(feed.id);

  for (const item of rssFeed.channel.item) {
    const publishedAt = new Date(item.pubDate);

    if (Number.isNaN(publishedAt.getTime())) {
      console.warn(
        `skip postwith invalid publication date: ${item.title}`,
      );
      continue;
    }

    await createPost(
      item.title,
      item.link,
      item.description,
      publishedAt,
      feed.id,
    );
  }
}