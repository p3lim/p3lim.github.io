---
layout: post
title: Setting up a WireGuard VPN Server
tags: vpn server
---

I've been using [OpenVPN](https://openvpn.net/) for a while on my home server just to keep my portable devices safe while roaming, but I've never 
quite liked its unstable nature, slow reconnection speeds and hosts of options making it harder to keep up with in terms of best practices.

I recently found out about [WireGuard](https://www.wireguard.com/), and was intrigued considering the [praise it got](http://lkml.iu.edu/hypermail/linux/kernel/1808.0/02472.html) from none other than [Linus Torvalds](https://twitter.com/linus__torvalds)!  
It boasts simple configuration, strong encryption, great performance and a codebase so small it can be audited in under a day. It's created by Jason A. Donenfeld, also known as [ZX2C4](https://www.zx2c4.com/), author of popular open source projects such as [pass](https://www.passwordstore.org/) and [cgit](https://git.zx2c4.com/cgit/about/).

Now, this is mostly for evaluation purposes, the project is still quite young and is considered a [work in progress](https://www.wireguard.com/#work-in-progress), so please make sure you know what you're getting yourself into.
I will not be doing benchmarks as there's loads out there already, this is merely a how-to for installing it yourself. 
If you want to know more about the project, read the [whitepaper](https://www.wireguard.com/papers/wireguard.pdf) and/or watch [presentations](https://www.wireguard.com/presentations/) about the project.

With the warnings out of the way, I wanted to test this out on my environment consisting of the following:

- Server running Debian 9.5
- Laptop running Arch Linux
- Phone running Android 8.1

The server will act as the VPN host, with the laptop and phone as clients connecting into its virtual network.

### Installation

I will be doing this on my server running Debian, but WireGuard supports most (if not all) major distributions, even other OSes!
Following the steps on the [official installation page](https://www.wireguard.com/install/), I added the sources and preferences and installed WireGuard like so:

```bash
sudo apt install wireguard
```
One thing that the installation page doesn't mention is that we'll also need the linux headers to create new links, so install that too:
```bash
sudo apt install linux-headers-$(uname -r)
```

### Configuring

WireGuard is relatively simple to get set up, but can get confusing if its your first time.  
A lot of the work is simplified with the `wg-quick` tool, which we'll be using.

First we'll need to generate some keys, and we'll store them in `/etc/wireguard/keys` so we'll have to make that directory too.
```bash
mkdir /etc/wireguard/keys
chmod 700 /etc/wireguard/keys
touch /etc/wireguard/keys/server
chmod 600 /etc/wireguard/keys/server
wg genkey > /etc/wireguard/keys/server
wg pubkey < /etc/wireguard/keys/server > /etc/wireguard/keys/server.pub
```

And there we have it, our private and public keys. Let's proceed with the configuration file:
```bash
touch /etc/wireguard/wg0.conf
nano /etc/wireguard/wg0.conf
```

In here we'll need to add an "interface", namely the server:
```ini
[Interface]
Address    = 10.0.0.1/24
PrivateKey = GAfZYrZqYd1YSoKs7Zd136hyQ8hJzZsariabybuuXG4
ListenPort = 51820
```
The `Address` field signifies the _virtual_ network that the server will be on, `/24` signifies the [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing).  
The `PrivateKey` is the key we generated earlier, copy-pasted from `/etc/wireguard/keys/server`.  
The `ListenPort` is the external port we're accepting traffic on, this **needs** to be opened on your firewall/router!

Now we just have to start it, which is super simple:
```bash
wg-quick up wg0 # wg0 must match the configuration file; wg0.conf
```

That's it, now you have your WireGuard server up and running!  
You can verify this by running `wg` to see WireGuard status, or `ip addr` to see the network interface status.

### Connecting the laptop

Now that WireGuard is running on the server, I want to connect my laptop to it. With Arch Linux, I install the packages:
```bash
pacman -S wireguard-tools linux-headers
```

I create the keys like before:
```bash
mkdir /etc/wireguard/keys
chmod 700 /etc/wireguard/keys
touch /etc/wireguard/keys/laptop
chmod 600 /etc/wireguard/keys/laptop
wg genkey > /etc/wireguard/keys/laptop
wg pubkey < /etc/wireguard/keys/laptop > /etc/wireguard/keys/laptop.pub
```
Then we need to create the config, much like before:
```bash
touch /etc/wireguard/wg0.conf
nano /etc/wireguard/wg0.conf
```

Now we'll need to add both an "interface" (for the laptop), and a "peer" (the server we're connecting to):
```ini
[Interface]
Address    = 10.0.0.2/24
PrivateKey = 8J1AJiIUOZZaIi4X58v3cGc3yHJg+96bW+6lD6q9q1E=

[Peer]
PublicKey  = 4MlvhLDMs53kHKPRpsfvQ5jIz8eajY7IbcIUbvfISXY=
AllowedIPs = 0.0.0.0/0 ::0/0
EndPoint   = vpn.example.com:51820
```

The interface `Address` is `10.0.0.2`, as this will be the laptop's address on the virtual network on the server.  
The interface `PrivateKey` is what we generated into `/etc/wireguard/keys/laptop`.  
The peer `PublicKey` is what we generated on the server in `/etc/wireguard/keys/server.pub`.  
The peer `AllowedIPs` just says that we'll accept any traffic coming from the VPN server, both IPv4 and IPv6 traffic (comma-separated).  
The peer `Endpoint` is the public-facing address for the server, which could just as well be an IP address if you don't have a domain for it.

We also need to whitelist the laptop on the server, so let's add to the `/etc/wireguard/wg0.conf` there:
```ini
[Interface]
Address    = 10.0.0.1/24
PrivateKey = GAfZYrZqYd1YSoKs7Zd136hyQ8hJzZsariabybuuXG4
ListenPort = 51820

[Peer]
PublicKey  = lNq6ckxoW5N+l8Sg11M2U5z5VGp/B0bR+kAhYsU9Vyc=
AllowedIPs = 10.0.0.2/32
```
The only thing we changed here was adding the "peer" for the laptop,  
`PublicKey` being the key we made on the laptop in `/etc/wireguard/keys/laptop.pub`,  
`AllowedIPs` is a whitelist of the laptop's `Address` field, with a CIDR of `/32` to only allow 1 IP.

Lastly, on the server we'll need to "restart" the tunnel:
```bash
wg-quick down wg0
wg-quick up wg0
```

And on the laptop we just need to start it:
```bash
wg-quick up wg0
```

### Connecting the phone

This is the most experimental part. One of the reasons WireGuard is so performant is because it's entirely running in the kernel, 
but the kernels on Android phones are notorious for being outdated. Unless you're running a custom ROM or know the inner workings of them, 
you'll lose out on this benefit. I'm OK with that, so let's get started!

First we'll need to install the preview of the WireGuard client, found on Google Play only at the moment:  
<https://play.google.com/store/apps/details?id=com.wireguard.android>  
(Sidenote: they plan on having it available on [F-Droid](https://f-droid.org/en/packages/com.wireguard.android/) too)

Open up the app, and you'll be presented with a blank slate. Hit the "+" button in the bottom-right and select "Create from scratch".

![[Click to zoom](https://user-images.githubusercontent.com/26496/44641418-24747c80-a9c7-11e8-8b73-76de050d01d5.png)](https://user-images.githubusercontent.com/26496/44641423-29393080-a9c7-11e8-8fc6-223abc5721d8.png)

Choose any name you want, hit the "Generate" button on the right side, and fill in the "Addresses" field.  
Again, we're using the `10.0.0.x/24` format, this time the last number is `3`.  
Lastly, add some DNS servers, I like to use [1.1.1.1](https://1.1.1.1/), but you can pick any you want (comma-separated).  

![[Click to zoom](https://user-images.githubusercontent.com/26496/44641424-2b9b8a80-a9c7-11e8-93de-67030a77341a.png)](https://user-images.githubusercontent.com/26496/44641428-2dfde480-a9c7-11e8-8d38-c0dfa9d5d0d4.png)

Hit the big "Add Peer" button and fill in the fields for the server like we did for the laptop.

![[Click to zoom](https://user-images.githubusercontent.com/26496/44641430-2f2f1180-a9c7-11e8-8b64-8fccbc59be7f.png)](https://user-images.githubusercontent.com/26496/44641432-30f8d500-a9c7-11e8-84e2-edbb7679b01e.png)

That's pretty much it for the phone setup, just hit the save button in the top-right to finish.  
We'll need the "Public key" from the phone, I suggest using some form for copy-pasting it since it's a bit tedious to type out manually.

Back to the server, we'll need to whitelist the phone like we did with the laptop, so let's modify `/etc/wireguard/wg0.conf` again:
```ini
[Interface]
Address    = 10.0.0.1/24
PrivateKey = GAfZYrZqYd1YSoKs7Zd136hyQ8hJzZsariabybuuXG4
ListenPort = 51820

[Peer]
PublicKey  = lNq6ckxoW5N+l8Sg11M2U5z5VGp/B0bR+kAhYsU9Vyc=
AllowedIPs = 10.0.0.2/32

[Peer]
PublicKey  = lXjYOk+11EB6JrRyw0z/3dVewvfoCuvdC6XwQALQKXM=
AllowedIPs = 10.0.0.3/32
```
The only thing to change is adding the 2nd peer, for the phone.  
And like before, we'll need to "restart" the tunnel on the server:
```bash
wg-quick down wg0
wg-quick up wg0
```

Finally, just flip the switch in the app and you should be connected!

You can now see all peers by running `sudo wg` on the server.

### Persistent

If you're happy with how the VPN works, I'd advice enabling on boot, which with systemd can be done like so:
```bash
systemctl enable wg-quick@wg0.service
systemctl enable systemd-networkd-wait-online.service
```
