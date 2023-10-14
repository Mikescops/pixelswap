+++
title = "Python : Transformer une image en niveau de gris en noir et blanc"
slug = 'python-transformer-une-image-en-niveau-de-gris-en-noir-et-blanc'
aliases = ['/post/python-transformer-une-image-en-niveau-de-gris-en-noir-et-blanc']
date = '2014-01-11T16:27:38.000Z'
draft = false
tags = ["python","binaire","image","convertir"]
image = 'featured.jpg'
+++

Le Python c'est le langage qui permet de faire plein de trucs sympa, comme binariser une image.

Tout d'abord il vous faut le logiciel [Python](http://www.python.org/). Pour ce qui est de la partie code, c'est un peu complexe pour un début mais vous comprendrez facilement les différentes fonctions.

Commencez par créé un dossier pour mettre votre code, et ajoutez [cette librairie](https://www.lama.univ-savoie.fr/pagesmembres/hyvernat/Enseignement/1011/info223//images.py) à l'intérieur. Puis, insérez dans le premier dossier une image en .pgm (niveau de gris).

Voici la partie code, créez un fichier dans l'IDLE Python et placez y ce code lisez bien les commentaire :

```python
from images import *

image_init=im_ouvre('imageorigine.pgm') # Ouvre une image en niveau de gris

tableau=image_init[0]

largeur=len(tableau[0])
print('largeur=',largeur)
hauteur=len(tableau)
print('hauteur = ',hauteur) # Affiche la taille de l'image

def binarise(tab, seuil):
   """Cette fonction renvoie un tableau représentant l'image binarisée"""
   for i in range (0,hauteur,1) :
      for j in range (0,largeur,1) :
      #print(i,j)
      if tab[i][j] >= seuil :
         tab[i][j] = 0
      else :
         tab[i][j] = 1
   return (tab)

####################################################################
# Permet de lancer la fonction et de déterminer le seuil noir/blanc qui est ici à 127.
tableau_nouv=binarise(tableau,127)

# Enregistrement du fichier au format PBM
image_nouv=(tableau_nouv, 'PBM')

im_sauve(image_nouv,'lenabin')
```

Puis enregistrez le dans votre dossier.

Et voilà vous n'avez plus qu'à appuyer sur F5 ou à lancer le fichier normalement.

Pour mieux comprendre comment cela fonctionne il faut juste vous dire qu'une image c'est un énorme tableau de nombre et que vous convertissez les images au dessus du seuil en 0.

**Mise à jour 2021:** 

Vous pouvez aussi passer d'une image en couleur à un niveau de gris très simplement avec la librairie PIL.

Pour l'installer, utilisez [pip](https://packaging.python.org/tutorials/installing-packages/):

```bash
pip install Pillow
```

Et le code est aussi simple que ça:

```python
from PIL import Image, ImageEnhance

file = "./test-img1.jpg"
img = Image.open(file)

filter = ImageEnhance.Color(img)
img = filter.enhance(0)
img.show()
```

Si vous avez un problème ou des questions, c'est plus bas.
