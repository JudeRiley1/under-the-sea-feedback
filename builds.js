// Latest playtest build: reads builds.json (written by Publish Build.bat) and fills the download card.
const $ = id => document.getElementById(id);
const when = iso => new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
const list = (ul, notes) => { ul.replaceChildren(...notes.map(text => Object.assign(document.createElement('li'), { textContent: text }))); };

async function showLatestBuild() {
  let data;
  try {
    const response = await fetch('builds.json', { cache: 'no-store' });
    if (!response.ok) return;
    data = await response.json();
  } catch { return; }
  const builds = Array.isArray(data.builds) ? data.builds : [];
  if (!builds.length) return;
  const [latest, ...older] = builds;
  $('buildVersion').textContent = 'v' + latest.version;
  $('buildMeta').textContent = 'Published ' + when(latest.date) + (latest.sizeMB ? ' · ' + latest.sizeMB + ' MB zip' : '');
  list($('buildNotes'), latest.notes || []);
  if (older.length) {
    $('buildOlder').replaceChildren(...older.flatMap(build => {
      const heading = Object.assign(document.createElement('h4'), { textContent: 'v' + build.version + ' · ' + when(build.date) });
      const ul = document.createElement('ul'); list(ul, build.notes || []);
      return [heading, ul];
    }));
    $('buildHistory').hidden = false;
  }
  $('latestBuild').hidden = false;
}
showLatestBuild();
