import {readReports,setupComposer,updateStatus,deleteReport,isAdmin,signIn,signOut} from "./feedback.js";
import{REPO,REPO_URL,normalize,textOnly}from"./model.js";
import {GAMES,DEFAULT_GAME,gameName,matchesStatus} from './games.js';
const $=s=>document.querySelector(s);
let entries=[],legacyEntries=[],journalEntries=[],isLoaded=false,loading=false,album=[],photo=0,caption="",activeKind="bug",journalRevision=0,activeGame=DEFAULT_GAME,pendingDelete=null;
const feedbackTabs=[{tab:"bugTab",panel:"bugs",kind:"bug",label:"＋ Add bug"},{tab:"improvementTab",panel:"improvements",kind:"improvement",label:"＋ Add improvement"}];
function selectTab(index,focus=false){
 feedbackTabs.forEach((item,n)=>{const tab=$("#"+item.tab);tab.setAttribute("aria-selected",String(n===index));tab.tabIndex=n===index?0:-1;$("#"+item.panel).hidden=n!==index;if(n===index&&focus)tab.focus()});
 const item=feedbackTabs[index];$("#addReport").textContent=item.label;activeKind=item.kind;
}
feedbackTabs.forEach((item,index)=>{
 $("#"+item.tab).onclick=()=>{selectTab(index);history.replaceState(null,"","#"+item.panel)};
 $("#"+item.tab).addEventListener("keydown",e=>{let next;if(e.key==="ArrowRight"||e.key==="ArrowLeft")next=1-index;else if(e.key==="Home")next=0;else if(e.key==="End")next=1;else return;e.preventDefault();selectTab(next,true);history.replaceState(null,"","#"+feedbackTabs[next].panel)});
});
window.addEventListener("hashchange",()=>selectTab(location.hash==="#improvements"?1:0));
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function code(i){return(i.kind==="bug"?"B":"I")+"-"+(i.source==="journal"?"J":"")+String(i.id).padStart(3,"0")}
function stateClass(s){return({"In progress":"progress","Ready to test":"testing",Done:"done",Reopened:"reopened"})[s]||""}
function badge(i){return el("span","badge "+stateClass(i.status),i.status)}
function statusControl(i,inDetail=false){
 if(i.source!=="journal")return badge(i);
 const select=el('select','badge status-select '+stateClass(i.status));
 select.id=(inDetail?'detailStatus-':'rowStatus-')+i.id;
 select.setAttribute('aria-label','Change status for '+i.title);
 for(const value of ['Open','In progress','Ready to test','Done','Reopened','Not planned']){const option=el('option','',value);option.value=value;option.selected=value===i.status;select.append(option)}
 select.onchange=async()=>{
  const next=select.value,previous=i.status;
  if(next===previous)return;
  select.disabled=true;select.setAttribute('aria-busy','true');
  const pending=el('option','','Saving...');pending.value='pending';select.append(pending);select.value='pending';
  try{
   const updated=await updateStatus(i.id,next);Object.assign(i,updated);journalRevision++;
   journalEntries=journalEntries.map(item=>item.id===i.id?updated:item);entries=[...legacyEntries,...journalEntries];render();
   if($('#detail').open&&$('#detail').dataset.reportId===String(i.id))paintDetailMeta(i);
   document.getElementById(select.id)?.focus();toast('Status updated.');
  }catch(error){pending.remove();select.value=previous;select.disabled=false;select.removeAttribute('aria-busy');toast(error.message)}
 };
 return select;
}
function paintDetailMeta(i){$('#deleteDetail').hidden=!isAdmin()||i.source!=='journal';$('#deleteDetail').onclick=()=>askDelete(i);$('#detailMeta').replaceChildren(statusControl(i,true),el('span','priority '+i.priority.toLowerCase(),i.priority),el('span','','Logged by '+i.author))}
function showPhotos(i,index=0){album=i.images;photo=index;caption=i.title;paintPhoto();if(!$("#lightbox").open)$("#lightbox").showModal()}
function paintPhoto(){$("#fullImage").src=album[photo];$("#fullImage").alt=caption+" — screenshot "+(photo+1);$("#imageCaption").textContent=caption;$("#imageCount").textContent=(photo+1)+" / "+album.length;$("#imageOriginal").href=album[photo];$("#previous").disabled=album.length<2;$("#next").disabled=album.length<2}
function thumb(i,index=0){const b=el("button","thumb");b.setAttribute("aria-label","Enlarge screenshot "+(index+1)+" for "+i.title);const image=el("img");image.src=i.images[index];image.alt=i.title;image.loading="lazy";image.addEventListener("error",()=>{image.hidden=true;b.title="Screenshot unavailable";b.append(el("span","","Unavailable"));b.onclick=()=>toast("Could not load this screenshot. Please try Refresh.")});b.append(image,el("span","zoom",i.images.length>1?"↗ "+i.images.length:"↗"));b.onclick=()=>showPhotos(i,index);return b}
function detail(i){$("#detailCode").textContent=code(i)+" · "+(i.kind==="bug"?"BUG REPORT":"IMPROVEMENT");$("#detailTitle").textContent=i.title;paintDetailMeta(i);$('#detail').dataset.reportId=String(i.id);$("#detailImages").replaceChildren(...i.images.map((_,n)=>thumb(i,n)));const body=$("#detailBody");body.replaceChildren();for(const [key,value]of Object.entries(i.fields)){if(["Screenshots","Status","Priority"].includes(key))continue;const clean=textOnly(value);if(!clean)continue;body.append(el("h3","",key),el("p","",clean))}$("#editLink").hidden=i.source==="journal";if(i.url)$("#editLink").href=i.url;
 $("#detail").showModal()}
function row(i){const tr=el("tr");const id=el("td","code",code(i)),images=el("td"),observation=el("td"),status=el("td"),priority=el("td"),more=el("td");images.append(i.images.length?thumb(i):el("span","no-photo","No screenshot"));const title=el("button","entry-title",i.title);title.onclick=()=>detail(i);observation.append(title,el("p","description",i.description||"Open for details"));status.append(statusControl(i));priority.append(el("span","priority "+i.priority.toLowerCase(),i.priority));const open=el("button","row-open","↗");open.setAttribute("aria-label","Open "+i.title);open.onclick=()=>detail(i);more.append(open);if(isAdmin()&&i.source==='journal'){const remove=el('button','row-delete','Delete');remove.setAttribute('aria-label','Delete '+i.title);remove.onclick=()=>askDelete(i);more.append(remove)}tr.append(id,images,observation,status,priority,more);return tr}
function render(){const search=$("#search").value.toLowerCase(),status=$("#status").value;const gameEntries=entries.filter(i=>(i.game||DEFAULT_GAME)===activeGame);const active=gameEntries.filter(i=>matchesStatus(i,status)&&[i.title,i.description,code(i),i.author].join(" ").toLowerCase().includes(search));for(const kind of["bug","improvement"]){const list=active.filter(i=>i.kind===kind),total=active.filter(i=>i.kind===kind).length;$("#"+kind+"Count").textContent=isLoaded?String(total):"\u2014";const rows=$("#"+kind+"Rows");rows.replaceChildren(...list.map(row));if(!list.length){const tr=el("tr"),td=el("td","empty-cell",isLoaded?(search||status?"No matching feedback.":"No reports yet."):loading?"Loading reports…":"Could not load reports. Try Refresh.");td.colSpan=6;tr.append(td);rows.append(tr)}}$("#openCount").textContent=!isLoaded?"\u2014":gameEntries.filter(i=>["Open","Reopened"].includes(i.status)).length;$("#progressCount").textContent=!isLoaded?"\u2014":gameEntries.filter(i=>i.status==="In progress").length;$("#testCount").textContent=!isLoaded?"\u2014":gameEntries.filter(i=>i.status==="Ready to test").length;$("#doneCount").textContent=!isLoaded?"\u2014":gameEntries.filter(i=>i.status==="Done").length}
async function readLegacy(){
 let data=[],page=1;
 while(true){const res=await fetch("https://api.github.com/repos/"+REPO+"/issues?state=all&sort=created&direction=asc&per_page=100&page="+page,{headers:{Accept:"application/vnd.github+json"},cache:"no-cache",signal:AbortSignal.timeout(20000)});if(!res.ok)throw Error("Older GitHub reports could not be refreshed.");const batch=await res.json();data.push(...batch);if(batch.length<100)break;page++}
 return data.map(normalize).filter(Boolean);
}
async function refresh(){
 if(loading)return;const revision=journalRevision;loading=true;$('#sync').dataset.state='loading';$('#refresh').disabled=true;$('#sync').textContent='Syncing\u2026';$('#notice').hidden=true;render();
 try{
  const results=await Promise.allSettled([readLegacy(),readReports()]);const messages=[];
  if(results[0].status==='fulfilled')legacyEntries=results[0].value;else messages.push('Older GitHub reports could not be refreshed.');
  if(results[1].status==='fulfilled'){if(revision===journalRevision)journalEntries=results[1].value;isLoaded=true}else messages.push('New feedback could not be refreshed. Please try again.');
  entries=[...legacyEntries,...journalEntries];
  $('#sync').dataset.state=messages.length?'error':'connected';$('#sync').textContent=messages.length?'Refresh needed':'Updated '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  if(messages.length){$('#notice').textContent=messages.join(' ')+(isLoaded?' Previously loaded reports are still shown.':'');$('#notice').hidden=false}
 }finally{loading=false;$('#refresh').disabled=false;render()}
}
const openComposer=setupComposer({toast,onSaved:report=>{
 journalRevision++;journalEntries=journalEntries.filter(item=>item.id!==report.id);journalEntries.push(report);entries=[...legacyEntries,...journalEntries];isLoaded=true;
 $('#search').value='';$('#status').value='active';selectGame(report.game||DEFAULT_GAME);selectTab(report.kind==='bug'?0:1);render();$('#sync').textContent='Feedback saved';
}});
$('#addReport').onclick=()=>openComposer(activeKind,activeGame);
$("#search").addEventListener("input",render);$("#status").addEventListener("change",render);$("#refresh").onclick=refresh;$("#help").onclick=()=>$("#guide").showModal();$("#print").onclick=()=>window.print();
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$("#"+b.dataset.close).close());
document.querySelectorAll("dialog:not(#composer)").forEach(d=>d.addEventListener("click",e=>{if(e.target===d&&!d.dataset.busy){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
$("#previous").onclick=()=>{photo=(photo-1+album.length)%album.length;paintPhoto()};$("#next").onclick=()=>{photo=(photo+1)%album.length;paintPhoto()};
$("#lightbox").addEventListener("keydown",e=>{if(e.key==="ArrowRight"){$("#next").click();e.preventDefault()}if(e.key==="ArrowLeft"){$("#previous").click();e.preventDefault()}});
let toastTimer;function toast(message){$("#toast").textContent=message;$("#toast").classList.add("visible");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("#toast").classList.remove("visible"),3500)}
$("#share").onclick=async()=>{try{await navigator.clipboard.writeText(location.origin+location.pathname);toast("Feedback link copied.")}catch{toast("Copy this page's address to share the board.")}};
document.addEventListener("keydown",e=>{
 if(e.key!=="/"||e.ctrlKey||e.metaKey||e.altKey||e.target.closest("input,textarea,select,[contenteditable]")||document.querySelector("dialog[open]"))return;
 e.preventDefault();$("#search").focus();
});
function selectGame(id,focus=false){
 activeGame=id;
 for(const game of GAMES){const button=$('#game-'+game.id),selected=game.id===id;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;if(selected&&focus)button.focus()}
 $('#gamePanel').setAttribute('aria-labelledby','game-'+id);$('#selectedGameHeading').textContent=gameName(id);render();
}
GAMES.forEach((game,index)=>{
 const button=el('button','',game.name);button.id='game-'+game.id;button.setAttribute('role','tab');button.setAttribute('aria-controls','gamePanel');button.onclick=()=>selectGame(game.id);
 button.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=(index+1)%GAMES.length;else if(e.key==='ArrowLeft')next=(index+GAMES.length-1)%GAMES.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=GAMES.length-1;else return;e.preventDefault();selectGame(GAMES[next].id,true)};
 $('#gameTabs').append(button);
});
function paintAdmin(){
 $('#adminAccess').textContent=isAdmin()?'Admin · Sign out':'Admin sign in';render();$('#deleteDetail').hidden=!isAdmin()||$('#editLink').hidden===false;
}
$('#adminAccess').onclick=()=>{if(isAdmin()){signOut();paintAdmin();toast('Signed out.')}else{$('#adminError').hidden=true;$('#adminDialog').showModal();$('#adminKey').focus()}};
$('#adminForm').onsubmit=async e=>{e.preventDefault();$('#adminSubmit').disabled=true;$('#adminError').hidden=true;try{await signIn($('#adminKey').value.trim());$('#adminKey').value='';$('#adminDialog').close();paintAdmin();toast('Signed in as administrator.')}catch(error){$('#adminError').textContent=error.message;$('#adminError').hidden=false}finally{$('#adminSubmit').disabled=false}};
function askDelete(report){pendingDelete=report;$('#deleteDescription').textContent=gameName(report.game||DEFAULT_GAME)+' · '+report.title;$('#deleteError').hidden=true;$('#deleteDialog').showModal()}
$('#confirmDelete').onclick=async()=>{
 if(!pendingDelete)return;const report=pendingDelete;const dialog=$('#deleteDialog');dialog.querySelectorAll('button').forEach(button=>button.disabled=true);dialog.dataset.busy='true';$('#deleteError').hidden=true;
 try{await deleteReport(report.id);journalRevision++;journalEntries=journalEntries.filter(item=>item.id!==report.id);entries=[...legacyEntries,...journalEntries];pendingDelete=null;dialog.close();if($('#detail').open&&$('#detail').dataset.reportId===String(report.id))$('#detail').close();paintAdmin();toast('Report deleted.')}catch(error){$('#deleteError').textContent=error.message;$('#deleteError').hidden=false;paintAdmin()}finally{delete dialog.dataset.busy;dialog.querySelectorAll('button').forEach(button=>button.disabled=false)}
};
$('#deleteDialog').addEventListener('cancel',event=>{if($('#deleteDialog').dataset.busy)event.preventDefault()});
selectGame(DEFAULT_GAME);
selectTab(location.hash==="#improvements"?1:0);
refresh();

