import {GAMES} from './games.js?v=two-statuses-1';
const REPO='JudeRiley1/under-the-sea-feedback';
const ROOT='https://github.com/'+REPO;
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
const when=value=>new Date(value.slice(0,10)+'T12:00:00').toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
const assetURL=(game,tag)=>ROOT+'/releases/download/'+encodeURIComponent(tag)+'/'+encodeURIComponent(game.asset);
const versionLabel=build=>build.versionLabel||('v'+build.version);
export function mergeBuilds(game,manifest,releases){
 const builds=new Map();
 for(const release of releases){
  if(release.draft||!release.tag_name.startsWith(game.tagPrefix))continue;
  const asset=release.assets?.find(item=>item.name===game.asset);if(!asset)continue;
  const version=release.tag_name.slice(game.tagPrefix.length);
  builds.set(release.tag_name,{version,versionLabel:/^\d{4}-\d{2}-\d{2}$/.test(version)?'Build '+version:undefined,tag:release.tag_name,date:release.published_at.slice(0,10),sizeMB:Math.round(asset.size/1024/1024),notes:(release.body||'').split(/\r?\n/).map(line=>line.replace(/^[-*]\s+/, '').trim()).filter(Boolean)});
 }
 for(const build of manifest?.builds||[]){
  if(!build.version||!/^\d{4}-\d{2}-\d{2}$/.test(build.date||''))continue;
  const tag=build.tag||game.tagPrefix+build.version;
  builds.set(tag,{...builds.get(tag),...build,tag});
 }
 return [...builds.values()].sort((a,b)=>b.date.localeCompare(a.date)||b.version.localeCompare(a.version,undefined,{numeric:true}));
}
async function readJSON(url){const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Build information is unavailable.');return response.json()}
async function readReleases(){
 const releases=[];let page=1;
 while(true){const batch=await readJSON('https://api.github.com/repos/'+REPO+'/releases?per_page=100&page='+page);releases.push(...batch);if(batch.length<100)return releases;page++}
}
function download(game,build,latest=false){const a=el('a',latest?'button primary release-download':'button previous-download',latest?'Download ↓':'Download '+versionLabel(build)+' ↓');a.href=assetURL(game,build.tag);a.setAttribute('aria-label','Download '+game.name+' '+versionLabel(build)+' for Windows');return a}
function notes(build){
 const ul=el('ul','release-notes');for(const note of build.notes||[])ul.append(el('li','',note));
 return ul.children.length?ul:el('p','release-muted','No release notes were provided for this build.');
}
export function renderGame(game,builds){
 const article=el('article','game-release');article.dataset.game=game.id;
 const row=el('div','release-row'),identity=el('div','release-identity'),icon=el('span','game-icon',game.initials),name=el('div');icon.setAttribute('aria-hidden','true');name.append(el('h3','',game.name));identity.append(icon,name);row.append(identity);
 if(!builds.length){name.append(el('p','release-muted','Build information is unavailable.'));const browse=el('a','button','Browse releases ↗');browse.href=ROOT+'/releases';row.append(browse);article.append(row);return article}
 const [latest,...older]=builds;name.append(el('p','release-muted','Windows · '+when(latest.date)+(latest.sizeMB?' · '+latest.sizeMB+' MB':'')));
 const version=el('div','release-version');version.append(el('span','release-label','LATEST'),el('strong','',versionLabel(latest)));row.append(version,download(game,latest,true));
 const toggle=el('button','release-toggle','Notes & builds');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','history-'+game.id);toggle.setAttribute('aria-label','Release notes and earlier builds for '+game.name);row.append(toggle);article.append(row);
 const history=el('div','release-history');history.id='history-'+game.id;history.hidden=true;
 history.append(el('p','install-help',game.instructions),el('h4','','Latest release · '+versionLabel(latest)),notes(latest));
 history.append(el('h4','earlier-heading','Earlier builds'+(older.length?' · '+older.length:'')));
 if(!older.length)history.append(el('p','release-muted','This is the first published build. Future builds will appear here.'));
 for(const build of older){const details=el('details','earlier-build'),summary=el('summary','',versionLabel(build));summary.append(el('span','',when(build.date)+(build.sizeMB?' · '+build.sizeMB+' MB':'')));details.append(summary,download(game,build),notes(build));history.append(details)}
 toggle.onclick=()=>{const expanded=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!expanded));history.hidden=expanded};article.append(history);return article;
}
export async function loadLibrary(){
 const list=document.getElementById('gameLibrary'),notice=document.getElementById('libraryNotice'),retry=document.getElementById('retryBuilds');retry.disabled=true;notice.textContent='Loading builds…';notice.hidden=false;
 const results=await Promise.allSettled([readReleases(),...GAMES.map(game=>readJSON(game.manifest))]);
 const releases=results[0].status==='fulfilled'?results[0].value:[];let missing=false;
 list.replaceChildren(...GAMES.map((game,index)=>{const manifest=results[index+1].status==='fulfilled'?results[index+1].value:null;const builds=mergeBuilds(game,manifest,releases);if(!builds.length)missing=true;return renderGame(game,builds)}));
 const partial=results.some(result=>result.status==='rejected');notice.hidden=!partial;notice.textContent=missing?'Some builds could not load. Try again or browse the releases.':'Showing available build information. Refresh to check for additional releases.';retry.hidden=!partial;retry.disabled=false;
}
if(document.getElementById('gameLibrary')){document.getElementById('retryBuilds').onclick=loadLibrary;loadLibrary()}
