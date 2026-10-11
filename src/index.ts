import { readConfig, setUser } from "./config.js";
import {
  createUser,
  getUser,
  getUsers,
  resetUsers,
} from "./lib/db/queries/users.js";
import { getFeedByURL, createFeed } from "./lib/db/queries/feeds.js";
import type { Feed, User } from "./lib/db/schema.js";

import { getFeeds } from "./lib/db/queries/feeds.js";

import {
  createFeedFollow,
  getFeedFollowsForUser,
  deleteFeedFollow,
} from "./lib/db/queries/feed_follows.js";
import { scrapeFeeds } from "./lib/aggregator.js";
import { getPostsForUser } from "./lib/db/queries/posts.js";
type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

type CommandsRegistry = Record<string, CommandHandler>;
async function handlerReset(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  await resetUsers();
  console.log("db_reset successfully");
}

async function handlerUsers(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const users = await getUsers();
  const currentUserName = readConfig().currentUserName;

  for (const user of users) {
    if (user.name === currentUserName) {
      console.log(`* ${user.name} (current)`);
    } else {
      console.log(`* ${user.name}`);
    }
  }
}
function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
): void {
  registry[cmdName] = handler;
}

async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const handler = registry[cmdName];

  if (!handler) {
    throw new Error(`command doesn't found: ${cmdName}`);
  }

  await handler(cmdName, ...args);
}
async function handlerLogin(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("A username is required");
  }

  const username = args[0];
  const user = await getUser(username);

  if (!user) {
    throw new Error("User does not exist");
  }

  setUser(readConfig(), username);
  console.log(`user has become to ${username}`);
}

async function handlerRegister(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("A username is required");
  }

  const username = args[0];
  const user = await getUser(username);

  if (user) {
    throw new Error("User already exists");
  }

  const newUser = await createUser(username);

  setUser(readConfig(), username);

  console.log(`User ${username} created successfully`);
  console.log(newUser);
}


function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  if (!match) {
    throw new Error(
      "invalid durationu se  value like 500ms, 1s, 1m, or 1h",
    );
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return amount;
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    default:
      throw new Error("unsupported duration unit");
  }
}

function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h${minutes}m${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m${seconds}s`;
  }

  return `${seconds}s`;
}

function handleError(err: unknown): void {
  console.error(err);
}

async function handlerAgg(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length !== 1) {
    throw new Error("the agg command require duration argument");
  }

  const timeBetweenRequests = parseDuration(args[0]);

  if (timeBetweenRequests <= 0) {
    throw new Error("duration must greater than 0");
  }

  console.log(
    `collecting feed every ${formatDuration(timeBetweenRequests)}`,
  );

  scrapeFeeds().catch(handleError);

  const interval = setInterval(() => {
    scrapeFeeds().catch(handleError);
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("shutting down feed aggregator");
      clearInterval(interval);
      resolve();
    });
  });
}






function printFeed(feed: Feed, user: User): void {
  console.log("feed created successfully");
  console.log(`  ID: ${feed.id}`);
  console.log(`  Created At: ${feed.createdAt}`);
  console.log(`  Updated At: ${feed.updatedAt}`);
  console.log(`  Name: ${feed.name}`);
  console.log(`  URL: ${feed.url}`);
  console.log(`  User: ${user.name}`);
}

async function handlerAddFeed(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 2) {
    throw new Error("Feed name and URL are required");
  }



  const feed = await createFeed(args[0], args[1], user.id);

  const feedFollow = await createFeedFollow(user.id, feed.id);
printFeedFollow(feedFollow);
}


async function handlerFeeds(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length > 0) {
    throw new Error("the feed_command take no arguments");
  }

  const feeds = await getFeeds();

  for (const feed of feeds) {
    console.log(`* ${feed.name} (${feed.url}) by ${feed.userName}`);
  }
}

function printFeedFollow(feedFollow: {
  userName: string;
  feedName: string;
}): void {
  console.log(`Feed ${feedFollow.feedName} followed by ${feedFollow.userName}`);
}




async function handlerFollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void>   {
  if (args.length !== 1) {
    throw new Error("this command require feed URL");
  }

  const feed = await getFeedByURL(args[0]);

  if (!feed) {
    throw new Error("feed doesn't found");
  }

  const feedFollow = await createFeedFollow(user.id, feed.id);

  printFeedFollow(feedFollow);
}


async function handlerFollowing(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length > 0) {
    throw new Error("the follow command take no argument");
  }

 

  const feedFollows = await getFeedFollowsForUser(user.id);

  console.log(`Feeds followed by ${user.name}:`);

  for (const feedFollow of feedFollows) {
    console.log(`* ${feedFollow.feedName}`);
  }
}

function middlewareLoggedIn(
  handler: UserCommandHandler,
): CommandHandler {
  return async (cmdName, ...args) => {
    const currentUserName = readConfig().currentUserName;

    if (!currentUserName) {
      throw new Error("no user  currently logged ");
    }

    const user = await getUser(currentUserName);

    if (!user) {
      throw new Error(`user ${currentUserName} doesn't found`);
    }

    await handler(cmdName, user, ...args);
  };
}



async function handlerUnfollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length !== 1) {
    throw new Error("the unfollow command requires  feed url");
  }

  await deleteFeedFollow(user.id, args[0]);

  console.log("feed unfollow successfully");
}

async function handlerBrowse(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length > 1) {
    throw new Error("browse accept  most one limit argument");
  }

  const limit = args.length === 0 ? 2 : Number(args[0]);

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error("Limit must be a positive integer");
  }

  const posts = await getPostsForUser(user.id, limit);

  if (posts.length === 0) {
    console.log("no post found follow some feed first");
    return;
  }

  for (const post of posts) {
    console.log(`title: ${post.title}`);
    console.log(`URl: ${post.url}`);
    console.log(`feed: ${post.feedName}`);
    console.log(`published: ${post.publishedAt.toISOString()}`);
    console.log(`description: ${post.description}`);
    console.log("---");
  }
}

async function main(): Promise<void> {
  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);


  registerCommand(registry, "reset", handlerReset);
registerCommand(registry, "users", handlerUsers);
registerCommand(registry, "agg", handlerAgg);

registerCommand(registry, "feeds", handlerFeeds);
registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
registerCommand(
  registry,
  "unfollow",
  middlewareLoggedIn(handlerUnfollow),
); 

registerCommand(
  registry,
  "browse",
  middlewareLoggedIn(handlerBrowse),
);

 const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("does not eough argumentprovided");
    process.exit(1);
  }

  const cmdName = args[0];
  const cmdArgs = args.slice(1);

  try {
    await runCommand(registry, cmdName, ...cmdArgs);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
  process.exit(0);
}


main();
