class History {
  constructor(limit = 120) { this.limit = limit; this.stack = []; this.redoStack = []; }
  push(state) { const s = JSON.stringify(state); this.stack.push(s); if (this.stack.length>this.limit) this.stack.shift(); this.redoStack=[]; }
  canUndo(){ return this.stack.length>1; }
  undo(){ if(!this.canUndo()) return null; const last=this.stack.pop(); this.redoStack.push(last); return JSON.parse(this.stack[this.stack.length-1]); }
  canRedo(){ return this.redoStack.length>0; }
  redo(){ if(!this.canRedo()) return null; const r=this.redoStack.pop(); this.stack.push(r); return JSON.parse(r); }
  reset(state){ this.stack=[JSON.stringify(state)]; this.redoStack=[]; }
}
