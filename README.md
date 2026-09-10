# mini-agent-ia

Un mini agent IA en Python créé avec Claude Code — scanner de marché avec alertes Telegram/WhatsApp.

## scanner.py — Market Scanner Agent

Scanne 30 assets (Crypto, Indices, Commodités, Forex) et détecte les opportunités de rebond compatibles E8.

### Indicateurs calculés

| Indicateur | Rôle |
|---|---|
| RSI(14) | Détection survente |
| ATR(14) | Volatilité / taille des stops |
| Bollinger %B | Position dans les bandes |
| Drop 20j | Baisse depuis le pic sur 20 jours |
| ATH drop 1y | Distance depuis le plus haut annuel |

Le **score 0-100** pondère ces 5 facteurs pour classer les meilleures opportunités.

### Installation

```bash
pip install yfinance pandas numpy rich
```

### Utilisation

```bash
# Scan simple
python scanner.py

# Filtrer par baisse minimale
python scanner.py --min-drop 5

# Filtrer par score minimum
python scanner.py --min-drop 5 --min-score 40

# Mode watch (refresh toutes les 30 min)
python scanner.py --watch 30

# Sauvegarder les résultats en JSON
python scanner.py --save

# Tester les notifications sans attendre les seuils
python scanner.py --test-notif
```

### Configuration notifications (scanner.py)

```python
TELEGRAM_TOKEN   = "TON_TOKEN"       # BotFather → /newbot
TELEGRAM_CHAT_ID = "TON_CHAT_ID"     # @userinfobot pour le trouver
TELEGRAM_ON      = True

WHATSAPP_PHONE   = "596XXXXXXXXX"    # sans le +
WHATSAPP_APIKEY  = "TON_APIKEY"      # CallMeBot
WHATSAPP_ON      = False

ALERT_SCORE_MIN  = 55   # score min pour déclencher une alerte
ALERT_DROP_MIN   = 5.0  # baisse min depuis pic 20j (%)
MAX_ALERTS       = 3    # top N assets dans le message
```

### Assets couverts

- **Crypto** (10) : BTC, ETH, SOL, XRP, BNB, DOGE, ADA, AVAX, LINK, LTC
- **Indices** (4) : S&P 500, Nasdaq 100, Dow Jones, Russell 2000
- **Commodités** (5) : Gold, Silver, WTI, Brent, Nat Gas
- **Forex** (6) : EUR/USD, GBP/USD, USD/JPY, AUD/USD, GBP/JPY, USD/CAD
