import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const dom=new JSDOM(readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://juderiley1.github.io/under-the-sea-feedback/'});
for(const key of ['window','document','location','history','localStorage'])globalThis[key]=dom.window[key];
dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};
dom.window.HTMLDialogElement.prototype.close=function(){this.open=false};
let report={id:52,source:'journal',kind:'bug',description:'Example bug for UI verification',title:'Example bug for UI verification',priority:'High',status:'Open',images:[]};
let posted,failNext=false,deleted=false,deleteCalls=0,failDelete=false;
const popcorn={...report,id:60,game:'popcorn-overload',title:'Popcorn feedback',description:'Popcorn feedback'};
globalThis.fetch=async(url,options={})=>{
 if(String(url).includes('api.github.com'))return Response.json([]);
 if(String(url).endsWith('/api/admin'))return options.headers.Authorization==='Bearer test-admin'?Response.json({admin:true}):Response.json({error:'Invalid admin key'},{status:403});
 if(options.method==='DELETE'){deleteCalls++;if(failDelete){failDelete=false;return Response.json({error:'Could not delete'},{status:500})}deleted=true;return Response.json({deleted:true})}
 if(options.method==='POST'){posted=options.body;return Response.json({...report,id:53,kind:posted.get('kind'),game:posted.get('game'),description:posted.get('description'),priority:posted.get('priority')},{status:201})}
 if(options.method==='PATCH'){
  if(failNext){failNext=false;return Response.json({error:'Try again shortly'},{status:503})}
  report={...report,status:JSON.parse(options.body).status};return Response.json(report);
 }
 return Response.json({reports:deleted?[popcorn]:[report,popcorn],next:null});
};
const $=s=>document.querySelector(s),change=el=>el.dispatchEvent(new dom.window.Event('change',{bubbles:true})),tick=()=>new Promise(r=>setTimeout(r,5));
await import('../app.js');await tick();
assert.equal($('#rowStatus-52').value,'Open');assert.equal($('#openCount').textContent,'1');
assert.equal(localStorage.length,0,'status selector available without submitter key');
$('#rowStatus-52').value='In progress';change($('#rowStatus-52'));await tick();
assert.equal($('#rowStatus-52').value,'In progress');assert.equal($('#openCount').textContent,'0');assert.equal($('#progressCount').textContent,'1');
failNext=true;$('#rowStatus-52').value='Done';change($('#rowStatus-52'));await tick();
assert.equal($('#rowStatus-52').value,'In progress');assert.equal($('#doneCount').textContent,'0');assert.equal($('#toast').textContent,'Try again shortly');
$('.entry-title').click();assert.ok($('#detail').open);assert.equal($('#detailStatus-52').value,'In progress');
$('#detailStatus-52').value='Done';change($('#detailStatus-52'));await tick();
assert.equal($('#detailStatus-52').value,'Done');assert.equal($('#rowStatus-52'),null,'Done leaves default active list');$('#status').value='Done';change($('#status'));assert.equal($('#rowStatus-52').value,'Done');$('#status').value='';change($('#status'));assert.equal($('#rowStatus-52').value,'Done');assert.equal($('#doneCount').textContent,'1');
$('#detail').close();$('#addReport').click();assert.ok($('#composer').open);
assert.equal($('#feedbackPriority').value,'Medium');$('#feedbackPriority').value='Low';change($('#feedbackPriority'));
$('#feedbackDescription').value='Low priority feedback submitted through the popup';
await $('#feedbackForm').onsubmit({preventDefault(){}});
assert.equal(posted.get('priority'),'Low');assert.equal(posted.get('kind'),'bug');assert.equal($('#composer').open,false);assert.equal($('#feedbackPriority').value,'Medium');
$('#improvementTab').click();$('#addReport').click();$('#feedbackPriority').value='High';change($('#feedbackPriority'));$('#feedbackDescription').value='High priority improvement';
await $('#feedbackForm').onsubmit({preventDefault(){}});
assert.equal(posted.get('priority'),'High');assert.equal(posted.get('kind'),'improvement');assert.equal($('#improvements').hidden,false);
// Additional multi-game and administrator checks.
$('#game-popcorn-overload').click();assert.equal($('#openCount').textContent,'1');assert.equal($('#bugCount').textContent,'1');assert.equal($('#rowStatus-52'),null);
$('#bugTab').click();$('#addReport').click();assert.equal($('#composerGame').textContent,'Popcorn Overload');$('#feedbackDescription').value='Popcorn-specific draft';$('#feedbackDescription').dispatchEvent(new dom.window.Event('input'));$('#closeComposer').click();
$('#game-under-the-sea').click();$('#addReport').click();assert.equal($('#feedbackDescription').value,'');$('#closeComposer').click();
$('#game-popcorn-overload').click();$('#addReport').click();assert.equal($('#feedbackDescription').value,'Popcorn-specific draft');await $('#feedbackForm').onsubmit({preventDefault(){}});assert.equal(posted.get('game'),'popcorn-overload');
assert.equal($('.row-delete'),null,'Deletion hidden before admin sign-in');$('#adminAccess').click();$('#adminKey').value='wrong';await $('#adminForm').onsubmit({preventDefault(){}});assert.equal($('#adminError').hidden,false);assert.equal($('.row-delete'),null);
$('#adminKey').value='test-admin';await $('#adminForm').onsubmit({preventDefault(){}});assert.equal($('#adminDialog').open,false);assert.ok($('.row-delete'));
$('.row-delete').click();assert.ok($('#deleteDialog').open);assert.equal(deleteCalls,0,'No delete before confirmation');document.querySelector('[data-close=deleteDialog]').click();assert.equal(deleteCalls,0);
$('.row-delete').click();failDelete=true;await $('#confirmDelete').onclick();assert.equal($('#deleteError').hidden,false);assert.ok($('#rowStatus-60'),'Failed delete retains report');await $('#confirmDelete').onclick();assert.equal($('#deleteDialog').open,false);assert.equal($('#rowStatus-60'),null);
$('#adminAccess').click();assert.equal($('.row-delete'),null);
console.log('PASS: priority popup for both types, public inline and detail status changes, summary updates, failed-save rollback, default reset.');
