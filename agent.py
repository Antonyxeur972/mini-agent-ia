"""
Mini Agent IA - Un agent conversationnel simple en Python
=========================================================
Cet agent peut :
  - Répondre à des questions sur la météo (simulée)
  - Faire des calculs mathématiques
  - Donner l'heure et la date actuelles
  - Effectuer des recherches web (simulées, 3 résultats par requête)

Comment ça marche ?
    L'agent lit ce que tu écris, essaie de comprendre ton intention
    (météo / calcul / heure / recherche), puis te répond.
    Tape "quitter" ou "exit" pour arrêter.
"""

import datetime   # Pour obtenir l'heure et la date
import random     # Pour simuler la météo et varier les réponses
import re         # Pour détecter et évaluer les expressions mathématiques


# ---------------------------------------------------------------------------
# 1. MODULE MÉTÉO (simulée)
# ---------------------------------------------------------------------------

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

    ville_trouvee = None
    for ville in VILLES_CONNUES:
        if ville in texte_lower:
            ville_trouvee = ville
            break

    if ville_trouvee:
        condition = random.choice(VILLES_CONNUES[ville_trouvee])
        temp_min, temp_max = TEMPERATURES[condition]
        temperature = random.randint(temp_min, temp_max)
        return (
            f"À {ville_trouvee.capitalize()}, il fait actuellement {condition} "
            f"avec {temperature}°C. (données simulées)"
        )
    else:
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

PATTERN_CALCUL = re.compile(r"[\d\s\.\+\-\*\/\(\)\^]+")
CARACTERES_AUTORISES = set("0123456789+-*/().^ ")


def calculer(texte: str) -> str:
    """
    Extrait et évalue une expression mathématique depuis le texte de l'utilisateur.
    Opérations supportées : + - * / ( ) et ^ (puissance → converti en **)
    """
    correspondances = PATTERN_CALCUL.findall(texte)
    expressions_candidates = [m.strip() for m in correspondances if any(c.isdigit() for c in m)]

    if not expressions_candidates:
        return "Je n'ai pas trouvé de calcul à effectuer. Exemple : 'calcule 15 * 3 + 2'"

    expression = max(expressions_candidates, key=len)

    if not all(c in CARACTERES_AUTORISES for c in expression):
        return "Expression non autorisée. Utilise uniquement des chiffres et +, -, *, /, (, ), ^"

    expression_python = expression.replace("^", "**")

    try:
        resultat = eval(expression_python, {"__builtins__": {}}, {})  # noqa: S307

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
# 4. MODULE RECHERCHE WEB (simulée)
# ---------------------------------------------------------------------------

# Chaque entrée est une liste de 3 résultats fictifs : titre, url, résumé.
# Les clés sont des thèmes reconnus automatiquement dans la requête.
FAUX_RESULTATS = {
    "python": [
        {
            "titre": "Python.org — Documentation officielle",
            "url":   "https://docs.python.org/fr/3/",
            "resume": "La référence complète du langage Python : tutoriels, bibliothèque standard, "
                      "guides d'installation et exemples pour tous les niveaux.",
        },
        {
            "titre": "Apprendre Python en 2024 — OpenClassrooms",
            "url":   "https://openclassrooms.com/fr/courses/7168871-apprenez-les-bases-du-langage-python",
            "resume": "Cours interactif gratuit pour débuter avec Python. Variables, boucles, "
                      "fonctions et projets pratiques inclus.",
        },
        {
            "titre": "Python pour les débutants — Real Python (FR)",
            "url":   "https://realpython.com/python-first-steps/",
            "resume": "Guide pas-à-pas pour installer Python et écrire tes premiers programmes. "
                      "Exemples concrets et exercices corrigés.",
        },
    ],
    "javascript": [
        {
            "titre": "MDN Web Docs — JavaScript",
            "url":   "https://developer.mozilla.org/fr/docs/Web/JavaScript",
            "resume": "Documentation de référence JavaScript par Mozilla. Syntaxe, API du navigateur, "
                      "ES2024, tutoriels et exemples interactifs.",
        },
        {
            "titre": "JavaScript.info — Le tutoriel moderne",
            "url":   "https://fr.javascript.info/",
            "resume": "Cours JavaScript complet et moderne, de zéro à expert. Couvre les bases, "
                      "le DOM, les Promises, les classes et plus encore.",
        },
        {
            "titre": "FreeCodeCamp — Certification JavaScript",
            "url":   "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
            "resume": "300 heures de contenu gratuit sur JavaScript, les algorithmes et les "
                      "structures de données. Certification reconnue à la clé.",
        },
    ],
    "intelligence artificielle": [
        {
            "titre": "Qu'est-ce que l'intelligence artificielle ? — IBM",
            "url":   "https://www.ibm.com/fr-fr/topics/artificial-intelligence",
            "resume": "Introduction claire à l'IA : machine learning, deep learning, NLP. "
                      "Cas d'usage concrets dans l'industrie.",
        },
        {
            "titre": "Cours IA gratuit — Elements of AI (Université d'Helsinki)",
            "url":   "https://course.elementsofai.com/fr/",
            "resume": "MOOC gratuit en français pour comprendre l'IA sans connaissances préalables. "
                      "Plus de 750 000 apprenants dans le monde.",
        },
        {
            "titre": "Hugging Face — Modèles et datasets open-source",
            "url":   "https://huggingface.co/",
            "resume": "La plateforme de référence pour l'IA open-source. Accède à des milliers de "
                      "modèles pré-entraînés : texte, image, audio.",
        },
    ],
    "recette": [
        {
            "titre": "Marmiton — Recettes de cuisine faciles",
            "url":   "https://www.marmiton.org/",
            "resume": "Plus de 60 000 recettes notées par la communauté. Filtres par ingrédient, "
                      "temps de préparation et régime alimentaire.",
        },
        {
            "titre": "750g — Recettes simples et rapides",
            "url":   "https://www.750g.com/",
            "resume": "Recettes illustrées étape par étape, vidéos de cuisine et conseils de chefs. "
                      "Idéal pour les débutants en cuisine.",
        },
        {
            "titre": "Cuisine Actuelle — Recettes et astuces",
            "url":   "https://www.cuisineactuelle.fr/",
            "resume": "Des recettes de saison, des menus équilibrés et des conseils nutritionnels "
                      "pour manger sain au quotidien.",
        },
    ],
    "voyage": [
        {
            "titre": "Lonely Planet France — Guides de voyage",
            "url":   "https://www.lonelyplanet.fr/",
            "resume": "Guides de destination, conseils pratiques, hôtels et restaurants recommandés "
                      "par des voyageurs passionnés.",
        },
        {
            "titre": "Routard.com — Conseils et bons plans voyage",
            "url":   "https://www.routard.com/",
            "resume": "Le guide du routard en ligne : visas, budgets, itinéraires et forum de voyage "
                      "pour planifier ton prochain trip.",
        },
        {
            "titre": "Skyscanner — Vols pas chers",
            "url":   "https://www.skyscanner.fr/",
            "resume": "Comparateur de vols en temps réel. Trouve les meilleures offres sur des "
                      "millions de combinaisons de vols, hôtels et voitures.",
        },
    ],
    "sport": [
        {
            "titre": "L'Équipe — Actualités sportives",
            "url":   "https://www.lequipe.fr/",
            "resume": "Toute l'actu du sport en direct : football, tennis, rugby, cyclisme. "
                      "Résultats, classements et transferts.",
        },
        {
            "titre": "Eurosport — Sport en direct et replay",
            "url":   "https://www.eurosport.fr/",
            "resume": "Résultats en direct, vidéos et analyses des grandes compétitions sportives "
                      "mondiales sur tous les sports.",
        },
        {
            "titre": "Decathlon — Conseils sport et équipement",
            "url":   "https://www.decathlon.fr/conseils-sport",
            "resume": "Guides et conseils pour débuter ou progresser dans ton sport. Sélection "
                      "d'équipements adaptés à chaque niveau.",
        },
    ],
    "musique": [
        {
            "titre": "Spotify — Écoute de la musique en streaming",
            "url":   "https://open.spotify.com/",
            "resume": "80 millions de titres, des podcasts et des playlists personnalisées. "
                      "Version gratuite avec publicités ou premium sans coupures.",
        },
        {
            "titre": "Deezer — Musique en ligne",
            "url":   "https://www.deezer.com/fr/",
            "resume": "Plateforme française de streaming musical avec 90 millions de morceaux, "
                      "des radios thématiques et du contenu exclusif.",
        },
        {
            "titre": "Musicmatch — Paroles et accords de guitare",
            "url":   "https://www.musescore.com/fr",
            "resume": "Partitions gratuites, accords et tablatures pour tous les instruments. "
                      "Plus de 1 million de partitions disponibles.",
        },
    ],
    "science": [
        {
            "titre": "Futura Sciences — Actualités scientifiques",
            "url":   "https://www.futura-sciences.com/",
            "resume": "Toute l'actualité de la science en français : espace, physique, biologie, "
                      "environnement. Articles, dossiers et vidéos.",
        },
        {
            "titre": "CNRS — Centre National de la Recherche Scientifique",
            "url":   "https://www.cnrs.fr/fr/actualites",
            "resume": "Les dernières découvertes de la recherche française. Communiqués de presse, "
                      "dossiers thématiques et ressources pédagogiques.",
        },
        {
            "titre": "Science & Vie — Magazine de vulgarisation",
            "url":   "https://www.science-et-vie.com/",
            "resume": "Reportages et enquêtes sur les grandes questions scientifiques. Astronomie, "
                      "médecine, technologie et environnement.",
        },
    ],
}

# Associations mots-clés → thème du dictionnaire FAUX_RESULTATS
MOTS_THEMES = {
    "python":                  "python",
    "javascript":              "javascript",
    "js":                      "javascript",
    "ia":                      "intelligence artificielle",
    "intelligence artificielle": "intelligence artificielle",
    "machine learning":        "intelligence artificielle",
    "deep learning":           "intelligence artificielle",
    "recette":                 "recette",
    "cuisine":                 "recette",
    "plat":                    "recette",
    "voyage":                  "voyage",
    "voyager":                 "voyage",
    "destination":             "voyage",
    "sport":                   "sport",
    "football":                "sport",
    "tennis":                  "sport",
    "musique":                 "musique",
    "chanson":                 "musique",
    "science":                 "science",
    "physique":                "science",
    "chimie":                  "science",
    "biologie":                "science",
}

# Mots à retirer pour extraire la vraie requête de l'utilisateur
MOTS_DECLENCHEURS_RECHERCHE = [
    "recherche", "cherche", "chercher", "rechercher", "trouve", "trouver",
    "search", "googler", "google", "infos sur", "info sur",
    "qu'est-ce que", "c'est quoi", "dis-moi", "parle-moi de",
    "web", "internet", "en ligne", "site sur", "des résultats sur",
]


def extraire_requete(texte: str) -> str:
    """
    Supprime les mots déclencheurs du texte pour isoler la requête réelle.
    Exemple : "cherche des infos sur Python" → "Python"
    """
    requete = texte.lower()
    for mot in sorted(MOTS_DECLENCHEURS_RECHERCHE, key=len, reverse=True):
        # Remplacement insensible à la casse, en conservant les espaces propres
        requete = re.sub(r"\b" + re.escape(mot) + r"\b", " ", requete)
    # Nettoyer les espaces multiples laissés par les suppressions
    requete = re.sub(r"\s+", " ", requete)
    return requete.strip(" ?,!.")


def _formater_resultats(requete_affichee: str, resultats: list) -> str:
    """
    Formate une liste de 3 résultats web en un affichage lisible.
    Chaque résultat est un dict avec les clés 'titre', 'url', 'resume'.
    """
    lignes = [f'🔍 Résultats pour "{requete_affichee}" :\n' + "─" * 46]
    for i, r in enumerate(resultats, start=1):
        lignes.append(
            f"[{i}] {r['titre']}\n"
            f"    🔗 {r['url']}\n"
            f"    💬 {r['resume']}"
        )
    lignes.append("─" * 46)
    lignes.append("⚠️  Résultats simulés — aucune connexion internet réelle.")
    return "\n\n".join(lignes)


def search_web(texte: str) -> str:
    """
    Outil de recherche web simulée.

    Fonctionnement :
      1. Extrait la requête réelle depuis le texte brut de l'utilisateur.
      2. Cherche si un thème connu correspond à un mot de la requête.
      3. Retourne 3 faux résultats (titre, URL, résumé) bien formatés.
      4. Si aucun thème ne correspond, génère des résultats génériques.
    """
    requete = extraire_requete(texte)

    if not requete:
        return (
            "Sur quoi veux-tu que je recherche ?\n"
            "Exemple : 'cherche des infos sur Python'"
        )

    # Chercher si un mot de la requête correspond à un thème connu
    theme_trouve = None
    for mot_cle, theme in MOTS_THEMES.items():
        if re.search(r"\b" + re.escape(mot_cle) + r"\b", requete):
            theme_trouve = theme
            break

    if theme_trouve:
        resultats = FAUX_RESULTATS[theme_trouve]
    else:
        # Résultats génériques construits à partir de la requête
        requete_encodee = requete.replace(" ", "+")
        resultats = [
            {
                "titre": f"Tout savoir sur {requete.title()} — Wikipedia",
                "url":   f"https://fr.wikipedia.org/wiki/{requete.replace(' ', '_').title()}",
                "resume": f"Article encyclopédique complet sur {requete}. Définition, histoire, "
                          f"fonctionnement et références bibliographiques.",
            },
            {
                "titre": f"{requete.title()} : guide complet 2024",
                "url":   f"https://www.lemonde.fr/recherche/?keywords={requete_encodee}",
                "resume": f"Dossier approfondi sur {requete} : analyses d'experts, chiffres clés "
                          f"et perspectives pour 2024.",
            },
            {
                "titre": f"Forum : vos questions sur {requete.title()}",
                "url":   f"https://www.reddit.com/search/?q={requete_encodee}&restrict_sr=false",
                "resume": f"Des milliers de discussions sur {requete}. Conseils de la communauté, "
                          f"retours d'expérience et ressources partagées.",
            },
        ]

    return _formater_resultats(requete, resultats)


# ---------------------------------------------------------------------------
# 5. MOTEUR DE DÉTECTION D'INTENTION
# ---------------------------------------------------------------------------

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
        "heure", "date", "jour", "quelle heure",
        "il est", "aujourd'hui", "maintenant", "horloge"
    ],
    "recherche": [
        "recherche", "cherche", "chercher", "rechercher",
        "trouve", "trouver", "search", "googler",
        "infos sur", "info sur", "qu'est-ce que", "c'est quoi",
        "parle-moi de", "dis-moi tout sur",
        "machine learning", "deep learning",
    ],
}


def detecter_intention(texte: str) -> str:
    """
    Analyse le texte et retourne l'intention :
    'meteo', 'calcul', 'heure', 'recherche' ou 'inconnu'.
    """
    texte_lower = texte.lower()
    scores = {"meteo": 0, "calcul": 0, "heure": 0, "recherche": 0}

    for intention, mots in MOTS_CLES.items():
        for mot in mots:
            if re.search(r"['\-\s]", mot):
                # Expressions multi-mots ou avec apostrophe/tiret : substring suffit
                # (\b échoue sur les caractères non-alphanumériques internes)
                if mot in texte_lower:
                    scores[intention] += 1
            else:
                # Mot simple : frontière de mot pour éviter "jour" dans "bonjour"
                if re.search(r"\b" + re.escape(mot) + r"\b", texte_lower):
                    scores[intention] += 1

    # Boost si on détecte une expression chiffre-opérateur-chiffre
    if re.search(r"\d+\s*[\+\-\*\/\^]\s*\d+", texte):
        scores["calcul"] += 3

    meilleur_score = max(scores.values())

    if meilleur_score == 0:
        return "inconnu"

    return max(scores, key=scores.get)


# ---------------------------------------------------------------------------
# 6. RÉPONSE AUX QUESTIONS INCONNUES
# ---------------------------------------------------------------------------

REPONSES_INCONNU = [
    "Hmm, je ne suis pas sûr de comprendre. Je peux t'aider avec :\n"
    "  • La météo      (ex: 'météo à Paris')\n"
    "  • Les calculs   (ex: '12 * 7 + 3')\n"
    "  • L'heure       (ex: 'quelle heure est-il ?')\n"
    "  • Une recherche (ex: 'cherche des infos sur Python')",

    "Je ne sais pas répondre à ça. Essaie :\n"
    "  - 'Quel temps fait-il à Lyon ?'\n"
    "  - 'Calcule 100 / 4'\n"
    "  - 'Quelle heure est-il ?'\n"
    "  - 'Cherche des infos sur l'intelligence artificielle'",

    "Question difficile ! Mes compétences : météo, calculs, heure, recherche web. "
    "Tape 'aide' pour plus d'infos.",
]


def reponse_inconnu() -> str:
    """Retourne aléatoirement un message d'aide quand l'intention n'est pas reconnue."""
    return random.choice(REPONSES_INCONNU)


def afficher_aide() -> str:
    """Affiche le message d'aide complet."""
    return (
        "\n📋 Voici ce que je sais faire :\n"
        "─────────────────────────────────────\n"
        "🌤  MÉTÉO     → 'météo à Marseille'\n"
        "             → 'quel temps fait-il à Bordeaux ?'\n\n"
        "🔢  CALCUL    → '15 * 4 + 2'\n"
        "             → 'combien font 120 / 6 ?'\n"
        "             → '2 ^ 10' (puissance)\n\n"
        "🕐  HEURE     → 'quelle heure est-il ?'\n"
        "             → 'on est quel jour ?'\n\n"
        "🔍  RECHERCHE → 'cherche des infos sur Python'\n"
        "             → 'qu'est-ce que le machine learning ?'\n"
        "             → 'trouve des recettes de cuisine'\n\n"
        "💡  COMMANDES SPÉCIALES :\n"
        "    aide / help  → afficher ce message\n"
        "    quitter / exit / q → quitter l'agent\n"
        "─────────────────────────────────────"
    )


# ---------------------------------------------------------------------------
# 7. BOUCLE PRINCIPALE DE L'AGENT
# ---------------------------------------------------------------------------

def traiter_message(texte: str) -> str:
    """
    Fonction principale : reçoit un message et renvoie la réponse appropriée.
    C'est ici que toute la logique de l'agent se réunit.
    """
    texte = texte.strip()

    if texte.lower() in ("aide", "help", "?"):
        return afficher_aide()

    intention = detecter_intention(texte)

    if intention == "meteo":
        return obtenir_meteo(texte)
    elif intention == "calcul":
        return calculer(texte)
    elif intention == "heure":
        return obtenir_heure()
    elif intention == "recherche":
        return search_web(texte)
    else:
        return reponse_inconnu()


def demarrer_agent():
    """Lance la boucle interactive de l'agent."""

    print("=" * 50)
    print("   Bienvenue dans Mini Agent IA ! 🤖")
    print("=" * 50)
    print("Je peux répondre à des questions sur :")
    print("  • La météo      (ex: météo à Paris)")
    print("  • Les calculs   (ex: 15 * 4 + 2)")
    print("  • L'heure       (ex: quelle heure est-il ?)")
    print("  • Le web (sim.) (ex: cherche des infos sur Python)")
    print("\nTape 'aide' pour plus d'infos, 'quitter' pour partir.")
    print("-" * 50)

    while True:
        try:
            saisie = input("\nToi : ").strip()

            if not saisie:
                print("Agent : (Dis quelque chose ! Tape 'aide' si tu es perdu.)")
                continue

            if saisie.lower() in ("quitter", "exit", "quit", "q", "au revoir", "bye"):
                print("\nAgent : Au revoir ! À bientôt 👋")
                break

            reponse = traiter_message(saisie)
            print(f"\nAgent : {reponse}")

        except KeyboardInterrupt:
            print("\n\nAgent : Interruption détectée. À bientôt ! 👋")
            break


# ---------------------------------------------------------------------------
# Point d'entrée du programme
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    demarrer_agent()
