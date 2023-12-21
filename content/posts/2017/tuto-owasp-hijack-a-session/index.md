+++
title = "[TUTO] Owasp : Hijack a session"
slug = 'tuto-owasp-hijack-a-session'
aliases = ['/post/tuto-owasp-hijack-a-session']
date = '2017-07-04T06:56:40.000Z'
draft = false
tags = ["owasp","hack","hijack","securite","administration"]
image = 'featured.jpg'
+++

Notre première mission est une Session Hijack sur la plateforme vulnérable Owasp.

**Description de la stratégie:**

Notre stratégie sera d’utiliser le bruteforce afin de pouvoir voler les identifiants de l’utilisateur via les cookies en transit sur le réseau.

Étant étudiant en sécurité informatique, je réalise régulièrement des sujets pratiques afin de me familiariser avec les différents outils de hack et de protection. Je vous propose donc de partager avec vous, dans une série de tutoriels, mon travail. Si vous avez des remarques sur certains propos qui vous paraissent erronés, les commentaires sont à votre disposition.

**Description de cette attaque “vol de sessions”:**

Le vol de session (session hijacking en anglais) est une attaque qui consiste à s'introduire dans une session existante entre deux hôtes et à intervenir en cours de communication en se faisant passer pour l'un d'entre eux.

Plusieurs solutions de vol de sessions existent:

Le source routing est une option du protocole IP qui permet de spécifier le chemin à suivre pour les paquets IP, à l'aide d'une série d'adresses IP indiquant les routeurs à utiliser. De fait, il est possible d’acheminer les paquets vers un routeur sous notre contrôle. Si le source routing est désactivé (on suppose que c’est le cas dans la plupart des systèmes actuels), on peut tenter de faire des “blind attacks” c’est à dire envoyer des paquets à l’aveugle en essayant de prédire les numéros de séquence (SESSIONID par exemple). La dernière technique peut être de faire planter la machine de l’un des participants à l’échange sur le réseau pour prendre sa place.

En résumé il existe 3 techniques:

*   usurpation d’adresse: falsification de données
    
*   attaque par interception (“Man-In-The-Middle”): vol de cookie HTTP en transit
    
*   attaque par infection du navigateur (“Man-In-The-Browser”): Installation de code sur le navigateur pour transférer des données à un tiers
    

**Résultats obtenus:**

On commence par utiliser Webscarab pour intercepter la requête envoyer par le site:

Ensuite on utilise le logiciel pour générer un série de WEAKID en recherchant deux WEAKID qui ne se suivent pas puisque cela signifie que le WEAKID manquant existe déjà.

Dans la séquence ci-dessus on trouve un identifiant manquant commençant par 10179, donc on obtient le tableau suivant:

ID

Value

id précédent

10178-1495099558338

id recherché

10179-1495099558 . . .

id suivant

10180-1495099558439

Il ne nous reste plus qu’à trouver les trois derniers chiffres manquant à l’id recherchant sachant qu’il seront compris entre 338 et 439.


On utilise maintenant la fonction “fuzzer” de Webscarab permettant de bruteforcer ces trois derniers chiffres et ainsi découvrir les chiffres dont nous avons besoin. en regardant les paquets générés, on recherche un paquet dont la taille est différente, indiquant que la réponse du serveur est différente de celle des autres.

Une fois que l’on a trouvé la bonne requête, on en observe les détails pour retrouver le WEAKID recherché. 

Ici, notre WEAKID recherché est donc 10179-1495099558388, Il ne reste plus qu’à intercepter de nouveau une requête, remplacer le WEAKID par celui que l’on a trouvé ci dessus pour finalement obtenir le résultat voulu:


**Conseils et recommandations:**

Pour sécuriser son application, il est recommandé de mettre en place une politique de gestion des cookies en instaurant des règles et des bonnes pratiques telles que la limitation des cookies aux seuls cookies sécurisés.

Il est nécessaire de limiter la durée de validité des cookies afin de limiter le vol de sessions et ajouter une protection CSRF pour protéger aussi une fois la session expirée.

Il faut utiliser avec parcimonie les solutions d’authentification unique même si elles proposent une expérience utilisateur conviviales car une vulnérabilité dans celles-ci peut permettre à un pirate d’accéder à plusieurs compte d’un coup.

On peut utiliser un processus de type fail2ban pour se prémunir des attaques de type bruteforce qui cherchent à deviner les numéros de séquence.
