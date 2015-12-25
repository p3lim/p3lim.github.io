---
layout: post
title: Setting up a Raspberry Pi
tags: raspi
---
In the attempt to rid my computer of all software and services that would require it to run 24/7, I've decided to offload most of the stuff that would need to run all the time onto a better platform.

This is the first post in (hopefully) a series that'll cover what is possible to do with the Raspberry Pi, starting off by getting the device ready.
<!--more-->

### Intentions

When I first got the [Raspberry Pi](//www.raspberrypi.org/help/what-is-a-raspberry-pi/) in the mail I had planned to host a simple TeamSpeak server on it, and nothing more. Sadly, the first thing I found out when I got it was that TeamSpeak doesn't have a version for ARM processors (which the Raspberry Pi is equipped with), so it just sat in its box for a few weeks doing nothing but collecting dust, being forgotten.

A few weeks later I decided to play around with the possibilities of this device again, but I first had to set it up properly, and while doing so, doing a writeup of the process for future reference (and possibly others in the same position).

### The Setup

As far hardware goes, it's best to have a list of all the parts required, and what I'll be using for the purpose of these posts.

- [Raspberry Pi 2 Model B+](//www.raspberrypi.org/products/model-b-plus/)
- MicroSD card (4GB should suffice, but the more the merrier)
- Micro USB cable
- Ethernet cable (CAT5 or better)
- A computer with an SD card reader
- Internet connection

Further in this series I will add on to this, but this is the bare requirements to get the device up and running.

### The Operating System

At the core of every computer there is the OS, there are many a flavor to choose from, but I chose [Raspbian](//www.raspbian.org/), a modified version of [Debian](//www.debian.org/) that is tailored for the Raspberry Pi.

And since one might not have that much storage available on the Pi, I chose to get the [unattended netinstaller](//github.com/debian-pi/raspbian-ua-netinst) version of it, which allows me to easily make a customized and small installation of Raspbian, only containing what I felt necessary.

You'll also need a tool to format the MicroSD card, for this I recommend [Rufus](//rufus.akeo.ie/), a simple and free tool that'll do the job. This is only available on Windows, so if you're running Linux or OSX you'll have to find a tool yourself that allow you to partition and format external drives.

First off, insert the MicroSD card into your computer, this is what will host the OS for the Pi, and is the sole storage available to it.

Next you'll need to download the [lastest release](//github.com/debian-pi/raspbian-ua-netinst/releases/latest) **zip** file of Raspbian, which at the time of this writing is v1.0.8.1.

While that is downloading (shouldn't take long) we'll format the MicroSD card. Open up Rufus, select the MicroSD card from the list, select FAT32 as the file system and make sure the "Create a bootable disk.." is unchecked. Once you're ready hit the "Start" button on the bottom and wait for it to finish.

Once the formatting is done and the download of Raspbian is finished, extract the contents of the zip file directly onto the MicroSD card.

As a last step we want to have the installer apply some additional settings and packages, which we can do with a simple config file.

Create a new text file `installer-config.txt` inside the MicroSD card, and paste the contents below into it:

{% highlight properties %}
release=jessie
packages=cpufrequtils,raspi-copies-and-fills,rng-tools,nano
hostname=raspi
{% endhighlight %}

You can tweak these to your liking, full details and a list of defaults can be found in the [raspbian-ua-netinst project's readme](//github.com/debian-pi/raspbian-ua-netinst#installer-customization).

Once done, eject the MicroSD card from your computer.

### Connecting All The Things!

This part is simple, and I don't why it required a writeup, but what the heck.

1. Insert the MicroSD card into the Raspberry Pi.
2. Connect the Raspberry Pi to your router/switch using an ethernet cable.
3. Optionally, connect your Raspberry Pi to a monitor over HDMI during installation.
	- *This is recommended, as it is otherwise hard to tell when the installation is done.*
4. Connect the Raspberry Pi to any 5V USB-powering device.
	- *Anything will suffice, a cellphone USB charger unit, your computer, even routers tend to have an USB port.*

When powered up, the installation of Raspbian will start automatically, and will take some time (15-25 minutes depending on your internet connection).
If you've connected a monitor you'll know when it's done, as you'll be greeted with a login prompt.

### First boot and SSH

The system is almost completely unconfigured on the first boot, we'll go over some of the things you'll want to do first.

First off you'll have to find out what local IP address the Pi was assigned, you can find out by checking with your router's settings, and I won't cover this here, as it varies a lot from router to router.  
While you're there, it's best if you assign an IP address to it manually instead of having [DHCP](https://en.wikipedia.org/wiki/Dynamic_Host_Configuration_Protocol) lease one to it for a limited time. Trust me, you'll thank me later.

Once you've gotten the local IP address, let's connect to it over SSH! If you don't have a client there is an excellent app for [Chrome](//www.google.com/chrome/browser/) called *Secure Shell* that'll do nicely, you can find it on the [webstore](//chrome.google.com/webstore/detail/secure-shell/pnhechapfaindjhompbnflcldabbghjo), and we'll be using it in this series.

Start *Secure Shell* and fill in the following fields:

- username (`root`)
- hostname (the IP address assigned to the Pi)
- port (`22` is default for SSH)

And then you just hit Connect (or <kbd>Enter</kbd>). You'll be prompted for a password, the default is `raspbian`.

First things first; change that password. Type `passwd` and enter in the old password, followed by your new password (twice).

You'll then want to configure your default locale and timezone.  
Type `dpkg-reconfigure locales` and you'll be prompted with a daemon that allows you to select your locale. Use the arrow keys to navigate up and down, hit <kbd>Space</kbd> to select your locale (select the UTF-8 version of it preferably), then hit <kbd>Enter</kbd>. Select it as the default locale for the system in the next prompt, and you're done.

Type `dpkg-reconfigure tzdata` and you'll be prompted with a similar daemon, this time for your timezone. It's the same procedure basically.

Optional: Add a hardware random number generator. You decide if you want this or not, but it improves the performance of various applications that need random numbers significantly.  
Copy/paste the following command (<kbd>Ctrl+Shift+V</kbd> in *Secure Shell* by the way) `echo 'bcm2708-rng' >> /etc/modules`.

Lastly you'll want to add a new user, using *root* is not a good thing as it has access to anything and everything on the system. This is the user that you'll normally use when connecting to the Pi over SSH.
Type `adduser pi` (name it anything you want really), and follow the prompts. We also want to allow this user some privileges, such as becoming elevated to execute administrative commands through "sudo", so that you don't have to log into *root* every time: `adduser pi sudo`.  

And for good measure, restart the Pi: `reboot`.

And that's it, you now have a Raspberry Pi running the latest version of Raspbian, ready for your every need.

I'll cover some examples of what you can use the Pi for in the following posts.
