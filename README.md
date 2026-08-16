# Portal - Link Navigation Hub

A beautiful, self-contained server that creates an engaging navigation portal from links stored in JSON files.

## Features

- 🎨 Modern, responsive UI with dark theme
- 🔍 Search links by title or description
- 🏷️ Filter by tags (platform/source included as just another tag)
- 📁 Multiple JSON files support (no merge conflicts)
- 🌐 Self-contained Express server
- 📱 Mobile-friendly design
- 🔗 Quick copy-to-clipboard functionality

## Setup

### Installation

```bash
npm install
```

### Login

The UI is protected by a login page (`public/login.html`) with credentials read from env vars
`PORTAL_USER` / `PORTAL_PASSWORD` (defaults: `admin` / `portal2026`). Copy `.env.example` to
`.env` and set your own before deploying anywhere public.

### Running Locally

```bash
npm start
```

Then open `http://localhost:3000` in your browser and log in.

## Adding Links

Create JSON files in the `data/` folder. Each file should follow this structure:

```json
{
  "links": [
    {
      "id": "unique-id",
      "title": "Link Title",
      "url": "https://example.com",
      "description": "Brief description of the link",
      "tags": ["tag1", "tag2"],
      "dateAdded": "2026-05-06"
    }
  ]
}
```

### Required Fields
- `url` - The actual link
- `title` - Display name

### Optional Fields
- `id` - Unique identifier (auto-generated if not provided)
- `description` - Short description
- `tags` - Array of tags; the first tag doubles as the link's primary topic for grouping in
  the UI. There's no separate `source`/platform field — if you want it visible, add it as a
  tag (e.g. `"TikTok"`), same as the `POST /api/links` endpoint does automatically
- `dateAdded` - When you added the link

## File Organization

Suggested structure to avoid merge conflicts:

```
data/
├── programming.json
├── design.json
├── tutorials.json
├── resources.json
└── ...
```

One person can maintain each file independently!

## Deployment

### GitHub Pages (Static)

1. Initialize git:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Build and push to GitHub

### Vercel / Railway (Recommended)

1. Push to GitHub
2. Connect to Vercel or Railway
3. Set build command: `npm install`
4. Set start command: `npm start`

## API Endpoints

### Get All Links
```
GET /api/links
```

### Add a Link
```
POST /api/links
Content-Type: application/json

{ "url": "https://..." }
```
Only `url` is required. The server tries to fill in the rest from the link itself:
- the platform is inferred from the domain (TikTok, Instagram, Facebook, YouTube, X, ...)
  and added as a tag (not a separate field)
- `title`/`description` are read from the page's `og:title`/`og:description` if reachable
- topic `tags` are guessed from that text via a keyword list; if no topic can be established,
  `tags` is set to `["DACLASSIFICARE"]` so it can be reviewed and reclassified later

You can override any inferred field by passing `title`, `description` or `tags` (array)
in the request body. New links are appended to `data/ad_link.json`.

### Update a Link
```
PUT /api/links/:id
Content-Type: application/json

{ "title": "...", "description": "...", "tags": ["..."] }
```
Any subset of `title`, `description`, `tags` can be sent. Used by the UI's edit-title,
edit-description, edit-tags and title/description swap actions.

### Delete a Link
```
DELETE /api/links/:id
```
Used by the UI's 🗑️ button (asks for confirmation before calling this).

### Query Parameters
- `tag=javascript` - Filter by tag
- `search=query` - Search by title/description

### Example
```
GET /api/links?tag=AI&search=prompt
```

### Get Available Filters
```
GET /api/filters
```

Returns:
```json
{
  "tags": ["javascript", "design", "tutorial"]
}
```

## Telegram Bot

Forward a link to a Telegram bot and it gets added exactly as if you'd pasted it in the
"Add link" form — same metadata inference, same `data/ad_link.json`.

### Setup

1. Talk to [@BotFather](https://t.me/BotFather) on Telegram, run `/newbot`, and copy the token
   it gives you.
2. Copy `.env.example` to `.env` and fill in:
   - `TELEGRAM_BOT_TOKEN` - the token from BotFather
   - `PORTAL_BOT_TOKEN` - any random secret, e.g. generate one with
     `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`.
     Must match between the server and the bot (both read it from `.env`).
   - `TELEGRAM_ALLOWED_CHAT_IDS` (optional) - comma-separated chat ids allowed to add links;
     leave empty while testing, then lock it down once the bot is public
3. Start the server (`npm start`) and, in another terminal, the bot:
   ```bash
   npm run bot
   ```
4. Message your bot a link on Telegram — it replies with the title it saved, or an error.

The bot only needs to run somewhere that can reach the portal server's `PORTAL_API_URL`
(default `http://localhost:3000`); it uses long-polling, so it does **not** need to be
publicly reachable itself, even after the portal is deployed online.

## Architecture

- **server.js** - Express.js backend
  - Reads all JSON files from `data/` folder
  - Provides filtering API
  - Serves static frontend

- **public/index.html** - HTML UI with Tailwind CSS
- **public/app.js** - Alpine.js frontend logic
- **public/login.html** - Login page
- **telegram-bot.js** - Optional Telegram bot that forwards links to `POST /api/links`
- **data/*** - Your link collections

## Tips

- Keep each JSON file focused on a theme/category
- Use consistent metadata across files
- The server automatically detects new/updated JSON files
- No database needed - everything is file-based and git-friendly

## License

MIT
