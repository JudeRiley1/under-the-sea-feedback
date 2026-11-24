export const GAMES = [
  {id:'under-the-sea',name:'Under the Sea',initials:'US',manifest:'builds.json',asset:'Under-the-Sea.zip',tagPrefix:'v',platforms:[{id:'windows',label:'Windows',asset:'Under-the-Sea.zip',instructions:'Unzip the whole folder, then open Under the Sea.exe.'},{id:'mac',label:'Mac',asset:'Under-the-Sea-Mac.zip',instructions:'Unzip, drag Under the Sea.app into Applications, then do the one-time Terminal step in HOW TO PLAY (Mac).txt (inside the zip) before the first launch.'}],instructions:'Unzip the whole folder, then open Under the Sea.exe.'},
  {id:'popcorn-overload',name:'Popcorn Overload',initials:'PO',manifest:'popcorn-builds.json',asset:'Popcorn-Overload.exe',tagPrefix:'popcorn-',platforms:[{id:'windows',label:'Windows',asset:'Popcorn-Overload.exe',instructions:'Download and open Popcorn-Overload.exe. No installation needed.'},{id:'mac',label:'Mac',asset:'Popcorn-Overload-Mac.zip',instructions:'Download the ZIP, extract it, then open Popcorn Overload.app.'}],instructions:'Download and open Popcorn-Overload.exe. No installation needed.'},
  {id:'crafters-path',name:"Crafter's Path",initials:'CP',manifest:'crafters-path-builds.json',asset:'Crafters-Path.zip',tagPrefix:'crafters-path-v',platforms:[{id:'windows',label:'Windows',asset:'Crafters-Path.zip',instructions:"Unzip the whole folder, keep all files together, then open Crafter's Path.exe."}],instructions:"Unzip the whole folder, keep all files together, then open Crafter's Path.exe."}
];
export const DEFAULT_GAME = GAMES[0].id;
export const gameName = id => GAMES.find(game => game.id === id)?.name || GAMES[0].name;
export const normalizeStatus=status=>['Complete','Done','Not planned'].includes(status)?'Complete':'Open';
export function matchesStatus(report, filter) {
  return !filter || normalizeStatus(report.status) === filter;
}
