+++
title = "Texte en 3D anaglyphe en CSS"
slug = 'texte-en-3d-anaglyphe-en-css'
aliases = ['/post/texte-en-3d-anaglyphe-en-css']
date = '2013-12-10T20:11:35.000Z'
draft = false
tags = ["3d","anaglyphe","css","html5"]
image = 'featured.jpg'
+++

Oui, vous avez bien lu ! Il est possible de faire des textes en 3D en css !

Comme vous le savez surement la 3D anaglyphe a pour but de forcer votre oeil à voir en relief en séparant 2 couleurs, généralement le rouge et le bleu.

**Comment ça marche ?**

La technique la plus simple pour cette opération est de dupliquer le texte et de superposer les deux textes obtenus. Cette technique est facilement réalisable en CSS. Pour commencer créez un titre <h1> qui contiendra le texte "MON TITRE EN 3D".

Utilisez ensuite le code ci-dessous (lisez bien les commentaires) :

h1 {

    position: relative; /\* Permettre la superposition des 2 textes \*/

    font-family: sans-serif; /\* Pour éviter les problèmes de compatibilité avec votre police \*/

    color: rgba(4, 12, 212, 0.5) /\* Couleur (bleu) rgba pour gérer la transparence \*/

}

​

h1:after{

    content: "MON TITRE EN 3D"; /\* Replacez votre titre ici pour le dupliquer\*/

    position: absolute;

    left: 10px;

    top: 5px; /\* Pour déplacer le titre de 10 px vers la gauche et de 5px vers le haut\*/

    color: rgba(255,0,0,0.5) /\* Le dernier chiffre et le taux de transparence de 0 à 1 \*/

}

La superposition de deux éléments à l'aide de la fonction :after permet de laisser supposer qu'il y a un troisième élément violet. Notez cependant que la transparence RGBA n'est pas gérée par tous les navigateurs.

Donnez moi vos impressions et vos remarques dans les commentaires.
