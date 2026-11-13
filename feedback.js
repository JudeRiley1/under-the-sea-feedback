import {currentProfile,validName} from './profiles.js?v=two-statuses-1';
import {DEFAULT_GAME,gameName,normalizeStatus} from './games.js?v=two-statuses-1';
export const API='https://under-the-sea-feedback-api.judeyboy12.chatgpt.site';
const KEY='uts-feedback-edit-keys';
export function normalizeReport(report){
 return {...report,status:normalizeStatus(report.status),game:report.game||DEFAULT_GAME,source:'journal',author:report.profileName||'Anonymous',fields:{Description:report.description},
  images:(report.images||[]).filter(value=>{try{const url=new URL(value);return url.origin===API&&/^\/images\/[0-9a-f-]{36}$/.test(url.pathname)}catch{return false}})};
}
export async function readReports(){
 const reports=[];let after=0;
 do{const response=await fetch(API+'/api/reports?after='+after,{cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('The board could not load new feedback. Please refresh.');
  const data=await response.json();reports.push(...data.reports.map(normalizeReport));after=data.next;
 }while(after);
 return reports;
}
function keys(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
export function editKey(id){return keys()[id]||''}
function saveKey(id,key){try{localStorage.setItem(KEY,JSON.stringify({...keys(),[id]:key}));return true}catch{return false}}
function randomToken(){return [...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('')}
export async function updateStatus(id,status){
 const response=await fetch(API+'/api/reports/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status}),signal:AbortSignal.timeout(20000)});
 const data=await response.json();if(!response.ok)throw Error(data.error||'Could not update status.');return normalizeReport(data);
}
export function validateImage(file){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Use PNG, JPG or WebP screenshots.');
 if(file.size>12*1024*1024)throw Error('Choose a screenshot smaller than 12 MB.');
}
async function prepareImage(file){
 validateImage(file);
 const bitmap=await createImageBitmap(file);
 try{
  const scale=Math.min(1,1920/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.88));
  if(!blob||blob.size>4*1024*1024)throw Error('This screenshot is too large. Try a smaller image.');
  return new File([blob],'screenshot.webp',{type:blob.type});
 }finally{bitmap.close()}
}
export function setupComposer({onSaved,toast}){
 const $=s=>document.querySelector(s),dialog=$('#composer'),form=$('#feedbackForm'),filesInput=$('#screenshotFiles'),drop=$('#screenshotDrop'),send=$('#sendFeedback'),error=$('#formError');
 let images=[],kind='bug',game=DEFAULT_GAME,requestId=crypto.randomUUID(),token=randomToken(),busy=false,preparing=0,draftVersion=0;
 const drafts=new Map();
 const showError=message=>{error.textContent=message;error.hidden=!message};
 function preview(){
  const list=$('#screenshotPreviews');list.replaceChildren();
  images.forEach((image,index)=>{
   const card=document.createElement('div');card.className='screenshot-preview';
   const img=document.createElement('img');img.src=image.url;img.alt='Screenshot '+(index+1);
   const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Remove screenshot '+(index+1));remove.disabled=busy;
   remove.onclick=()=>{URL.revokeObjectURL(image.url);images.splice(index,1);draftVersion++;preview()};card.append(img,remove);list.append(card);
  });
  $('#screenshotHint').textContent=images.length?images.length+' / 4 screenshots':'Ctrl+V to paste · or choose a file';
 }
 async function addImages(files){
  if(busy)return;
  preparing++;send.disabled=true;showError('');
  try{for(const file of files){if(images.length>=4)throw Error('You can add up to four screenshots.');const prepared=await prepareImage(file);if(images.length>=4)throw Error('You can add up to four screenshots.');images.push({file:prepared,url:URL.createObjectURL(prepared)});draftVersion++;preview()}}
  catch(e){showError(e.message||'Could not read that screenshot.')}
  finally{preparing--;send.disabled=busy||preparing>0}
 }
 filesInput.onchange=()=>{addImages([...filesInput.files]);filesInput.value=''};
 dialog.addEventListener('paste',e=>{if(busy)return;const files=[...(e.clipboardData?.items||[])].filter(item=>item.kind==='file'&&item.type.startsWith('image/')).map(item=>item.getAsFile()).filter(Boolean);if(files.length){e.preventDefault();addImages(files)}});
 drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragging')});
 drop.addEventListener('dragleave',()=>drop.classList.remove('dragging'));
 drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragging');addImages([...e.dataTransfer.files])});
 dialog.addEventListener('cancel',e=>{if(busy||preparing)e.preventDefault()});
 // Keep a cancelled draft, including screenshots, until it is submitted.
 $('#closeComposer').onclick=()=>{if(!busy&&!preparing)dialog.close()};
 $('#feedbackDescription').addEventListener('input',()=>{draftVersion++});
 $('#feedbackPriority').addEventListener('change',()=>{draftVersion++});
 let lastAttemptVersion=-1,lastAttemptProfile='';
 form.onsubmit=async e=>{
  e.preventDefault();if(busy||preparing||!form.reportValidity())return;
  const profileName=currentProfile();if(!validName(profileName)){showError('Choose your player name before submitting.');return}
  const description=$('#feedbackDescription').value.trim();if(description.length<3){showError('Add a short description of what happened.');return}
  // Retry the same request after a network failure; use a new key if the draft changed.
  if(lastAttemptVersion!==-1&&(lastAttemptVersion!==draftVersion||lastAttemptProfile!==profileName)){requestId=crypto.randomUUID();token=randomToken()}
  lastAttemptVersion=draftVersion;lastAttemptProfile=profileName;
  busy=true;send.disabled=true;send.textContent='Submitting…';$('#closeComposer').disabled=true;filesInput.disabled=true;$('#feedbackDescription').disabled=true;$('#feedbackPriority').disabled=true;preview();showError('');
  try{
   const body=new FormData();body.set('kind',kind);body.set('profileName',profileName);body.set('game',game);body.set('description',description);body.set('priority',$('#feedbackPriority').value);body.set('requestId',requestId);body.set('editToken',token);images.forEach(image=>body.append('images',image.file));
   const response=await fetch(API+'/api/reports',{method:'POST',body,signal:AbortSignal.timeout(45000)});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Could not submit your feedback.');
   saveKey(data.id,token);onSaved(normalizeReport(data));dialog.close();
   images.forEach(image=>URL.revokeObjectURL(image.url));images=[];form.reset();requestId=crypto.randomUUID();token=randomToken();lastAttemptVersion=-1;draftVersion=0;
   drafts.delete(game+':'+kind);toast('Feedback added to '+gameName(game)+'.');
  }catch(e){showError(e.name==='TimeoutError'?'The upload took too long. Your draft is still here—try Submit again.':e.message==='Failed to fetch'?'Could not connect. Your draft is still here—try again.':e.message)}
  finally{busy=false;send.disabled=false;send.textContent='Submit';$('#closeComposer').disabled=false;filesInput.disabled=false;$('#feedbackDescription').disabled=false;$('#feedbackPriority').disabled=false;preview()}
 };
 return (selectedKind,selectedGame=DEFAULT_GAME)=>{if(kind!==selectedKind||game!==selectedGame){drafts.set(game+':'+kind,{images,description:$('#feedbackDescription').value,priority:$('#feedbackPriority').value,requestId,token,draftVersion,lastAttemptVersion,lastAttemptProfile});kind=selectedKind;game=selectedGame;const draft=drafts.get(game+':'+kind);images=draft?.images||[];$('#feedbackDescription').value=draft?.description||'';$('#feedbackPriority').value=draft?.priority||'Medium';requestId=draft?.requestId||crypto.randomUUID();token=draft?.token||randomToken();draftVersion=draft?.draftVersion||0;lastAttemptVersion=draft?.lastAttemptVersion??-1;lastAttemptProfile=draft?.lastAttemptProfile||'';preview()}$('#composerGame').textContent=gameName(game);$('#composerTitle').textContent=kind==='bug'?'Report a bug':'Suggest an improvement';$('#feedbackDescription').placeholder=kind==='bug'?'What happened? What did you expect?':'What would make the game better?';showError('');dialog.showModal();$('#feedbackDescription').focus()};
}

let adminToken='';
export const isAdmin=()=>Boolean(adminToken);
export function signOut(){adminToken=''}
export async function signIn(token){
 const response=await fetch(API+'/api/admin',{headers:{Authorization:'Bearer '+token},cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!response.ok){const data=await response.json();throw Error(data.error||'Could not sign in.')}
 adminToken=token;
}
export async function deleteReport(id){
 const response=await fetch(API+'/api/reports/'+id,{method:'DELETE',headers:{Authorization:'Bearer '+adminToken},signal:AbortSignal.timeout(20000)});
 if(response.status===401||response.status===403)adminToken='';
 if(!response.ok){const data=await response.json();throw Error(data.error||'Could not delete this report.')}
}
