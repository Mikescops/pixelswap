+++
title = "Displaying my vinyl collection from the Discogs API"
slug = 'displaying-my-vinyl-collection-from-the-discogs-api'
aliases = ['/post/displaying-my-vinyl-collection-from-the-discogs-api']
date = '2023-12-25T09:48:01.172Z'
draft = false
tags = ["tutorial", "javascript", "api", "discogs", "vinyl"]
image = 'featured.png'
+++

I recently started to collect vinyls and I wanted to display my collection on my website. I found that Discogs, a service that allows to catalog your vinyls, has a [public API](https://www.discogs.com/developers/) that can be used to retrieve the data of a user's collection. I made use of the [Hugo data templates](https://gohugo.io/templates/data-templates/) to store the vinyl list and their details and dynamically generated the collection page.

## Getting the data from the Discogs API

First, you need to create an account on [Discogs](https://www.discogs.com/) and generate an API token. You can do that by going to [this page](https://www.discogs.com/settings/developers) and clicking on create a personal access token. The API can be used without a token but if you want to retrieve the images of the releases you need to be authenticated.

_At this stage you just need to safely store this token somewhere, like in Dashlane for instance 😉_

Put this token in a environment variable named `DISCOGS_TOKEN`.

```bash
export DISCOGS_TOKEN=your_token
```

Then, you can use the [Discogs API](https://www.discogs.com/developers/) to retrieve the data of your collection.

```js
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');

// Replace with your username
const username = 'your_username';
// 0 is the folder ID for the main collection
const apiUrl = `https://api.discogs.com/users/${username}/collection/folders/0/releases`;

const fetchVinyls = async () => {
    try {
        const response = await fetch(apiUrl, {
            headers: {
                Authorization: `Discogs token=${process.env.DISCOGS_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        return data.releases;
    } catch (error) {
        console.error('Error fetching data from Discogs:', error);
        return [];
    }
};

const transformToJSON = (vinyls) => {
    return vinyls.map((vinyl) => ({
        title: vinyl.basic_information.title,
        artist: vinyl.basic_information.artists.map((artist) => artist.name).join(', '),
        label: vinyl.basic_information.labels.map((label) => label.name).join(', '),
        year: vinyl.basic_information.year,
        image: vinyl.basic_information.cover_image
    }));
};

const main = async () => {
    const vinyls = await fetchVinyls();
    const vinylsJSON = transformToJSON(vinyls);
    fs.writeFileSync('data/vinyls.json', JSON.stringify(vinylsJSON, null, 4));
    console.log('Vinyls data written to vinyls.json');
};

main();
```

The final JSON file will be stored in `data/vinyls.json` and will look like this:

```json
[
    {
        "title": "Outrun",
        "artist": "Kavinsky",
        "label": "Record Makers",
        "year": 2013,
        "image": "https://i.discogs.com/xxxx.jpeg"
    }
]
```

## Creating the view with Hugo

Now that we have the data we need to create the page that will display it.
You can simply create a new page named `vinyls.md` in the `content` folder of your Hugo project.

```md
---
title: 'Vinyls Collection'
layout: 'vinyls'
---
```

Then, you need to create a new layout named `vinyls.html` in the `layouts` folder of your Hugo project.

```go-html-template
{{ define "main" }}
    <div class="container">
        <h1>My vinyls collection</h1>
        <div class="vinyls">
            {{ range .Site.Data.vinyls }}
                <div class="vinyl">
                    <img src="{{ .image }}" alt="{{ .title }}" />
                    <div class="vinyl__details">
                        <h2>{{ .title }}</h2>
                        <p>{{ .artist }}</p>
                        <p>{{ .label }}</p>
                        <p>{{ .year }}</p>
                    </div>
                </div>
            {{ end }}
        </div>
    </div>
{{ end }}
```

This layout will loop through the data stored in the `vinyls.json` file and display the different vinyls.

I recommend to fetch the images locally instead of using the URL provided by the API. This way you can be sure that the images will be available even if the Discogs CDN is down. You can do so by using the `GetRemote` function of Hugo and convert it to the format you like best (here webp).

```go-html-template
{{- $image := resources.GetRemote .image }}
{{- $image_webp := $image.Fill "200x200 Center webp q100" }}

<img src="{{ $image_webp.RelPermalink }}" alt="{{ .title }}" />
```

If you want a more styled version of this page, you can check the [source code of my website](https://github.com/Mikescops/pixelswap/blob/main/themes/pixelswap-theme/layouts/_default/vinyls.html).

## Conclusion

We have seen how to retrieve the data of a Discogs collection and how to display it on a website using Hugo.
You can do even more with the API like retrieving the data of a specific release or artist or getting your wishlist. You can check the [Discogs API documentation](https://www.discogs.com/developers/) for more information.

I hope this tutorial will help you to display your vinyl collection on your website. If you have any questions, feel free to reach out to me on [Threads](https://threads.net/@corentin.mrs) or in the comments below.

_By the way, I'll talk to you soon about my turntable, it's amazing_ 🤫
