+++
title = "How we made a Terraform provider for Home Assistant"
slug = 'how-we-made-a-terraform-provider-for-home-assistant'
aliases = ['/post/how-we-made-a-terraform-provider-for-home-assistant']
date = '2023-01-10T21:11:43.000Z'
draft = false
tags = ["hashicorp","vault","terraform","development"]
image = 'featured.jpg'
+++

I know I’m really late to post about this but in December 2021 with my friends Eléonore & Cyril we decided to participate in a hackathon by Hashicorp. The goal was pretty simple, build something in the “holidays mood” with their products.

And that’s what we did 🚀

Ultimately, we got selected to talk in their Conference “HashiTalks 2021” to talk about how we used Terraform to automate our house.

Unfortunately, the record of the conference got lost, but I’ll share below a cool video presentation of the project and the slides from the presentation.

  

## Building a Terraform provider and a vault extension for Home Assistant

I think a video presentation is worth a 1000 words post, so here it is:

<iframe style="width: 100%; height: 512px;" src="//www.youtube.com/embed/kM5IfW3SPY0" allowfullscreen="" data-dashlane-frameid="180388626436" frameborder="0"></iframe>

_\*(the microphone didn’t catch correctly the google-home sound so please make sure your audio is high enough to be able to hear it during demo)_

This project can be reused by anyone to easily control home IoTs via code and automate devices/ambiances. You need to have a [Home Assistant](https://www.home-assistant.io/) instance running (installed on a Raspberry Pi for example) and some lights and media players connected to it.

For now, the terraform provider is compatible with media players (speaker or TV) and lights but we will continue maintaining it and adding more device types.

The vault extension is also useful to quickly deploy a home-vault and start storing any secrets you need. For example, we store the API bearer token that is needed by the HomeAssistant Terraform provider. A different usage could be to store some ssh keys that you want to share between your local computers.

## Why this crazy project?

Firstly, we wanted to learn how to write terraform providers, as we are using terraform in our daily job we thought it could be a nice introduction to start building custom providers.

Secondly, we all like to hack our home devices and connect every object. So having a local vault to store our secrets and controlling different scenes and devices with terraform was our go to.

It was our first time coding with Golang too so any advice will be appreciated 😀

## Where to try it?

The terraform module repository is available at [shaeli/nowel](https://github.com/Shaeli/nowel).

The terraform provider is available at [mikescops/terraform-provider-homeassistant](https://github.com/Mikescops/terraform-provider-homeassistant) and on the [official terraform registry](https://registry.terraform.io/providers/Mikescops/homeassistant/latest).

The vault extension is available at [tidalf/ha-addon-vault](https://github.com/tidalf/ha-addon-vault) and installable through the addon-store.

## About the HashiTalks 2021

Well, as mentioned above, I’m pretty sad that the recording didn’t work at the time because we invested a lot of time and effort making a nice talk with live demos. I even made multiple computers and cameras recording setup which was sick.

But well anyway, [the slides are here](https://github.com/Shaeli/nowel/blob/main/Using%20hashicorp%20products%20at%20home.pdf) and I think they speak for themselves.  

<iframe src="https://docs.google.com/viewer?embedded=true&amp;url=https://github.com/Shaeli/nowel/raw/main/Using%20hashicorp%20products%20at%20home.pdf" style="width: 100%; height: 510px; border: none;"></iframe>

It started with a joke, “let’s code during holidays”, and ended up being a cool experience because it was with friends, because it was our first conference talk (online) and more importantly because we met cool people on the way (cc Grace 👋).

So please, if you have some spare time, do some crazy useless projects, it’s not that hard and you’ll learn a lot!
