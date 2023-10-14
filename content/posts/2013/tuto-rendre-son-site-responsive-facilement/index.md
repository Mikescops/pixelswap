+++
title = "[TUTO] Rendre son site responsive facilement"
slug = 'tuto-rendre-son-site-responsive-facilement'
aliases = ['/post/tuto-rendre-son-site-responsive-facilement']
date = '2013-11-19T17:10:26.000Z'
draft = false
tags = ["tuto","css","responsive"]
image = 'featured.png'
+++

Dans ce petit tutoriel je vais vous apprendre une manière simple d'adapter votre site web aux mobiles, en le rendant responsive. 

**Alors comment ça se passe ?**  
Et bien, il vous suffit de modifier votre css pour chaque résolution. Je vais vous présenter ici la solution la plus simple. Dans votre feuille de style vous allez définir une largeur d'écran pour laquelle le css de votre objet va changer, voici un example avec le contaioner de votre site.  
​

```scss
.container {
    width: 80%
}

@media (max-width: 640px) {
    .container {
        position: relative;
        bottom: 0;
    }
}
```

Vous l'aurez compris, pour les appareils avec un écran inférieur à 640px mon container apparaitra avec une largeur de 100%. De plus n'hésitez pas à utiliser les pourcentages, ils rendent vraiment les choses facile pour le "resposive design". Vous pouvez utiliser aussi le "min-width" pour déterminer tous les affichages au dessus de la résolution choisie.

Si vous êtes sur votre ordinateur, vous pouvez vous amuser à redimensionner la taille de votre navigateur, j'ai créé ce site pour qu'il soit resposive. 

L'essayer c'est l'adopter !
