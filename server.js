const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Serve static files
app.use(express.static('public'));

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

  // Filter by category
  if (req.query.category) {
    links = links.filter(l =>
      l.category && l.category.toLowerCase() === req.query.category.toLowerCase()
    );
  }

  // Filter by source
  if (req.query.source) {
    links = links.filter(l =>
      l.source && l.source.toLowerCase() === req.query.source.toLowerCase()
    );
  }

  // Filter by author
  if (req.query.author) {
    links = links.filter(l =>
      l.author && l.author.toLowerCase() === req.query.author.toLowerCase()
    );
  }

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

// API endpoint to update a link (description and/or tags)
app.put('/api/links/:id', express.json(), (req, res) => {
  const linkId = req.params.id;
  const { description, tags } = req.body;

  // Validate input
  if (description === undefined && tags === undefined) {
    return res.status(400).json({ error: 'At least one field (description or tags) must be provided' });
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

  const categories = [...new Set(links.map(l => l.category).filter(Boolean))].sort();
  const sources = [...new Set(links.map(l => l.source).filter(Boolean))].sort();
  const authors = [...new Set(links.map(l => l.author).filter(Boolean))].sort();
  const tags = [...new Set(links.flatMap(l => l.tags || []))].sort();

  res.json({
    categories,
    sources,
    authors,
    tags
  });
});

app.listen(PORT, () => {
  console.log(`Portal server running at http://localhost:${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});
