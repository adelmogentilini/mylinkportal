function portalApp() {
  return {
    allLinks: [],
    displayedLinks: [],
    filters: {
      tags: []
    },
    search: '',
    selectedTag: '',
    newLinkUrl: '',
    newLinkDescription: '',
    adding: false,

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

    async addLink() {
      if (!this.newLinkUrl || this.adding) return;
      this.adding = true;
      try {
        const response = await fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: this.newLinkUrl,
            description: this.newLinkDescription || undefined
          })
        });

        if (response.ok) {
          const newLink = await response.json();
          this.allLinks.unshift(newLink);
          this.newLinkUrl = '';
          this.newLinkDescription = '';
          this.filterLinks();
          await this.loadFilters();
        } else {
          const err = await response.json().catch(() => ({}));
          alert(`Errore aggiunta link: ${err.error || response.status}`);
        }
      } catch (err) {
        console.error('Error adding link:', err);
        alert('Errore aggiunta link');
      } finally {
        this.adding = false;
      }
    },

    resetFilters() {
      this.search = '';
      this.selectedTag = '';
      this.filterLinks();
    },

    selectTag(tag) {
      this.selectedTag = this.selectedTag === tag ? '' : tag;
      this.filterLinks();
    },

    tagCounts() {
      const counts = {};
      this.allLinks.forEach(l => (l.tags || []).forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      }));
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    },

    groupedLinks() {
      const order = this.tagCounts().map(t => t.name);
      const groups = {};
      this.displayedLinks.forEach(l => {
        const tag = (l.tags && l.tags[0]) || 'Untagged';
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(l);
      });
      return order
        .filter(tag => groups[tag])
        .map(tag => ({ tag, links: groups[tag] }));
    },

    sourceIcon(tags) {
      const icons = {
        tiktok: '🎵',
        instagram: '📸',
        facebook: '👥',
        threads: '🧵',
        youtube: '▶️',
        x: '🐦',
        linkedin: '💼',
        reddit: '👽'
      };
      const match = (tags || []).find(t => icons[t.toLowerCase()]);
      return match ? icons[match.toLowerCase()] : '🔗';
    },

     async copyToClipboard(text) {
       try {
         await navigator.clipboard.writeText(text);
         alert('Link copied to clipboard!');
       } catch (err) {
         console.error('Failed to copy:', err);
       }
     },

     async editTitle(linkId) {
       const link = this.allLinks.find(l => l.id === linkId);
       if (!link) return;

       const newTitle = prompt('Enter new title:', link.title || '');
       if (newTitle === null) return; // User cancelled

       try {
         const response = await fetch(`/api/links/${linkId}`, {
           method: 'PUT',
           headers: {
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({ title: newTitle })
         });

         if (response.ok) {
           link.title = newTitle;
           this.filterLinks();
         } else {
           alert('Failed to update title');
         }
       } catch (err) {
         console.error('Error updating title:', err);
         alert('Error updating title');
       }
     },

     async swapTitleDescription(linkId) {
       const link = this.allLinks.find(l => l.id === linkId);
       if (!link) return;

       const newTitle = link.description || '';
       const newDescription = link.title || '';

       try {
         const response = await fetch(`/api/links/${linkId}`, {
           method: 'PUT',
           headers: {
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({ title: newTitle, description: newDescription })
         });

         if (response.ok) {
           link.title = newTitle;
           link.description = newDescription;
           this.filterLinks();
         } else {
           alert('Failed to swap title/description');
         }
       } catch (err) {
         console.error('Error swapping title/description:', err);
         alert('Error swapping title/description');
       }
     },

     async editDescription(linkId) {
       const link = this.allLinks.find(l => l.id === linkId);
       if (!link) return;

       const newDescription = prompt('Enter new description:', link.description || '');
       if (newDescription === null) return; // User cancelled

       try {
         const response = await fetch(`/api/links/${linkId}`, {
           method: 'PUT',
           headers: {
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({ description: newDescription })
         });

         if (response.ok) {
           // Update the link in our local data
           link.description = newDescription;
           this.filterLinks(); // Refresh the displayed links
           alert('Description updated successfully!');
         } else {
           alert('Failed to update description');
         }
       } catch (err) {
         console.error('Error updating description:', err);
         alert('Error updating description');
       }
     },

     async deleteLink(linkId) {
       const link = this.allLinks.find(l => l.id === linkId);
       if (!link) return;

       const confirmed = confirm(`Eliminare il link "${link.title || link.url}"?`);
       if (!confirmed) return;

       try {
         const response = await fetch(`/api/links/${linkId}`, { method: 'DELETE' });

         if (response.status === 401) {
           window.location.href = '/login.html';
           return;
         }

         if (response.ok) {
           this.allLinks = this.allLinks.filter(l => l.id !== linkId);
           this.filterLinks();
           await this.loadFilters();
         } else {
           alert('Failed to delete link');
         }
       } catch (err) {
         console.error('Error deleting link:', err);
         alert('Error deleting link');
       }
     },

     async logout() {
       try {
         await fetch('/api/logout', { method: 'POST' });
       } catch (err) {
         console.error('Error logging out:', err);
       } finally {
         window.location.href = '/login.html';
       }
     },

     async editTags(linkId) {
       const link = this.allLinks.find(l => l.id === linkId);
       if (!link) return;

       const currentTags = link.tags ? link.tags.join(', ') : '';
       const newTags = prompt('Enter tags (comma-separated):', currentTags);
       if (newTags === null) return; // User cancelled

       const tagsArray = newTags
         .split(',')
         .map(tag => tag.trim())
         .filter(tag => tag.length > 0);

       try {
         const response = await fetch(`/api/links/${linkId}`, {
           method: 'PUT',
           headers: {
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({ tags: tagsArray })
         });

         if (response.ok) {
           // Update the link in our local data
           link.tags = tagsArray;
           this.filterLinks(); // Refresh the displayed links
           // Reload filters to update tag list
           await this.loadFilters();
           alert('Tags updated successfully!');
         } else {
           alert('Failed to update tags');
         }
       } catch (err) {
         console.error('Error updating tags:', err);
         alert('Error updating tags');
       }
     }
  };
}
