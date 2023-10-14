+++
title = "Générer un nombre aléatoire en Jquery"
slug = 'generer-un-nombre-aleatoire-en-jquery'
aliases = ['/post/generer-un-nombre-aleatoire-en-jquery']
date = '2014-07-06T09:07:52.000Z'
draft = false
tags = ["random","jquery","tuto","web","javascript"]
image = 'featured.jpg'
+++

Dernièrement, j'ai du déterminer le gagnant du concours lancé sur [Geek Mexicain](http://geek-mexicain.net) pour gagner Hitman Absolution. J'ai donc créé un code en Jquery qui permet de tirer un nombre aléatoire entre deux bornes. C'est un script assez simple mais il peut être modifié pour différentes applications.

Tout d'abord, il vous faudra la version de Jquery de votre choix, prenez la plus récente si vous le souhaitez et importez là dans votre page html.

Ensuite, voici le code dont vous aurez besoin :

En cliquant sur le lien "Générer", on appelle la fonction "getNumber" qui défini un nombre aléatoire entre les deux bornes. Pour terminer on utilise "_$('#result').html(randomnumber);_" pour afficher le résultat dans la balise souhaitée.
