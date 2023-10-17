/** Create a new post in the content/posts/ folder, with the current year and the name of the blog passed in parameter as a slug 
 * 
 * The script will create a index.md inside this folder with the following content:
 * 
 * +++
title = "Title"
slug = 'slug'
aliases = ['/post/slug']
date = '2023-01-28T16:00:36.000Z'
draft = false
tags = []
image = 'featured.jpeg'
+++
 * 
*/

const fs = require('fs');
const path = require('path');

const title = process.argv[2];

if (!title) {
    console.error('Please provide a title for the post');
    process.exit(1);
}

const slug = title.toLowerCase().replace(/ /g, '-');
const date = new Date().toISOString();
const year = date.split('-')[0];
const folderName = `${year}/${slug}`;
const filePath = path.join('content/posts', folderName, 'index.md');

if (fs.existsSync(filePath)) {
    console.error('Post already exists');
    process.exit(1);
}

const fileContent = `+++
title = "${title}"
slug = '${slug}'
aliases = ['/post/${slug}']
date = '${date}'
draft = false
tags = []
image = 'featured.jpeg'
+++
`;

fs.mkdirSync(path.join('content/posts', folderName), { recursive: true });
fs.writeFileSync(filePath, fileContent);

console.log('Post created successfully');
