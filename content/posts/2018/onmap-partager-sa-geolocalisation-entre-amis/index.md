+++
title = "onMap : partager sa géolocalisation entre amis"
slug = 'onmap-partager-sa-geolocalisation-entre-amis'
aliases = ['/post/onmap-partager-sa-geolocalisation-entre-amis']
date = '2018-12-31T09:47:51.000Z'
draft = false
tags = ["onmap","geolocalisation","git","projet"]
image = 'featured.jpg'
+++

31 décembre, il n'est jamais trop tard pour dévoiler un nouveau projet !

Ces dernières semaines j'ai travaillé sur un service permettant de partager sa position géographique avec ses amis / famille... Le but étant d'être multi-platforme, sécurisé et respectueux de la vie privée. Pour la cartographie j'ai donc bien évidemment utilisé Open Street Map !

Pour cela j'ai créé un serveur NodeJS avec des WebSockets pour inter-connecter les utilisateurs entre eux. J'ai aussi développé une application Android (en espérant un jour en faire une sur iOS).

## Comment ça fonctionne ?

N'importe qui peut héberger une instance de onMap sur son serveur, la mienne est disponible sur [onmap.pixelswap.fr](https://onmap.pixelswap.fr/). Les utilisateurs accèdent au site sur leur navigateur ou via l'application Android et se connecte à une room (espace d'échange) avec un nom d'utilisateur et un mot de passe.

Tout le monde peut se connecter une room mais si vous ne disposez pas du même mot de passe les échanges ne pourront être déchiffrés !

En parlant de chiffrement justement, j'utilise de l'AES avec des clés en 256 bits en utilisant bien sûr un vecteur d'initialisation aléatoire. Les mots de passe ne transitent jamais sur le réseau, les messages et données de géolocalisation sont chiffrés et déchiffrés uniquement côté client.

## Et dans le futur ?

Pour l'instant le projet est en ligne sur mon git personnel : [https://labs.pixelswap.fr/mikescops/onMap](https://labs.pixelswap.fr/mikescops/onMap), j'invite toutes les personnes qui le souhaitent à y contribuer.

Je pense que beaucoup de choses sont encore à améliorer que ce soit au niveau design ou au niveau du code. Ce projet est plus une expérimentation à l'heure actuelle.

Concernant de nouvelles fonctionnalités, j'aimerais beaucoup intégrer des fonctions sociales plus avancées, et jouer sur le système de localisation : détecteur de proximité entre personnes, tracés de routes...
