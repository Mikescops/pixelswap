+++
title = "[TUTO] Créer un thème sombre automatique en fonction de l'heure"
slug = 'tuto-creer-un-theme-sombre-automatique-en-fonction-de-l-heure'
aliases = ['/post/tuto-creer-un-theme-sombre-automatique-en-fonction-de-l-heure']
date = '2019-01-06T10:32:24.000Z'
draft = false
tags = ["dark","theme","sombre","css","web","html","jquery"]
image = 'featured.jpg'
+++

Les dark theme ou thèmes sombres sont un bon moyen d'améliorer l'expérience utilisateur en lui proposant une interface alternative pouvant à la fois améliorer sa lecture du site et diminuer la consommation électrique de son appareil (notamment sur les écrans OLED).

Dans ce tutoriel je vais vous apprendre une méthode basique pour créer un thème sombre et l'activer en fonction de l'heure de la journée.

## Un thème sombre au clic d'un bouton

Commençons par créer une page HTML très basique avec les éléments suivants :

```html
<body>
    
    <h1>Titre du site</h1>
    <p>Paragraphe quelconque</p>

    <button id="darkTrigger">Activer le thème sombre</button>
    
</body>
```

Ainsi qu'une feuille de style CSS contenant les classes pour notre thème sombre :

```css
/** Dark CSS */

.dark {
  background-color: #112F41;
  color: #ffffff;
}

.dark button {
  background: #144098;
  color: #fff;
}
```

Il vous faudra ensuite inclure la [librairie Jquery](https://code.jquery.com/) qui vous permettra de gagner du temps l'écriture du Javascript.

L'opération est simple, on détecte le clic sur le bouton et on ajoute une classe "dark" à l'élément <body> :

```javascript
$("#darkTrigger").click(function(){
    if ($("body").hasClass("dark")){
        $("body").removeClass("dark");
    }
    else{
        $("body").addClass("dark");
    }
});
```

En fonction de si la classe est déjà présente ou non, on l'ajoute ou on la retire.

## Automatiser l'activation en fonction de l'heure

Pour cela nous allons utiliser la fonction ready de Jquery qui attend que le DOM soit entièrement chargé, puis nous initialisons une variable avec la Date actuelle (timestamp) avec la quelle nous récupérons l'heure actuelle. Il suffit ensuite de tester si l'heure est incluse dans un créneau prédéfini (ici entre 17h et 8h), si c'est le cas le thème sombre est activé.

```javascript
$(document).ready(function () {
    var d = new Date();
    var h = d.getHours();

    if(h > 17 || h < 8){
        $("body").addClass("dark");
    }
});
```

## En démo

<iframe height="434" scrolling="no" title="Automatic night dark theme" src="//codepen.io/mikescops/embed/rovNVb/?height=434&amp;theme-id=light&amp;default-tab=js,result" frameborder="no" allowfullscreen="true" style="width: 100%;">See the Pen <a href="https://codepen.io/mikescops/pen/rovNVb/">Automatic night dark theme</a> by Corentin Mors (<a href="https://codepen.io/mikescops">@mikescops</a>) on <a href="https://codepen.io">CodePen</a>.</iframe>

J'espère que ce tutoriel vous a été utile et n'hésitez pas à poser des questions dans les commentaires !
