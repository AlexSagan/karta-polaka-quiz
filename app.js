const tg=window.Telegram?.WebApp;
if(tg){tg.ready();tg.expand();document.documentElement.style.setProperty('--tg-bg',tg.themeParams.bg_color||'#0f1117');}
const labels={history:'Historia Polski',traditions:'Kultura i tradycje',famous:'Znani Polacy',geography:'Geografia'};
const QUIZ_SIZE=20,MAX_MISTAKES=3,TIME_LIMIT=20*60;
let all=[],pool=[],idx=0,score=0,current='all',mistakes=[],answered=false,wrongCount=0,timeLeft=TIME_LIMIT,timerId=null,finished=false,pendingAction=null;
const $=s=>document.querySelector(s);
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a};

async function init(){
 try{
  const r=await fetch('./questions.json?v=3',{cache:'no-store'});
  if(!r.ok)throw new Error('HTTP '+r.status);
  all=await r.json();renderCounts();renderLast();
 }catch(e){
  $('#loadError').classList.remove('hidden');
  $('#loadError').textContent='Nie udało się wczytać bazy pytań: '+e.message;
 }
}
function renderCounts(){
 document.querySelectorAll('[data-cat]').forEach(el=>{
  const c=el.dataset.cat,bank=c==='quick'?all:all.filter(q=>q.category===c);
  el.querySelector('.meta').textContent=`20 pytań · baza: ${bank.length}`;
 });
 $('#total').textContent=`${all.length} pytań w bazie`;
}
function renderLast(){
 const s=JSON.parse(localStorage.getItem('kp_stats')||'null');
 if(s)$('#last').textContent=`Ostatni wynik: ${s.score}/${s.total} (${Math.round(s.score/s.total*100)}%)`;
}
function start(cat,retry=false){
 stopTimer();current=cat;score=0;idx=0;mistakes=[];wrongCount=0;answered=false;finished=false;timeLeft=TIME_LIMIT;
 if(retry){
  const saved=JSON.parse(localStorage.getItem('kp_mistakes')||'[]');
  pool=shuffle(saved).slice(0,Math.min(QUIZ_SIZE,saved.length));
 }else{
  const source=cat==='quick'?all:all.filter(q=>q.category===cat);
  pool=shuffle(source).slice(0,Math.min(QUIZ_SIZE,source.length));
 }
 if(!pool.length){alert('Brak pytań w tym trybie.');return}
 showView('quiz');show();startTimer();
}
function startTimer(){
 updateTimer();
 timerId=setInterval(()=>{timeLeft--;updateTimer();if(timeLeft<=0)lose('time')},1000);
}
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null}}
function updateTimer(){
 const t=Math.max(0,timeLeft),m=Math.floor(t/60),s=t%60;
 $('#timer').textContent=`⏱ ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
 $('#timer').classList.toggle('danger',timeLeft<=60);
}
function updateHud(){
 $('#qnum').textContent=`${Math.min(idx+1,pool.length)}/${pool.length}`;
 $('#lives').textContent=`Błędy: ${wrongCount}/${MAX_MISTAKES}`;
}
function show(){
 if(finished)return;answered=false;
 const q=pool[idx];
 $('#cat').textContent=current==='quick'?'Szybki quiz':(labels[q.category]||q.category);
 updateHud();$('#bar').style.width=`${(idx/pool.length)*100}%`;
 $('#question').textContent=q.question;$('#answers').innerHTML='';
 $('#feedback').classList.add('hidden');$('#next').classList.add('hidden');
 const opts=q.answers.map((text,i)=>({text,correct:i===q.correct}));
 shuffle(opts).forEach(o=>{
  const b=document.createElement('button');b.className='answer';b.textContent=o.text;
  b.onclick=()=>choose(o,b,q);$('#answers').appendChild(b);
 });
}
function choose(opt,btn,q){
 if(answered||finished)return;answered=true;
 [...document.querySelectorAll('.answer')].forEach(b=>{
  if(b.textContent===q.answers[q.correct])b.classList.add('correct');b.disabled=true;
 });
 if(opt.correct){
  score++;$('#feedback').textContent='✓ Dobra odpowiedź';$('#feedback').className='feedback good';
 }else{
  btn.classList.add('wrong');mistakes.push(q);wrongCount++;updateHud();
  $('#feedback').textContent=`✕ Poprawna odpowiedź: ${q.answers[q.correct]}`;$('#feedback').className='feedback bad';
 }
 $('#feedback').classList.remove('hidden');
 if(wrongCount>=MAX_MISTAKES){setTimeout(()=>lose('mistakes'),650);return}
 $('#next').classList.remove('hidden');
}
function next(){if(finished)return;idx++;if(idx>=pool.length)finish(true);else show()}
function lose(reason){
 if(finished)return;
 stopTimer();
 finish(false,reason==='time'?'CZAS MINĄŁ':'PRZEGRANA',
  reason==='time'?'Minęło 20 minut. Spróbuj ponownie.':'3 błędne odpowiedzi — koniec próby.');
}
function finish(completed=true,title=null,message=null){
 finished=true;stopTimer();
 localStorage.setItem('kp_stats',JSON.stringify({score,total:pool.length,date:Date.now(),completed,wrongCount}));
 localStorage.setItem('kp_mistakes',JSON.stringify(mistakes));
 $('#resultTitle').textContent=title||(completed?'QUIZ UKOŃCZONY':'KONIEC');
 $('#score').textContent=`${score}/${pool.length}`;
 $('#percent').textContent=message||(completed?`${Math.round(score/pool.length*100)}% poprawnych odpowiedzi`:'');
 $('#mistakeInfo').textContent=`Błędy: ${wrongCount}/${MAX_MISTAKES}`;
 $('#retryMistakes').classList.toggle('hidden',!mistakes.length);
 showView('result');renderLast();
}
function showView(id){['home','quiz','result'].forEach(x=>$('#'+x).classList.toggle('hidden',x!==id));window.scrollTo(0,0)}
function isQuizActive(){
 return !finished && !$('#quiz').classList.contains('hidden');
}
function requestLeave(action){
 if(!isQuizActive()){performAction(action);return;}
 pendingAction=action;
 $('#leaveModal').classList.remove('hidden');
}
function closeLeaveModal(){
 pendingAction=null;
 $('#leaveModal').classList.add('hidden');
}
function confirmLeave(){
 const action=pendingAction;
 pendingAction=null;
 $('#leaveModal').classList.add('hidden');
 stopTimer();finished=true;
 performAction(action);
}
function performAction(action){
 if(action==='results'){showResults();return;}
 stopTimer();finished=true;showView('home');
}
function home(){requestLeave('home')}
function quizMenu(){requestLeave('quiz')}
function resultsNav(){requestLeave('results')}
document.addEventListener('click',e=>{const c=e.target.closest('[data-cat]');if(c)start(c.dataset.cat)});
window.start=start;window.next=next;window.home=home;init();

function showResults(){
 const s=JSON.parse(localStorage.getItem('kp_stats')||'null');
 if(!s){alert('Brak zapisanych wyników.');return;}
 stopTimer(); finished=true;
 $('#resultTitle').textContent='OSTATNI WYNIK';
 $('#score').textContent=`${s.score}/${s.total}`;
 $('#percent').textContent=`${Math.round(s.score/s.total*100)}% poprawnych odpowiedzi`;
 $('#mistakeInfo').textContent=`Błędy: ${s.wrongCount||0}/${MAX_MISTAKES}`;
 $('#retryMistakes').classList.add('hidden');
 showView('result');
}
window.showResults=showResults;window.quizMenu=quizMenu;window.resultsNav=resultsNav;window.closeLeaveModal=closeLeaveModal;window.confirmLeave=confirmLeave;
