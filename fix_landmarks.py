import glob

def fix_landmarks(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Change <div class="page-wrapper"> to <main class="page-wrapper">
    content = content.replace('<div class="page-wrapper">', '<main class="page-wrapper">')
    # Change </div><!-- /page-wrapper --> to </main><!-- /page-wrapper -->
    content = content.replace('</div><!-- /page-wrapper -->', '</main><!-- /page-wrapper -->')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

for html_file in glob.glob('*.html'):
    fix_landmarks(html_file)

print("Landmarks fixed.")
