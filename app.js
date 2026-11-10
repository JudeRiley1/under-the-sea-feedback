import{REPO,REPO_URL,normalize,textOnly}from"./model.js";
const $=s=>document.querySelector(s);
let entries=[],isLoaded=false,loading=false,album=[],photo=0,caption="";
const feedbackTabs=[{tab:"bugTab",panel:"bugs",kind:"bug",label:"＋ Add bug"},{tab:"improvementTab",panel:"improvements",kind:"improvement",label:"＋ Add improvement"}];
function selectTab(index,focus=false){
 feedbackTabs.forEach((item,n)=>{const tab=$("#"+item.tab);tab.setAttribute("aria-selected",String(n===index));tab.tabIndex=n===index?0:-1;$("#"+item.panel).hidden=n!==index;if(n===index&&focus)tab.focus()});
 const item=feedbackTabs[index];$("#addReport").textContent=item.label;$("#addReport").href=REPO_URL+"/issues/new?template="+item.kind+".yml";
}
feedbackTabs.forEach((item,index)=>{
 $("#"+item.tab).onclick=()=>{selectTab(index);history.replaceState(null,"","#"+item.panel)};
 $("#"+item.tab).addEventListener("keydown",e=>{let next;if(e.key==="ArrowRight"||e.key==="ArrowLeft")next=1-index;else if(e.key==="Home")next=0;else if(e.key==="End")next=1;else return;e.preventDefault();selectTab(next,true);history.replaceState(null,"","#"+feedbackTabs[next].panel)});
});
window.addEventListener("hashchange",()=>selectTab(location.hash==="#improvements"?1:0));
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function code(i){return(i.kind==="bug"?"B":"I")+"-"+String(i.id).padStart(3,"0")}
function stateClass(s){return({"In progress":"progress","Ready to test":"testing",Done:"done",Reopened:"reopened"})[s]||""}
function badge(i){return el("span","badge "+stateClass(i.status),i.status)}
function showPhotos(i,index=0){album=i.images;photo=index;caption=i.title;paintPhoto();if(!$("#lightbox").open)$("#lightbox").showModal()}
function paintPhoto(){$("#fullImage").src=album[photo];$("#fullImage").alt=caption+" — screenshot "+(photo+1);$("#imageCaption").textContent=caption;$("#imageCount").textContent=(photo+1)+" / "+album.length;$("#imageOriginal").href=album[photo];$("#previous").disabled=album.length<2;$("#next").disabled=album.length<2}
function thumb(i,index=0){const b=el("button","thumb");b.setAttribute("aria-label","Enlarge screenshot "+(index+1)+" for "+i.title);const image=el("img");image.src=i.images[index];image.alt=i.title;image.loading="lazy";image.addEventListener("error",()=>{image.hidden=true;b.title="Screenshot unavailable. Open the report on GitHub.";b.append(el("span","","View report"));b.onclick=()=>window.open(i.url,"_blank","noopener")});b.append(image,el("span","zoom",i.images.length>1?"↗ "+i.images.length:"↗"));b.onclick=()=>showPhotos(i,index);return b}
function detail(i){$("#detailCode").textContent=code(i)+" · "+(i.kind==="bug"?"BUG REPORT":"IMPROVEMENT");$("#detailTitle").textContent=i.title;$("#detailMeta").replaceChildren(badge(i),el("span","priority "+i.priority.toLowerCase(),i.priority),el("span","","Logged by "+i.author));$("#detailImages").replaceChildren(...i.images.map((_,n)=>thumb(i,n)));const body=$("#detailBody");body.replaceChildren();for(const [key,value]of Object.entries(i.fields)){if(["Screenshots","Status","Priority"].includes(key))continue;const clean=textOnly(value);if(!clean)continue;body.append(el("h3","",key),el("p","",clean))}$("#editLink").href=i.url;$("#detail").showModal()}
function row(i){const tr=el("tr");const id=el("td","code",code(i)),images=el("td"),observation=el("td"),status=el("td"),priority=el("td"),more=el("td");images.append(i.images.length?thumb(i):el("span","no-photo","No screenshot"));const title=el("button","entry-title",i.title);title.onclick=()=>detail(i);observation.append(title,el("p","description",i.description||"Open for details"));status.append(badge(i));priority.append(el("span","priority "+i.priority.toLowerCase(),i.priority));const open=el("button","row-open","↗");open.setAttribute("aria-label","Open "+i.title);open.onclick=()=>detail(i);more.append(open);tr.append(id,images,observation,status,priority,more);return tr}
function render(){const search=$("#search").value.toLowerCase(),status=$("#status").value;const active=entries.filter(i=>(!status||i.status===status)&&[i.title,i.description,code(i),i.author].join(" ").toLowerCase().includes(search));for(const kind of["bug","improvement"]){const list=active.filter(i=>i.kind===kind),total=entries.filter(i=>i.kind===kind).length;$("#"+kind+"Count").textContent=isLoaded?String(total):"\u2014";const rows=$("#"+kind+"Rows");rows.replaceChildren(...list.map(row));if(!list.length){const tr=el("tr"),td=el("td","empty-cell",isLoaded?(search||status?"No matching feedback.":"No reports yet."):loading?"Loading reports…":"Could not load reports. Try Refresh.");td.colSpan=6;tr.append(td);rows.append(tr)}}$("#openCount").textContent=!isLoaded?"\u2014":entries.filter(i=>["Open","Reopened"].includes(i.status)).length;$("#progressCount").textContent=!isLoaded?"\u2014":entries.filter(i=>i.status==="In progress").length;$("#testCount").textContent=!isLoaded?"\u2014":entries.filter(i=>i.status==="Ready to test").length;$("#doneCount").textContent=!isLoaded?"\u2014":entries.filter(i=>i.status==="Done").length}
async function refresh(){
 if(loading)return;loading=true;$("#sync").dataset.state="loading";$("#refresh").disabled=true;$("#sync").textContent="Syncing…";$("#notice").hidden=true;render();
 try{let data=[],page=1;while(true){const res=await fetch("https://api.github.com/repos/"+REPO+"/issues?state=all&sort=created&direction=asc&per_page=100&page="+page,{headers:{Accept:"application/vnd.github+json"},cache:"no-cache",signal:AbortSignal.timeout(20000)});if(!res.ok)throw Error(res.status===403||res.status===429?"GitHub's public request limit has been reached. Try again later.":"The shared journal is temporarily unavailable.");const batch=await res.json();data.push(...batch);if(batch.length<100)break;page++}entries=data.map(normalize).filter(Boolean);isLoaded=true;$("#sync").dataset.state="connected";$("#sync").textContent="Updated "+new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});}
 catch(e){$("#sync").dataset.state="error";const box=$("#notice");box.hidden=false;box.replaceChildren(document.createTextNode((e.name==="TimeoutError"?"GitHub took too long to respond.":e.message)+" "+(isLoaded?"Previously loaded reports are still shown. ":"")));const link=el("a","","Read or add reports directly on GitHub ↗");link.href=REPO_URL+"/issues";link.target="_blank";link.rel="noopener";box.append(link);$("#sync").textContent=isLoaded?"Showing previous results · refresh needed":"Shared journal not connected";}
 finally{loading=false;$("#refresh").disabled=false;render()}
}
for(const kind of["bug","improvement"])document.querySelectorAll(".new-"+kind).forEach(a=>{a.href=REPO_URL+"/issues/new?template="+kind+".yml"});
$("#search").addEventListener("input",render);$("#status").addEventListener("change",render);$("#refresh").onclick=refresh;$("#help").onclick=()=>$("#guide").showModal();$("#print").onclick=()=>window.print();
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$("#"+b.dataset.close).close());
document.querySelectorAll("dialog").forEach(d=>d.addEventListener("click",e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
$("#previous").onclick=()=>{photo=(photo-1+album.length)%album.length;paintPhoto()};$("#next").onclick=()=>{photo=(photo+1)%album.length;paintPhoto()};
$("#lightbox").addEventListener("keydown",e=>{if(e.key==="ArrowRight"){$("#next").click();e.preventDefault()}if(e.key==="ArrowLeft"){$("#previous").click();e.preventDefault()}});
let toastTimer;function toast(message){$("#toast").textContent=message;$("#toast").classList.add("visible");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("#toast").classList.remove("visible"),3500)}
$("#share").onclick=async()=>{try{await navigator.clipboard.writeText(location.origin+location.pathname);toast("Journal link copied.")}catch{toast("Copy this page's address to share the journal.")}};
document.addEventListener("keydown",e=>{
 if(e.key!=="/"||e.ctrlKey||e.metaKey||e.altKey||e.target.closest("input,textarea,select,[contenteditable]")||document.querySelector("dialog[open]"))return;
 e.preventDefault();$("#search").focus();
});
selectTab(location.hash==="#improvements"?1:0);
refresh();

