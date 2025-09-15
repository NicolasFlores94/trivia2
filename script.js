// ==========================
// 🎯 Mesa única por QR (1 juego cada 12 horas)
// ==========================
function getMesaID() {
  const params = new URLSearchParams(window.location.search);
  return params.get("mesa") || "default";
}
const mesaID = getMesaID();

function canPlayMesa() {
  const lastPlay = localStorage.getItem(`mesa-${mesaID}`);
  if(!lastPlay) return true;
  const last = parseInt(lastPlay);
  return (Date.now() - last) >= 12*60*60*1000;
}
function markPlayedMesa() { localStorage.setItem(`mesa-${mesaID}`, Date.now()); }
function timeRemainingMesa() {
  const last = parseInt(localStorage.getItem(`mesa-${mesaID}`));
  if(!last) return 0;
  const diff = 12*60*60*1000 - (Date.now() - last);
  return diff > 0 ? diff : 0;
}

// ==========================
// 🎮 Trivia
// ==========================
const triviaContainer = document.getElementById("trivia-container");
const startTriviaBtn = document.getElementById("startTrivia");
const questions = [
  { question: "¿Cuál es la capital de Argentina?", options: ["Buenos Aires","Córdoba","Rosario","Mendoza"], answer:"Buenos Aires" },
  { question: "¿Qué bebida es típica en Irlanda?", options: ["Whiskey","Vodka","Tequila","Ron"], answer:"Whiskey" },
  { question: "¿Cuántos continentes hay en el mundo?", options: ["5","6","7","8"], answer:"7" }
];
let currentQuestion=0, score=0, playerName="", playerPhone="", wonTrivia=false;

function showQuestion() {
  const q = questions[currentQuestion];
  triviaContainer.innerHTML = `<div class="question">${q.question}</div>
    <div class="options">${q.options.map(opt=>`<div class="option">${opt}</div>`).join("")}</div>`;
  document.querySelectorAll(".option").forEach(option=>option.addEventListener("click",()=>checkAnswer(option)));
}
function checkAnswer(optionDiv) {
  const selected = optionDiv.textContent;
  const q = questions[currentQuestion];
  document.querySelectorAll(".option").forEach(opt=>opt.classList.add("disabled"));
  if(selected===q.answer){ optionDiv.classList.add("correct"); score++; }
  else{ optionDiv.classList.add("incorrect"); document.querySelectorAll(".option").forEach(opt=>{ if(opt.textContent===q.answer) opt.classList.add("correct"); }); }
  setTimeout(()=>{ currentQuestion++; if(currentQuestion<questions.length){ showQuestion(); } else { endTrivia(); } },1500);
}
function endTrivia(){
  wonTrivia = score === questions.length;
  spinBtn.disabled = !wonTrivia;
  saveScore(playerName, playerPhone, score);
  renderRanking();
  triviaContainer.innerHTML = `<p>Terminaste la trivia 🎉</p>
    <p>Puntuación: ${score}/${questions.length}</p>
    ${wonTrivia?'<p>🎡 Ruleta desbloqueada, girala para ganar premios!</p>':'<p>❌ No acertaste todas las respuestas, la ruleta sigue bloqueada.</p>'}
    <button id="restartBtn" class="btn">Reiniciar Trivia</button>`;
  document.getElementById("restartBtn").addEventListener("click", restartTrivia);
}
function restartTrivia(){ currentQuestion=0; score=0; wonTrivia=false; spinBtn.disabled=true; showLogin(); }
function showLogin(){
  triviaContainer.innerHTML = `<h2>🎮 Ingresá tus datos</h2>
    <input type="text" id="playerName" placeholder="Nombre">
    <input type="text" id="playerPhone" placeholder="Celular">
    <button id="startTrivia" class="btn">Comenzar Trivia</button>`;
  document.getElementById("startTrivia").addEventListener("click", startTrivia);
}
function startTrivia(){
  if(!canPlayMesa()){
    const remaining = timeRemainingMesa();
    const hours = Math.floor(remaining/(1000*60*60));
    const minutes = Math.floor((remaining%(1000*60*60))/(1000*60));
    alert(`⚠️ Esta mesa ya jugó. Volvé a jugar en ${hours}h ${minutes}m.`);
    return;
  }
  playerName=document.getElementById("playerName").value.trim();
  playerPhone=document.getElementById("playerPhone").value.trim();
  if(!playerName||!playerPhone){ alert("⚠️ Ingresa nombre y celular."); return; }
  currentQuestion=0; score=0; wonTrivia=false; spinBtn.disabled=true; showQuestion();
  markPlayedMesa();
}
startTriviaBtn.addEventListener("click", startTrivia);

// ==========================
// 🏆 Ranking
// ==========================
const rankingList=document.getElementById("ranking-list");
const resetBtn=document.getElementById("resetRanking");
function saveScore(name,phone,points){
  let ranking=JSON.parse(localStorage.getItem("ranking"))||[];
  ranking.push({name,phone,points});
  ranking.sort((a,b)=>b.points-a.points);
  ranking=ranking.slice(0,10);
  localStorage.setItem("ranking",JSON.stringify(ranking));
}
function renderRanking(){
  let ranking=JSON.parse(localStorage.getItem("ranking"))||[];
  rankingList.innerHTML=ranking.map((r,i)=>`<li>🏅 ${i+1}. ${r.name} (${r.phone}) — ${r.points} pts</li>`).join("");
}
resetBtn.addEventListener("click",()=>{ localStorage.removeItem("ranking"); renderRanking(); });
renderRanking();

// ==========================
// 🎡 Ruleta
// ==========================
const spinBtn=document.getElementById("spinBtn");
const wheelCanvas=document.getElementById("wheel");
const lightsCanvas=document.getElementById("wheelLights");
const confettiCanvas=document.getElementById("confettiCanvas");
const ctx=wheelCanvas.getContext("2d");
const ctxLights=lightsCanvas.getContext("2d");
const ctxConfetti=confettiCanvas.getContext("2d");

const segments=["Trago gratis","2x1 Cerveza","10% descuento","Ticket sorpresa"];
const colors=["#f87171","#34d399","#60a5fa","#fbbf24"];
let angle=0, angularVelocity=0;

// 💫 Ruleta
function drawWheel(){
  const len = segments.length;
  const arc = Math.PI*2/len;
  ctx.clearRect(0,0,300,300);
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for(let i=0;i<len;i++){
    ctx.beginPath();
    ctx.moveTo(150,150);
    ctx.arc(150,150,150,i*arc,i*arc+arc);
    ctx.fillStyle = colors[i%colors.length];
    ctx.fill();
    const angleMiddle=i*arc+arc/2;
    const x=150+Math.cos(angleMiddle)*100;
    const y=150+Math.sin(angleMiddle)*100;
    ctx.fillStyle="black";
    ctx.fillText(segments[i],x,y);
  }
}

// 💡 Luces
function drawLights(){
  ctxLights.clearRect(0,0,300,300);
  const time = Date.now()/100;
  for(let i=0;i<12;i++){
    const a = i*Math.PI/6 + (angularVelocity*50);
    const x = 150+Math.cos(a)*140;
    const y = 150+Math.sin(a)*140;
    ctxLights.beginPath();
    ctxLights.arc(x,y,6,0,2*Math.PI);
    ctxLights.fillStyle=(Math.sin(time+i)>0)?"yellow":"orange";
    ctxLights.fill();
  }
}

// 🎊 Confeti
let confettiParticles=[];
function createConfetti(){
  confettiParticles=[];
  for(let i=0;i<100;i++){
    confettiParticles.push({x:150,y:150,angle:Math.random()*2*Math.PI,speed:Math.random()*4+2,color:colors[Math.floor(Math.random()*colors.length)],size:Math.random()*6+4});
  }
}
function drawConfetti(){
  ctxConfetti.clearRect(0,0,300,300);
  confettiParticles.forEach(p=>{
    p.x+=Math.cos(p.angle)*p.speed;
    p.y+=Math.sin(p.angle)*p.speed+1;
    p.angle+=0.05;
    ctxConfetti.fillStyle=p.color;
    ctxConfetti.fillRect(p.x,p.y,p.size,p.size);
  });
  confettiParticles=confettiParticles.filter(p=>p.y<300);
  if(confettiParticles.length>0) requestAnimationFrame(drawConfetti);
}

// 🎯 Animación Ruleta
function animateWheel(){
  if(angularVelocity>0.002){
    angle+=angularVelocity;
    angularVelocity*=0.97;
    wheelCanvas.style.transform=`rotate(${angle}rad)`;
    drawLights();
    requestAnimationFrame(animateWheel);
  } else {
    drawLights();
    const selectedIndex=Math.floor(segments.length-(angle%(2*Math.PI))/(2*Math.PI/segments.length))%segments.length;
    document.getElementById("result").textContent=`🎉 Ganaste: ${segments[selectedIndex]}`;
    spinBtn.disabled=true;
    createConfetti();
    drawConfetti();
  }
}

spinBtn.addEventListener("click",()=>{
  if(spinBtn.disabled) return;
  angularVelocity=0.4+Math.random()*0.2;
  animateWheel();
});

drawWheel();
