+++
title = "[Tuto] Boutons modulables au survol de la souris CSS"
slug = 'boutons-modulables-au-survol-de-la-souris'
aliases = ['/post/boutons-modulables-au-survol-de-la-souris']
date = '2013-11-25T18:14:48.000Z'
draft = false
tags = ["bouton","css","html5","tuto"]
image = 'featured.jpg'
+++

J'étais parti pour vous apprendre à faire un bouton qui disparaissait au survol de la souris, puis, je me suis dit que c'était vraiment inutile. C'est pourquoi je vous propose donc de faire un bouton qui va se modifier quand on passera la souris dessus. Ce tutoriel me permet de vous apprendre la fonction ":hover"

Commençons tout de suite par designer notre bouton en oubliant pas qu'il possède 2 formes bien distinctes : une classique et une au survol de la souris.

Pour l'html je vous propose de partir sur :

```

<div class="btn"> <a href="#votrelien">cliquez ici</a></div>
```

Quant au css, on va l'écrire sous cette forme (les commentaires sont là uniquement pour vous aider) :

```

.btn{
background-color: #40c781;
border-radius: 3px; /* Coins arrondis */
border-bottom: 2px solid #35a76e; /* Petite bordure en bas du bouton */
text-align: center; /* Centrer le texte */
}
.btn a{
text-decoration: none; /* Supprimer le soulignage du lien */
line-height: 42px; /* Changer la hauteur de la ligne d'écriture */
color: #fff; /* Couleur du texte blanche */
}
.btn:hover {
background-color: #34a46c; /* On modifie la couleur du fond au passage de la souris */
}
```

Votre bouton est maintenant fini ! Ce tutoriel vous permettra donc de modifier n'importe quel élément quand la souris passe dessus. 

Et en bonus je vous donne le code pour faire disparaître votre bouton et agacer vos utilisateurs (peu recommandé) :

```

.btn:hover{
display: none; /* Fais disparaitre le bouton */
}
```
