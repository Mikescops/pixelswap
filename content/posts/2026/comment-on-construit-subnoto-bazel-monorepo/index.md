---
title: Comment on construit Subnoto (et comment on a arrêté de se compliquer la vie)
slug: comment-construit-subnoto-bazel-monorepo
post_lang: fr
date: 2026-03-23T14:43:27.902Z
draft: false
tags:
  - projet
  - développement
  - bazel
  - monorepo
  - kubernetes
  - terraform
  - gitlab
aliases:
  - post/comment-construit-subnoto-bazel-monorepo
image: featured.png
---

Au démarrage de [Subnoto](https://subnoto.com/), nous n'avions pas une vision figée de la "stack idéale" : surtout des contraintes - sécurité exigeante, plusieurs langages, SDKs à maintenir, et la volonté d'itérer vite sans tout casser à chaque fois. Ce billet raconte comment nous avons cessé de bricoler pour réduire la friction, jusqu'à un ensemble déclaratif et reproductible ([Bazel](https://bazel.build/), monorepo, environnements distants, [Kubernetes](https://kubernetes.io/), [GitLab](https://about.gitlab.com/)). Public visé : équipes qui accumulent de la complexité multi-langage et se demandent où investir tôt.

---

## Des contraintes plutôt qu'une stack parfaite

Comme beaucoup, nous avons d'abord visé le "simple". Assez vite, il est apparu que simple ne voulait pas dire scalable : la dette se voyait dans les allers-retours entre repos, les builds opaques et les environnements qui divergeaient.

## Le moment où l'on a arrêté de bricoler

À un moment, la friction a été suffisante pour poser franchement la question :

> Est-ce qu'on construit le produit... ou est-ce qu'on lutte contre notre stack ?

C'est à ce moment-là que nous avons sérieusement regardé **[Bazel](https://bazel.build/)** - non par effet de mode, mais parce que l'approche est radicale. Bazel force l'explicitation des dépendances, des builds et du graphe "qui dépend de quoi". Contraignant au début, cela apporte quelque chose de rare en ingénierie à grande échelle : **de la prévisibilité**.

## Le choix structurant : le monorepo (sans dogme)

Très vite, une autre décision s'est imposée : tout regrouper. Pas par amour du monorepo, mais parce que l'éclatement multi-repos devenait ingérable pour notre cas.

Aujourd'hui, Subnoto fonctionne avec une approche hybride :

- un **dépôt privé** pour le cœur produit ;
- un **dépôt public** pour ce que nous open sourçons (SDKs, certaines briques, etc.).

Les deux sont liés **au niveau du build** : avec Bazel, un dépôt peut dépendre de l'autre via des dépendances externes (workspace / modules), ce qui conserve un graphe de build cohérent même réparti sur plusieurs repos.

L'expérience reste proche d'un monorepo :

- un seul graphe de dépendances ;
- une cohérence globale ;
- une CI qui raisonne sur l'ensemble ;

tout en séparant clairement ce qui reste privé de ce que nous partageons.

Pour visualiser cette architecture hybride, voici un schema simplifie :

```d2
direction: right

developer: "Developpeur"

private_repo: "Repo prive\n(core produit)"
public_repo: "Repo public\n(SDKs, briques open source)"

bazel_graph: "Graphe Bazel unique"
ci: "Pipeline CI"
artifacts: "Artifacts / Releases"

developer -> private_repo: "code"
developer -> public_repo: "contribs OSS"

private_repo -> bazel_graph: "targets internes"
public_repo -> bazel_graph: "dependances externes"

bazel_graph -> ci: "build + tests cibles"
ci -> artifacts: "publication"
```

## Monorepo n'est pas monolithe

Nous sommes en monorepo, pas en monolithe. Chaque module reste indépendant, versionné et isolé - Bazel pousse d'ailleurs cette granularité. Résultat paradoxal : **plus le dépôt grossit, plus la structure peut rester lisible**, à condition de respecter les frontières entre cibles.

## L'effet sur les outils (et l'IA)

Un bénéfice inattendu : lorsque toute la codebase pertinente est accessible dans un même contexte, on limite le changement de contexte mental, les dépendances "magiques" et le code "caché" ailleurs. Pour des outils comme Cursor ou d'autres agents, c'est un gain net : parcourir le graphe, comprendre les dépendances et proposer des changements cohérents. Un multi-repos classique fragmente souvent ce contexte.

## "Oui mais la CI sera lente"

C'est l'objection classique - et nous la partagions : gros dépôt, beaucoup de code, builds interminables. **C'est là que Bazel change la donne.**

Bazel ne "rebuild" pas un projet dans son ensemble : il ne reconstruit que ce qui est nécessaire. Chaque étape est déterminée par ses entrées et ses dépendances ; si rien ne change, rien ne s'exécute inutilement. **Tout peut être mis en cache** - localement, en CI, ou à distance - dans l'esprit des builds déterministes et réutilisables à grande échelle.

## Ce que cela change concrètement

Chez nous, une modification backend ne force pas le rebuild ni les tests du frontend. **Une CI complète peut tenir en quelques minutes** même avec un dépôt conséquent - et plus le projet grossit, plus le cache a de chances d'être utile.

## Abandonner le "ca marche chez moi"

Une fois le build reproductible, la question suivante est venue naturellement : **et l'environnement de développement ?** Trop d'écarts entre machines de dev, CI et production nous ont poussés vers une décision nette : **déporter le développement dans des environnements distants provisionnés**.

Nous utilisons **[Coder](https://coder.com/)** : en pratique, vous lancez un environnement, **[Terraform](https://developer.hashicorp.com/terraform)** déploie, vous codez. Base de données, stockage, services et outils sont prêts, **avec les mêmes versions pour tout le monde**. L'expérience reste proche du local (environnement distant type VS Code Server), mais la machine personnelle redevient secondaire : setup reproductible, onboarding en quelques minutes pour un nouveau développeur.

Comme tout est défini en Terraform et déployé sur **Kubernetes**, on peut viser des environnements proches de la prod, des enclaves sécurisées ou des scénarios complexes déjà au stade du dev.

## Le cache partagé

Un des effets les plus forts : **le cache Bazel est partagé entre dev et CI**. Environnements quasi identiques et builds déterministes font qu'un build en dev peut nourrir la CI, et inversement - ce qui compresse encore les temps de build.

Et c'est aussi plus facile a expliquer avec un schema de flux cache :

```d2
direction: right

dev_env: "Environnement dev distant\n(Coder + Terraform)"
ci_env: "Environnement CI"
remote_cache: "Bazel Remote Cache"
build_graph: "Build deterministe"
tests: "Tests cibles"

dev_env -> build_graph: "bazel build/test"
ci_env -> build_graph: "bazel build/test"

build_graph -> remote_cache: "push cache entries"
remote_cache -> build_graph: "cache hit"

build_graph -> tests: "execute uniquement le necessaire"
```

## Kubernetes et GitLab

Dès que les environnements sont déclaratifs et les builds reproductibles, **Kubernetes** s'inscrit comme une suite logique pour le dev, la CI et la production, avec **isolation stricte** entre environnements.

Nous utilisons **[GitLab.com](https://gitlab.com/)** par pragmatisme (pas de self-host pour l'instant : maintenance, priorités), en gardant nos runners et la maîtrise des pipelines ; pour certains builds critiques, nous passons par des runners officiels pour la provenance. Si le sujet vous intéresse, j'avais déjà partagé un retour d'expérience autour de GitLab dans [cet article sur GitLab Notify](/entry/creation-gitlab-notify-une-extension-pour-ameliorer-le-flow-de-review/).

## Ce que nous en retenons

Nous n'avons pas cherché la stack parfaite : nous avons cherché à **réduire la friction**. Petit à petit, le système converge vers quelque chose où tout est déclaratif, reproductible et relié — et où **l'on passe plus de temps à construire qu'à réparer**.

## Est-ce que c'est overkill ?

Probablement pour beaucoup de projets. Dans notre contexte, c'est ce qui nous permet de tenir la complexité et d'éviter le piège : avancer vite... puis passer des mois à tout reconstruire.

**Si vous construisez quelque chose de simple, ne faites pas ça.** En revanche, si vous accumulez plusieurs langages, plusieurs SDKs et des contraintes fortes, il peut être pertinent de traiter ces sujets **plus tôt** que vous ne le pensez.

---

Pour aller plus loin, vous pouvez consulter la [documentation Subnoto](https://subnoto.com/documentation), notamment la partie développeur sur [l'API](https://subnoto.com/documentation/developers/working-with-the-api). Côté blog, j'ai aussi publié un article sur [la création d'un provider Terraform](/entry/how-we-made-a-terraform-provider-for-home-assistant/) et un autre sur la [migration de ce blog vers Hugo/Markdown](/entry/migrating-from-a-php-cms-to-a-markdown-generated-blog/), qui complètent bien les sujets d'outillage et de reproductibilité évoqués ici.
