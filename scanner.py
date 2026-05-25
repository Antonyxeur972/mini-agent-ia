#!/usr/bin/env python3
# pip install yfinance pandas numpy rich

import argparse, json, os, sys, time, warnings, urllib.parse, urllib.request
from datetime import datetime
warnings.filterwarnings("ignore")

try:
    import numpy as np
    import pandas as pd
    import yfinance as yf
    from rich import box
    from rich.console import Console
    from rich.panel import Panel
    from rich.progress import BarColumn, Progress, SpinnerColumn, TextColumn
    from rich.table import Table
except ImportError:
    print("Lance d'abord: pip install yfinance pandas numpy rich")
    sys.exit(1)

console = Console()

# ╔══════════════════════════════════════════════════════════╗
# ║              ⚙️  CONFIG — REMPLIS ICI                   ║
# ╚══════════════════════════════════════════════════════════╝

TELEGRAM_TOKEN   = "COLLE_TON_TOKEN_ICI"       # ex: 7412853920:AAFxxx
TELEGRAM_CHAT_ID = "COLLE_TON_CHAT_ID_ICI"     # ex: 123456789  (@userinfobot pour le trouver)

WHATSAPP_PHONE   = "596XXXXXXXXX"              # ton numéro sans + (Martinique = 596...)
WHATSAPP_APIKEY  = "TON_APIKEY_CALLMEBOT"      # reçu par WhatsApp depuis +34 644 49 46 43

ALERT_SCORE_MIN  = 55     # score minimum pour notifier (0-100)
ALERT_DROP_MIN   = 5.0    # baisse minimum depuis le pic 20j (%)
MAX_ALERTS       = 3      # top N assets envoyés par message

TELEGRAM_ON      = True   # active/désactive Telegram
WHATSAPP_ON      = False  # active quand tu as ton apikey CallMeBot

# ╔══════════════════════════════════════════════════════════╗
# ║              📋  ASSETS E8-COMPATIBLE                   ║
# ╚══════════════════════════════════════════════════════════╝

ASSETS = {
    "Crypto": {
        "BTC-USD":"Bitcoin","ETH-USD":"Ethereum","SOL-USD":"Solana",
        "XRP-USD":"Ripple","BNB-USD":"BNB","DOGE-USD":"Dogecoin",
        "ADA-USD":"Cardano","AVAX-USD":"Avalanche","LINK-USD":"Chainlink","LTC-USD":"Litecoin",
    },
    "Indices": {
        "^GSPC":"S&P 500","^IXIC":"Nasdaq 100","^DJI":"Dow Jones","^RUT":"Russell 2000",
    },
    "Commodites": {
        "GC=F":"Gold","SI=F":"Silver","CL=F":"WTI Crude","BZ=F":"Brent Crude","NG=F":"Nat Gas",
    },
    "Forex": {
        "EURUSD=X":"EUR/USD","GBPUSD=X":"GBP/USD","USDJPY=X":"USD/JPY",
        "AUDUSD=X":"AUD/USD","GBPJPY=X":"GBP/JPY","USDCAD=X":"USD/CAD",
    },
}

# ╔══════════════════════════════════════════════════════════╗
# ║              📐  CALCULS TECHNIQUES                     ║
# ╚══════════════════════════════════════════════════════════╝

def rsi(s, p=14):
    d = s.diff()
    g = d.clip(lower=0).ewm(com=p-1, adjust=True).mean()
    l = (-d.clip(upper=0)).ewm(com=p-1, adjust=True).mean()
    return 100 - (100 / (1 + g / l.replace(0, np.nan)))

def atr(hi, lo, cl, p=14):
    tr = pd.DataFrame({
        "hl": hi - lo,
        "hc": (hi - cl.shift()).abs(),
        "lc": (lo - cl.shift()).abs(),
    }).max(axis=1)
    return tr.ewm(com=p-1, adjust=True).mean()

def bollinger_pos(s, p=20):
    mid = s.rolling(p).mean()
    std = s.rolling(p).std()
    pos = ((s - (mid - 2*std)) / (4*std).replace(0, np.nan)) * 100
    return pos.iloc[-1]

def rebound_score(rsi_v, drop, atr_p, dist_low, bb):
    s = 0
    if rsi_v < 25:   s += 30
    elif rsi_v < 30: s += 25
    elif rsi_v < 40: s += 18
    elif rsi_v < 50: s += 10
    elif rsi_v < 60: s += 4

    if drop > 25:    s += 25
    elif drop > 15:  s += 20
    elif drop > 10:  s += 14
    elif drop > 7:   s += 9
    elif drop > 4:   s += 5
    else:            s += 2

    if atr_p > 4:    s += 20
    elif atr_p > 3:  s += 16
    elif atr_p > 2:  s += 12
    elif atr_p > 1:  s += 7
    else:            s += 3

    if dist_low > 25:  s += 15
    elif dist_low > 15: s += 10
    elif dist_low > 8:  s += 5

    if pd.notna(bb):
        if bb < 15:   s += 10
        elif bb < 25: s += 7
        elif bb < 35: s += 3

    return min(int(s), 100)

# ╔══════════════════════════════════════════════════════════╗
# ║              🔍  ANALYSE PAR ASSET                      ║
# ╚══════════════════════════════════════════════════════════╝

def analyze(ticker, name, category):
    try:
        raw   = yf.download(ticker, period="3mo", interval="1d", progress=False, auto_adjust=True)
        raw1y = yf.download(ticker, period="1y",  interval="1d", progress=False, auto_adjust=True)
        if raw.empty or len(raw) < 21:
            return None
        if isinstance(raw.columns,   pd.MultiIndex): raw.columns   = raw.columns.get_level_values(0)
        if isinstance(raw1y.columns, pd.MultiIndex): raw1y.columns = raw1y.columns.get_level_values(0)

        cl, hi, lo = raw["Close"].squeeze(), raw["High"].squeeze(), raw["Low"].squeeze()
        cur = float(cl.iloc[-1])

        win20   = hi.tail(20)
        peak    = float(win20.max())
        pkdate  = win20.idxmax().strftime("%d/%m")
        drop    = (peak - cur) / peak * 100

        hi1y    = float(raw1y["High"].squeeze().max()) if not raw1y.empty else float(hi.max())
        lo1y    = float(raw1y["Low"].squeeze().min())  if not raw1y.empty else float(lo.min())
        dist_lo = (cur - lo1y) / lo1y * 100
        ath_drp = (hi1y - cur) / hi1y * 100

        rsi_v   = float(rsi(cl).iloc[-1])
        atr_v   = float(atr(hi, lo, cl).iloc[-1])
        atr_p   = atr_v / cur * 100
        bb      = bollinger_pos(cl)
        d1      = (cur - float(cl.iloc[-2])) / float(cl.iloc[-2]) * 100 if len(cl)>1 else 0
        d5      = (cur - float(cl.iloc[-6])) / float(cl.iloc[-6]) * 100 if len(cl)>5 else 0

        score = rebound_score(rsi_v, drop, atr_p, dist_lo, bb)

        return dict(
            ticker=ticker, name=name, category=category,
            price=cur, peak=peak, pkdate=pkdate, drop=round(drop,2),
            hi1y=hi1y, lo1y=lo1y, ath_drp=round(ath_drp,2), dist_lo=round(dist_lo,2),
            rsi=round(rsi_v,1), atr_p=round(atr_p,2), bb=round(bb,1) if pd.notna(bb) else None,
            d1=round(d1,2), d5=round(d5,2), score=score,
        )
    except:
        return None

# ╔══════════════════════════════════════════════════════════╗
# ║              📲  NOTIFICATIONS                          ║
# ╚══════════════════════════════════════════════════════════╝

def send_telegram(msg):
    if not TELEGRAM_ON or "COLLE" in TELEGRAM_TOKEN:
        return False
    try:
        url  = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        data = urllib.parse.urlencode({"chat_id": TELEGRAM_CHAT_ID, "text": msg, "parse_mode": "HTML"}).encode()
        urllib.request.urlopen(urllib.request.Request(url, data=data, method="POST"), timeout=10)
        return True
    except Exception as e:
        console.print(f"[red]Telegram erreur: {e}[/red]")
        return False

def send_whatsapp(msg):
    if not WHATSAPP_ON or "TON_APIKEY" in WHATSAPP_APIKEY:
        return False
    try:
        url = (f"https://api.callmebot.com/whatsapp.php"
               f"?phone={WHATSAPP_PHONE}&text={urllib.parse.quote(msg)}&apikey={WHATSAPP_APIKEY}")
        urllib.request.urlopen(url, timeout=10)
        return True
    except Exception as e:
        console.print(f"[red]WhatsApp erreur: {e}[/red]")
        return False

def fmt_price(p):
    if p >= 1000: return f"{p:,.0f}"
    if p >= 1:    return f"{p:.4f}"
    return f"{p:.6f}"

def signal(r):
    if r["rsi"] < 30 and r["drop"] > 10: return "🔥 STRONG OVERSOLD"
    if r["rsi"] < 35 and r["drop"] > 15: return "⚡ Oversold majeur"
    if r["rsi"] < 40:                    return "📉 Oversold"
    if r["drop"] > 12:                   return "📉 Correction majeure"
    if r["d5"] > 0:                      return "↗️ Début rebond"
    return "👀 À surveiller"

def build_messages(top):
    now = datetime.now().strftime("%d/%m %H:%M")

    # ── Telegram HTML ──────────────────────────────────────
    tg = [f"🤖 <b>Market Scanner — {now}</b>",
          f"⚡ <b>{len(top)} setup(s) E8 détecté(s)</b>\n"]
    for i, r in enumerate(top, 1):
        tgt  = fmt_price(r["price"] * (1 + r["atr_p"]*2/100))
        stop = fmt_price(r["price"] * (1 - r["atr_p"]/100))
        tg += [
            f"<b>#{i} {r['name']} ({r['ticker']})</b>",
            f"  📌 Prix : <code>{fmt_price(r['price'])}</code>",
            f"  📉 Baisse : <b>-{r['drop']:.1f}%</b> depuis pic {r['pkdate']}",
            f"  📊 RSI : {r['rsi']:.0f}  |  ATR : {r['atr_p']:.2f}%",
            f"  🎯 Cible : {tgt}  |  Stop : {stop}",
            f"  🏆 Score : <b>{r['score']}/100</b>  {signal(r)}\n",
        ]
    tg.append("⚠️ <i>Indicatif — respecte les règles E8 (1-2% risk/trade)</i>")

    # ── WhatsApp texte brut ────────────────────────────────
    wa = [f"MARKET SCANNER {now}", f"{len(top)} setup(s) E8\n"]
    for i, r in enumerate(top, 1):
        tgt  = fmt_price(r["price"] * (1 + r["atr_p"]*2/100))
        stop = fmt_price(r["price"] * (1 - r["atr_p"]/100))
        wa += [
            f"#{i} {r['name']} ({r['ticker']})",
            f"  Prix: {fmt_price(r['price'])}",
            f"  Baisse: -{r['drop']:.1f}% (pic {r['pkdate']})",
            f"  RSI: {r['rsi']:.0f} | ATR: {r['atr_p']:.2f}%",
            f"  Cible: {tgt} | Stop: {stop}",
            f"  Score: {r['score']}/100  {signal(r)}\n",
        ]
    wa.append("Indicatif - regles E8 obligatoires")

    return "\n".join(tg), "\n".join(wa)

def notify(results, force=False):
    eligible = [r for r in results if r["score"] >= ALERT_SCORE_MIN and r["drop"] >= ALERT_DROP_MIN]
    if not eligible and not force:
        console.print(f"[dim]🔕 Pas d'alerte (score<{ALERT_SCORE_MIN} ou baisse<{ALERT_DROP_MIN}%)[/dim]")
        return
    top = (eligible if eligible else results)[:MAX_ALERTS]
    tg_msg, wa_msg = build_messages(top)

    console.print("\n[bold cyan]📲 Envoi notifications…[/bold cyan]")
    if send_telegram(tg_msg): console.print("[green]  ✅ Telegram envoyé[/green]")
    if send_whatsapp(wa_msg): console.print("[green]  ✅ WhatsApp envoyé[/green]")
    if not TELEGRAM_ON:       console.print("[dim]  — Telegram désactivé[/dim]")
    if not WHATSAPP_ON:       console.print("[dim]  — WhatsApp désactivé[/dim]")

# ╔══════════════════════════════════════════════════════════╗
# ║              🖥️  AFFICHAGE TERMINAL                     ║
# ╚══════════════════════════════════════════════════════════╝

def rsi_col(v):
    if v < 30: return "bright_red"
    if v < 40: return "red"
    if v < 50: return "yellow"
    return "white"

def score_col(s):
    if s >= 70: return "bright_green"
    if s >= 50: return "green"
    if s >= 35: return "yellow"
    return "dim white"

def print_table(rows):
    t = Table(
        title=f"[bold]🎯 Opportunités de Rebond — {datetime.now().strftime('%d/%m/%Y %H:%M')}[/bold]",
        box=box.ROUNDED, header_style="bold magenta", show_lines=True,
    )
    for col, just, w in [
        ("Asset","left",16),("Catégorie","left",11),("Prix","right",10),
        ("Pic 20j","right",10),("Baisse","right",8),("ATH drop","right",9),
        ("RSI","center",5),("ATR%","center",6),("1j","right",7),("5j","right",7),
        ("Score","center",7),("Signal","left",20),
    ]:
        t.add_column(col, justify=just, min_width=w)

    for r in rows:
        dc = "red" if r["drop"]>10 else "yellow"
        c1 = "green" if r["d1"]>=0 else "red"
        c5 = "green" if r["d5"]>=0 else "red"
        sc = score_col(r["score"])
        rc = rsi_col(r["rsi"])
        t.add_row(
            f"[bold]{r['name']}[/bold]\n[dim]{r['ticker']}[/dim]",
            r["category"],
            fmt_price(r["price"]),
            f"{fmt_price(r['peak'])}\n[dim]({r['pkdate']})[/dim]",
            f"[{dc}]-{r['drop']:.1f}%[/{dc}]",
            f"[red]-{r['ath_drp']:.1f}%[/red]",
            f"[{rc}]{r['rsi']}[/{rc}]",
            f"{r['atr_p']:.2f}%",
            f"[{c1}]{r['d1']:+.1f}%[/{c1}]",
            f"[{c5}]{r['d5']:+.1f}%[/{c5}]",
            f"[{sc}][bold]{r['score']}[/bold][/{sc}]",
            signal(r),
        )
    console.print(t)

def print_top3(rows):
    console.rule("[bold cyan]🏆 TOP 3 SETUPS E8[/bold cyan]")
    for i, r in enumerate(rows[:3], 1):
        tgt  = fmt_price(r["price"] * (1 + r["atr_p"]*2/100))
        stop = fmt_price(r["price"] * (1 - r["atr_p"]/100))
        console.print(
            f"\n  [bold cyan]#{i} {r['name']} ({r['ticker']})[/bold cyan]\n"
            f"  Prix : [cyan]{fmt_price(r['price'])}[/cyan]  |  "
            f"Cible : [green]{tgt}[/green]  |  Stop : [red]{stop}[/red]\n"
            f"  RSI : [{rsi_col(r['rsi'])}]{r['rsi']}[/{rsi_col(r['rsi'])}]  |  "
            f"ATR : {r['atr_p']:.2f}%  |  "
            f"Baisse : [red]-{r['drop']:.1f}%[/red]  |  "
            f"Score : [{score_col(r['score'])}][bold]{r['score']}/100[/bold][/{score_col(r['score'])}]\n"
            f"  {signal(r)}"
        )
    console.rule()
    console.print("[dim]⚠️  Cibles/stops = 1-2×ATR, indicatifs. Respecte le drawdown E8.[/dim]\n")

# ╔══════════════════════════════════════════════════════════╗
# ║              🚀  SCAN PRINCIPAL                         ║
# ╚══════════════════════════════════════════════════════════╝

def run_scan(min_drop=3.0, min_score=0, notify_force=False):
    console.print(Panel.fit(
        "[bold cyan]🤖 MARKET SCANNER AGENT[/bold cyan]\n"
        "[dim]E8 · Drops · Volatilité · Rebond · Telegram · WhatsApp[/dim]",
        border_style="cyan",
    ))
    console.print(f"[dim]📡 {datetime.now().strftime('%d/%m/%Y %H:%M:%S')} | "
                  f"Filtres: baisse>{min_drop}% | score>{min_score}[/dim]\n")

    tickers = [(t, n, c) for c, assets in ASSETS.items() for t, n in assets.items()]
    results = []

    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"),
                  BarColumn(), TextColumn("{task.completed}/{task.total}"), console=console) as prog:
        task = prog.add_task("Analyse…", total=len(tickers))
        for ticker, name, cat in tickers:
            prog.update(task, description=f"[cyan]{ticker:<12}[/cyan]")
            r = analyze(ticker, name, cat)
            if r: results.append(r)
            prog.advance(task)

    filtered = sorted(
        [r for r in results if r["drop"] >= min_drop and r["score"] >= min_score],
        key=lambda x: x["score"], reverse=True,
    )

    console.print(f"\n[bold green]✅ {len(filtered)} opportunités[/bold green] "
                  f"[dim]({len(results)} assets scannés)[/dim]\n")

    if filtered:
        print_table(filtered)
        print_top3(filtered)
        notify(filtered, force=notify_force)
    else:
        console.print("[yellow]Aucune oppo avec ces filtres. Essaie --min-drop 2[/yellow]")

    return filtered

# ╔══════════════════════════════════════════════════════════╗
# ║              ▶️  ENTRÉE PRINCIPALE                      ║
# ╚══════════════════════════════════════════════════════════╝

def main():
    p = argparse.ArgumentParser(description="Market Scanner Agent — E8 + Telegram + WhatsApp")
    p.add_argument("--watch",      type=int,   default=0,   metavar="MIN",
                   help="Refresh auto toutes les N minutes")
    p.add_argument("--min-drop",   type=float, default=3.0, metavar="PCT",
                   help="Baisse min depuis pic 20j (défaut 3.0)")
    p.add_argument("--min-score",  type=int,   default=0,   metavar="N",
                   help="Score minimum 0-100 (défaut 0)")
    p.add_argument("--test-notif", action="store_true",
                   help="Envoie une notif de test sans attendre le seuil")
    p.add_argument("--save",       action="store_true",
                   help="Sauvegarde les résultats en JSON horodaté")
    args = p.parse_args()

    if args.watch:
        console.print(f"[bold magenta]🔄 Watch mode — refresh toutes les {args.watch} min[/bold magenta]")
        console.print("[dim]Ctrl+C pour arrêter[/dim]\n")
        try:
            while True:
                res = run_scan(args.min_drop, args.min_score, args.test_notif)
                if args.save:
                    fn = f"scan_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
                    with open(fn, "w") as f: json.dump(res, f, indent=2, default=str)
                    console.print(f"[dim]💾 {fn}[/dim]")
                console.print(f"[dim]⏳ Prochain scan dans {args.watch} min…[/dim]")
                time.sleep(args.watch * 60)
        except KeyboardInterrupt:
            console.print("\n[yellow]Agent arrêté.[/yellow]")
    else:
        res = run_scan(args.min_drop, args.min_score, args.test_notif)
        if args.save:
            fn = f"scan_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
            with open(fn, "w") as f: json.dump(res, f, indent=2, default=str)
            console.print(f"[dim]💾 {fn}[/dim]")

if __name__ == "__main__":
    main()
