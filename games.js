export const GAMES = [
  {id:'under-the-sea',name:'Under the Sea',initials:'US',manifest:'builds.json',asset:'Under-the-Sea.zip',tagPrefix:'v',instructions:'Unzip the whole folder, then open Under the Sea.exe.'},
  {id:'popcorn-overload',name:'Popcorn Overload',initials:'PO',manifest:'popcorn-builds.json',asset:'Popcorn-Overload.exe',tagPrefix:'popcorn-',instructions:'Download and open Popcorn-Overload.exe. No installation needed.'}
];
export const DEFAULT_GAME = GAMES[0].id;
export const gameName = id => GAMES.find(game => game.id === id)?.name || GAMES[0].name;
export const normalizeStatus=status=>['Complete','Done','Not planned'].includes(status)?'Complete':'Open';
export function matchesStatus(report, filter) {
  return !filter || normalizeStatus(report.status) === filter;
}
