+++
title = "A simple setup for an Ubuntu server"
slug = 'a-simple-setup-for-an-ubuntu-server'
aliases = ['/post/a-simple-setup-for-an-ubuntu-server']
date = '2021-11-20T17:48:35.000Z'
draft = false
tags = ["server","ubuntu","setup","infrastructure"]
image = 'featured.png'
+++

Setup an Ubuntu server may be done in multiple ways but I'd like to share with you the simple and quick steps I usually do when I get a raw machine in my hands.

  

## Setup the SSH connection

Let's start with the basics, you need to connect to your server instance. Usually, during the creation of your container or virtual machine you have the opportunity to inject your SSH public key into it. If it's the case, DO IT, then SSH will be enabled by default and you can connect without using a password.

If it's not the case, you can copy your public SSH key into ~/.ssh/authorized\_keys and enable the ssh service.

  

Then you can connect to the root user:

```bash
ssh root@<server_ip> -i ~/.ssh/id_pk # i usually use -i option to select the ssh key as i have multiple ones
```

Hopefully, your first step on the machine is to update the server packages:

```bash
apt update

apt upgrade
```

  

## Prepare a non-privileged user

Add a non-privileged user (name "demo" for this tutorial):  

```bash
adduser demo
```

  

Optional: As we're on Ubuntu the sudo package is available, so let's use this feature and give some privileges to our user (this step may not be recommended in terms of security).

```bash
# we add the user to the sudoers
usermod -aG sudo demo
```

  

Copy the authorized\_keys to your demo user (so you can still ssh on it):  

```bash
rsync --archive --chown=demo:demo ~/.ssh /home/demo
```

**  
Note**: it is the same thing as:

```bash
mkdir /home/worker/.ssh
cp ~/.ssh/authorized_keys /home/worker/.ssh/authorized_keys
chown worker:worker /home/worker/.ssh/authorized_keys
```

At this point, you can test connecting with demo user.

## Let's harden a bit the server

You should disable root login:  

```bash
vi /etc/ssh/sshd_config

# edit / add those lines
PermitRootLogin no

# if you never lose your SSH keys
PasswordAuthentication no
```

  

You can also configure the ufw package which is a simple firewall.

**Important note**: make sure you allow SSH ports, otherwise, you will be locked out.  
  

```bash
ufw app list
ufw allow 22 # or something else depending on your default ssh port
ufw allow http
ufw allow https # for a web server
ufw enable
ufw status
```

And voilà! These are some quick steps but you have already a good setup to start working. Please share any improvements you find to this guide (remember I want to keep it short) and I'll update the page.
