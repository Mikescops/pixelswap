+++
title = "Ingénieur logiciel chez Dashlane, 9 mois plus tard"
slug = 'ingenieur-logiciel-chez-dashlane-9-mois-plus-tard'
aliases = ['/post/ingenieur-logiciel-chez-dashlane-9-mois-plus-tard']
date = '2019-12-04T09:54:49.000Z'
draft = false
tags = ["dashlane","logiciel","job"]
image = 'featured.jpg'
+++

Je ne l'avais pas mentionné sur ce blog, mais j'ai rejoint **Dashlane**, un gestionnaire de mots de passe, fin février en tant qu'ingénieur logiciel stagiaire puis maintenant junior. Dans ce billet, je souhaite revenir sur le passage de l'école au premier emploi et sur mon job actuel.

## De l'école au premier emploi

L'école, c'est faire des projets rapidement et les rendre tout aussi vite au prof sans prendre la peine de faire un projet maintenable ou récupérable plus tard. En fait, une des choses qu'on apprend assez naturellement c'est l'efficacité. Aucun doute là dessus, faire un truc qui marche dans les cas attendus c'est assez simple. Pourtant, une fois en entreprise et face à des utilisateurs ou des clients qui ne comprennent pas bien l'informatique on comprend très vite l'importance de gérer tous les cas et surtout ceux qu'on aurait jamais imaginés.

De ce premier constat il y a de nombreuses conclusions à tirer :

*   **L'importance d'écrire du code propre :** c'est un peu la base mais écrire des noms de fonctions qui ont du sens (passer de "mkSqrt" à "makeSquareRoot") devient une nécessité pour qu'un collègue relise ton code (ou même toi plus tard).
*   **Organiser son code :** fini les fichiers de 10000 lignes avec des fonctions main() qui font une API, le café et la peinture de la pièce. Bien diviser son code en sous dossiers et faire une action par fonction est la clé pour éviter des mauvaises surprises et pouvoir déboguer simplement.
*   **Documenter le code :** j'ai déjà entendu un prof en parler, une fois, ça semblait être une légende à l'époque ou du moins une perte de temps. Et pourtant, prendre un main un projet sans savoir comment il fonctionne, ne pas comprendre comment au moins le lancer arrive si souvent qu'une bonne documentation fait gagner du temps.
*   **Ne pas se moquer du code que tu vois :** sur une grosse code base, il arrive souvent de reprendre du code un peu vieux et faire un petit _git blame_ c'est  potentiellement voir son nom s'afficher. Parce que oui, on oublie vite les trucs crades d'avant, on pourra dire que c'était une "PoC" !
*   **Faire des tests unitaires :** si on avait pu évoquer la documentation en cours, les tests unitaires n'avaient jamais été évoqués et c'était pour moi un langage extraterrestre. "Il n'y a pas de changements qui ne cassent rien" dit un de mes collègues. En effet, si tu changes quelque chose dans le code comment être 100% sûr que tu n'as pas cassé autre chose ailleurs dans le code ? En ayant une batterie de tests (mais aussi de la QA) complète qui couvre un maximum de ton code.

## Mon job

Ingénieur logiciel est un intitulé très flou mais pour ma part je travaille sur la partie backend dans l'équipe serveur. Chez Dashlane, nous nous occupons de nombreuses tâches comme l'infrastructure (gestion et surveillance), l'API qui permet à tous les clients applicatifs de fonctionner mais aussi l'interaction entre les différents services comme par exemple l'équipe data. De par mes études, je suis aussi très lié avec l'équipe sécurité pour laquelle j'effectue des tâches diverses.

L'une des caractéristiques majeures de mon travail est donc d'être extrêmement diverse et s'apparente à une philosophie [DevSecOps](https://www.redhat.com/fr/topics/devops/what-is-devsecops). Si pour pour ma part cela me convient, ce n'est pas quelque chose qui est imposé par l'entreprise, chacun des membres de mon équipe doit être capable de travailler sur n'importe quelle tâche tout en pouvant définir des préférences.

Voici une liste non exhaustive des trucs cool que j'ai découvert au travail :

*   **Typescript :** Javascript c'est sympa mais tout est assez libre au niveau des types et c'est là que Typescript intervient. Il permet un typage statique optionnel des variables et des fonctions, la création de classes et d’interfaces, l’import de modules, tout en conservant l’approche non-contraignante de Javascript. De plus en plus démocratisé dans les projets modernes en entreprise Typescript limite la trop grande liberté octroyée par Javascript et empêche de nombreuses erreurs lors de la mise en production. Le temps consacré au typage est définitivement gagné en lisibilité et en sécurité.
*   **Terraform** **:** outil open-source développé par HashiCorp, il permet de provisionner des infrastructures sur de nombreux fournisseurs de services, pour notre part AWS, à partir d’une configuration donnée et conserver un état courant, ce qui permet d'avoir un suivi des modifications lors de l'application d'une nouvelle configuration.
*   **Vault :** outil aussi développé par Hashicorp, il permet de stocker tous les secrets liés au développement et à la mise en production. Ainsi, on peut stocker de manière très sécurisé des clés d'API, des certificats, des clés utilisées pour signer des packages...
*   **Gitlab CI :** si l'outil principal de Gitlab est très connu, les CI sont plus récentes et permettent de faire tourner des tests unitaires, construire les packages et autres artifacts à chaque nous commit. Cet outil est vraiment passionnant à utiliser tant les possibilités sont vastes. 

Je vous invite à vous essayer à ces technos, je prendrais peut être plus de temps pour en détailler certaines dans d'autres articles.

Si vous aussi vous avez découvert avec votre travail des technos que vous utilisez maintenant tous les jours, faîtes m'en part dans les commentaires.
