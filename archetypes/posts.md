---
title: '{{ replace .File.ContentBaseName `-` ` ` | title }}'
slug: '{{ .File.ContentBaseName }}'
aliases: ['/post/{{ .File.ContentBaseName }}']
date: '{{ .Date }}'
draft: false
image: 'featured.jpeg'
tags: []
---

Content of the post