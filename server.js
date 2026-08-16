const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const ADD_LINK_FILE = path.join(DATA_DIR, 'ad_link.json');

// Serve static files
app.use(express.static('public'));

// Known platforms, used to guess "source" and a default title from the URL alone
const SOURCE_PATTERNS = [
  { match: /tiktok\.com/i, source: 'TikTok', title: () => 'TikTok Video' },
  { match: /instagram\.com/i, source: 'Instagram', title: url => (/\/reel/i.test(url) ? 'Instagram Reel' : 'Instagram Post') },
  { match: /facebook\.com|fb\.watch/i, source: 'Facebook', title: () => 'Facebook Post' },
  { match: /threads\.(com|net)/i, source: 'Threads', title: () => 'Threads Post' },
  { match: /youtube\.com|youtu\.be/i, source: 'YouTube', title: () => 'YouTube Video' },
  { match: /twitter\.com|x\.com/i, source: 'X', title: () => 'X Post' },
  { match: /linkedin\.com/i, source: 'LinkedIn', title: () => 'LinkedIn Post' },
  { match: /reddit\.com/i, source: 'Reddit', title: () => 'Reddit Post' },
];

// Best-effort keyword -> tag mapping, based on the tags already used in data/*.json
const TAG_KEYWORDS = [
  { tags: ['Cucina'], keywords: ['ricetta', 'pizza', 'cucina', 'cibo', 'gelato', 'patate', 'pasta', 'dolce', 'dessert', 'food', 'recipe', 'merenda', 'piada'] },
  { tags: ['AI'], keywords: ['intelligenza artificiale', 'chatgpt', 'claude', 'prompt', 'modello ai', ' llm', 'openai', ' ai '] },
  { tags: ['Tecno'], keywords: ['tecnologia', 'trucco', 'telefono', 'smartphone', 'codice', 'gadget', 'iphone', 'android'] },
  { tags: ['Internet'], keywords: ['sito web', 'siti ', 'internet', 'password', 'sicurezza', 'browser', 'privacy', 'risorse online'] },
  { tags: ['Psyco'], keywords: ['mentale', 'psicologia', 'ansia', 'stress', 'benessere psic'] },
  { tags: ['Storia'], keywords: ['storia', 'romani', 'romana', 'antica', 'storico'] },
];

function inferSourceAndTitle(url) {
  for (const p of SOURCE_PATTERNS) {
    if (p.match.test(url)) {
      return { source: p.source, title: p.title(url) };
    }
  }
  let hostname = 'Unknown';
  try {
    hostname = new URL(url).hostname.replace(/^www\./, '') || 'Unknown';
  } catch (err) {
    // leave hostname as 'Unknown'
  }
  return { source: hostname, title: hostname !== 'Unknown' ? `${hostname} Link` : 'Unknown Link' };
}

function inferTags(text) {
  const haystack = ` ${(text || '').toLowerCase()} `;
  for (const entry of TAG_KEYWORDS) {
    if (entry.keywords.some(kw => haystack.includes(kw))) {
      return entry.tags;
    }
  }
  return null;
}

function extractMetaContent(html, property) {
  let re = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
  let m = html.match(re);
  if (m) return m[1];
  re = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`, 'i');
  m = html.match(re);
  return m ? m[1] : null;
}

// Best-effort fetch of the page itself, to try to extract a real title/description
// (source we can already infer from the URL, the topic is harder and may require this).
async function fetchLinkMetadata(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PortalBot/1.0)' }
    });
    clearTimeout(timeoutId);
    const html = await response.text();
    return {
      ogTitle: extractMetaContent(html, 'og:title'),
      ogDescription: extractMetaContent(html, 'og:description')
    };
  } catch (err) {
    return {};
  }
}

function generateNextLinkId() {
  const links = loadAllLinks();
  let max = 0;
  links.forEach(l => {
    if (l.id && l.id.startsWith('link-')) {
      const n = parseInt(l.id.split('-')[1], 10);
      if (!isNaN(n)) max = Math.max(max, n);
    }
  });
  return `link-${max + 1}`;
}

// Load all links from JSON files in data directory
function loadAllLinks() {
  const allLinks = [];

  if (!fs.existsSync(DATA_DIR)) {
    return allLinks;
  }

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

  files.forEach(file => {
    try {
      const filePath = path.join(DATA_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      if (data.links && Array.isArray(data.links)) {
        allLinks.push(...data.links);
      }
    } catch (err) {
      console.error(`Error reading ${file}:`, err.message);
    }
  });

  return allLinks;
}

// API endpoint to get links with optional filters
app.get('/api/links', (req, res) => {
  let links = loadAllLinks();

  // Filter by tag
  if (req.query.tag) {
    links = links.filter(l =>
      l.tags && l.tags.map(t => t.toLowerCase()).includes(req.query.tag.toLowerCase())
    );
  }

  // Search by title or description
  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    links = links.filter(l =>
      (l.title && l.title.toLowerCase().includes(search)) ||
      (l.description && l.description.toLowerCase().includes(search))
    );
  }

  res.json(links);
});

// API endpoint to add a new link, inferring metadata from the URL itself where possible
app.post('/api/links', express.json(), async (req, res) => {
  const body = req.body || {};
  const url = typeof body.url === 'string' ? body.url.trim() : '';

  if (!url) {
    return res.status(400).json({ error: 'Field "url" is required' });
  }
  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const { source, title: fallbackTitle } = inferSourceAndTitle(url);
  const meta = await fetchLinkMetadata(url);

  const title = body.title || meta.ogTitle || fallbackTitle;
  const description = body.description || meta.ogDescription || '';

  let tags = Array.isArray(body.tags) ? body.tags.filter(t => typeof t === 'string' && t.trim()) : [];

  if (tags.length === 0) {
    const inferred = inferTags(`${title} ${description}`);
    // Topic could not be established from the link itself
    tags = inferred ? [...inferred] : ['DACLASSIFICARE'];
  }

  // The source/platform isn't stored as its own field; it just becomes another tag
  if (source && source.toLowerCase() !== 'unknown' && !tags.some(t => t.toLowerCase() === source.toLowerCase())) {
    tags.push(source);
  }

  const newLink = {
    id: generateNextLinkId(),
    title,
    url,
    description: description || `Link from ${source}`,
    tags,
    dateAdded: new Date().toISOString().split('T')[0]
  };

  try {
    let data = { links: [] };
    if (fs.existsSync(ADD_LINK_FILE)) {
      data = JSON.parse(fs.readFileSync(ADD_LINK_FILE, 'utf8'));
      if (!Array.isArray(data.links)) data.links = [];
    }
    data.links.push(newLink);
    fs.writeFileSync(ADD_LINK_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving new link:', err.message);
    return res.status(500).json({ error: 'Failed to save link' });
  }

  res.status(201).json(newLink);
});

// API endpoint to update a link (title, description and/or tags)
app.put('/api/links/:id', express.json(), (req, res) => {
  const linkId = req.params.id;
  const { title, description, tags } = req.body;

  // Validate input
  if (title === undefined && description === undefined && tags === undefined) {
    return res.status(400).json({ error: 'At least one field (title, description or tags) must be provided' });
  }

  const dataDir = path.join(__dirname, 'data');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

  let updated = false;

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      if (!data.links || !Array.isArray(data.links)) {
        continue;
      }

      const linkIndex = data.links.findIndex(link => link.id === linkId);
      if (linkIndex === -1) {
        continue;
      }

      // Update the link
      if (title !== undefined) {
        data.links[linkIndex].title = title;
      }
      if (description !== undefined) {
        data.links[linkIndex].description = description;
      }
      if (tags !== undefined) {
        data.links[linkIndex].tags = tags;
      }

      // Write back to file
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      updated = true;
      break; // Exit loop after updating
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
      return res.status(500).json({ error: `Failed to process ${file}` });
    }
  }

  if (updated) {
    res.json({ message: 'Link updated successfully' });
  } else {
    res.status(404).json({ error: 'Link not found' });
  }
});

// API endpoint to get available filter options
app.get('/api/filters', (req, res) => {
  const links = loadAllLinks();

  const tags = [...new Set(links.flatMap(l => l.tags || []))].sort();

  res.json({ tags });
});

app.listen(PORT, () => {
  console.log(`Portal server running at http://localhost:${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});
