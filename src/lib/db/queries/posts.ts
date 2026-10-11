import { desc, eq } from "drizzle-orm";
import { db } from "../index.js";
import { posts, feeds, feedFollows } from "../schema.js";

export async function createPost(
  title: string,
  url: string,
  description: string,
  publishedAt: Date,
  feedId: string,
) {
  const [post] = await db
    .insert(posts)
    .values({
      title,
      url,
      description,
      publishedAt,
      feedId,
    })
    .onConflictDoNothing({ target: posts.url })
    .returning();

  return post;
}

export async function getPostsForUser(
  userId: string,
  limit: number,
) {
  return await db
    .select({
      id: posts.id,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      title: posts.title,
      url: posts.url,
      description: posts.description,
      publishedAt: posts.publishedAt,
      feedId: posts.feedId,
      feedName: feeds.name,
    })
    .from(posts)
    .innerJoin(feeds, eq(posts.feedId, feeds.id))
    .innerJoin(feedFollows, eq(feedFollows.feedId, feeds.id))
    .where(eq(feedFollows.userId, userId))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}