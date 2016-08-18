---
layout: post
title: QR Code on a Cylinder
date: 2011-09-23
category: 'projects'
image: '/images/qr-code-on-a-cylinder-downtube.jpg'
excerpt: 'A qr code wrapped around a tube is distorted and cannot scan. This script projects an image onto a tube.'

---
On Frambike's downtube, right next to the bottom bracket, I have a scannable
QR code containing my contact info, in case it's lost or I need to prove it's
mine. However, my phone can't make sense of a square QR code mapped onto the
cylindrical tube. So I had to do some image processing.

This is a standard square QR code containing contact information.
When wrapped around a tube, it becomes distorted and cannot scan.

{% include image.html src="/images/qr-code-on-a-cylinder-square.png" alt="Square QR Code" caption="Square QR Code" %}

{% include image.html alt="Corrected QR Code" src="/images/qr-code-on-a-cylinder-corrected.jpg" caption="QR Code projected onto a cylinder. When wrapped around a tube, it appears square." %}

{% include image.html alt="Downtube with QR Code" src="/images/qr-code-on-a-cylinder-downtube.jpg" caption="Here's what it looks like before glue and clearcoat." %}

icyl.sh

``` bash
#!/bin/bash
infile=$1
rr=`convert $infile -ping -format "%[fx:w*57/90]" info:`
hh=`convert $infile -ping -format "%h" info:`
w2=`convert $infile -ping -format "%[fx:w/2]" info:`
ww=`convert xc: -format "%[fx:2*$rr*tan(0.5*90/57)]" info:`
ww2=`convert xc: -format "%[fx:$ww/2]" info:`
max=`convert xc: -format "%[fx:$rr*atan($ww2/$rr)+$w2]" info:`
convert -size ${ww}x1 xc: -monitor \
-fx "xx=(i-$ww2); ($rr*atan(xx/$rr)+$w2)/$max" +monitor \
-scale ${ww}x${hh}! tmp.png
time convert tmp.png $infile -monitor \
-fx "v.p{$max*u,j}" +monitor $1_corrected.jpg
```

In the shell:

``` bash
~ $ ./icyl.sh Downloads/jenny.png
Mogrify/Image/Downloads[jenny.png]: 1 of 2, 100% complete
fx image[tmp.png]: 199 of 200, 100% complete

real    0m0.269s
user    0m0.333s
sys     0m0.017s
```
