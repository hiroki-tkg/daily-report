#!/usr/bin/env python3
"""
Post-process a pptxgenjs-generated .pptx so Japanese text uses the design-system
Japanese font instead of PowerPoint's default (游ゴシック).

pptxgenjs only writes <a:latin typeface="Century Gothic"/> on each run and leaves
the East-Asian (<a:ea>) font empty, so PowerPoint falls back to its default Japanese
font. This script:

  1. sets <a:ea typeface="Hiragino Sans"/> (from tokens.json font.japanese) on every run
     in slide, layout, master and notes XML (pptxgenjs writes the Latin font there too),
  2. sets the theme's major/minor fonts (latin + ea) to the design-system fonts,
  3. adds altLang="ja-JP" to run properties so spell-check / line-breaking treat
     the text as Japanese.

Usage: postprocess.py deck.pptx [--ja "Noto Sans JP"] [--latin "Century Gothic"]
Idempotent — safe to run twice.
"""
import json
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
TOKENS = ROOT / "design-system" / "tokens.json"


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    src = Path(args[0])
    tokens = json.loads(TOKENS.read_text(encoding="utf-8"))
    ja = tokens["font"]["japanese"]
    latin = tokens["font"]["latin"]
    if "--ja" in args:
        ja = args[args.index("--ja") + 1]
    if "--latin" in args:
        latin = args[args.index("--latin") + 1]

    ea_tag = f'<a:ea typeface="{ja}"/>'
    changed_runs = 0
    changed_parts = 0

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td) / "out.pptx"
        with zipfile.ZipFile(src) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                name = item.filename
                if name.startswith("ppt/") and name.endswith(".xml") and (
                    "/slides/" in name or "/slideLayouts/" in name or "/slideMasters/" in name or "/notesSlides/" in name
                ):
                    xml = data.decode("utf-8")
                    before = xml
                    # 1. pptxgenjs writes <a:ea typeface="<latin font>"/>: replace it with the Japanese font;
                    #    if a run has <a:latin> but no <a:ea>, insert one.
                    xml, n1 = re.subn(r'<a:ea typeface="(?!' + re.escape(ja) + r'")[^"]*"[^>]*/>', ea_tag, xml)
                    xml, n2 = re.subn(r'(<a:latin typeface="[^"]*"[^>]*/>)(?!<a:ea)', r"\1" + ea_tag, xml)
                    changed_runs += n1 + n2
                    # 3. altLang on run properties that declare lang but no altLang
                    xml = re.sub(r'(<a:(?:rPr|endParaRPr|defRPr)\b[^>]*\blang="[^"]*")(?![^>]*altLang)', r'\1 altLang="ja-JP"', xml)
                    if xml != before:
                        changed_parts += 1
                    data = xml.encode("utf-8")
                elif name.startswith("ppt/theme/") and name.endswith(".xml"):
                    xml = data.decode("utf-8")
                    # 2. theme fonts
                    def fix_font_scheme(m):
                        block = m.group(0)
                        block = re.sub(r'<a:latin typeface="[^"]*"', f'<a:latin typeface="{latin}"', block, count=1)
                        block = re.sub(r'<a:ea typeface="[^"]*"', f'<a:ea typeface="{ja}"', block, count=1)
                        return block
                    xml = re.sub(r"<a:majorFont>.*?</a:majorFont>", fix_font_scheme, xml, flags=re.S)
                    xml = re.sub(r"<a:minorFont>.*?</a:minorFont>", fix_font_scheme, xml, flags=re.S)
                    data = xml.encode("utf-8")
                    changed_parts += 1
                zout.writestr(item, data)
        shutil.move(str(tmp), str(src))
    print(f"[postprocess] {src.name}: ea font '{ja}' added to {changed_runs} runs across {changed_parts} parts; theme fonts set to '{latin}' / '{ja}'")


if __name__ == "__main__":
    main()
