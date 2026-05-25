import json
import re
from datetime import datetime

def extract_source_from_url(url):
    """Extract source (Instagram or Facebook) from URL"""
    if 'instagram.com' in url:
        return 'Instagram'
    elif 'facebook.com' in url:
        return 'Facebook'
    else:
        # Default fallback
        return 'Unknown'

def main():
    # Read the CSV file
    csv_file_path = 'data/fromwhatsup.txt'
    json_file_path = 'data/ad_link.json'
    
    # Read existing JSON data
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Process CSV file
    with open(csv_file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Get the next ID number
    existing_ids = [link['id'] for link in data['links']]
    max_id_num = 0
    for id_str in existing_ids:
        if id_str.startswith('link-'):
            try:
                num = int(id_str.split('-')[1])
                max_id_num = max(max_id_num, num)
            except ValueError:
                pass
    
    # Process each line
    for line_num, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            continue
            
        # Split by comma (CSV format)
        parts = [part.strip() for part in line.split(',')]
        
        if len(parts) >= 3:
            url = parts[0].strip()
            description = parts[1].strip()
            tag = parts[2].strip()
            
            # Remove quotes from tag if present
            if tag.startswith('"') and tag.endswith('"'):
                tag = tag[1:-1]
            
            # Determine source from URL
            source = extract_source_from_url(url)
            
            # Generate new ID
            max_id_num += 1
            new_id = f'link-{max_id_num}'
            
            # Create new link object
            new_link = {
                "id": new_id,
                "title": f"{source} Post",  # Generic title based on source
                "url": url,
                "category": tag,  # Use tag as category
                "source": source,
                "author": "unknown",
                "description": description,
                "tags": [tag],  # Tag as array
                "dateAdded": datetime.now().strftime('%Y-%m-%d')
            }
            
            # Add to links array
            data['links'].append(new_link)
            print(f"Added: {new_id} - {description} ({source})")
    
    # Write updated JSON back to file
    with open(json_file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    
    print(f"Successfully processed {len(lines)} lines from {csv_file_path}")

if __name__ == '__main__':
    main()