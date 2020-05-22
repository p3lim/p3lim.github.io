---
layout: post
title: Proxmox VE with custom ACME providers
tags: proxmox,linux,acme
---

Proxmox VE has built-in support for requesting and renewing certificates from an ACME endpoint. It is designed to be used with Let's Encrypt, and as such it doesn't support adding new endpoints in the GUI, so we'll have to use the Proxmox CLI toolchain for that. Although everything else can be done in the GUI, we'll be doing it in the terminal as well, since it's a good idea to learn some of the commands.

First off we'll need to add the CA certificate to each Proxmox VE machine in the cluster. It's up to you how you get this certificate from your ACME provider, but once you've got it just use `rsync` or `scp` to copy it over.

This certificate needs to be moved to where all CA certificates are stored in a Debian environment, then update the database.

{% highlight bash %}
mv ca.crt /usr/local/share/ca-certificates/my-ca.crt
update-ca-certificates
{% endhighlight %}

With the CA certificate in place, we can now register a new account:

{% highlight bash %}
pvenode acme account register default <your email here> --directory https://your-acme-endpoint
{% endhighlight %}

Once the account is registered you can proceed and do the rest of the steps in the GUI, but we'll keep using the CLI for this.

We need to set the domains we'd want to request certificate(s) for, separated by a comma for each domain:

{% highlight bash %}
pvenode config set --acme domains=proxmox.local
{% endhighlight %}

Finally we'll request the certificate:

{% highlight bash %}
pvenode acme cert order
{% endhighlight %}

Try refreshing the webpage and see if it has started using the new certificate, it should happen automatically.

From now on, if the certificate is within 30 days of expiry it will be automatically renewed.

### Bonus: Using standard ports

Accessing the Proxmox GUI on a non-standard port doesn't look nice, and while Proxmox doesn't have a configuration option for this anywhere, we can use `iptables` to do this.

{% highlight bash %}
iptables -t nat -I PREROUTING --src 0/0 --dst $(hostname -i) -p tcp --dport 443 -j REDIRECT --to-ports 8006
{% endhighlight %}

This will redirect any requests on port 443 (the default HTTPS port) to the non-standard 8006 port used by Proxmox.

If you want this persistent across reboots you'll also need to install a piece of software that saves and restores your configuration automatically on boot.

{% highlight bash %}
apt install -y iptables-persistent
{% endhighlight %}

When prompted during installation about saving the current configuration, answer "Yes".
