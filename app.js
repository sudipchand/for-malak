const $ = id => document.getElementById(id);
const views = ['intro', 'game', 'invite', 'result'];
const backgroundMusic = $('background-music');
const musicToggle = $('music-toggle');
let userPausedMusic = false;
let musicHasStarted = false;
backgroundMusic.volume = 0.5;
function syncMusicControl() {
  const playing = !backgroundMusic.paused;
  musicToggle.textContent = playing ? '♫ Pause music' : '♫ Play music';
  musicToggle.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
}
async function startMusic() {
  if (userPausedMusic || !backgroundMusic.paused) return;
  try {
    await backgroundMusic.play();
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      $('music-status').textContent = 'Tap to open your invitation and start the music.';
    } else if (error.name !== 'AbortError') {
      $('music-status').textContent = 'The music could not load. Try refreshing the page.';
    }
    syncMusicControl();
  }
}
backgroundMusic.addEventListener('playing', () => {
  $('singer-avatar').dataset.singing = 'true';
  musicHasStarted = true;
  $('music-status').textContent = 'A little soundtrack for us.';
  syncMusicControl();
});
backgroundMusic.addEventListener('pause', () => {
  $('singer-avatar').dataset.singing = 'false';
  $('music-status').textContent = userPausedMusic ? 'Music paused.' : 'Tap Play music to continue.';
  syncMusicControl();
});
backgroundMusic.addEventListener('error', () => {
  $('singer-avatar').dataset.singing = 'false';
  $('music-status').textContent = 'The music could not load. Try refreshing the page.';
  syncMusicControl();
});
['waiting', 'ended', 'emptied'].forEach(eventName => {
  backgroundMusic.addEventListener(eventName, () => {
    $('singer-avatar').dataset.singing = 'false';
  });
});
musicToggle.addEventListener('click', () => {
  if (!backgroundMusic.paused) {
    userPausedMusic = true;
    backgroundMusic.pause();
  } else {
    userPausedMusic = false;
    startMusic();
  }
});
function startMusicFromFirstGesture(event) {
  if (!event.isTrusted || musicHasStarted || userPausedMusic || musicToggle.contains(event.target)) return;
  if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
  startMusic();
}
document.addEventListener('pointerdown', startMusicFromFirstGesture, { passive: true });
document.addEventListener('keydown', startMusicFromFirstGesture);
startMusic();
const heartPositions = [[50, 44], [77, 27], [25, 68], [77, 68], [25, 27]];
const heartMessages = [
  '1 / 5 — Great taste in music. We already knew that.',
  '2 / 5 — Okay, you’re good at this.',
  '3 / 5 — The butterflies? Those are mine.',
  '4 / 5 — One more. I’m building up the courage.',
  '5 / 5 — All yours. There’s something I want to ask you.'
];
let caughtHearts = 0;
let gameActive = false;
let nextHeartTimer;
function positionHeart() {
  const target = $('heart-target');
  const [x, y] = heartPositions[caughtHearts];
  target.style.left = x + '%';
  target.style.top = y + '%';
  target.setAttribute('aria-label', 'Catch heart ' + (caughtHearts + 1) + ' of 5');
  target.disabled = false;
}
function startGame() {
  clearTimeout(nextHeartTimer);
  caughtHearts = 0;
  gameActive = true;
  $('score-number').textContent = '00';
  $('heart-progress').value = 0;
  $('heart-progress').textContent = '0 of 5';
  $('heart-target').hidden = false;
  $('game-reveal').hidden = true;
  $('arena-hint').hidden = false;
  $('skip-game').hidden = false;
  $('catch-message').textContent = 'First heart: yours for the taking.';
  show('game');
  positionHeart();
}
function catchHeart() {
  const target = $('heart-target');
  if (!gameActive || target.disabled || caughtHearts >= 5) return;
  target.disabled = true;
  caughtHearts += 1;
  $('score-number').textContent = String(caughtHearts).padStart(2, '0');
  $('heart-progress').value = caughtHearts;
  $('heart-progress').textContent = caughtHearts + ' of 5';
  $('catch-message').textContent = heartMessages[caughtHearts - 1];
  if (caughtHearts === 5) {
    gameActive = false;
    target.hidden = true;
    $('arena-hint').hidden = true;
    $('skip-game').hidden = true;
    $('game-reveal').hidden = false;
    $('open-surprise').focus({ preventScroll: true });
    celebrate();
  } else {
    nextHeartTimer = setTimeout(() => {
      if (!gameActive) return;
      positionHeart();
      target.focus({ preventScroll: true });
    }, 240);
  }
}
$('heart-target').addEventListener('click', catchHeart);
['skip-intro', 'skip-game', 'open-surprise'].forEach(id => {
  $(id).addEventListener('click', () => {
    startMusic();
    show('invite');
  });
});
function show(id) {
  if (id !== 'game') {
    gameActive = false;
    clearTimeout(nextHeartTimer);
  }
  views.forEach(view => { $(view).hidden = view !== id; });
  const scrollTarget = window.matchMedia('(max-width: 650px)').matches && id !== 'intro' ? Math.max(0, $('experience-main').offsetTop - 16) : 0;
  window.scrollTo({ top: scrollTarget, behavior: 'instant' });
  const heading = $(id).querySelector('h1');
  heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
}
$('begin').addEventListener('click', () => {
  startMusic();
  startGame();
});
$('restart').addEventListener('click', () => show('invite'));
function respond(answer) {
  const selection = document.querySelector('input[name="date"]:checked')?.value;
  let title, description, kicker, reply;
  if (answer === 'yes') {
    kicker = 'THAT JUST MADE MY DAY.';
    title = 'Okay, now I’m<br><span class="serif pink">smiling.</span>';
    description = selection === 'coffee' ? 'Coffee, a walk, and good company.\nLet’s pick a time for Sunday.' : selection === 'drinks' ? 'Drinks and your playlist. Sounds like a plan.\nLet’s pick a time for Sunday.' : 'A little music and some time together.\nSounds like a lovely Sunday.';
    reply = selection === 'coffee' ? 'Yes, coffee and a walk sounds lovely! What time on Sunday?' : selection === 'drinks' ? 'Yes, let’s do drinks and music! What time on Sunday?' : 'Yes, I’d love to hang out on Sunday! Let’s make a plan.';
  } else if (answer === 'later') {
    kicker = 'ALL GOOD.';
    title = 'Another time,<br><span class="serif pink">maybe.</span>';
    description = 'No rush and no pressure.\nI’m glad I found the courage to ask.';
    reply = 'Thank you for the lovely invitation! Maybe another time — I’ll let you know.';
  } else {
    kicker = 'THANKS FOR BEING HONEST.';
    title = 'All good,<br><span class="serif pink">Malak.</span>';
    description = 'Thanks for taking a moment to open this.\nI hope the song still makes you smile.';
    reply = 'Thank you for the thoughtful invitation, but I’ll pass. I appreciate you asking.';
  }
  $('result-kicker').textContent = kicker;
  $('result-title').innerHTML = title;
  $('result-description').textContent = description;
  $('reply').value = reply;
  $('copy-status').textContent = 'Copy it and send it in our chat.';
  show('result');
  if (answer === 'yes') celebrate();
}
$('yes').addEventListener('click', () => respond('yes'));
$('later').addEventListener('click', () => respond('later'));
$('no').addEventListener('click', () => respond('no'));
$('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('reply').value);
    $('copy-status').textContent = 'Copied! Paste it in our chat to send it to me.';
  } catch {
    $('reply').focus();
    $('reply').select();
    $('copy-status').textContent = 'Select and copy the reply above, then paste it in our chat.';
  }
});
let animation;
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: 'prepare_date_reply',
      title: 'Prepare a reply to the Sunday invitation',
      description: 'Show a response and prepare an editable reply. This does not send a message or make a booking.',
      inputSchema: {type:'object',properties:{answer:{type:'string',enum:['yes','later','no']},date:{type:'string',enum:['coffee','drinks']}},required:['answer'],additionalProperties:false},
      annotations: {readOnlyHint:false,untrustedContentHint:false},
      execute(input) {
        if (!input || !['yes','later','no'].includes(input.answer) || (input.date !== undefined && !['coffee','drinks'].includes(input.date)) || Object.keys(input).some(key => !['answer','date'].includes(key))) throw new Error('Choose a valid answer and Sunday plan.');
        document.querySelectorAll('input[name="date"]').forEach(el => {el.checked = el.value === input.date;});
        respond(input.answer);
        return {reply:$('reply').value,sent:false};
      }
    }, {signal:lifecycle.signal})).catch(() => {});
    window.addEventListener('pagehide', () => lifecycle.abort(), {once:true});
  } catch {}
}
function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  cancelAnimationFrame(animation);
  const canvas = $('confetti'), ctx = canvas.getContext('2d');
  if (!ctx) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth, height = window.innerHeight;
  canvas.width = width * ratio; canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const colors = ['#ff8dcc', '#e6ff85', '#8ce6ee', '#ffffff'];
  const pieces = Array.from({ length: 110 }, () => ({ x: Math.random() * width, y: -Math.random() * height, speed: 110 + Math.random() * 150, drift: (Math.random() - .5) * 80, angle: Math.random() * Math.PI, spin: Math.random() * 4 - 2, color: colors[Math.floor(Math.random() * colors.length)] }));
  let start, previous;
  function draw(now) {
    if (!start) { start = now; previous = now; }
    const elapsed = now - start, dt = Math.min((now - previous) / 1000, .05); previous = now;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = Math.min(1, (4500 - elapsed) / 1000);
    if (elapsed > 4500) { ctx.clearRect(0, 0, width, height); return; }
    pieces.forEach(p => { p.y += p.speed * dt; p.x += p.drift * dt; p.angle += p.spin * dt; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle); ctx.fillStyle = p.color; ctx.fillRect(-3, -5, 6, 10); ctx.restore(); });
    animation = requestAnimationFrame(draw);
  }
  animation = requestAnimationFrame(draw);
}
