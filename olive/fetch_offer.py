"""OLIVE+ にログインして上場一覧の HTML を全ページ保存する。

環境変数:
    OLIVE_ID        ログインID (euiidcd)
    OLIVE_PASSWORD  パスワード
    OLIVE_BISC      買参人番号の前半 (例: 8472)
    OLIVE_BISE      買参人番号の後半 (例: 00)

使い方:
    python fetch_offer.py --date 20260928 --out html/
    python parse_offer.py html/20260928_p*.html -o 20260928.xlsx
"""
import argparse
import datetime as dt
import json
import os
import re
import sys
import time
from pathlib import Path

import requests

BASE = "https://smp-olive.otakaki.co.jp"
SALE_WEEKDAYS = (0, 2, 4)  # 月・水・金
JST = dt.timezone(dt.timedelta(hours=9))


def next_sale_day(today=None):
    d = (today or dt.datetime.now(JST).date()) + dt.timedelta(days=1)
    while d.weekday() not in SALE_WEEKDAYS:
        d += dt.timedelta(days=1)
    return d.strftime("%Y%m%d")


def csrf_token(html):
    m = re.search(r'name="_token"\s+value="([^"]+)"', html) or re.search(
        r'name="csrf-token"\s+content="([^"]+)"', html
    )
    if not m:
        sys.exit("CSRFトークンが見つかりません（画面構成が変わった可能性）")
    return m.group(1)


def login(s, user, password):
    page = s.get(f"{BASE}/login", params={"sys": "OTA"}, timeout=30)
    page.raise_for_status()
    r = s.post(
        f"{BASE}/login",
        data={"_token": csrf_token(page.text), "euiidcd": user, "password": password, "sys": "OTA"},
        timeout=30,
    )
    r.raise_for_status()
    if "/login" in r.url:
        sys.exit("ログインに失敗しました（ID・パスワードを確認）")
    return r


def open_list(s, bdat, bisc, bise, token):
    search = {
        "search_word": "", "search_kbn": "0", "search_sort": "0", "search_stim": "ALL",
        "search_tank_min": "", "search_tank_max": "", "search_kosu": "1",
        "search_hin": {}, "search_ken": {}, "search_san": {}, "search_clr": {},
        "search_sbt": {}, "search_kun": {},
    }
    r = s.post(
        f"{BASE}/a_offer/detail",
        data={
            "_token": token, "bdat": bdat, "khcx": "", "bisc": bisc, "bise": bise,
            "nkcd": " " * 10, "show_type": "list",
            "search_item": json.dumps(search, ensure_ascii=False, separators=(",", ":")),
        },
        timeout=60,
    )
    r.raise_for_status()
    return r.text


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=None, help="売立日 YYYYMMDD（省略時は次の表日）")
    ap.add_argument("--out", default="html")
    ap.add_argument("--max-pages", type=int, default=50)
    a = ap.parse_args()

    env = {k: os.environ.get(k) for k in ("OLIVE_ID", "OLIVE_PASSWORD", "OLIVE_BISC", "OLIVE_BISE")}
    missing = [k for k, v in env.items() if not v]
    if missing:
        sys.exit(f"環境変数が未設定: {', '.join(missing)}")

    bdat = a.date or next_sale_day()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    s = requests.Session()
    s.headers["User-Agent"] = "Mozilla/5.0 (olive-offer-report)"
    main_page = login(s, env["OLIVE_ID"], env["OLIVE_PASSWORD"])

    html = open_list(s, bdat, env["OLIVE_BISC"], env["OLIVE_BISE"], csrf_token(main_page.text))
    total = re.search(r'jfe-text-12">(\d+)</span>', html)
    print(f"売立日 {bdat}: 検索結果 {total.group(1) if total else '?'} 件")

    page = 1
    while True:
        (out / f"{bdat}_p{page:02d}.html").write_text(html, encoding="utf-8")
        if 'rel="next"' not in html or page >= a.max_pages:
            break
        page += 1
        time.sleep(2)  # 相手サーバーに負荷をかけない
        r = s.get(f"{BASE}/a_offer/detail", params={"page": page}, timeout=60)
        r.raise_for_status()
        html = r.text
    print(f"{page} ページ保存 → {out}/")
    s.get(f"{BASE}/logout", timeout=30)


if __name__ == "__main__":
    main()
