+++
title = "Détecter si un stream Dailymotion est live en PHP ou Javascript"
slug = 'detecter-si-un-stream-dailymotion-est-live-en-php-ou-javascript'
aliases = ['/post/detecter-si-un-stream-dailymotion-est-live-en-php-ou-javascript']
date = '2014-04-26T18:27:06.000Z'
draft = false
tags = ["live","stream","php","javascript","dailymotion"]
image = 'featured.jpg'
+++

Dans ce tutoriel je vias vous apprendre a détecter si un stream dailymotion est live ou pas et ce en PHP et en Javascript. Vous allez voir, le code est assez simple et nécessitera sans doute un fichier cache si vous voulez detecter plusieurs streams à la fois sans surcharger le chargement de votre site.

On commence par la partie PHP :

On passe au javascript qui nécessite Jquery pour lire le JSON !

Voilà donc la méthode est la même pour les deux, on se rend à l'adresse de l'api dailymotion et on regarde si la variable "onair" est sur true ou false et on affiche un texte en conséquence.

Dîtes moi si vous y êtes arrivés et si vous avez des questions n'hésitez pas :)
