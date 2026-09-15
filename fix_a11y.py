import os
import glob

def fix_headings(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace <span class="section-label" ...> with <h2 class="section-label" ...>
    # and </span> with </h2> ONLY if they match the section label.
    # Actually, a simple regex is better.
    import re
    # We find <span class="section-label" ...>...</span>
    content = re.sub(r'<span (class="section-label"[^>]*)>(.*?)</span>', r'<h2 \1>\2</h2>', content)
    
    # Check if there are other similar spans, like <span class="section-label">
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

for html_file in glob.glob('*.html'):
    fix_headings(html_file)

print("Headings fixed in all HTML files.")
