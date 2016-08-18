---
layout: post
title: OMGWTFADD
date: 2010-05-22
category: 'projects'
image: '/images/omgwtfadd.png'
excerpt: 'A weekend project. The game begins with 30 seconds of Tetris play, then the board rotates &pi; for 30 seconds of Breakout play.'
github: 'joeframbach/omgwtfadd'
scripts:
  - '/assets/jquery.min.js'
  - '/assets/jquery.githubRepoWidget.min.js'
  - '/assets/omgwtfadd.js'

---
OMGWTFADD was originally written in C++/OpenGL by Dave Wilkinson, Lindsey Bieda, and Bradley D. Kuhlman, taking first place in the PittGeeks 2nd Annual Open Source Game Coding Competition. This is a javascript remix using the HTML5 canvas element.

The game begins with 30 seconds of Tetris play, then the board rotates &pi; for 30 seconds of Breakout play. If the ball misses the paddle, all bricks drop one spot.

I started this project to learn more about canvas and jQuery, and in that respect it has been a huge success. Please keep in mind that this project is not finished. There is no end-game, and there are some collision bugs. I don't think the pieces rotate correctly.

<button id="omgwtfaddstart" onclick="omgwtfaddstart(this);">Click to start</button>
<canvas id="omgwtfaddcanvas" style="width:100%;margin:0 auto;"></canvas>
