/* Main app using GitHub sync helpers */
const qs = s=>document.querySelector(s);
const qsa = s=>Array.from(document.querySelectorAll(s));
const APP_PWD = 'lovevenusforever';

const loginRoot = qs('#login');
const appRoot = qs('#appRoot');
const pwdInput = qs('#pwd');
const btnLogin = qs('#btnLogin');
const btnClear = qs('#btnClear');
const loginMsg = qs('#loginMsg');

const boardListEl = qs('#boardList');
const worldEl = qs('#world');
const titleEl = qs('#boardTitle');
const autosaveEl = qs('#autosave');
const noteTemplate = qs('#noteTemplate');

const btnNew = qs('#btnNew');
const btnAddNote = qs('#btnAddNote');
const btnDeleteBoard = qs('#btnDeleteBoard');
const btnUndo = qs('#btnUndo');
const btnRedo = qs('#btnRedo');
const btnPull = qs('#btnPull');
const btnPush = qs('#btnPush');
const githubRepoInput = qs('#githubRepo');
const githubTokenInput = qs('#githubToken');

let boards = [];
let board = null;
let history = new History();

function uid(n=8){ return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2,n+2); }
function nowTS(){ return new Date().toISOString(); }

/* Login */
btnLogin.onclick = ()=>{
  if(pwdInput.value === APP_PWD){
    sessionStorage.setItem('qn:auth','1');
    
    
    init();
  } else {
    loginMsg.textContent = 'Senha incorreta';
    setTimeout(()=>loginMsg.textContent='',1500);
  }
};
btnClear.onclick = ()=>{
  if(confirm('Limpar dados locais?')){ localStorage.removeItem('qn:gitsync:v1'); location.reload(); }
};
if(sessionStorage.getItem('qn:auth')==='1'){   setTimeout(init,100); }

/* Load save helpers */
function loadLocal(){ boards = JSON.parse(localStorage.getItem('qn:gitsync:v1') || '[]'); }
function saveLocal(){ localStorage.setItem('qn:gitsync:v1', JSON.stringify(boards)); }

/* Render list */
function renderBoardList(){
  boardListEl.innerHTML = '';
  boards.filter(b=>!b.deleted).forEach(b=>{
    const li = document.createElement('li');
    li.textContent = b.title || 'Sem título';
    li.className = b.id === (board && board.id) ? 'active' : '';
    li.onclick = ()=> loadBoard(b.id);
    boardListEl.appendChild(li);
  });
}

/* Render canvas */
function renderBoardCanvas(){
  worldEl.innerHTML = '';
  if(!board) { titleEl.textContent='—'; return; }
  titleEl.textContent = board.title || 'Sem título';
  (board.notes||[]).forEach(n=>{
    const node = noteTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = n.id;
    node.style.left = (n.x||100) + 'px';
    node.style.top = (n.y||100) + 'px';
    node.querySelector('.note-title').textContent = n.title || '';
    node.querySelector('.note-body').innerHTML = n.text || '';
    node.querySelector('.btn-del').onclick = (e)=>{ e.stopPropagation(); if(confirm('Remover nota?')){ board.notes = board.notes.filter(x=>x.id!==n.id); pushHistory(); renderBoardCanvas(); scheduleSave(); } };
    node.querySelector('.btn-dup').onclick = (e)=>{ e.stopPropagation(); const copy = JSON.parse(JSON.stringify(n)); copy.id = uid(); copy.x = n.x+20; copy.y = n.y+20; board.notes.push(copy); pushHistory(); renderBoardCanvas(); scheduleSave(); };
    node.querySelector('.note-title').addEventListener('input', ()=>{ const f=board.notes.find(x=>x.id===n.id); f.title = node.querySelector('.note-title').textContent; pushHistory(); scheduleSave(); });
    node.querySelector('.note-body').addEventListener('input', ()=>{ const f=board.notes.find(x=>x.id===n.id); f.text = node.querySelector('.note-body').innerHTML; pushHistory(); scheduleSave(); });
    makeDraggable(node, n.id);
    worldEl.appendChild(node);
  });
  history.reset(board);
  updateUndoRedoButtons();
}

/* Draggable */
function makeDraggable(el,id){
  const hdr = el.querySelector('.note-header');
  let dragging=false, start={sx:0,sy:0,ox:0,oy:0};
  hdr.addEventListener('pointerdown',(ev)=>{ ev.preventDefault(); dragging=true; const rect=el.getBoundingClientRect(); start={sx:ev.clientX,sy:ev.clientY,ox:rect.left - worldEl.getBoundingClientRect().left, oy:rect.top - worldEl.getBoundingClientRect().top}; el.setPointerCapture && el.setPointerCapture(ev.pointerId); });
  hdr.addEventListener('pointermove',(ev)=>{ if(!dragging) return; const dx=(ev.clientX-start.sx); const dy=(ev.clientY-start.sy); el.style.left = (start.ox + dx) + 'px'; el.style.top = (start.oy + dy) + 'px'; });
  hdr.addEventListener('pointerup',(ev)=>{ if(!dragging) return; dragging=false; el.releasePointerCapture && el.releasePointerCapture(ev.pointerId); const note = board.notes.find(x=>x.id===id); note.x = parseFloat(el.style.left); note.y = parseFloat(el.style.top); pushHistory(); scheduleSave(); });
}

/* History helpers */
function pushHistory(){ if(!board) return; history.push(JSON.parse(JSON.stringify(board))); updateUndoRedoButtons(); }
btnUndo.onclick = ()=>{ const prev = history.undo(); if(!prev) return; board = prev; renderBoardCanvas(); saveBoardLocal(board); }
btnRedo.onclick = ()=>{ const next = history.redo(); if(!next) return; board = next; renderBoardCanvas(); saveBoardLocal(board); }
function updateUndoRedoButtons(){ btnUndo.disabled = !history.canUndo(); btnRedo.disabled = !history.canRedo(); }

/* Actions */
btnNew.onclick = ()=>{ const t = prompt('Nome do quadro:') || ('Quadro ' + (boards.length+1)); const b = { id: uid(), title: t, notes: [], view:{x:0,y:0,z:1}, lastModified: nowTS() }; boards.push(b); saveLocal(); renderBoardList(); loadBoard(b.id); }
btnAddNote.onclick = ()=>{ if(!board){ alert('Abra ou crie um quadro!'); return; } const n = { id: uid(), x: 100, y: 100, title: 'Nova nota', text: '', created: nowTS() }; board.notes.push(n); pushHistory(); renderBoardCanvas(); scheduleSave(); }
btnDeleteBoard.onclick = ()=>{ if(!board) return; if(!confirm('Excluir quadro (envia pra lixeira)?')) return; deleteBoardLocal(board.id); boards = boards = JSON.parse(localStorage.getItem('qn:gitsync:v1')||'[]'); renderBoardList(); loadBoard(boards.find(b=>!b.deleted)?.id); }

/* Inline title edit */
titleEl.addEventListener('input', ()=>{ if(!board) return; board.title = titleEl.textContent.trim() || 'Sem título'; pushHistory(); scheduleSave(); renderBoardList(); });

/* Save scheduling */
let saveTimer = null;
function scheduleSave(){ autosaveEl.textContent = 'Editando...'; clearTimeout(saveTimer); saveTimer = setTimeout(()=>{ if(board){ board.lastModified = nowTS(); saveBoardLocal(board); boards = JSON.parse(localStorage.getItem('qn:gitsync:v1')||'[]'); saveLocal(); autosaveEl.textContent = 'Salvo'; setTimeout(()=>autosaveEl.textContent='—',1200); } }, 700); }

/* Load board */
function loadBoard(id){ const b = JSON.parse(localStorage.getItem('qn:gitsync:v1')||'[]').find(x=>x.id===id); if(!b) return; board = JSON.parse(JSON.stringify(b)); renderBoardCanvas(); renderBoardList(); }

/* GitHub Pull/Push: uses github-sync.js helpers */
async function pullGitHub(){
  const repo = githubRepoInput.value.trim() || sessionStorage.getItem('qn:repo') || '';
  const token = githubTokenInput.value.trim() || sessionStorage.getItem('qn:token') || '';
  if(!repo || !token) return alert('Preencha repo e token (owner/repo e token).');
  sessionStorage.setItem('qn:repo', repo); sessionStorage.setItem('qn:token', token);
  try{
    btnPull.disabled = true; btnPull.textContent = 'Pulling...';
    const r = await pullFromGitHub(repo, token);
    if(r.notFound){
      if(!confirm('Arquivo data/boards.json não existe no repo. Criar com dados locais?')) { btnPull.disabled=false; btnPull.textContent='Pull (GitHub)'; return; }
      // create remote from local
      const local = JSON.parse(localStorage.getItem('qn:gitsync:v1')||'[]');
      const res = await pushToGitHub(repo, token, local, null);
      alert('Arquivo criado no repo.');
      btnPull.disabled=false; btnPull.textContent='Pull (GitHub)'; return;
    }
    // merge remote into local
    const remote = r.data;
    const merged = mergeMergeLocalAndRemote(remote);
    // save local
    localStorage.setItem('qn:gitsync:v1', JSON.stringify(merged));
    loadLocal(); renderBoardList(); loadBoard(merged[0]?.id);
    alert('Pull concluído e mesclado.');
  }catch(e){ alert('Pull falhou: ' + e.message); console.error(e); }
  finally{ btnPull.disabled=false; btnPull.textContent='Pull (GitHub)'; }
}

async function pushGitHub(){
  const repo = githubRepoInput.value.trim() || sessionStorage.getItem('qn:repo') || '';
  const token = githubTokenInput.value.trim() || sessionStorage.getItem('qn:token') || '';
  if(!repo || !token) return alert('Preencha repo e token (owner/repo e token).');
  sessionStorage.setItem('qn:repo', repo); sessionStorage.setItem('qn:token', token);
  try{
    btnPush.disabled = true; btnPush.textContent = 'Pushing...';
    // fetch remote to get sha if exists
    const r = await pullFromGitHub(repo, token);
    const local = JSON.parse(localStorage.getItem('qn:gitsync:v1')||'[]');
    const merged = mergeMergeLocalAndRemote(local);
    if(r.notFound){
      await pushToGitHub(repo, token, merged, null);
      alert('Criado boards.json no repo.');
    } else {
      await pushToGitHub(repo, token, merged, r.sha);
      alert('Push concluído.');
    }
  }catch(e){ alert('Push falhou: ' + e.message); console.error(e); }
  finally{ btnPush.disabled=false; btnPush.textContent='Push (GitHub)'; }
}

/* Simple merge: treat input as remote if remote newer; but here we call with local or remote as needed.
   We'll implement a deterministic LWW merge by board.id using lastModified field.
*/
function mergeMergeLocalAndRemote(remoteBoards){
  const local = JSON.parse(localStorage.getItem('qn:gitsync:v1')||'[]');
  const map = {};
  local.forEach(b=>map[b.id]=b);
  (remoteBoards||[]).forEach(rb=>{
    const lb = map[rb.id];
    if(!lb) map[rb.id]=rb;
    else {
      if((rb.lastModified||'') > (lb.lastModified||'')) map[rb.id]=rb;
    }
  });
  const merged = Object.values(map);
  // ensure all have lastModified
  merged.forEach(m=>{ if(!m.lastModified) m.lastModified = nowTS(); });
  return merged;
}

/* Init */
function init(){
  boards = JSON.parse(localStorage.getItem('qn:gitsync:v1') || '[]');
  if(!boards.length){
    const b = { id: uid(), title: 'Meu Quadro', notes: [], view:{x:0,y:0,z:1}, lastModified: nowTS() };
    boards.push(b);
    localStorage.setItem('qn:gitsync:v1', JSON.stringify(boards));
  }
  renderBoardList();
  loadBoard(boards[0].id);
}

/* wire buttons */
btnPull.onclick = pullGitHub;
btnPush.onclick = pushGitHub;

window.mergeBoardsIntoLocal = function(remote){ return mergeMergeLocalAndRemote(remote); };
