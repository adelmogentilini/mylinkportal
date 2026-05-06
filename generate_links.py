import json
import os
from datetime import date

def infer_info(url):
    # Determine platform
    if 'tiktok.com' in url:
        platform = 'TikTok'
        title = 'TikTok Video'
        category = 'Entertainment'
    elif 'instagram.com' in url:
        platform = 'Instagram'
        if '/reel/' in url:
            title = 'Instagram Reel'
        else:
            title = 'Instagram Post'
        category = 'Social Media'
    elif 'facebook.com' in url:
        platform = 'Facebook'
        title = 'Facebook Share'
        category = 'Social Media'
    else:
        platform = 'Unknown'
        title = url
        category = 'General'
    
    return {
        'title': title,
        'category': category,
        'source': platform,
        'author': 'unknown',
        'description': f'Link from {platform}',
        'tags': ['AUTO']
    }

def main():
    txt_path = os.path.join('data', 'fromwhatsup.txt')
    with open(txt_path, 'r') as f:
        lines = f.read().strip().splitlines()
    
    links = []
    today = date.today().isoformat()
    for i, url in enumerate(lines, start=1):
        info = infer_info(url.strip())
        link_obj = {
            'id': f'link-{i}',
            'title': info['title'],
            'url': url.strip(),
            'category': info['category'],
            'source': info['source'],
            'author': info['author'],
            'description': info['description'],
            'tags': info['tags'],
            'dateAdded': today
        }
        links.append(link_obj)
    
    output = {'links': links}
    out_path = os.path.join('data', 'ad_link.json')
    with open(out_path, 'w') as f:
        json.dump(output, f, indent=2)
    print(f'Generated {len(links)} links in {out_path}')

if __name__ == '__main__':
    main()