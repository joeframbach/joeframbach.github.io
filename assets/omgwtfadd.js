function omgwtfaddstart(anchor){
	anchor.style.display = 'none';
	var cols = 10;
	var rows = 20;
	var fps = 60;
	var gameinterval = 30000;
	
	var canvas = {color:'#c0c0c0'}; // {ctx,W,H,w,h,x,y,X,Y}
	canvas.ctx = $('#omgwtfaddcanvas')[0].getContext('2d');
	canvas.w = $('#omgwtfaddcanvas')[0].width
	         = Math.min(300,$('#omgwtfaddcanvas')[0].clientWidth);
	$('#omgwtfaddcanvas')[0].style.width = canvas.w+'px';
	canvas.h = $('#omgwtfaddcanvas')[0].height
	         = Math.min(600,2*canvas.w);
	$('#omgwtfaddcanvas')[0].style.height = canvas.h+'px';
	var bricksize = canvas.w/cols;

	var currentgame = 0;
	var intervalID;

	var keys = {};
	var key = {
		left:37,
		up:38,
		right:39,
		down:40,
	};

	var bricks = [];
	var i,j;
	for (i=rows; i--; ) {
		bricks[i] = [];
		for (j=cols; j--; ) {
			bricks[i][j] = 0;
		}
	}

	var tetris = {
		interval:500,

		piece:0, //{shapes,color,rot,x,y}
		colors:['#000000', '#0000ff', '#00ff00', '#00ffff', '#ff0000', '#ff00ff', '#ffff00'],
		shapes:[
			[ // straight
				[[0,0],[0,1],[0,2],[0,3]],
				[[0,3],[1,3],[2,3],[3,3]]
			],[ // left L
				[[0,2],[0,1],[0,0],[1,0]],
				[[0,1],[0,2],[1,2],[2,2]],
				[[0,2],[1,2],[1,1],[1,0]],
				[[0,1],[1,1],[2,1],[2,2]]
			],[ // right L
				[[1,2],[1,1],[1,0],[0,0]],
				[[0,2],[0,1],[1,1],[2,1]],
				[[1,2],[0,2],[0,1],[0,0]],
				[[0,2],[1,2],[2,2],[2,1]]
			],[ // T
				[[0,0],[1,0],[2,0],[1,1]],
				[[1,2],[1,1],[1,0],[0,1]],
				[[0,2],[1,2],[2,2],[1,1]],
				[[0,2],[0,1],[0,0],[1,1]]
			],[ // box
				[[0,0],[0,1],[1,1],[1,0]]
			],[ // S
				[[0,0],[1,0],[1,1],[2,1]],
				[[0,2],[0,1],[1,1],[1,0]]
			],[  // Z
				[[0,1],[1,1],[1,0],[2,0]],
				[[0,0],[0,1],[1,1],[1,2]]
			]
		],

		prologue:function(){
			tetris.piece = {rot:0,x:5,y:0};
			tetris.piece.shape = tetris.shapes[Math.floor(Math.random()*tetris.shapes.length)];
			tetris.piece.color = tetris.colors[Math.floor(Math.random()*tetris.colors.length)];
		},
		update:function(){
			if (!tetris.keydown({keyCode:key.down})) {
				var i,j;
				var piece = tetris.piece;

				//convert to bricks
				var p = piece.shape[piece.rot];
				for (i=p.length; i--; ) {
					bricks[p[i][1]+piece.y][p[i][0]+piece.x] = piece.color;
				}
				if (!piece.y) {
					tetris.epilogue();
					return;
				}

				var fullrow;
				for (i=rows; i--; ) {
					fullrow = true;
					for (j=cols; j--; ) {
						if (!bricks[i][j]) {
							fullrow = false;
							break;
						}
					}
					if (fullrow) {
						bricks.splice(i,1);
						bricks.unshift([]);
						for (j=cols; j--; ) {
							bricks[0][j] = 0;
						}
						i++;
					}
				}

				tetris.prologue();
			}
		},
		redraw:function(){
			var piece = tetris.piece;
			var i;
			var p = piece.shape[piece.rot];
			for (i=p.length; i--; ) {
				drawbrick(p[i][0]+piece.x, p[i][1]+piece.y, piece.color);
			}
		},
		epilogue:function(){
			tetris.piece = 0;
		},
		keydown:function(e){
			var piece = tetris.piece;
			var shapes = tetris.shapes;
			var colors = tetris.colors;
			var k = e.keyCode;
			var s = piece.shape;	
			var r = (piece.rot+(k==key.up))%s.length;
			var x = piece.x + (k==key.right) - (k==key.left);
			var y = piece.y + (k==key.down);

			if(tetris.check(s,r,x,y)) {
				piece.x = x;
				piece.y = y;
				piece.rot = r;
				return true;
			}
			else {
				return false;
			}
		},
		check:function(shape,rot,x,y){
			var prop = shape[rot];
			var i, row, col;
			for (i=prop.length; i--; ) {
				row = y+prop[i][1];
				if (row < 0) {
					continue;
				}
				col = x+prop[i][0];
				if (rows <= row || cols <= col || col < 0 || !!bricks[row][col]) {
					return false;
				}
			}
			return true;
		}
	};

	var breakout = {
		pps:300, //ball movement, pixels per second

		paddle:{color:'#000000'},
		ball:{color:'#000000'},

		prologue:function(){
			var ball = breakout.ball;
			var paddle = breakout.paddle;
			breakout.paddle.w = bricksize;
			breakout.paddle.h = breakout.paddle.w/2;
			breakout.paddle.x = (canvas.w-breakout.paddle.w-bricksize)/2;
			breakout.paddle.y = canvas.h - breakout.paddle.h;
			breakout.ball.r = breakout.paddle.h/4;
			breakout.ball.x = (canvas.w-breakout.ball.r-bricksize)/2;
			breakout.ball.y = breakout.paddle.y - breakout.paddle.h;

			breakout.paddle.dx = breakout.pps/fps;
			breakout.ball.dx = 0;
			breakout.ball.dy = -breakout.paddle.dx;
		},
		redraw:function(){
			var ball = breakout.ball;
			var paddle = breakout.paddle;
			canvas.ctx.fillStyle = ball.color;
			canvas.ctx.beginPath();
			canvas.ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2, true);
			canvas.ctx.closePath();
			canvas.ctx.fill();
			canvas.ctx.fillStyle = paddle.color;
			canvas.ctx.beginPath();
			canvas.ctx.rect(paddle.x,paddle.y,paddle.w,paddle.h);
			canvas.ctx.closePath();
			canvas.ctx.fill();

			var dx = paddle.dx*(!!keys[key.right] - !!keys[key.left]);
			paddle.x = Math.max(0,Math.min(canvas.w-paddle.w,paddle.x+dx));

			var row = Math.floor(ball.y/bricksize);
			var col = Math.floor(ball.x/bricksize);

			if (!!bricks[row][col]) {
				bricks[row][col] = 0;
				if (row != Math.floor((ball.y-ball.dy)/bricksize)) { //from top or bottom
					ball.dy = -ball.dy;
				}
				if (col != Math.floor((ball.x-ball.dx)/bricksize)) { // from left or right
					ball.dx = -ball.dx;
				}
			}

			var left = ball.x + ball.dx - ball.r;
			var right = ball.x + ball.dx + ball.r;
			var top = ball.y + ball.dy - ball.r;
			var bottom = ball.y + ball.dy + ball.r;
			if (canvas.w < right || left < 0)
				ball.dx = -ball.dx;

			if (top < 0)
				ball.dy = -ball.dy;
			else if (bottom >= canvas.h) {
				if (paddle.x <= right && left <= paddle.x + paddle.w) {
					ball.dy = -ball.dy;
					//move the ball differently based on where it hit the paddle
					ball.dx = paddle.dx * ((ball.x-(paddle.x+paddle.w/2))/paddle.w);
				}
				else {
					ball.dy = -ball.dy;
					bricks.splice(i,1);
					bricks.unshift([]);
					for (j=cols; j--; ) {
						bricks[0][j] = 0;
					}
				}
			}

			ball.x += ball.dx;
			ball.y += ball.dy;
		},
		keydown:function(e){
			keys[e.keyCode] = true;
		},
		keyup:function(e){
			keys[e.keyCode] = false;
		}
	};

	function drawbrick(x,y,color) {
		x = x*bricksize;
		y = y*bricksize;
		canvas.ctx.fillStyle = color;
		canvas.ctx.beginPath();
		canvas.ctx.moveTo(x+6, y+1);
		canvas.ctx.lineTo(x+bricksize-4, y+1);
		canvas.ctx.quadraticCurveTo(x+bricksize-1, y+1, x+bricksize-1, y+6);
		canvas.ctx.lineTo(x+bricksize-1, y+bricksize-4);
		canvas.ctx.quadraticCurveTo(x+bricksize-1, y+bricksize-1, x+bricksize-4, y+bricksize-1);
		canvas.ctx.lineTo(x+6, y+bricksize-1);
		canvas.ctx.quadraticCurveTo(x+1, y+bricksize-1, x+1, y+bricksize-4);
		canvas.ctx.lineTo(x+1, y+6);
		canvas.ctx.quadraticCurveTo(x+1, y+1, x+6, y+1);
		canvas.ctx.fill();
	}

	function redraw(){
		canvas.ctx.clearRect(0, 0, canvas.w, canvas.h);
		canvas.ctx.fillStyle = canvas.color;
		canvas.ctx.beginPath();
		canvas.ctx.rect(0,0,canvas.w,canvas.h);
		canvas.ctx.closePath();
		canvas.ctx.fill();

		var i,j;
		for (i=rows; i--; ) {
			for (j=cols; j--; ) {
				if (!!bricks[i][j]) {
					drawbrick(j,i,bricks[i][j]);
				}
			}
		}

		games[currentgame].redraw();
	}

	var games = [breakout,tetris];

	function transition() {
		var i,j;
		var newbricks = [];
		for (i=rows; i--; ) {
			newbricks[i] = [];
			for (j=cols; j--; ) {
				newbricks[i][j] = bricks[rows-i-1][cols-j-1];
			}
		}
		bricks = newbricks;

		if (!!intervalID) {
			clearInterval(intervalID);
		}

		if (!!games[currentgame].epilogue)
			games[currentgame].epilogue();

		currentgame = (currentgame+1)%games.length;
		var game = games[currentgame];

		$(document).unbind('keydown.omgwtfadd');
		if (!!game.keydown)
			$(document).bind('keydown.omgwtfadd',game.keydown);

		$(document).unbind('keyup.omgwtfadd');
		if (!!game.keyup)
			$(document).bind('keyup.omgwtfadd',game.keyup);

		$(document).unbind('keypress.omgwtfadd');
		if (!!game.keypress)
			$(document).bind('keypress.omgwtfadd',game.keypress);

		if (!!game.prologue)
			game.prologue();

		keys = {};

		if (!!game.update && !!game.interval)
			intervalID = setInterval(game.update,game.interval);
	}

	$(document).bind('keydown.omgwtfaddcatch',function(e){
		for (keyname in key)
			if (e.keyCode==key[keyname])
				e.preventDefault();
	});

	setInterval(transition,gameinterval);
	transition();
	setInterval(redraw,1000/fps); //40fps

}
