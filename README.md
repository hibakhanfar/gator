# Gator

Gator is a command-line RSS feed aggregator written in TypeScript, Node.js, PostgreSQL, and Drizzle ORM. It allows you to register, follow RSS feeds, automatically retrieve new posts and browse the latest articles right from the terminal

## Prerequisites

before running Gator make sure you have:

- [Node.js](https://nodejs.org/) installed.
- [PostgreSQL](https://www.postgresql.org/) installed and running.
- npm, which comes with Node.js.
- Git installed.

## Installation

1. Clone the repository:

   ```bash
   git clone <your-github-repository-url>
   cd gator
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a PostgreSQL database named `gator`.

4. Create a configuration file named `.gatorconfig.json` in your home directory.

   on linux or WSL the file should be located at `~/.gatorconfig.json`.

   Add the following configuration, replacing the database credentials with your own:

   ```json
   {
     "db_url": "postgres://username:password@localhost:5432/gator?sslmode=disable",
     "current_user_name": ""
   }
   ```

   Make sure the database URL matches your PostgreSQL setup.

5. generate and run the db migration:

   ```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

   if the repository already contains generated migrations, you generally jut need run `npx drizzle-kit migrate` to apply them.

## Usage

run command from the project root using:

```bash
npm run start <command> [arguments]
```

### Available Commands

| Command | Description |
|---|---|
| `register <username>` | register new user and set them as the current user |
| `login <username>` | switch to existing user |
| `users` | list all registered users |
| `reset` | reset the users db. use with caution |
| `addfeed <name> <url>` | Add an RSS feed and automatically follow it |
| `feeds` | list available rss feed |
| `follow <url>` | follow existing RSS feed |
| `following` | list the feed followed by the current user |
| `unfollow <url>` | unfollow an RSS fee/d |
| `agg <duration>` | continuously fetch feed at the specified interval |
| `browse [limit]` | browse the latest post from followed feed. default to 2 post |

### Example

register user:

```bash
npm run start register hiba
```

add an RSS feed:

```bash
npm run start addfeed "Hacker News RSS" https://hnrss.org/newest
```

Browse the latest two posts:

```bash
npm run start browse
```

browse the latest five posts:

```bash
npm run start browse 5
```

### Fetching Posts

start the aggregator with 10s interval:

```bash
npm run start agg 10s
```

gator fetchs feed and saves their posts to PostgreSQL stop the aggregator with `Ctrl+C`.

Supported duration units include:

- `500ms` — 500 milliseconds
- `10s` — 10 seconds
- `1m` — 1 minute
- `1h` — 1 hour

## How It Works

- **RSS parsing:** retrieves and parses RSS feed
- **Post storage:** stores posts in postgresql and avoids inserting duplicate post URL
- **Feed following:** associates users with the feeds they want to read
- **Aggregation:** fetches feeds in the background at a configurable interval
- **Browsing:** displays the newest post from the feeds followed by the current user

## Technologies

- TypeScript
- Node.js
- PostgreSQL
- Drizzle ORM
- `fast-xml-parser`
- `tsx`

