---
layout: post
title: Unifi Controller on a Raspberry Pi
tags: raspi,linux,network,unifi
sha: 1ea426adeee70fa59ac06b17e5b64a562a69613b
---

I wanted to repurpose my old Raspberry Pi 2 into something useful, as its age is showing and can't be used for anything complicated these days. One of the things it can do just fine is manage a small home or office Ubiquiti-based network.

I've already written about [setting up a Raspberry Pi](https://p3lim.net/2015/12/25/raspi-debian), and while that guide is quite old it still holds true, just with newer versions of everything (e.g. `release=buster` instead of `jessie`).

Let's get right into it.

### Installation

Before we do anything, make sure we're all up to date on software:

{% highlight bash %}
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
sudo apt autoclean -y
sudo reboot
{% endhighlight %}

With that out of the way, the first thing we need to do is install a newer Java runtime than the default, as the Oracle version available in the default repositories is too old for the Unifi software.

{% highlight bash %}
sudo apt install -y openjdk-8-jre-headless
{% endhighlight %}

We'll also want to install something to speed up any actions that require randomness, as a Raspberry Pi can't generate entropy fast enough because it has no mouse or keyboard to generate it from.

{% highlight bash %}
sudo apt install -y haveged
{% endhighlight %}

Getting right into it, we'll add the [Ubiquiti repositories](https://help.ui.com/hc/en-us/articles/220066768-UniFi-How-to-Install-and-Update-via-APT-on-Debian-or-Ubuntu) and add their GPG keys for verifiying the package signatures.

{% highlight bash %}
sudo apt install -y apt-transport-https
echo 'deb https://www.ui.com/downloads/unifi/debian stable ubiquiti' | sudo tee /etc/apt/sources.list.d/ubnt-unifi.list
sudo curl -sSL https://dl.ui.com/unifi/unifi-repo.gpg -o /etc/apt/trusted.gpg.d/unifi-repo.gpg
{% endhighlight %}

We can now finally install the Unifi Controller Software:

{% highlight bash %}
sudo apt update
sudo apt install -y unifi
{% endhighlight %}

After everything is installed, the Unifi software should be running automatically, and you'll be able to visit it at `https://<rpi-ip>:8443`!

### Bonus: Reverse proxy

We'll want to visit the webgui on a standard port like `443` instead of `8443`, and also get valid certificates to boot!
For this we'll use the fantastic software [Caddy](https://caddyserver.com/), which recently had its 2nd major release.

As with the Unifi software we'll need to [add their repositories](https://caddyserver.com/docs/download) first.

{% highlight bash %}
echo 'deb [trusted=yes] https://apt.fury.io/caddy/ /' | sudo tee /etc/apt/sources.list.d/caddy-fury.list
{% endhighlight %}

With that in place we can install Caddy:

{% highlight bash %}
sudo apt update
sudo apt install -y caddy
{% endhighlight %}

To set up Caddy, all we need to do is replace the contents of the configuration file, found at `/etc/caddy/Caddyfile` using your favorite terminal editor (e.g. `vim` or `nano`).

{% highlight caddyfile %}
unifi.example.com

reverse_proxy https://localhost:8443 {
	transport http {
		tls_insecure_skip_verify
	}
}
{% endhighlight %}

Then restart the Caddy service and it should work:

{% highlight bash %}
sudo systemctl restart caddy
{% endhighlight %}
