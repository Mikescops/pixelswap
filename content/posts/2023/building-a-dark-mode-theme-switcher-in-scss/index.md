+++
title = "Building a dark mode theme switcher in SCSS"
slug = 'building-a-dark-mode-theme-switcher-in-scss'
aliases = ['/post/building-a-dark-mode-theme-switcher-in-scss']
date = '2023-12-22T16:50:07.404Z'
draft = false
tags = ["tutorial", "css", "scss", "dark-mode"]
image = 'featured.jpg'
+++

Few years ago I made a simple tutorial to explain [how to build a dark mode theme switcher in CSS](https://pixelswap.fr/entry/tuto-creer-un-theme-sombre-automatique-en-fonction-de-l-heure/). Today I want to update it and show you how to do it in SCSS and how to use the default system theme.

## The HTML

First, we need to create a simple HTML structure with a button to switch the theme and a container to display the content.

```html
<button class="theme-switcher">Switch theme</button>
<div class="container">
    <h1>My website</h1>
    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum.</p>
</div>
```

## The SCSS

For the SCSS part, we will use a mixin to create the dark mode. We will use the `prefers-color-scheme` media query to detect if the user has a dark mode enabled on his system. If it's the case, we will apply the dark mode to the website. If not, we will use a simple class to switch the theme.

```scss
@mixin darkMode {
    @media (prefers-color-scheme: dark) {
        @content;
    }

    html.dark & {
        @content;
    }
}
```

Now we can use this mixin to create our dark mode.

```scss
.container {
    background-color: #fff;

    @include darkMode {
        background-color: #000;
    }
}
```

With the previous code, the background color of the container will be white by default and black if the user has a dark mode enabled on his system or if he has clicked on the button to switch the theme.

## The JavaScript

Now we need to add a simple JavaScript code to switch the theme when the user clicks on the button.

```js
const themeSwitcher = document.querySelector('.theme-switcher');
const html = document.querySelector('html');

themeSwitcher.addEventListener('click', () => {
    html.classList.toggle('dark');
});
```

In order to save the user's choice, we can use the `localStorage` to store the theme.

```js
const themeSwitcher = document.querySelector('.theme-switcher');
const html = document.querySelector('html');

if (localStorage.getItem('dark-mode') === 'true') {
    html.classList.add('dark');
}

themeSwitcher.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('dark-mode', document.documentElement.classList.contains('dark'));
});
```

## The result

That's it! We have a simple dark mode theme switcher in SCSS. You can see the result in the CodePen below.

<iframe height="300" style="width: 100%;" scrolling="no" title="Dark mode with SCSS and system theme" src="https://codepen.io/mikescops/embed/RwdwQrX?default-tab=html%2Cresult&editable=true&theme-id=light" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
  See the Pen <a href="https://codepen.io/mikescops/pen/RwdwQrX">
  Dark mode with SCSS and system theme</a> by Corentin Mors (<a href="https://codepen.io/mikescops">@mikescops</a>)
  on <a href="https://codepen.io">CodePen</a>.
</iframe>

<br>

### Bonus

If you want to test in your browser the system theme (this is for Chrome): inspect the page, go to the "Rendering" tab and change the theme to "Dark".
![How to emulate color scheme in Chrome](emulate-color-scheme.png)
Enjoy!
