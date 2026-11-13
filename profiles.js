const STORAGE_KEY='playtest-player-name';
export const cleanName=value=>String(value||'').normalize('NFC').trim().replace(/\s+/gu,' ');
export function validName(value){const name=cleanName(value);return name.length>=1&&name.length<=40&&!/[\u0000-\u001f\u007f]/u.test(String(value||''))}
export const profileKey=report=>cleanName(report.author||'Anonymous').toLowerCase();
export const initials=name=>cleanName(name).split(' ').filter(Boolean).slice(0,2).map(part=>Array.from(part)[0]).join('').toLocaleUpperCase();
let playerName='';
try{const stored=localStorage.getItem(STORAGE_KEY);if(validName(stored))playerName=cleanName(stored)}catch{}
export const currentProfile=()=>playerName;
export function setupProfile({toast}){
 const $=s=>document.querySelector(s),dialog=$('#profileDialog'),form=$('#profileForm'),input=$('#profileName');
 let onContinue=null;
 function paint(){ $('#playerProfile').textContent=playerName?'Profile: '+playerName:'Your profile';$('#composerProfileName').textContent=playerName||'Choose a name'; }
 function prompt(callback){onContinue=callback;input.value=playerName;$('#profileError').hidden=true;$('#profileContinue').textContent=callback?'Continue':'Save profile';dialog.showModal();input.focus()}
 form.onsubmit=e=>{
  e.preventDefault();if(!validName(input.value)){$('#profileError').textContent='Enter a name between 1 and 40 characters.';$('#profileError').hidden=false;return}
  playerName=cleanName(input.value);try{localStorage.setItem(STORAGE_KEY,playerName)}catch{toast('Your name will be remembered for this visit only.')}
  paint();const callback=onContinue;onContinue=null;dialog.close();callback?.();
 };
 dialog.addEventListener('close',()=>{onContinue=null});
 $('#playerProfile').onclick=()=>prompt(null);$('#changeProfile').onclick=()=>prompt(null);paint();
 return callback=>{if(playerName)callback();else prompt(callback)};
}
