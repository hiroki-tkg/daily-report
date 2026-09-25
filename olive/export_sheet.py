"""上場一覧を Google スプレッドシートに書き込む。

売立日ごとのタブ（例: 2026-09-28(月)）に明細を書き、「推移」タブに1日1行の集計を足す。
同じ売立日を再実行したときは、そのタブと推移の行を上書きする。

書き込みはスプレッドシート側の Apps Script（apps_script/Code.gs）が受ける。

環境変数:
    SHEET_WEBHOOK_URL  Apps Script のウェブアプリ URL
    SHEET_TOKEN        Apps Script のスクリプトプロパティ TOKEN と同じ値

使い方:
    python export_sheet.py html/20260928_p*.html
"""
import argparse
import datetime as dt
import os
import sys

import requests

from parse_offer import load_rows

WEEKDAYS = "月火水木金土日"
JST = dt.timezone(dt.timedelta(hours=9))


def sale_label(bdat):
    d = dt.datetime.strptime(bdat, "%Y%m%d").date()
    return f"{d:%Y-%m-%d}({WEEKDAYS[d.weekday()]})"


def share(part, total):
    return round(part / total, 4) if total else 0


def build_payload(rows):
    for r in rows:
        r["本数"] = r["入数"] * r["申込可能口数"]
    label = sale_label(rows[0]["売立日"])
    header = list(rows[0].keys())
    detail = [header] + [[r[k] for k in header] for r in rows]

    def stems(key, value):
        return sum(r["本数"] for r in rows if r[key] == value)

    total = sum(r["本数"] for r in rows)
    domestic, imported = stems("国産/外国産", "国産"), stems("国産/外国産", "外国産")
    classic, yms = stems("出荷者", "クラシック"), stems("出荷者", "YMS")
    summary_header = [
        "売立日", "取得日時", "行数", "総本数", "国産本数", "外国産本数", "外国産比率",
        "クラシック本数", "クラシック比率", "YMS本数", "YMS比率",
    ]
    summary = [
        label, dt.datetime.now(JST).strftime("%Y-%m-%d %H:%M"), len(rows), total,
        domestic, imported, share(imported, total),
        classic, share(classic, total), yms, share(yms, total),
    ]
    return {"sheet": label, "rows": detail, "summary_header": summary_header, "summary": summary}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("inputs", nargs="+")
    a = ap.parse_args()
    url, token = os.environ.get("SHEET_WEBHOOK_URL"), os.environ.get("SHEET_TOKEN")
    if not url or not token:
        sys.exit("環境変数が未設定: SHEET_WEBHOOK_URL / SHEET_TOKEN")

    rows = load_rows(a.inputs)
    if not rows:
        sys.exit("商品行が見つかりませんでした")
    payload = build_payload(rows)
    r = requests.post(url, json={"token": token, **payload}, timeout=60)
    r.raise_for_status()
    if "json" not in r.headers.get("Content-Type", ""):
        sys.exit("スプレッドシートから想定外の応答（ログイン画面など）。"
                 "ウェブアプリの「アクセスできるユーザー」が「全員」になっているか確認")
    res = r.json()
    if not res.get("ok"):
        sys.exit(f"スプレッドシートへの書き込みに失敗: {res}")
    print(f"{payload['sheet']}: {len(rows)} 行を書き込み")


if __name__ == "__main__":
    main()
