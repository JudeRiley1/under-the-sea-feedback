export const GAMES = [
  {id:'under-the-sea',name:'Under the Sea',initials:'US',manifest:'builds.json',asset:'Under-the-Sea.zip',tagPrefix:'v',instructions:'Unzip the whole folder, then open Under the Sea.exe.'},
  {id:'popcorn-overload',name:'Popcorn Overload',initials:'PO',manifest:'popcorn-builds.json',asset:'Popcorn-Overload.exe',tagPrefix:'popcorn-',platforms:[{id:'windows',label:'Windows',asset:'Popcorn-Overload.exe',instructions:'Download and open Popcorn-Overload.exe. No installation needed.'},{id:'mac',label:'Mac',asset:'Popcorn-Overload-Mac.zip',instructions:'Download the ZIP, extract it, then open Popcorn Overload.app.'}],instructions:'Download and open Popcorn-Overload.exe. No installation needed.'}
];
export const DEFAULT_GAME = GAMES[0].id;
export const gameName = id => GAMES.find(game => game.id === id)?.name || GAMES[0].name;
export const normalizeStatus=status=>['Complete','Done','Not planned'].includes(status)?'Complete':'Open';
export function matchesStatus(report, filter) {
  return !filter || normalizeStatus(report.status) === filter;
}
