"""
Mini Agent IA - Un agent conversationnel simple en Python
=========================================================
Cet agent peut :
  - Répondre à des questions sur la météo (simulée)
  - Faire des calculs mathématiques
  - Donner l'heure et la date actuelles

Comment ça marche ?
    L'agent lit ce que tu écris, essaie de comprendre ton intention
    (météo / calcul / heure), puis te répond.
    Tape "quitter" ou "exit" pour arrêter.
"""

import datetime   # Pour obtenir l'heure et la date
import random     # Pour simuler la météo de façon aléatoire
import re         # Pour détecter et évaluer les expressions mathématiques


# ---------------------------------------------------------------------------
# 1. MODULE MÉTÉO (simulée)
# ---------------------------------------------------------------------------

# Dictionnaire des villes connues avec leur météo fictive de base
VILLES_CONNUES = {
    "paris": ["ensoleillé", "nuageux", "pluvieux"],
    "lyon": ["ensoleillé", "nuageux"],
    "marseille": ["ensoleillé", "ensoleillé", "ensoleillé", "venteux"],
    "bordeaux": ["nuageux", "pluvieux", "ensoleillé"],
    "lille": ["pluvieux", "nuageux", "brumeux"],
    "nice": ["ensoleillé", "chaud", "ensoleillé"],
    "toulouse": ["ensoleillé", "nuageux"],
    "nantes": ["pluvieux", "nuageux", "venteux"],
    "strasbourg": ["neigeux", "nuageux", "pluvieux"],
    "montpellier": ["ensoleillé", "chaud", "venteux"],
}

# Températures fictives par condition météo (en °C)
TEMPERATURES = {
    "ensoleillé": (22, 32),
    "nuageux":    (14, 20),
    "pluvieux":   (10, 16),
    "venteux":    (12, 18),
    "brumeux":    (8,  14),
    "chaud":      (30, 38),
    "neigeux":    (-3,  3),
}


def obtenir_meteo(texte: str) -> str:
    """
    Cherche une ville dans le texte et renvoie une météo simulée.
    Si aucune ville n'est reconnue, renvoie une météo générique.
    """
    texte_lower = texte.lower()

    # Chercher si une ville connue est mentionnée
    ville_trouvee = None
    for ville in VILLES_CONNUES:
        if ville in texte_lower:
            ville_trouvee = ville
            break

    if ville_trouvee:
        # Choisir une condition météo aléatoire parmi celles de la ville
        condition = random.choice(VILLES_CONNUES[ville_trouvee])
        temp_min, temp_max = TEMPERATURES[condition]
        temperature = random.randint(temp_min, temp_max)
        return (
            f"À {ville_trouvee.capitalize()}, il fait actuellement {condition} "
            f"avec {temperature}°C. (données simulées)"
        )
    else:
        # Météo générique si la ville n'est pas reconnue
        conditions_generiques = list(TEMPERATURES.keys())
        condition = random.choice(conditions_generiques)
        temp_min, temp_max = TEMPERATURES[condition]
        temperature = random.randint(temp_min, temp_max)
        return (
            f"Je ne connais pas cette ville, mais en général aujourd'hui : "
            f"{condition}, {temperature}°C. (données simulées)\n"
            f"Villes disponibles : {', '.join(v.capitalize() for v in VILLES_CONNUES)}"
        )


# ---------------------------------------------------------------------------
# 2. MODULE CALCUL MATHÉMATIQUE
# ---------------------------------------------------------------------------

# Expression régulière pour trouver une opération du type : 12 + 34.5 * (2 - 1)
PATTERN_CALCUL = re.compile(
    r"[\d\s\.\+\-\*\/\(\)\^]+"   # chiffres, espaces, opérateurs courants
)

# Caractères autorisés pour l'évaluation sécurisée (évite l'injection de code)
CARACTERES_AUTORISES = set("0123456789+-*/().^ ")


def calculer(texte: str) -> str:
    """
    Extrait et évalue une expression mathématique depuis le texte de l'utilisateur.
    Opérations supportées : + - * / ( ) et ^ (puissance → converti en **)
    """
    # Chercher une expression mathématique dans le texte
    correspondances = PATTERN_CALCUL.findall(texte)

    # Filtrer pour ne garder que les fragments qui ressemblent à des calculs
    expressions_candidates = [m.strip() for m in correspondances if any(c.isdigit() for c in m)]

    if not expressions_candidates:
        return "Je n'ai pas trouvé de calcul à effectuer. Exemple : 'calcule 15 * 3 + 2'"

    # Prendre la candidate la plus longue (probablement la plus complète)
    expression = max(expressions_candidates, key=len)

    # Vérifier que l'expression ne contient que des caractères sûrs
    if not all(c in CARACTERES_AUTORISES for c in expression):
        return "Expression non autorisée. Utilise uniquement des chiffres et +, -, *, /, (, ), ^"

    # Remplacer ^ par ** pour la puissance (ex: 2^8 → 2**8)
    expression_python = expression.replace("^", "**")

    try:
        # eval() est sécurisé ici car on a filtré les caractères au-dessus
        resultat = eval(expression_python, {"__builtins__": {}}, {})  # noqa: S307

        # Afficher un entier proprement, sinon 2 décimales max
        if isinstance(resultat, float) and resultat.is_integer():
            resultat = int(resultat)
        elif isinstance(resultat, float):
            resultat = round(resultat, 6)

        return f"{expression.strip()} = {resultat}"
    except ZeroDivisionError:
        return "Erreur : division par zéro impossible !"
    except Exception:
        return f"Je n'ai pas pu calculer '{expression}'. Vérifie la syntaxe."


# ---------------------------------------------------------------------------
# 3. MODULE HEURE ET DATE
# ---------------------------------------------------------------------------

def obtenir_heure() -> str:
    """Renvoie l'heure et la date actuelles formatées en français."""
    maintenant = datetime.datetime.now()

    # Noms des jours et mois en français
    jours = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
    mois = [
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ]

    jour_semaine = jours[maintenant.weekday()]
    nom_mois = mois[maintenant.month - 1]

    return (
        f"Nous sommes {jour_semaine} {maintenant.day} {nom_mois} {maintenant.year}, "
        f"il est {maintenant.strftime('%H:%M:%S')}."
    )


# ---------------------------------------------------------------------------
# 4. MOTEUR DE DÉTECTION D'INTENTION
# ---------------------------------------------------------------------------

# Mots-clés qui indiquent chaque type de question
MOTS_CLES = {
    "meteo": [
        "météo", "meteo", "temps", "température", "temperature",
        "chaud", "froid", "pluie", "soleil", "nuage", "neige",
        "vent", "climat", "prévision", "prevision"
    ],
    "calcul": [
        "calcul", "calculer", "calcule", "combien", "résoudre", "résous",
        "addition", "soustraction", "multiplication", "division",
        "plus", "moins", "fois", "divisé", "puissance", "somme",
        "+", "-", "*", "/", "^", "="
    ],
    "heure": [
        "heure", "heure ?", "temps", "date", "jour", "quelle heure",
        "il est", "aujourd'hui", "maintenant", "horloge"
    ],
}


def detecter_intention(texte: str) -> str:
    """
    Analyse le texte de l'utilisateur et retourne l'intention détectée :
    'meteo', 'calcul', 'heure' ou 'inconnu'.
    """
    texte_lower = texte.lower()
    scores = {"meteo": 0, "calcul": 0, "heure": 0}

    for intention, mots in MOTS_CLES.items():
        for mot in mots:
            # re.search avec \b évite les faux positifs (ex: "jour" dans "bonjour")
            if re.search(r"\b" + re.escape(mot) + r"\b", texte_lower):
                scores[intention] += 1

    # Vérifier aussi si le texte contient une expression mathématique évidente
    if re.search(r"\d+\s*[\+\-\*\/\^]\s*\d+", texte):
        scores["calcul"] += 3  # Boost si on voit une opération chiffre-opérateur-chiffre

    meilleur_score = max(scores.values())

    if meilleur_score == 0:
        return "inconnu"

    # Retourner l'intention avec le score le plus élevé
    return max(scores, key=scores.get)


# ---------------------------------------------------------------------------
# 5. RÉPONSE AUX QUESTIONS INCONNUES
# ---------------------------------------------------------------------------

REPONSES_INCONNU = [
    "Hmm, je ne suis pas sûr de comprendre. Je peux t'aider avec :\n"
    "  • La météo  (ex: 'météo à Paris')\n"
    "  • Les calculs (ex: '12 * 7 + 3')\n"
    "  • L'heure   (ex: 'quelle heure est-il ?')",

    "Je ne sais pas répondre à ça. Essaie :\n"
    "  - 'Quel temps fait-il à Lyon ?'\n"
    "  - 'Calcule 100 / 4'\n"
    "  - 'Quelle heure est-il ?'",

    "Question difficile ! Mes compétences : météo, calculs, heure. Tape 'aide' pour plus d'infos.",
]


def reponse_inconnu() -> str:
    """Retourne aléatoirement un message d'aide quand l'intention n'est pas reconnue."""
    return random.choice(REPONSES_INCONNU)


def afficher_aide() -> str:
    """Affiche le message d'aide complet."""
    return (
        "\n📋 Voici ce que je sais faire :\n"
        "─────────────────────────────────────\n"
        "🌤  MÉTÉO   → 'météo à Marseille'\n"
        "           → 'quel temps fait-il à Bordeaux ?'\n\n"
        "🔢  CALCUL  → '15 * 4 + 2'\n"
        "           → 'combien font 120 / 6 ?'\n"
        "           → '2 ^ 10' (puissance)\n\n"
        "🕐  HEURE   → 'quelle heure est-il ?'\n"
        "           → 'on est quel jour ?'\n\n"
        "💡  COMMANDES SPÉCIALES :\n"
        "    aide / help  → afficher ce message\n"
        "    quitter / exit / q → quitter l'agent\n"
        "─────────────────────────────────────"
    )


# ---------------------------------------------------------------------------
# 6. BOUCLE PRINCIPALE DE L'AGENT
# ---------------------------------------------------------------------------

def traiter_message(texte: str) -> str:
    """
    Fonction principale : reçoit un message et renvoie la réponse appropriée.
    C'est ici que toute la logique de l'agent se réunit.
    """
    texte = texte.strip()

    # Commandes spéciales d'aide
    if texte.lower() in ("aide", "help", "?"):
        return afficher_aide()

    # Détecter l'intention de l'utilisateur
    intention = detecter_intention(texte)

    # Appeler le bon module selon l'intention
    if intention == "meteo":
        return obtenir_meteo(texte)
    elif intention == "calcul":
        return calculer(texte)
    elif intention == "heure":
        return obtenir_heure()
    else:
        return reponse_inconnu()


def demarrer_agent():
    """Lance la boucle interactive de l'agent."""

    # Message de bienvenue
    print("=" * 50)
    print("   Bienvenue dans Mini Agent IA ! 🤖")
    print("=" * 50)
    print("Je peux répondre à des questions sur :")
    print("  • La météo  (ex: météo à Paris)")
    print("  • Les calculs (ex: 15 * 4 + 2)")
    print("  • L'heure   (ex: quelle heure est-il ?)")
    print("\nTape 'aide' pour plus d'infos, 'quitter' pour partir.")
    print("-" * 50)

    # Boucle infinie : l'agent écoute jusqu'à ce que l'utilisateur parte
    while True:
        try:
            # Lire la saisie de l'utilisateur
            saisie = input("\nToi : ").strip()

            # Ignorer les saisies vides
            if not saisie:
                print("Agent : (Dis quelque chose ! Tape 'aide' si tu es perdu.)")
                continue

            # Vérifier si l'utilisateur veut quitter
            if saisie.lower() in ("quitter", "exit", "quit", "q", "au revoir", "bye"):
                print("\nAgent : Au revoir ! À bientôt 👋")
                break

            # Traiter le message et afficher la réponse
            reponse = traiter_message(saisie)
            print(f"\nAgent : {reponse}")

        except KeyboardInterrupt:
            # Ctrl+C : sortie propre
            print("\n\nAgent : Interruption détectée. À bientôt ! 👋")
            break


# ---------------------------------------------------------------------------
# Point d'entrée du programme
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Ce bloc s'exécute seulement si on lance directement ce fichier
    # (pas si on l'importe dans un autre module)
    demarrer_agent()
