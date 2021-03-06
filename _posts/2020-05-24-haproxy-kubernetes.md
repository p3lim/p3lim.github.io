---
layout: post
title: Kubernetes Control Plane Load Balancer
tags: kubernetes,linux,network
sha: b58d3226b9272444429ced4915d688e95cbd3112
---

In a cloud environment you'd typically have a proper load balancer in front of your Kubernetes cluster, such as Amazon ELB. In a bare-metal environment you don't have this luxury, but setting up your own is rather easy.

The necessity for this is to reach the Kubernetes API on one common address, regardless of the health of your cluster. Should one node be down you'd still reach the cluster just fine, creating a proper high-availability configuration.

### Setup

This setup is done on a fresh Fedora 32 VM, with access to the following Kubernetes cluster with the API running on port 6443 (default):

| Name   | IP        |
|--------|-----------|
| kube01 | 10.0.0.11 |
| kube02 | 10.0.0.12 |
| kube03 | 10.0.0.13 |

Install HAProxy:

{% highlight bash %}
dnf install -y haproxy
{% endhighlight %}

Make sure HAProxy can bind to any address and port:

{% highlight bash %}
setsebool -P haproxy_connect_any 1
{% endhighlight %}

Configure HAProxy to round-robin to these hosts, with health checks:

{% highlight bash %}
cat <<EOF >/etc/haproxy/haproxy.cfg
frontend kubernetes-api
	mode tcp
	bind *:6443
	default_backend kubernetes-control-plane

backend kubernetes-control-plane
	mode    tcp
	balance roundrobin
	server  kube01 10.0.0.11:6443 check
	server  kube02 10.0.0.12:6443 check
	server  kube03 10.0.0.13:6443 check
EOF
{% endhighlight %}

Open up the port in the firewall:

{% highlight bash %}
firewall-cmd --add-port=6443/tcp --permanent
firewall-cmd --reload
{% endhighlight %}

Then enable the HAProxy service:

{% highlight bash %}
systemctl enable --now haproxy
{% endhighlight %}

And that's it, you're now load balancing the Kubernetes control plane.
