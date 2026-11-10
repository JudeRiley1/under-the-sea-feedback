export const REPO="JudeRiley1/under-the-sea-feedback";
export const REPO_URL="https://github.com/"+REPO;
export function imageURL(value){try{const u=new URL(value);return u.protocol==="https:"&&["github.com","user-images.githubusercontent.com","private-user-images.githubusercontent.com","raw.githubusercontent.com","juderiley1.github.io"].includes(u.hostname)?u.href:null}catch{return null}}
export function extractImages(body){
 const found=[];
 for(const m of body.matchAll(/!\[[^\]]*\]\(\s*(https:\/\/[^\s)]+)(?:\s+["'][^)]*)?\s*\)|<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)){
 const safe=imageURL((m[1]||m[2]).replaceAll("&amp;","&"));if(safe&&!found.includes(safe))found.push(safe);
 }return found;
}
export function fields(body){
 const result={};let key="Notes",lines=[];
 const finish=()=>{const value=lines.join("\n").trim();if(value&&value!=="_No response_")result[key]=value};
 for(const line of body.split(/\r?\n/)){if(/^###\s+/.test(line)){finish();key=line.replace(/^###\s+/,"").trim();lines=[]}else lines.push(line)}finish();return result;
}
export function textOnly(text){return (text||"").replace(/!\[[^\]]*\]\([^)]*\)/g,"").replace(/<img\b[^>]*>/gi,"").replace(/<[^>]+>/g,"").replace(/\[([^\]]+)\]\([^)]+\)/g,"$1").replace(/^<!--.*?-->$/gm,"").trim()}
export function normalize(issue){
 if(issue.pull_request)return null;
 const labels=(issue.labels||[]).map(l=>typeof l==="string"?l:l.name).map(s=>s.toLowerCase()),f=fields(issue.body||"");
 const kind=labels.includes("enhancement")||/^\[improvement\]/i.test(issue.title)?"improvement":"bug";
 const states=["Open","In progress","Ready to test","Reopened"];
 let status=issue.state==="closed"?(issue.state_reason==="not_planned"?"Not planned":"Done"):(states.find(x=>labels.includes(x.toLowerCase()))||states.find(x=>x===f.Status)||"Open");
 const priority=["High","Medium","Low"].find(x=>labels.includes("priority: "+x.toLowerCase()))||(["High","Medium","Low"].includes(f.Priority)?f.Priority:"Medium");
 return {id:issue.number,kind,title:issue.title.replace(/^\[(bug|improvement)\]\s*:?\s*/i,""),description:textOnly(f.Description||f.Notes||""),images:extractImages(issue.body||""),status,priority,fields:f,author:issue.user?.login||"crew",url:REPO_URL+"/issues/"+issue.number,updated:issue.updated_at};
}
