const STORAGE_KEY = 'qn:gitsync:v1';
function nowTS(){ return new Date().toISOString(); }
function getBoards(){ try{ const raw = localStorage.getItem(STORAGE_KEY); if(!raw) return []; return JSON.parse(raw);}catch(e){console.error('read fail',e); return [];} }
function saveBoardsLocal(boards){ localStorage.setItem(STORAGE_KEY, JSON.stringify(boards)); }
function getBoard(id){ return getBoards().find(b=>b.id===id) || null; }
function saveBoardLocal(board){ const all=getBoards(); board.lastModified = nowTS(); const idx=all.findIndex(x=>x.id===board.id); if(idx>=0) all[idx]=board; else all.push(board); saveBoardsLocal(all); }
function deleteBoardLocal(id){ const all=getBoards(); const idx=all.findIndex(x=>x.id===id); if(idx>=0){ all[idx].deleted = true; all[idx].lastModified = nowTS(); saveBoardsLocal(all); } }
function mergeBoardsIntoLocal(remoteBoards){ const local = getBoards(); const map = {}; local.forEach(b=>map[b.id]=b); remoteBoards.forEach(rb=>{ const lb = map[rb.id]; if(!lb) map[rb.id]=rb; else { if((rb.lastModified||'') > (lb.lastModified||'')) map[rb.id]=rb; } }); const merged = Object.values(map); saveBoardsLocal(merged); return merged; }
