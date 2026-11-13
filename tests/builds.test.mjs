import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
const dom=new JSDOM('<div></div>');globalThis.document=dom.window.document;
const {mergeBuilds,renderGame,loadLibrary}=await import('../builds.js');
const {GAMES}=await import('../games.js');
const manifest=JSON.parse(readFileSync(new URL('../builds.json',import.meta.url),'utf8'));
test('library isolates game assets and merges full release history with manifest notes',()=>{
 const releases=[{tag_name:'v1.3',published_at:'2026-11-09T12:00:00Z',body:'Old notes',assets:[{name:'Under-the-Sea.zip',size:1000000}]},{tag_name:'popcorn-2026-11-13',published_at:'2026-11-13T12:00:00Z',assets:[{name:'Popcorn-Overload.exe',size:110000000}]},{tag_name:'v1.9',published_at:'2026-11-14T12:00:00Z',body:'New notes',assets:[{name:'Under-the-Sea.zip',size:1000000}]}];
 const builds=mergeBuilds(GAMES[0],manifest,releases);assert.equal(builds[0].version,'1.9');assert.equal(builds.at(-1).version,'1.3');assert.equal(builds.length,7);assert.ok(!builds.some(b=>b.tag.startsWith('popcorn')));
 const popcorn=mergeBuilds(GAMES[1],null,releases);assert.equal(popcorn.length,1);assert.equal(popcorn[0].versionLabel,'Build 2026-11-13');
 const card=renderGame(GAMES[0],builds),toggle=card.querySelector('button');assert.equal(card.querySelector('.release-history').hidden,true);toggle.click();assert.equal(card.querySelector('.release-history').hidden,false);toggle.click();assert.equal(card.querySelector('.release-history').hidden,true);
 assert.ok(card.querySelector('a').href.endsWith('/v1.9/Under-the-Sea.zip'));assert.equal(card.querySelectorAll('.previous-download').length,6);assert.ok([...card.querySelectorAll('a')].every(a=>!a.href.includes('/latest/')));
});
test('untrusted notes and game names render as text; first build has a clear empty history',()=>{
 const card=renderGame({...GAMES[1],name:'<img onerror=alert(1)>'},[{version:'1',tag:'popcorn-1',date:'2026-11-13',notes:['<script>alert(1)</script>']}]);assert.equal(card.querySelector('img,script'),null);assert.match(card.textContent,/first published build/);
});
test('platform selection uses version-pinned assets and updates size and instructions',()=>{
 const releases=['2026-11-14','2026-11-13'].map(date=>({tag_name:'popcorn-'+date,published_at:date+'T12:00:00Z',assets:[{name:'Popcorn-Overload.exe',size:108*1024*1024},{name:'Popcorn-Overload-Mac.zip',size:120*1024*1024}]}));
 const builds=mergeBuilds(GAMES[1],{builds:[{version:'2026-11-14',date:'2026-11-14',sizeMB:108}]},releases);
 const card=renderGame(GAMES[1],builds),select=card.querySelector('.platform-select');
 assert.match(card.querySelector('.release-download').href,/popcorn-2026-11-14\/Popcorn-Overload.exe$/);
 select.value='mac';select.dispatchEvent(new dom.window.Event('change'));
 assert.match(card.querySelector('.release-download').href,/popcorn-2026-11-14\/Popcorn-Overload-Mac.zip$/);
 assert.match(card.querySelector('.release-identity').textContent,/Mac.*120 MB/);
 assert.match(card.querySelector('.install-help').textContent,/extract it.*\.app/);
 const older=card.querySelector('.earlier-build'),oldSelect=older.querySelector('select');oldSelect.value='mac';oldSelect.dispatchEvent(new dom.window.Event('change'));
 assert.match(older.querySelector('a').href,/popcorn-2026-11-13\/Popcorn-Overload-Mac.zip$/);
 assert.match(older.querySelector('summary').textContent,/120 MB/);
});
test('unpublished platforms have no download link; manifest keeps published Mac builds available offline',()=>{
 const base={version:'2026-11-13',date:'2026-11-13'};
 const pending=renderGame(GAMES[1],mergeBuilds(GAMES[1],{builds:[base]},[]));
 assert.equal(pending.querySelector('option[value=mac]').disabled,true);
 assert.ok([...pending.querySelectorAll('a')].every(a=>!a.href.endsWith('Mac.zip')));
 const macOnly={...base,downloads:{mac:{asset:'Popcorn-Overload-Mac.zip',sizeMB:120}}};
 const available=renderGame(GAMES[1],mergeBuilds(GAMES[1],{builds:[macOnly]},[]));
 assert.equal(available.querySelector('select').value,'mac');
 assert.equal(available.querySelector('option[value=windows]').disabled,true);
 assert.match(available.querySelector('a').href,/Popcorn-Overload-Mac.zip$/);
});
test('a release API failure keeps manifest downloads available and offers retry',async()=>{
 document.body.innerHTML='<div id="gameLibrary"></div><p id="libraryNotice"></p><button id="retryBuilds"></button>';
 globalThis.fetch=async url=>{if(String(url).startsWith('https:'))throw Error('offline');return Response.json(url==='builds.json'?manifest:{builds:[{version:'2026-11-13',date:'2026-11-13'}]})};
 await loadLibrary();assert.equal(document.querySelectorAll('.release-download').length,2);assert.equal(document.getElementById('retryBuilds').hidden,false);
 globalThis.fetch=async()=>{throw Error('offline')};await loadLibrary();assert.equal(document.querySelectorAll('.game-release').length,2);assert.equal(document.querySelectorAll('.release-download').length,0);assert.match(document.getElementById('libraryNotice').textContent,/could not load/);
});
