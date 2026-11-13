export const GAMES = [
  {id:'under-the-sea',name:'Under the Sea'},
  {id:'popcorn-overload',name:'Popcorn Overload'}
];
export const DEFAULT_GAME = GAMES[0].id;
export const gameName = id => GAMES.find(game => game.id === id)?.name || GAMES[0].name;
export function matchesStatus(report, filter) {
  return filter === 'active' ? !['Done','Not planned'].includes(report.status) : !filter || report.status === filter;
}
