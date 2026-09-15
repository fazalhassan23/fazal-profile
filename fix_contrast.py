import glob
import re

def fix_html_vars(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix CSS var names
    content = content.replace('var(--bg-surface)', 'var(--surface)')
    content = content.replace('var(--border-color)', 'var(--border)')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

for html_file in glob.glob('*.html'):
    fix_html_vars(html_file)

print("HTML vars fixed.")

css_file = 'css/style.css'
with open(css_file, 'r', encoding='utf-8') as f:
    css_content = f.read()

# Fix dark mode --text-tertiary (around line 21, but using regex)
css_content = re.sub(r'(--text-tertiary:\s*)#8A8AA4;', r'\g<1>#A0A0B8;', css_content)

# Fix light mode --text-tertiary (around line 99)
css_content = re.sub(r'(--text-tertiary:\s*)#8888A0;', r'\g<1>#595973;', css_content)

with open(css_file, 'w', encoding='utf-8') as f:
    f.write(css_content)

print("CSS contrast fixed.")
