/* github-sync.js
   Provides helpers to GET/PUT a JSON file in a repo via GitHub Contents API.
   The UI stores repo and token in sessionStorage (not localStorage) by design.
   Data path used: data/boards.json
*/
const GITHUB_PATH = 'data/boards.json';

function getSessionRepo(){ return sessionStorage.getItem('qn:repo') || ''; }
function getSessionToken(){ return sessionStorage.getItem('qn:token') || ''; }
function setSessionRepoToken(repo, token){ sessionStorage.setItem('qn:repo', repo); sessionStorage.setItem('qn:token', token); }

async function githubGetJSON(repo, token){
  if(!repo || !token) throw new Error('Repo or token missing');
  const url = `https://api.github.com/repos/${repo}/contents/${GITHUB_PATH}`;
  const res = await fetch(url, { headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github.v3+json' } });
  if(res.status === 404) return { notFound: true };
  if(!res.ok) throw new Error('GET failed: '+res.status);
  const body = await res.json();
  // content is base64
  const content = atob(body.content.replace(/\n/g,'')); // decode
  const data = JSON.parse(content);
  return { data, sha: body.sha };
}

async function githubPutJSON(repo, token, data, sha){
  if(!repo || !token) throw new Error('Repo or token missing');
  const url = `https://api.github.com/repos/${repo}/contents/${GITHUB_PATH}`;
  const content = btoa(JSON.stringify(data, null, 2));
  const message = sha ? 'Update boards.json via app' : 'Create boards.json via app';
  const body = { message, content };
  if(sha) body.sha = sha;
  const res = await fetch(url, { method: 'PUT', headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github.v3+json' }, body: JSON.stringify(body) });
  if(!res.ok){ const txt = await res.text(); throw new Error('PUT failed: '+res.status+' '+txt); }
  return await res.json();
}

/* High-level sync operations */
async function pullFromGitHub(repo, token){
  const r = await githubGetJSON(repo, token);
  if(r.notFound) return { notFound: true };
  return { data: r.data, sha: r.sha };
}

async function pushToGitHub(repo, token, data, sha){
  const res = await githubPutJSON(repo, token, data, sha);
  return res;
}
