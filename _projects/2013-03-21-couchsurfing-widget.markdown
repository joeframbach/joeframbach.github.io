---
layout: post
title: Couchsurfing Widget
date: 2013-03-21
category: 'projects'
image: '/images/couchsurfing-widget.png'
excerpt: 'Embeddable widget for sharing your Couchsurfing profile.'
github: 'joeframbach/jquery-couchsurfing-widget'
scripts:
  - '/assets/jquery.min.js'
  - '/assets/jquery.githubRepoWidget.min.js'

---
I made a sharable profile widget for Couchsurfing. It looks like this:

{% include image.html alt="widget screenshot" src="/images/couchsurfing-widget.png" %}

Couchsurfing does not have a public API! And the server does not allow CORS!

As a workaround, I proxied the request through YQL and picked apart the response HTML with JQuery.
