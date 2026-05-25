# Mini Agent IA

Un petit agent conversationnel en Python, idéal pour les débutants.  
Il peut répondre à des questions sur la **météo simulée**, effectuer des **calculs mathématiques** et donner **l'heure et la date** actuelles.

---

## Fonctionnalités

| Capacité | Exemples de questions |
|---|---|
| Météo (simulée) | `météo à Paris`, `quel temps fait-il à Lyon ?` |
| Calculs | `15 * 4 + 2`, `combien font 120 / 6 ?`, `2 ^ 10` |
| Heure & date | `quelle heure est-il ?`, `on est quel jour ?` |

---

## Prérequis

- **Python 3.7 ou supérieur** (aucune bibliothèque externe nécessaire)

Vérifie ta version Python :
```bash
python --version
# ou
python3 --version
```

---

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/antonyxeur972/mini-agent-ia.git

# 2. Aller dans le dossier
cd mini-agent-ia
```

Aucune installation de dépendances requise — uniquement la bibliothèque standard Python.

---

## Utilisation

```bash
python agent.py
# ou
python3 agent.py
```

L'agent démarre et affiche une invite `Toi :`. Tape ta question et appuie sur Entrée.

### Exemple de session

```
==================================================
   Bienvenue dans Mini Agent IA !
==================================================
Je peux répondre à des questions sur :
  • La météo  (ex: météo à Paris)
  • Les calculs (ex: 15 * 4 + 2)
  • L'heure   (ex: quelle heure est-il ?)

Toi : météo à Paris
Agent : À Paris, il fait actuellement nuageux avec 17°C. (données simulées)

Toi : combien font 2 ^ 8 ?
Agent : 2 ^ 8 = 256

Toi : quelle heure est-il ?
Agent : Nous sommes dimanche 25 mai 2025, il est 14:32:07.

Toi : quitter
Agent : Au revoir ! À bientôt 👋
```

---

## Commandes spéciales

| Commande | Action |
|---|---|
| `aide` ou `help` | Affiche le menu d'aide complet |
| `quitter`, `exit`, `q` | Quitte l'agent proprement |
| `Ctrl + C` | Interruption d'urgence |

---

## Structure du code

```
agent.py
├── MODULE MÉTÉO         → obtenir_meteo()
├── MODULE CALCUL        → calculer()
├── MODULE HEURE         → obtenir_heure()
├── DÉTECTION INTENTION  → detecter_intention()
└── BOUCLE PRINCIPALE    → demarrer_agent()
```

Le fichier `agent.py` est découpé en sections bien commentées, pensées pour les débutants :

- Chaque fonction a une docstring qui explique ce qu'elle fait
- Les choix de conception sont expliqués dans les commentaires
- La logique de détection d'intention est transparente

---

## Villes disponibles (météo simulée)

Paris, Lyon, Marseille, Bordeaux, Lille, Nice, Toulouse, Nantes, Strasbourg, Montpellier.

---

## Pistes d'amélioration

- Connecter une vraie API météo (ex: OpenWeatherMap)
- Ajouter la gestion d'autres langues
- Brancher un vrai modèle de langage (ex: API Claude) pour la compréhension
- Sauvegarder l'historique de conversation dans un fichier

---

## Licence

Projet libre — utilise et modifie ce code comme tu le souhaites.
