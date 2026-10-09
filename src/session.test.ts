import { afterEach, describe, expect, it, vi } from 'vitest';
import { levels } from './game/levels';
import { legalMoves, initialPositions, isSolved } from './game/engine';
import { solve } from './game/solver';
import { moveSession, newSession, readSaved, STORAGE_KEY, undoSession, writeSaved } from './session';
afterEach(() => vi.unstubAllGlobals());
describe('session, undo and persistence', () => {
  it('counts a multi-cell drag once, ignores no-op and illegal moves', () => {
    const level=levels[0], start=newSession(level);
    expect(moveSession(level,start,{bike:0,to:start.positions[0]})).toBe(start);
    expect(moveSession(level,start,{bike:0,to:90})).toBe(start);
    const moved=moveSession(level,start,{bike:0,to:level.size-2});
    expect(moved.moves).toBe(1);expect(moved.history).toHaveLength(1);
    expect(undoSession(moved)).toEqual(start);
  });
  it('undo restores exited cargo/regular bikes, every previous state, and move count', () => {
    for(const level of levels){
      let session=newSession(level);
      const initial=session;
      const result=solve(level,session.positions);
      expect(result.status).toBe('solved');
      for(const move of result.moves) session=moveSession(level,session,move);
      expect(isSolved(session.positions)).toBe(true);
      expect(session.moves).toBe(result.moves.length);
      for(let i=result.moves.length;i>0;i--) {session=undoSession(session);expect(session.moves).toBe(i-1);}
      expect(session).toEqual(initial);
      expect(undoSession(session)).toBe(session);
    }
  });
  it('rapid sequential operations use their latest state and undo safely',()=>{
    const level=levels[0];let session=newSession(level);
    for(let i=0;i<80;i++) {
      const move=legalMoves(level,session.positions).find(m=>m.to>=0)!;
      const next=moveSession(level,session,move);
      expect(next.moves).toBe(session.moves+1);
      session=next;
    }
    for(let i=0;i<80;i++) session=undoSession(session);
    expect(session.positions).toEqual(initialPositions(level));expect(session.moves).toBe(0);
  });
  function browser(language='de-DE') {
    const values=new Map<string,string>();
    vi.stubGlobal('navigator',{language});vi.stubGlobal('window',{matchMedia:()=>({matches:true})});
    vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)});
    return values;
  }
  it('follows browser language and reduced motion, with English fallback',()=>{
    browser();expect(readSaved(levels).settings).toEqual({language:'de',reducedMotion:true,sound:true});
    browser('fr-FR');expect(readSaved(levels).settings.language).toBe('en');
  });
  it('roundtrips progress, preferences and full undo history',()=>{
    browser();const state=readSaved(levels);
    state.session=moveSession(levels[0],newSession(levels[0]),{bike:0,to:0});
    state.best={1:4};state.settings.sound=false;
    expect(writeSaved(state)).toBe(true);
    expect(readSaved(levels)).toEqual(state);
  });
  it('restores a long attempt without imposing a move limit',()=>{
    browser();const state=readSaved(levels);
    state.session={...newSession(levels[0]),moves:10001,history:Array.from({length:10001},(_,moves)=>({positions:initialPositions(levels[0]),moves}))};
    expect(writeSaved(state)).toBe(true);expect(readSaved(levels).session?.moves).toBe(10001);
  });
  it('recovers gracefully from corrupt saves or unavailable storage',()=>{
    const storage=browser();storage.set(STORAGE_KEY,'invalid json');expect(readSaved(levels).session).toBeNull();
    storage.set(STORAGE_KEY,JSON.stringify({version:1,session:{...newSession(levels[0]),positions:[-4]},best:{1:-9},settings:{language:'zz'}}));
    expect(readSaved(levels).session).toBeNull();expect(readSaved(levels).best).toEqual({});
    vi.stubGlobal('localStorage',{getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('denied');}});
    expect(readSaved(levels).session).toBeNull();expect(writeSaved(readSaved(levels))).toBe(false);
  });
});
