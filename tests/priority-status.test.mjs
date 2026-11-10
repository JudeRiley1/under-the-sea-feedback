import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const dom=new JSDOM(readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'https://juderiley1.github.io/under-the-sea-feedback/'});
for(const key of ['window','document','location','history','localStorage'])globalThis[key]=dom.window[key];
dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};
dom.window.HTMLDialogElement.prototype.close=function(){this.open=false};
let report={id:52,source:'journal',kind:'bug',description:'Example bug for UI verification',title:'Example bug for UI verification',priority:'High',status:'Open',images:[]};
let posted,failNext=false;
globalThis.fetch=async(url,options={})=>{
 if(String(url).includes('api.github.com'))return Response.json([]);
 if(options.method==='POST'){posted=options.body;return Response.json({...report,id:53,kind:posted.get('kind'),description:posted.get('description'),priority:posted.get('priority')},{status:201})}
 if(options.method==='PATCH'){
  if(failNext){failNext=false;return Response.json({error:'Try again shortly'},{status:503})}
  report={...report,status:JSON.parse(options.body).status};return Response.json(report);
 }
 return Response.json({reports:[report],next:null});
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
assert.equal($('#detailStatus-52').value,'Done');assert.equal($('#rowStatus-52').value,'Done');assert.equal($('#doneCount').textContent,'1');
$('#detail').close();$('#addReport').click();assert.ok($('#composer').open);
assert.equal($('#feedbackPriority').value,'Medium');$('#feedbackPriority').value='Low';change($('#feedbackPriority'));
$('#feedbackDescription').value='Low priority feedback submitted through the popup';
await $('#feedbackForm').onsubmit({preventDefault(){}});
assert.equal(posted.get('priority'),'Low');assert.equal(posted.get('kind'),'bug');assert.equal($('#composer').open,false);assert.equal($('#feedbackPriority').value,'Medium');
$('#improvementTab').click();$('#addReport').click();$('#feedbackPriority').value='High';change($('#feedbackPriority'));$('#feedbackDescription').value='High priority improvement';
await $('#feedbackForm').onsubmit({preventDefault(){}});
assert.equal(posted.get('priority'),'High');assert.equal(posted.get('kind'),'improvement');assert.equal($('#improvements').hidden,false);
console.log('PASS: priority popup for both types, public inline and detail status changes, summary updates, failed-save rollback, default reset.');
