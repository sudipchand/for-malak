const $ = id => document.getElementById(id);
const views = ['intro', 'invite', 'result'];
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
  musicHasStarted = true;
  $('music-status').textContent = 'A little soundtrack for us.';
  syncMusicControl();
});
backgroundMusic.addEventListener('pause', () => {
  $('music-status').textContent = userPausedMusic ? 'Music paused.' : 'Tap Play music to continue.';
  syncMusicControl();
});
backgroundMusic.addEventListener('error', () => {
  $('music-status').textContent = 'The music could not load. Try refreshing the page.';
  syncMusicControl();
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
function show(id) {
  views.forEach(view => { $(view).hidden = view !== id; });
  window.scrollTo({ top: 0, behavior: 'instant' });
  const heading = $(id).querySelector('h1');
  heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
}
$('begin').addEventListener('click', () => {
  startMusic();
  show('invite');
});
$('restart').addEventListener('click', () => show('invite'));
function respond(answer) {
  const selection = document.querySelector('input[name="date"]:checked')?.value;
  let title, description, kicker, reply;
  if (answer === 'yes') {
    kicker = 'THAT JUST MADE MY DAY.';
    title = 'Okay, now I’m<br><span class="serif pink">smiling.</span>';
    description = selection === 'coffee' ? 'Coffee, a walk, and you. Sounds pretty perfect.\nLet’s find a time that works for us.' : selection === 'drinks' ? 'Drinks, good music, and you. I’m in.\nLet’s find a time that works for us.' : 'A little music. A little chemistry. A date with you.\nLet’s make a plan.';
    reply = selection === 'coffee' ? 'Yes, I’d love to! Coffee and a walk sounds lovely. When are you free?' : selection === 'drinks' ? 'Yes, I’d love to! Let’s do drinks and music. When are you free?' : 'Yes, I’d love to go on a date with you! Let’s make a plan.';
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
      title: 'Prepare a reply to the date invitation',
      description: 'Show a response and prepare an editable reply. This does not send a message or make a booking.',
      inputSchema: {type:'object',properties:{answer:{type:'string',enum:['yes','later','no']},date:{type:'string',enum:['coffee','drinks']}},required:['answer'],additionalProperties:false},
      annotations: {readOnlyHint:false,untrustedContentHint:false},
      execute(input) {
        if (!input || !['yes','later','no'].includes(input.answer) || (input.date !== undefined && !['coffee','drinks'].includes(input.date)) || Object.keys(input).some(key => !['answer','date'].includes(key))) throw new Error('Choose a valid answer and date idea.');
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
