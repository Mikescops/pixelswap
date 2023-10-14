+++
title = "Mes lectures : SASS pour les Webs Designers"
slug = 'mes-lectures-sass-pour-les-webs-designers'
aliases = ['/post/mes-lectures-sass-pour-les-webs-designers']
date = '2015-03-11T16:01:20.000Z'
draft = false
tags = ["sass","preprocesseur","css","web","design"]
image = 'featured.jpg'
+++

Récemment je me suis penché sur un moyen d'augmenter mon efficacité pour coder mes feuilles de style en CSS. Très vite, le mot SASS m'est revenu comme un OVNI capable d'optimiser le CSS.

Mais débuter sur ce qu'on appelle le SASS n'est pas aussi évident, c'est pourquoi je me suis tourné vers ouvrage écrit par Dan Cederholm pour me guider.

Nommé "SASS pour les Webs Designers" et [paru](http://www.editions-eyrolles.com/Livre/9782212141474/sass-pour-les-web-designers) aux éditions Eyrolles, ce livre est une vrai porte d'entrée vers l'univers des préprocesseurs CSS. Documenté et illustré, on découvre pas à pas à créer nos premiers designs.

Si je n'ai pas envie de vous gâcher le plaisir de découvrir tout ça par vous même, il faut savoir que le SASS permet de coder le CSS comme un langage classique évolué. Vous pourrez donc créer des variables, des fonctions et autres boucles et ainsi rendre votre CSS agréable à lire et à coder.

Encore novice en la matière pour le moment, je vois en SASS, un gain de temps et un réel plaisir à créer des boucles qui seront formatées dans un CSS tout propre et bien organisé. SASS ne nous oblige cependant pas à modifier nos habitudes de travail, mais vient les élargir.

Un exemple d'utilisation de variables :

```
<span class="nv" style="box-sizing: border-box; color: rgb(0, 128, 128);">$font-stack</span><span class="p" style="box-sizing: border-box;">:</span>    <span class="n" style="box-sizing: border-box;">Helvetica</span><span class="o" style="box-sizing: border-box; color: rgb(0, 0, 0); font-weight: bold;">,</span> <span class="nb" style="box-sizing: border-box; color: rgb(0, 134, 179);">sans-serif</span>
<span class="nv" style="box-sizing: border-box; color: rgb(0, 128, 128);">$primary-color</span><span class="p" style="box-sizing: border-box;">:</span> <span class="mh" style="box-sizing: border-box; color: rgb(0, 153, 153);">#333</span>

<span class="nt" style="box-sizing: border-box; color: rgb(0, 0, 128);">body</span>
  <span class="nl" style="box-sizing: border-box; color: rgb(153, 0, 0); font-weight: bold;">font</span><span class="p" style="box-sizing: border-box;">:</span> <span class="m" style="box-sizing: border-box; color: rgb(0, 153, 153);">100%</span> <span class="nv" style="box-sizing: border-box; color: rgb(0, 128, 128);">$font-stack</span>
  <span class="nl" style="box-sizing: border-box; color: rgb(153, 0, 0); font-weight: bold;">color</span><span class="p" style="box-sizing: border-box;">:</span> <span class="nv" style="box-sizing: border-box; color: rgb(0, 128, 128);">$primary-color</span>
```

Vous trouverez ce livre ainsi que les autres de la collection A book Apart sur le [site officiel de l'éditeur](http://www.editions-eyrolles.com/Collection/10768/a-book-apart).
