
const tg=window.Telegram?.WebApp;
if(tg){tg.ready();tg.expand();document.documentElement.style.setProperty('--tg-bg',tg.themeParams.bg_color||'#0f1117');}
const labels={history:'Historia Polski',traditions:'Kultura i tradycje',famous:'Znani Polacy',geography:'Geografia'};
let all=[],pool=[],idx=0,score=0,current='all',mistakes=[],answered=false;
const $=s=>document.querySelector(s);
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a};

async function init(){
 try{
   const r=await fetch('./questions.json?v=2',{cache:'no-store'});
   if(!r.ok) throw new Error('HTTP '+r.status);
   all=await r.json();
   renderCounts(); renderLast();
 }catch(e){
   $('#loadError').classList.remove('hidden');
   $('#loadError').textContent='Nie udało się wczytać bazy pytań: '+e.message;
 }
}
function renderCounts(){
 document.querySelectorAll('[data-cat]').forEach(el=>{
   const c=el.dataset.cat;
   let n=c==='quick'?Math.min(20,all.length):all.filter(q=>q.category===c).length;
   el.querySelector('.meta').textContent=`${n} pytań`;
 });
 $('#total').textContent=`${all.length} pytań w bazie`;
}
function renderLast(){
 const s=JSON.parse(localStorage.getItem('kp_stats')||'null');
 if(s) $('#last').textContent=`Ostatni wynik: ${s.score}/${s.total} (${Math.round(s.score/s.total*100)}%)`;
}
function start(cat, retry=false){
 current=cat; score=0; idx=0; mistakes=[]; answered=false;
 if(retry){
   pool=JSON.parse(localStorage.getItem('kp_mistakes')||'[]');
 }else if(cat==='quick'){
   pool=shuffle(all).slice(0,Math.min(20,all.length));
 }else{
   pool=shuffle(all.filter(q=>q.category===cat));
 }
 if(!pool.length){alert('Brak pytań w tym trybie.');return}
 showView('quiz'); show();
}
function show(){
 answered=false;
 const q=pool[idx];
 $('#cat').textContent=labels[q.category]||q.category;
 $('#qnum').textContent=`${idx+1}/${pool.length}`;
 $('#bar').style.width=`${(idx/pool.length)*100}%`;
 $('#question').textContent=q.question;
 $('#answers').innerHTML='';
 $('#feedback').classList.add('hidden');
 $('#next').classList.add('hidden');

 const opts=q.answers.map((text,i)=>({text,correct:i===q.correct}));
 shuffle(opts).forEach(o=>{
   const b=document.createElement('button');
   b.className='answer'; b.textContent=o.text;
   b.onclick=()=>choose(o,b,q);
   $('#answers').appendChild(b);
 });
}
function choose(opt,btn,q){
 if(answered)return; answered=true;
 const buttons=[...document.querySelectorAll('.answer')];
 buttons.forEach(b=>{ if(b.textContent===q.answers[q.correct]) b.classList.add('correct'); b.disabled=true; });
 if(opt.correct){score++;$('#feedback').textContent='✓ Dobra odpowiedź';$('#feedback').className='feedback good';}
 else{btn.classList.add('wrong');mistakes.push(q);$('#feedback').textContent=`✕ Poprawna odpowiedź: ${q.answers[q.correct]}`;$('#feedback').className='feedback bad';}
 $('#feedback').classList.remove('hidden');$('#next').classList.remove('hidden');
}
function next(){idx++; if(idx>=pool.length) finish(); else show();}
function finish(){
 localStorage.setItem('kp_stats',JSON.stringify({score,total:pool.length,date:Date.now()}));
 localStorage.setItem('kp_mistakes',JSON.stringify(mistakes));
 $('#score').textContent=`${score}/${pool.length}`;
 $('#percent').textContent=`${Math.round(score/pool.length*100)}% poprawnych odpowiedzi`;
 $('#mistakeInfo').textContent=mistakes.length?`Błędne odpowiedzi: ${mistakes.length}`:'Bez błędów. Świetnie!';
 $('#retryMistakes').classList.toggle('hidden',!mistakes.length);
 showView('result'); renderLast();
}
function showView(id){['home','quiz','result'].forEach(x=>$('#'+x).classList.toggle('hidden',x!==id));window.scrollTo(0,0)}
function home(){showView('home')}
document.addEventListener('click',e=>{const c=e.target.closest('[data-cat]');if(c)start(c.dataset.cat)});
window.start=start;window.next=next;window.home=home;init();
