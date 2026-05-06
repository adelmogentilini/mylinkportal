# Portal - Link Navigation Hub

A beautiful, self-contained server that creates an engaging navigation portal from links stored in JSON files.

## Features

- 🎨 Modern, responsive UI with dark theme
- 🔍 Search links by title or description
- 🏷️ Filter by category, source, author, and tags
- 📁 Multiple JSON files support (no merge conflicts)
- 🌐 Self-contained Express server
- 📱 Mobile-friendly design
- 🔗 Quick copy-to-clipboard functionality

## Setup

### Installation

```bash
npm install
```

### Running Locally

```bash
npm start
```

Then open `http://localhost:3000` in your browser.

## Adding Links

Create JSON files in the `data/` folder. Each file should follow this structure:

```json
{
  "links": [
    {
      "id": "unique-id",
      "title": "Link Title",
      "url": "https://example.com",
      "category": "Programming",
      "source": "TikTok",
      "author": "creator_name",
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
- `category` - Link category (e.g., "Programming", "Design")
- `source` - Where you found it (e.g., "TikTok", "Instagram", "Direct URL")
- `author` - Creator/author name
- `description` - Short description
- `tags` - Array of tags for additional filtering
- `dateAdded` - When you added the link
- `rating` - Optional rating (1-5)

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

### Query Parameters
- `category=Programming` - Filter by category
- `source=TikTok` - Filter by source
- `author=creator_name` - Filter by author
- `tag=javascript` - Filter by tag
- `search=query` - Search by title/description

### Example
```
GET /api/links?category=Programming&search=react
```

### Get Available Filters
```
GET /api/filters
```

Returns:
```json
{
  "categories": ["Design", "Programming"],
  "sources": ["Instagram", "TikTok", "YouTube"],
  "authors": ["creator1", "creator2"],
  "tags": ["javascript", "design", "tutorial"]
}
```

## Architecture

- **server.js** - Express.js backend
  - Reads all JSON files from `data/` folder
  - Provides filtering API
  - Serves static frontend

- **public/index.html** - HTML UI with Tailwind CSS
- **public/app.js** - Alpine.js frontend logic
- **data/*** - Your link collections

## Tips

- Keep each JSON file focused on a theme/category
- Use consistent metadata across files
- The server automatically detects new/updated JSON files
- No database needed - everything is file-based and git-friendly

## License

MIT
