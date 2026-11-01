(() => {
  "use strict";
  const KEY = "discipline30_v1";
  const habits = [
    "Проснулся в 05:00",
    "Соблюдал своё решение о воздержании",
    "Посмотрел минимум 30 минут контента на английском",
    "Регулярно и полноценно питался",
    "Контролировал использование телефона",
    "Соблюдал сбалансированное питание",
    "Поддерживал водный баланс",
    "Выполнил запланированную тренировку или восстановление",
    "Сделал 20 подтягиваний"
  ];
  const blankDay = () => ({ checks:Array(9).fill(false), recovery:false, notes:"" });
  const todayISO = () => { const d=new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
  const addDays = (iso,n) => { const d=new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return d; };
  const fmt = d => d.toLocaleDateString("ru-RU",{day:"numeric",month:"long"});
  const defaultData = () => ({version:1,startDate:todayISO(),days:Array.from({length:30},blankDay)});
  let data = load();
  let selectedDay = 0, activePage = "home", toastTimer;
  function load(){ try { const raw=localStorage.getItem(KEY); if(!raw)return defaultData(); const parsed=JSON.parse(raw); if(!parsed||!Array.isArray(parsed.days)||parsed.days.length!==30) return defaultData(); return {...defaultData(),...parsed,days:parsed.days.map(d=>({...blankDay(),...d,checks:Array.from({length:9},(_,i)=>!!(d.checks||[])[i])}))}; } catch(e){ return defaultData(); } }
  function save(){ localStorage.setItem(KEY,JSON.stringify(data)); }
  function dayData(i){ return data.days[i]; }
  function count(d){ return d.checks.filter(Boolean).length; }
  function isComplete(d){ return count(d)===9; }
  function dayStatus(i){ const d=dayData(i), n=count(d); if(isComplete(d))return "done"; if(n>0)return "partial"; return "missed"; }
  function totals(){ const done=data.days.filter(isComplete).length, partial=data.days.filter(d=>count(d)>0&&!isComplete(d)).length, checks=data.days.reduce((s,d)=>s+count(d),0); return {done,partial,checks,pct:Math.round(checks/270*100)}; }
  function streaks(){ let best=0,run=0; for(const d of data.days){if(isComplete(d)){run++;best=Math.max(best,run)}else run=0;} let current=0; for(let i=29;i>=0;i--){if(isComplete(data.days[i]))current++;else if(count(data.days[i])===0)continue;else break;} return {best,current}; }
  function showToast(msg){ const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2200); }
  function go(page){ activePage=page; document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+page));document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page)); if(page==="home")renderHome();if(page==="checklist")renderChecklist();if(page==="calendar")renderCalendar();if(page==="stats")renderStats();if(page==="settings")document.getElementById("startDateInput").value=data.startDate; window.scrollTo({top:0,behavior:"smooth"}); }
  function renderHome(){ const t=totals(),s=streaks(), d=dayData(selectedDay);document.getElementById("homeDay").innerHTML=`День ${selectedDay+1} <small>из 30</small>`;document.getElementById("homeDate").textContent=fmt(addDays(data.startDate,selectedDay));document.getElementById("overallPct").textContent=t.pct+"%";document.getElementById("mainRing").style.setProperty("--progress",t.pct);document.getElementById("doneDays").textContent=t.done;document.getElementById("currentStreak").textContent=s.current;document.getElementById("totalChecks").textContent=t.checks+"/270";const preview=[0,1,2].map(i=>`<div class="preview-item"><b>${count(d)===9?"✓":String(count(d)).padStart(2,"0")}</b>${habits[i]}</div>`).join("");document.getElementById("todayPreview").innerHTML=preview;}
  function renderChecklist(){const d=dayData(selectedDay),n=count(d),pct=Math.round(n/9*100);document.getElementById("checkDayTitle").innerHTML=`День ${selectedDay+1} <small>из 30</small>`;document.getElementById("checkDayDate").textContent=fmt(addDays(data.startDate,selectedDay));document.getElementById("dayProgressBar").style.width=pct+"%";document.getElementById("dayProgressText").textContent=`${n} из 9 выполнено`;document.getElementById("dayProgressPct").textContent=pct+"%";document.getElementById("prevDay").disabled=selectedDay===0;document.getElementById("nextDay").disabled=selectedDay===29;document.getElementById("prevDay").style.opacity=selectedDay===0?".3":"1";document.getElementById("nextDay").style.opacity=selectedDay===29?".3":"1";
    document.getElementById("checklistItems").innerHTML=habits.map((h,i)=>`<div class="check-item ${d.checks[i]?"checked":""}"><span class="num">${String(i+1).padStart(2,"0")}</span><input type="checkbox" id="habit${i}" data-index="${i}" ${d.checks[i]?"checked":""} aria-label="${h}"><label for="habit${i}">${h}${i===7&&d.recovery?" <small>(восстановление)</small>":""}</label>${i===7?`<button class="text-btn recovery-toggle" id="recoveryToggle" title="Отметить восстановление">${d.recovery?"Сбросить":"Восстановление"}</button>`:""}</div>`).join("");
    document.getElementById("dayNotes").value=d.notes||"";document.getElementById("finishDayBtn").textContent=isComplete(d)?"День выполнен ✓":"Завершить день ✓";
  }
  function updateCheck(i,v){const d=dayData(selectedDay);d.checks[i]=v;if(i===7&&v)d.recovery=false;save();renderChecklist();renderHome();if(isComplete(d)){showToast("День "+(selectedDay+1)+" завершён! Отличная работа.");if(data.days.every(isComplete))showToast("30 из 30! Ты прошёл челлендж!");}}
  function renderCalendar(){const t=totals();document.getElementById("calendarDone").textContent=t.done;document.getElementById("calendarPartial").textContent=t.partial;document.getElementById("calendarMissed").textContent=30-t.done-t.partial;const start=addDays(data.startDate,0),offset=(start.getDay()+6)%7;let html=Array(offset).fill("<div></div>").join("");for(let i=0;i<30;i++){const status=dayStatus(i);html+=`<button class="calendar-day ${status} ${i===selectedDay?"current":""}" data-day="${i}" aria-label="День ${i+1}, ${status}">${i+1}</button>`;}document.getElementById("calendarGrid").innerHTML=html;}
  function renderStats(){const t=totals(),s=streaks();document.getElementById("statsOverall").textContent=t.pct+"%";document.getElementById("statsRingPct").textContent=t.pct+"%";document.getElementById("statsRing").style.setProperty("--progress",t.pct);document.getElementById("statsDone").textContent=t.done;document.getElementById("statsPartial").textContent=t.partial;document.getElementById("statsBest").textContent=s.best;document.getElementById("statsCurrent").textContent=s.current;
    document.getElementById("dailyChart").innerHTML=data.days.map((d,i)=>{const p=count(d)/9*100;return `<div class="bar ${isComplete(d)?"full":""} ${i===selectedDay?"today":""}" style="height:${Math.max(3,p)}%" title="День ${i+1}: ${count(d)}/9"></div>`;}).join("");
    document.getElementById("habitStats").innerHTML=habits.map((h,i)=>{const n=data.days.filter(d=>d.checks[i]).length,p=Math.round(n/30*100);return `<div class="habit-row"><span>${h}</span><b>${p}%</b><div class="habit-track"><i style="width:${p}%"></i></div></div>`;}).join("");
  }
  function confirmModal(title,text,action,label="Подтвердить"){const m=document.getElementById("modalBackdrop");document.getElementById("modalTitle").textContent=title;document.getElementById("modalText").textContent=text;document.getElementById("modalConfirm").textContent=label;m.hidden=false;const close=()=>{m.hidden=true;document.getElementById("modalConfirm").onclick=null;};document.getElementById("modalCancel").onclick=close;document.getElementById("modalConfirm").onclick=()=>{close();action();};}
  function exportData(){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`discipline-30-backup-${todayISO()}.json`;a.click();URL.revokeObjectURL(url);showToast("Резервная копия сохранена");}
  function importData(file){const r=new FileReader();r.onload=()=>{try{const v=JSON.parse(r.result);if(!v||!Array.isArray(v.days)||v.days.length!==30||!v.startDate)throw Error();data={version:1,startDate:v.startDate,days:v.days.map(d=>({...blankDay(),...d,checks:Array.from({length:9},(_,i)=>!!(d.checks||[])[i])}))};save();renderAll();showToast("Данные восстановлены");}catch(e){showToast("Не удалось прочитать файл");}};r.readAsText(file);}
  function renderAll(){renderHome();renderChecklist();renderCalendar();renderStats();}
  document.addEventListener("click",e=>{const nav=e.target.closest("[data-page]");if(nav){e.preventDefault();go(nav.dataset.page);return;}const goBtn=e.target.closest("[data-go]");if(goBtn){go(goBtn.dataset.go);return;}const day=e.target.closest("[data-day]");if(day){selectedDay=Number(day.dataset.day);go("checklist");return;}});
  document.getElementById("checklistItems").addEventListener("change",e=>{if(e.target.matches('input[type="checkbox"][data-index]'))updateCheck(Number(e.target.dataset.index),e.target.checked);});
  document.getElementById("checklistItems").addEventListener("click",e=>{if(e.target.id==="recoveryToggle"){const d=dayData(selectedDay);d.recovery=!d.recovery;d.checks[7]=d.recovery;save();renderChecklist();renderHome();showToast(d.recovery?"Восстановление учтено":"Отметка восстановления снята");}});
  document.getElementById("dayNotes").addEventListener("input",e=>{dayData(selectedDay).notes=e.target.value;save();});
  document.getElementById("prevDay").onclick=()=>{selectedDay=Math.max(0,selectedDay-1);renderChecklist();};
  document.getElementById("nextDay").onclick=()=>{selectedDay=Math.min(29,selectedDay+1);renderChecklist();};
  document.getElementById("finishDayBtn").onclick=()=>{if(isComplete(dayData(selectedDay)))showToast("Этот день уже завершён. Так держать!");else showToast("Осталось выполнить "+(9-count(dayData(selectedDay)))+" пунктов");};
  document.getElementById("saveStartDate").onclick=()=>{const v=document.getElementById("startDateInput").value;if(!v){showToast("Выбери дату начала");return;}data.startDate=v;save();renderAll();showToast("Дата начала обновлена");};
  document.getElementById("exportBtn").onclick=exportData;document.getElementById("backupBtn").onclick=exportData;
  document.getElementById("importFile").onchange=e=>{if(e.target.files[0])importData(e.target.files[0]);e.target.value="";};
  document.getElementById("resetBtn").onclick=()=>confirmModal("Сбросить весь прогресс?","Все отметки и заметки за 30 дней будут удалены. Рекомендуем сначала экспортировать резервную копию.",()=>{data=defaultData();selectedDay=0;save();renderAll();document.getElementById("startDateInput").value=data.startDate;showToast("Прогресс сброшен");},"Сбросить");
  document.getElementById("modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")document.getElementById("modalCancel").click();});
  if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));}
  renderAll();
})();