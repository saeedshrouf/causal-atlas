from pathlib import Path
import base64
import re

root = Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text()
css = (root / "assets/styles.css").read_text()


def inline_font(match):
    font = root / "assets" / match[1]
    data = base64.b64encode(font.read_bytes()).decode()
    return f'url("data:font/ttf;base64,{data}")'


css = re.sub(r'url\("?(fonts/[^\)\"]+)"?\)', inline_font, css)
modules = [
    "site.config.js",
    "assets/js/text.js",
    "assets/js/search.js",
    "assets/js/icons.js",
    "assets/js/catalog-view.js",
    "assets/js/footer.js",
    "assets/js/guide.js",
    "assets/js/app.js",
]
parts = []
for name in modules:
    source = (root / name).read_text()
    source = re.sub(r'^import\b.*?;\s*', '', source, flags=re.M | re.S)
    source = re.sub(r'\bexport\s+', '', source)
    source = source.replace('import.meta.url', 'document.baseURI')
    parts.append(source)

catalog = (root / "data/catalog.json").read_text().replace('</', '<\\/')
html = re.sub(r'<link rel="stylesheet" href="assets/styles.css"\s*/?>', lambda _: f'<style>{css}</style>', html)
theme = (root / "assets/js/theme.js").read_text()
html = html.replace('<script src="assets/js/theme.js"></script>', '<script>' + theme + '</script>')
html = re.sub(r'<script type="module" src="assets/js/app.js"></script>', '', html)
script = '\n'.join(parts).replace('</script', '<\\/script')
html = html.replace('</body>', f'<script type="application/json" id="catalog-data">{catalog}</script>\n<script>\n{{\n{script}\n}}\n</script>\n</body>')
notices = '\n\n'.join(path.read_text() for path in sorted((root / 'licenses').glob('*.txt')))
html = html.replace('</body>', '<!-- Third-party asset licenses\n' + notices + '\n-->\n</body>')
output = root / "dist" / "Causal_Atlas_Preview.html"
output.parent.mkdir(exist_ok=True)
output.write_text(html)
print(output)
