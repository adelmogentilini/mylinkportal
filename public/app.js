function portalApp() {
  return {
    allLinks: [],
    displayedLinks: [],
    filters: {
      categories: [],
      sources: [],
      authors: [],
      tags: []
    },
    search: '',
    selectedCategory: '',
    selectedSource: '',
    selectedAuthor: '',
    selectedTag: '',

    async init() {
      await this.loadFilters();
      await this.loadLinks();
    },

    async loadFilters() {
      try {
        const response = await fetch('/api/filters');
        this.filters = await response.json();
      } catch (err) {
        console.error('Error loading filters:', err);
      }
    },

    async loadLinks() {
      try {
        const response = await fetch('/api/links');
        this.allLinks = await response.json();
        this.filterLinks();
      } catch (err) {
        console.error('Error loading links:', err);
      }
    },

    filterLinks() {
      let filtered = [...this.allLinks];

      // Apply category filter
      if (this.selectedCategory) {
        filtered = filtered.filter(l =>
          l.category && l.category.toLowerCase() === this.selectedCategory.toLowerCase()
        );
      }

      // Apply source filter
      if (this.selectedSource) {
        filtered = filtered.filter(l =>
          l.source && l.source.toLowerCase() === this.selectedSource.toLowerCase()
        );
      }

      // Apply author filter
      if (this.selectedAuthor) {
        filtered = filtered.filter(l =>
          l.author && l.author.toLowerCase() === this.selectedAuthor.toLowerCase()
        );
      }

      // Apply tag filter
      if (this.selectedTag) {
        filtered = filtered.filter(l =>
          l.tags && l.tags.map(t => t.toLowerCase()).includes(this.selectedTag.toLowerCase())
        );
      }

      // Apply search filter
      if (this.search) {
        const searchLower = this.search.toLowerCase();
        filtered = filtered.filter(l =>
          (l.title && l.title.toLowerCase().includes(searchLower)) ||
          (l.description && l.description.toLowerCase().includes(searchLower))
        );
      }

      this.displayedLinks = filtered;
    },

    resetFilters() {
      this.search = '';
      this.selectedCategory = '';
      this.selectedSource = '';
      this.selectedAuthor = '';
      this.selectedTag = '';
      this.filterLinks();
    },

    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };
}
