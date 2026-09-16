
const tg=window.Telegram?.WebApp; if(tg){tg.ready();tg.expand();}
let all=[],pool=[],idx=0,score=0,locked=false,currentCategory="Wszystkie";
const $=s=>document.querySelector(s);
async function init(){all=await (await fetch("questions.json")).json(); renderCounts();}
function renderCounts(){document.querySelectorAll("[data-cat]").forEach(el=>{let c=el.dataset.cat;let n=c==="Wszystkie"?all.length:all.filter(q=>q.category===c).length;el.querySelector(".meta").textContent=`${n} pytań`;});}
function start(cat){currentCategory=cat; pool=(cat==="Wszystkie"?all:all.filter(q=>q.category===cat)).sort(()=>Math.random()-.5);idx=0;score=0;$("#home").classList.add("hidden");$("#result").classList.add("hidden");$("#quiz").classList.remove("hidden");show();}
function show(){locked=false;let q=pool[idx];$("#qnum").textContent=`${idx+1}/${pool.length}`;$("#cat").textContent=q.category;$("#bar").style.width=`${idx/pool.length*100}%`;$("#question").textContent=q.q;$("#answers").innerHTML="";$("#explain").classList.add("hidden");$("#next").classList.add("hidden");q.answers.forEach((a,i)=>{let b=document.createElement("button");b.className="answer";b.textContent=a;b.onclick=()=>choose(i,b);$("#answers").appendChild(b);});}
function choose(i,b){if(locked)return;locked=true;let q=pool[idx],bs=[...document.querySelectorAll(".answer")];bs[q.correct].classList.add("correct");if(i===q.correct)score++;else b.classList.add("wrong");$("#explain").textContent=q.explanation;$("#explain").classList.remove("hidden");$("#next").classList.remove("hidden");}
function next(){idx++;if(idx>=pool.length)return finish();show();}
function finish(){$("#quiz").classList.add("hidden");$("#result").classList.remove("hidden");$("#score").textContent=`${score}/${pool.length}`;$("#percent").textContent=`${Math.round(score/pool.length*100)}% poprawnych odpowiedzi`;localStorage.setItem("kp_last",JSON.stringify({score,total:pool.length,category:currentCategory}));}
function home(){$("#quiz").classList.add("hidden");$("#result").classList.add("hidden");$("#home").classList.remove("hidden");}
document.addEventListener("click",e=>{let c=e.target.closest("[data-cat]");if(c)start(c.dataset.cat)});
init();
