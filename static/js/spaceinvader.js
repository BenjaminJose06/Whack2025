// Space Invaders Game Script - extracted from spaceinvader.html
// Expects DOM elements with IDs:
// #game-canvas, #startScreen, #gameOverScreen, #startButton, #restartButton,
// #finalScore, #finalWave, #quizScreen, #quizCard, #questionText, #answerButtons,
// #pointsFeedback, #inGameExit

function awardXP(points, activityType, details) {
	if (!points || points <= 0) return;
		try {
			if (typeof showPointsFeedback === 'function') showPointsFeedback('+' + points + ' XP!', '#22c55e');
		} catch {}
	fetch('/api/add_xp', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ xp: points, activity_type: activityType, details })
	}).catch(() => {});
}

/* Simple JavaScript Inheritance - John Resig (MIT) */
(function(){
	var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
	this.Class = function(){};
	Class.extend = function(prop) {
		var _super = this.prototype;
		initializing = true;
		var prototype = new this();
		initializing = false;
		for (var name in prop) {
			prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name]) ?
				(function(name, fn){
					return function() { var tmp = this._super; this._super = _super[name]; var ret = fn.apply(this, arguments); this._super = tmp; return ret; };
				})(name, prop[name]) : prop[name];
		}
		function Class() { if (!initializing && this.init) this.init.apply(this, arguments); }
		Class.prototype = prototype; Class.prototype.constructor = Class; Class.extend = arguments.callee; return Class;
	};
})();

(function() { var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame; window.requestAnimationFrame = raf; })();
(function() { if (!window.performance.now) { window.performance.now = (!Date.now) ? function() { return new Date().getTime(); } : function() { return Date.now(); } } })();

var IS_CHROME = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
var CANVAS_WIDTH = 640; var CANVAS_HEIGHT = 640;
var SPRITE_SHEET_SRC = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAEACAYAAAADRnAGAAACGUlEQVR42u3aSQ7CMBAEQIsn8P+/hiviAAK8zFIt5QbELiTHmfEYE3L9mZE9AAAAqAVwBQ8AAAD6THY5CgAAAKbfbPX3AQAAYBEEAADAuZrC6UUyfMEEAIBiAN8OePXnAQAAsLcmmKFPAQAAgHMbm+gbr3Sdo/LtcAAAANR6GywPAgBAM4D2JXAAABoBzBjA7AmlOx8AAEAzAOcDAADovTc4vQim6wUCABAYQG8QAADd4dPd2fRVYQAAANQG0B4HAABAawDnAwAA6AXgfAAAALpA2uMAAABwPgAAgPoAM9Ci/R4AAAD2dmqcEQIAIC/AiQGuAAYAAECcRS/a/cJXkUf2AAAAoBaA3iAAALrD+gIAAADY9baX/nwAAADNADwFAADo9YK0e5FMX/UFACA5QPSNEAAAAHKtCekmDAAAAADvBljtfgAAAGgMMGOrunvCy2uCAAAACFU6BwAAwF6AGQPa/XsAAADYB+B8AAAAtU+ItD4OAwAAAFVhAACaA0T7B44/BQAAANALwGMQAAAAADYO8If2+P31AgAAQN0SWbhFDwCAZlXgaO1xAAAA1FngnA8AACAeQPSNEAAAAM4CnC64AAAA4GzN4N9NSfgKEAAAAACszO26X8/X6BYAAAD0Anid8KcLAAAAAAAAAJBnwNEvAAAA9Jns1ygAAAAAAAAAAAAAAAAAAABAQ4COCENERERERERERBrnAa1sJuUVr3rsAAAAAElFTkSuQmCC';
var LEFT_KEY = 37; var RIGHT_KEY = 39; var SHOOT_KEY = 88;
var PLAYER_CLIP_RECT = { x: 0, y: 204, w: 62, h: 32 };
var ALIEN_BOTTOM_ROW = [ { x: 0, y: 0, w: 51, h: 34 }, { x: 0, y: 102, w: 51, h: 34 }];
var ALIEN_MIDDLE_ROW = [ { x: 0, y: 137, w: 50, h: 33 }, { x: 0, y: 170, w: 50, h: 34 }];
var ALIEN_TOP_ROW = [ { x: 0, y: 68, w: 50, h: 32 }, { x: 0, y: 34, w: 50, h: 32 }];
var ALIEN_X_MARGIN = 40; var ALIEN_SQUAD_WIDTH = 11 * ALIEN_X_MARGIN;

function getRandomArbitrary(min, max) { return Math.random() * (max - min) + min; }
function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clamp(num, min, max) { return Math.min(Math.max(num, min), max); }
function valueInRange(value, min, max) { return (value <= max) && (value >= min); }
function checkRectCollision(A, B) {
	var xOverlap = valueInRange(A.x, B.x, B.x + B.w) || valueInRange(B.x, A.x, A.x + A.w);
	var yOverlap = valueInRange(A.y, B.y, B.y + B.h) || valueInRange(B.y, A.y, A.y + A.h);
	return xOverlap && yOverlap;
}

var Point2D = Class.extend({
	init: function(x, y) { this.x = (typeof x === 'undefined') ? 0 : x; this.y = (typeof y === 'undefined') ? 0 : y; },
	set: function(x, y) { this.x = x; this.y = y; }
});
var Rect = Class.extend({
	init: function(x, y, w, h) { this.x = (typeof x === 'undefined') ? 0 : x; this.y = (typeof y === 'undefined') ? 0 : y; this.w = (typeof w === 'undefined') ? 0 : w; this.h = (typeof h === 'undefined') ? 0 : h; },
	set: function(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
});

var canvas = null, ctx = null, spriteSheetImg = null, bulletImg = null;
var keyStates = null, prevKeyStates = null, lastTime = 0;
var player = null, aliens = [], particleManager = null;
var updateAlienLogic = false, alienDirection = -1, alienYDown = 0, alienCount = 0, wave = 1;
var hasGameStarted = false;
var startScreenEl = document.getElementById('startScreen');
var gameOverScreenEl = document.getElementById('gameOverScreen');
var startButton = document.getElementById('startButton');
var restartButton = document.getElementById('restartButton');
var finalScoreEl = document.getElementById('finalScore');
var finalWaveEl = document.getElementById('finalWave');
var quizScreenEl = document.getElementById('quizScreen');
var quizCardEl = document.getElementById('quizCard');
var questionTextEl = document.getElementById('questionText');
var answerButtonsEl = document.getElementById('answerButtons');
var pointsFeedbackEl = document.getElementById('pointsFeedback');
var inGameExitEl = document.getElementById('inGameExit');

var quizActive = false; var scoreThreshold = 200; var nextQuizScore = 200; var lastQuizTime = 0; var quizCooldownMs = 15000;

// Finance quiz questions (multiple choice)
var questions = [
	{ question: "What does APR stand for?", answers: ["Annual Percentage Rate", "Average Payment Ratio", "Account Payback Rate", "Automatic Payment Request"], correct: 0 },
	{ question: "What is a budget?", answers: ["A shopping list", "A plan for spending and saving money", "A type of loan", "A credit card"], correct: 1 },
	{ question: "A credit score is mainly used for?", answers: ["Approving loans or credit", "Setting tax rates", "Determining favorite color", "Tracking shopping history"], correct: 0 },
	{ question: "Missing a credit card payment can lead to?", answers: ["Nothing", "A late fee and interest", "Bonus points", "Higher credit score"], correct: 1 },
	{ question: "On a loan, 'interest' is?", answers: ["Free money", "The cost of borrowing", "A discount", "A reward"], correct: 1 },
	{ question: "Which is typically considered 'good debt'?", answers: ["High-interest credit card", "Student loan", "Gambling loan", "Payday loan"], correct: 1 },
	{ question: "An emergency fund is ideally how much?", answers: ["1–2 weeks of expenses", "3–6 months of expenses", "Two years of salary", "No savings needed"], correct: 1 },
	{ question: "Diversification helps to?", answers: ["Increase fees", "Reduce investment risk", "Eliminate all risk", "Lower returns automatically"], correct: 1 },
	{ question: "Compound interest means?", answers: ["Interest only on principal", "Earning interest on interest", "No interest charged", "Flat interest each year"], correct: 1 },
	{ question: "Checking vs Savings: which is for everyday spending?", answers: ["Savings account", "Money market", "Checking account", "CD"], correct: 2 },
	{ question: "FDIC insurance generally protects deposits up to?", answers: ["$25,000", "$100,000", "$250,000", "$1,000,000"], correct: 2 },
	{ question: "Debit vs Credit card: a debit card?", answers: ["Borrows money from bank", "Uses your checking funds", "Builds credit automatically", "Is always safer than credit"], correct: 1 },
	{ question: "Which document shows your yearly wages and taxes withheld?", answers: ["W-2", "1099-INT", "W-4", "1040-EZ"], correct: 0 },
	{ question: "A 401(k) is a type of?", answers: ["Mortgage", "Retirement account", "Car insurance", "Student grant"], correct: 1 },
	{ question: "Inflation usually?", answers: ["Increases purchasing power", "Decreases purchasing power", "Has no effect", "Raises interest you earn"], correct: 1 },
	{ question: "A mortgage is?", answers: ["A rent agreement", "A loan to buy a home", "A bank fee", "An insurance policy"], correct: 1 },
	{ question: "Grace period on a credit card is?", answers: ["Time before late fee", "Time before interest accrues on purchases", "A fee waiver", "A balance transfer"], correct: 1 },
	{ question: "Paying only the minimum on a credit card?", answers: ["Avoids all interest", "May cost more interest over time", "Increases your score fast", "Is better than paying in full"], correct: 1 },
	{ question: "A Certificate of Deposit (CD) typically has?", answers: ["No term and no penalties", "Fixed term and early withdrawal penalty", "Daily transfers", "Unlimited check writing"], correct: 1 },
	{ question: "Best way to pay off high-interest debt first is called?", answers: ["Snowball (smallest balance)", "Avalanche (highest rate)", "Sandcastle", "Interest shuffle"], correct: 1 },
	{ question: "Gross income vs net income: net is?", answers: ["Before taxes/deductions", "After taxes/deductions", "Just bonuses", "Only cash income"], correct: 1 },
	{ question: "Credit utilization is?", answers: ["Payments made", "Balance ÷ limit", "APR × balance", "Credit age"], correct: 1 },
	{ question: "APY vs APR: APY includes?", answers: ["Monthly fees", "Compounding", "Late charges", "Taxes"], correct: 1 },
	{ question: "A secured loan requires?", answers: ["No application", "Collateral", "A co-signer always", "Zero interest"], correct: 1 },
	{ question: "Roth IRA contributions are?", answers: ["Tax-deductible now", "Taxed now; withdrawals tax-free in retirement", "Taxed later", "Not allowed under age 59½"], correct: 1 },
	{ question: "Payday loans often have?", answers: ["Very low rates", "High fees and interest", "Tax benefits", "FDIC coverage"], correct: 1 },
	{ question: "Dollar-cost averaging means?", answers: ["Investing a fixed amount regularly", "Investing only at lows", "All-in at once", "Only bonds"], correct: 0 }
];

var BaseSprite = Class.extend({
	init: function(img, x, y) { this.img = img; this.position = new Point2D(x, y); this.scale = new Point2D(1, 1); this.bounds = new Rect(x, y, this.img.width, this.img.height); this.doLogic = true; },
	update: function(dt) { },
	_updateBounds: function() { this.bounds.set(this.position.x, this.position.y, ~~(0.5 + this.img.width * this.scale.x), ~~(0.5 + this.img.height * this.scale.y)); },
	_drawImage: function() { ctx.drawImage(this.img, this.position.x, this.position.y); },
	draw: function(resized) { this._updateBounds(); this._drawImage(); }
});
var SheetSprite = BaseSprite.extend({
	init: function(sheetImg, clipRect, x, y) { this._super(sheetImg, x, y); this.clipRect = clipRect; this.bounds.set(x, y, this.clipRect.w, this.clipRect.h); },
	update: function(dt) {},
	_updateBounds: function() { var w = ~~(0.5 + this.clipRect.w * this.scale.x); var h = ~~(0.5 + this.clipRect.h * this.scale.y); this.bounds.set(this.position.x - w/2, this.position.y - h/2, w, h); },
	_drawImage: function() { ctx.save(); ctx.transform(this.scale.x, 0, 0, this.scale.y, this.position.x, this.position.y); ctx.drawImage(this.img, this.clipRect.x, this.clipRect.y, this.clipRect.w, this.clipRect.h, ~~(0.5 + -this.clipRect.w*0.5), ~~(0.5 + -this.clipRect.h*0.5), this.clipRect.w, this.clipRect.h); ctx.restore(); },
	draw: function(resized) { this._super(resized); }
});
var Player = SheetSprite.extend({
	init: function() { this._super(spriteSheetImg, PLAYER_CLIP_RECT, CANVAS_WIDTH/2, CANVAS_HEIGHT - 70); this.scale.set(0.85, 0.85); this.lives = 3; this.xVel = 0; this.bullets = []; this.bulletDelayAccumulator = 0; this.score = 0; },
	reset: function() { this.lives = 3; this.score = 0; this.position.set(CANVAS_WIDTH/2, CANVAS_HEIGHT - 70); },
	shoot: function() { var bullet = new Bullet(this.position.x, this.position.y - this.bounds.h / 2, 1, 1000); this.bullets.push(bullet); },
	handleInput: function() { if (isKeyDown(LEFT_KEY)) { this.xVel = -175; } else if (isKeyDown(RIGHT_KEY)) { this.xVel = 175; } else this.xVel = 0; if (wasKeyPressed(SHOOT_KEY)) { if (this.bulletDelayAccumulator > 0.5) { this.shoot(); this.bulletDelayAccumulator = 0; } } },
	updateBullets: function(dt) { for (var i = this.bullets.length - 1; i >= 0; i--) { var bullet = this.bullets[i]; if (bullet.alive) { bullet.update(dt); } else { this.bullets.splice(i, 1); bullet = null; } } },
	update: function(dt) { this.bulletDelayAccumulator += dt; this.position.x += this.xVel * dt; this.position.x = clamp(this.position.x, this.bounds.w/2, CANVAS_WIDTH - this.bounds.w/2); this.updateBullets(dt); },
	draw: function(resized) { this._super(resized); for (var i = 0, len = this.bullets.length; i < len; i++) { var bullet = this.bullets[i]; if (bullet.alive) { bullet.draw(resized); } } }
});
var Bullet = BaseSprite.extend({ init: function(x, y, direction, speed) { this._super(bulletImg, x, y); this.direction = direction; this.speed = speed; this.alive = true; }, update: function(dt) { this.position.y -= (this.speed * this.direction) * dt; if (this.position.y < 0) { this.alive = false; } }, draw: function(resized) { this._super(resized); } });
var Enemy = SheetSprite.extend({
	init: function(clipRects, x, y) { this._super(spriteSheetImg, clipRects[0], x, y); this.clipRects = clipRects; this.scale.set(0.5, 0.5); this.alive = true; this.onFirstState = true; this.stepDelay = 1; this.stepAccumulator = 0; this.doShoot = false; this.bullet = null; },
	toggleFrame: function() { this.onFirstState = !this.onFirstState; this.clipRect = (this.onFirstState) ? this.clipRects[0] : this.clipRects[1]; },
	shoot: function() { this.bullet = new Bullet(this.position.x, this.position.y + this.bounds.w/2, -1, 500); },
	update: function(dt) { this.stepAccumulator += dt; if (this.stepAccumulator >= this.stepDelay) { if (this.position.x < this.bounds.w/2 + 20 && alienDirection < 0) { updateAlienLogic = true; } if (alienDirection === 1 && this.position.x > CANVAS_WIDTH - this.bounds.w/2 - 20) { updateAlienLogic = true; } if (this.position.y > CANVAS_HEIGHT - 50) { showGameOver(); } if (getRandomArbitrary(0, 1000) <= 5 * (this.stepDelay + 1)) { this.doShoot = true; } this.position.x += 10 * alienDirection; this.toggleFrame(); this.stepAccumulator = 0; } this.position.y += alienYDown; if (this.bullet !== null && this.bullet.alive) { this.bullet.update(dt); } else { this.bullet = null; } },
	draw: function(resized) { this._super(resized); if (this.bullet !== null && this.bullet.alive) { this.bullet.draw(resized); } }
});
var ParticleExplosion = Class.extend({
	init: function() { this.particlePool = []; this.particles = []; },
	draw: function() {
		for (var i = this.particles.length - 1; i >= 0; i--) {
			var particle = this.particles[i];
			particle.moves++;
			particle.x += particle.xunits;
			particle.y += particle.yunits + (particle.gravity * particle.moves);
			particle.life--;
			if (particle.life <= 0 ) {
				if (this.particlePool.length < 100) {
					this.particlePool.push(this.particles.splice(i,1));
				} else {
					this.particles.splice(i,1);
				}
			} else {
				ctx.globalAlpha = (particle.life)/(particle.maxLife);
				ctx.fillStyle = particle.color;
				ctx.fillRect(particle.x, particle.y, particle.width, particle.height);
				ctx.globalAlpha = 1;
			}
		}
	},
	createExplosion: function(x, y, color, number, width, height, spd, grav, lif) {
		for (var i = 0; i < number; i++) {
			var angle = Math.floor(Math.random() * 360);
			var speed = Math.floor(Math.random() * spd / 2) + spd;
			var life = Math.floor(Math.random() * lif) + lif / 2;
			var radians = angle * Math.PI / 180;
			var xunits = Math.cos(radians) * speed;
			var yunits = Math.sin(radians) * speed;
			if (this.particlePool.length > 0) {
				var tempParticle = this.particlePool.pop();
				tempParticle.x = x;
				tempParticle.y = y;
				tempParticle.xunits = xunits;
				tempParticle.yunits = yunits;
				tempParticle.life = life;
				tempParticle.color = color;
				tempParticle.width = width;
				tempParticle.height = height;
				tempParticle.gravity = grav;
				tempParticle.moves = 0;
				tempParticle.alpha = 1;
				tempParticle.maxLife = life;
				this.particles.push(tempParticle);
			} else {
				this.particles.push({
					x: x,
					y: y,
					xunits: xunits,
					yunits: yunits,
					life: life,
					color: color,
					width: width,
					height: height,
					gravity: grav,
					moves: 0,
					alpha: 1,
					maxLife: life
				});
			}
		}
	}
});

function setImageSmoothing(value) { ctx['imageSmoothingEnabled'] = value; ctx['mozImageSmoothingEnabled'] = value; ctx['oImageSmoothingEnabled'] = value; ctx['webkitImageSmoothingEnabled'] = value; ctx['msImageSmoothingEnabled'] = value; }
function initCanvas() { canvas = document.getElementById('game-canvas'); ctx = canvas.getContext('2d'); setImageSmoothing(true); spriteSheetImg = new Image(); spriteSheetImg.src = SPRITE_SHEET_SRC; preDrawImages(); window.addEventListener('resize', resize); document.addEventListener('keydown', onKeyDown); document.addEventListener('keyup', onKeyUp); }
function preDrawImages() { var c = drawIntoCanvas(6, 12, function(ctx2) { ctx2.fillStyle = '#00a9e0'; ctx2.fillRect(0, 0, ctx2.canvas.width, ctx2.canvas.height); }); bulletImg = new Image(); bulletImg.src = c.toDataURL(); }

function initGame() { aliens = []; wave = 1; player = new Player(); particleManager = new ParticleExplosion(); setupAlienFormation(); hasGameStarted = true; quizActive = false; nextQuizScore = scoreThreshold; lastQuizTime = 0; startScreenEl.style.display = 'none'; gameOverScreenEl.style.display = 'none'; quizScreenEl.style.display = 'none'; inGameExitEl.style.display = 'inline-flex'; }
function setupAlienFormation() { alienCount = 0; for (var i = 0, len = 5 * 11; i < len; i++) { var gridX = (i % 11); var gridY = Math.floor(i / 11); var clipRects; switch (gridY) { case 0: case 1: clipRects = ALIEN_BOTTOM_ROW; break; case 2: case 3: clipRects = ALIEN_MIDDLE_ROW; break; case 4: clipRects = ALIEN_TOP_ROW; break; } aliens.push(new Enemy(clipRects, (CANVAS_WIDTH/2 - ALIEN_SQUAD_WIDTH/2) + ALIEN_X_MARGIN/2 + gridX * ALIEN_X_MARGIN, CANVAS_HEIGHT/3.25 - gridY * 40)); alienCount++; } }
function showGameOver() { hasGameStarted = false; finalScoreEl.textContent = player.score; finalWaveEl.textContent = wave; gameOverScreenEl.style.display = 'flex'; inGameExitEl.style.display = 'none'; var xpGained = Math.floor(player.score / 10); awardXP(xpGained, 'game', 'Space Invaders - Score: ' + player.score); }
function init() { initCanvas(); keyStates = []; prevKeyStates = []; resize(); }
function isKeyDown(key) { return keyStates[key]; }
function wasKeyPressed(key) { return !prevKeyStates[key] && keyStates[key]; }
function updateAliens(dt) { if (updateAlienLogic) { updateAlienLogic = false; alienDirection = -alienDirection; alienYDown = 25; } for (var i = aliens.length - 1; i >= 0; i--) { var alien = aliens[i]; if (!alien.alive) { aliens.splice(i, 1); alien = null; alienCount--; if (alienCount < 1) { wave++; setupAlienFormation(); } return; } alien.stepDelay = ((alienCount * 20) - (wave * 10)) / 1000; if (alien.stepDelay <= 0.05) { alien.stepDelay = 0.05; } alien.update(dt); if (alien.doShoot) { alien.doShoot = false; alien.shoot(); } } alienYDown = 0; }
function resolveBulletEnemyCollisions() {
	var bullets = player.bullets;
	for (var i = 0, len = bullets.length; i < len; i++) {
		var bullet = bullets[i];
		for (var j = 0, alen = aliens.length; j < alen; j++) {
			var alien = aliens[j];
			if (checkRectCollision(bullet.bounds, alien.bounds)) {
				alien.alive = false;
				bullet.alive = false;
				particleManager.createExplosion(
					alien.position.x,
					alien.position.y,
					'#00a9e0',
					70,
					5,
					5,
					3,
					0.15,
					50
				);
				player.score += 25;
				if (player.score >= nextQuizScore && !quizActive) {
					var nowTs = Date.now();
					if (nowTs - lastQuizTime >= quizCooldownMs) {
						nextQuizScore += scoreThreshold;
						lastQuizTime = nowTs;
						showQuiz();
					}
				}
			}
		}
	}
}
function resolveBulletPlayerCollisions() { for (var i = 0, len = aliens.length; i < len; i++) { var alien = aliens[i]; if (alien.bullet !== null && checkRectCollision(alien.bullet.bounds, player.bounds)) { if (player.lives === 0) { showGameOver(); } else { alien.bullet.alive = false; particleManager.createExplosion(player.position.x, player.position.y, '#f44336', 100, 8, 8, 6, 0.001, 40); player.position.set(CANVAS_WIDTH/2, CANVAS_HEIGHT - 70); player.lives--; break; } } } }
function resolveCollisions() { resolveBulletEnemyCollisions(); resolveBulletPlayerCollisions(); }
function updateGame(dt) { if (quizActive) return; player.handleInput(); prevKeyStates = keyStates.slice(); player.update(dt); updateAliens(dt); resolveCollisions(); }
function drawIntoCanvas(width, height, drawFunc) { var c = document.createElement('canvas'); c.width = width; c.height = height; var cctx = c.getContext('2d'); drawFunc(cctx); return c; }
function fillText(text, x, y, color, fontSize) { if (typeof color !== 'undefined') ctx.fillStyle = color; if (typeof fontSize !== 'undefined') ctx.font = fontSize + "px 'Segoe UI', Roboto, Arial, sans-serif"; ctx.fillText(text, x, y); }
function fillCenteredText(text, x, y, color, fontSize) { var metrics = ctx.measureText(text); fillText(text, x - metrics.width/2, y, color, fontSize); }
function drawBottomHud() { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, CANVAS_HEIGHT - 2, CANVAS_WIDTH, 2); fillText('Lives: ' + player.lives, 12, CANVAS_HEIGHT - 10, '#e2e8f0', 16); fillText('Wave: ' + wave, CANVAS_WIDTH - 120, CANVAS_HEIGHT - 10, '#e2e8f0', 16); fillCenteredText('Score: ' + player.score, CANVAS_WIDTH/2, 26, '#00a9e0', 20); }
function drawAliens(resized) { for (var i = 0; i < aliens.length; i++) { aliens[i].draw(resized); } }
function drawGame(resized) { player.draw(resized); drawAliens(resized); particleManager.draw(); drawBottomHud(); }
function animate() { var now = window.performance.now(); var dt = now - lastTime; if (dt > 100) dt = 100; if (hasGameStarted && !quizActive) { updateGame(dt / 1000); } ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); if (hasGameStarted) { drawGame(false); } lastTime = now; requestAnimationFrame(animate); }
function showQuiz() { quizActive = true; var question = questions[Math.floor(Math.random() * questions.length)]; questionTextEl.textContent = question.question; answerButtonsEl.innerHTML = ''; question.answers.forEach(function(answer, index) { var btn = document.createElement('button'); btn.textContent = answer; btn.style.margin = '0'; btn.style.width = '100%'; btn.onclick = function() { handleAnswer(index === question.correct); }; answerButtonsEl.appendChild(btn); }); quizScreenEl.style.display = 'flex'; }
function handleAnswer(isCorrect) { if (isCorrect) { quizCardEl.classList.add('quiz-correct'); player.score += 50; showPointsFeedback('+50 Points!', '#22c55e'); } else { quizCardEl.classList.add('quiz-incorrect'); player.score -= 25; if (player.score < 0) player.score = 0; showPointsFeedback('-25 Points!', '#f44336'); } setTimeout(function() { quizCardEl.classList.remove('quiz-correct', 'quiz-incorrect'); hideQuiz(); }, 600); }
function hideQuiz() { quizActive = false; quizScreenEl.style.display = 'none'; }
function showPointsFeedback(text, color) { pointsFeedbackEl.textContent = text; pointsFeedbackEl.style.color = color || '#22c55e'; pointsFeedbackEl.classList.remove('show-points'); void pointsFeedbackEl.offsetWidth; pointsFeedbackEl.classList.add('show-points'); }
function resize() { var w = window.innerWidth, h = window.innerHeight; var scaleFactor = Math.min(w / CANVAS_WIDTH, h / CANVAS_HEIGHT); if (IS_CHROME) { canvas.width = CANVAS_WIDTH * scaleFactor; canvas.height = CANVAS_HEIGHT * scaleFactor; setImageSmoothing(true); ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0); } else { canvas.style.width = CANVAS_WIDTH * scaleFactor + 'px'; canvas.style.height = CANVAS_HEIGHT * scaleFactor + 'px'; } }
function onKeyDown(e) { e.preventDefault(); keyStates[e.keyCode] = true; }
function onKeyUp(e) { e.preventDefault(); keyStates[e.keyCode] = false; }

// Wire UI events
startButton.addEventListener('click', initGame);
restartButton.addEventListener('click', function() { gameOverScreenEl.style.display = 'none'; initGame(); });

// Initialize on load without clobbering other handlers
window.addEventListener('load', function() { init(); animate(); });

