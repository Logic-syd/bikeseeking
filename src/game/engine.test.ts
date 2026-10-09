import { describe, expect, it } from 'vitest';
import { applyMove, getRange, initialPositions, isSolved, legalMoves, stepMove, validateLevel, validatePositions } from './engine';
import { solve } from './solver';
import { levels } from './levels';
import type { Level, Side } from './types';

const fixture = (): Level => ({ id: 100, title: { de:'Test',en:'Test' }, subtitle: { de:'',en:'' }, size:6, difficulty:'easy', bikes:[{ id:'A',axis:'h',lane:2,length:2,start:0,color:'#000' }], exits:[{side:'right',lane:2}], obstacles:[] });

describe('grid rules', () => {
  it('rejects crossing a bike even when its destination is free', () => {
    const l=fixture(); l.bikes.push({id:'B',axis:'v',lane:2,length:2,start:1,color:'#000'});
    expect(getRange(l,[0,1],0).max).toBe(0);
    expect(applyMove(l,[0,1],{bike:0,to:4})).toBeNull();
    expect(applyMove(l,[0,1],{bike:0,to:-1,exit:1})).toBeNull();
  });
  it('preserves queues of bikes parked on the same lane', () => {
    const l=fixture(); l.bikes.push({...l.bikes[0],id:'B',start:3});
    expect(getRange(l,[0,3],0).max).toBe(1);
    expect(applyMove(l,[0,3],{bike:0,to:-1,exit:1})).toBeNull();
    const afterFront=applyMove(l,[0,3],{bike:1,to:-1,exit:1})!;
    expect(applyMove(l,afterFront,{bike:0,to:-1,exit:1})).toEqual([-1,-1]);
  });
  it('blocks the entire swept path at fixed obstacles', () => {
    const l=fixture(); l.obstacles=[{x:3,y:2,kind:'bollard'}];
    expect(getRange(l,[0],0)).toEqual({min:0,max:1,exitNegative:false,exitPositive:false});
    expect(applyMove(l,[0],{bike:0,to:4})).toBeNull();
    expect(applyMove(l,[0],{bike:0,to:1})).toEqual([1]);
  });
  it.each(['left','right','top','bottom'] as Side[])('allows a complete bike through %s only on the aligned lane', side => {
    const l=fixture(); l.bikes[0]={...l.bikes[0],axis:side==='left'||side==='right'?'h':'v',length:3,start:1}; l.exits=[{side,lane:2}];
    const direction=side==='left'||side==='top'?-1:1;
    expect(applyMove(l,[1],{bike:0,to:-1,exit:direction})).toEqual([-1]);
    expect(applyMove(l,[1],{bike:0,to:-1,exit:direction===1?-1:1})).toBeNull();
    l.exits[0].lane=3;
    expect(applyMove(l,[1],{bike:0,to:-1,exit:direction})).toBeNull();
  });
  it('keeps fences closed and cargo fully inside the board', () => {
    const l=fixture(); l.exits=[]; l.bikes[0].length=3;
    expect(applyMove(l,[0],{bike:0,to:4})).toBeNull();
    expect(applyMove(l,[0],{bike:0,to:-1,exit:-1})).toBeNull();
    expect(applyMove(l,[0],{bike:0,to:3})).toEqual([3]);
    expect(applyMove(l,[0],{bike:0,to:-1})).toBeNull();
  });
  it('rejects fractional moves, no-ops, stale exited bikes, and invalid states', () => {
    const l=fixture();
    for(const move of [{bike:0,to:1.5},{bike:0,to:0},{bike:5,to:2},{bike:0,to:2,exit:1 as const},{bike:0,to:-2}]) expect(applyMove(l,[0],move)).toBeNull();
    expect(applyMove(l,[-1],{bike:0,to:0})).toBeNull();
    expect(applyMove(l,[5],{bike:0,to:0})).toBeNull();
    expect(validatePositions(l,[]).length).toBeGreaterThan(0);
    expect(validatePositions(l,[NaN]).length).toBeGreaterThan(0);
  });
  it('returns independent immutable positions for undo, including exited bikes', () => {
    const l=fixture(), before=initialPositions(l);
    const after=applyMove(l,before,{bike:0,to:-1,exit:1})!;
    expect(before).toEqual([0]); expect(after).toEqual([-1]);
    expect(before).not.toBe(after); expect(legalMoves(l,after)).toEqual([]);
    expect(isSolved(before)).toBe(false); expect(isSolved(after)).toBe(true);
  });
  it('accessible steps stop at the edge, then exit through the opening', () => {
    const l=fixture();
    expect(stepMove(l,[0],0,1)).toEqual({bike:0,to:1});
    expect(stepMove(l,[4],0,1)).toEqual({bike:0,to:-1,exit:1});
    expect(stepMove(l,[0],0,-1)).toBeNull();
  });
  it('detects malformed level data and overlaps', () => {
    const l=fixture(); l.bikes.push({...l.bikes[0]}); l.obstacles=[{x:0,y:2,kind:'tree'}];
    expect(validateLevel(l).join(' ')).toMatch(/Duplicate.*overlaps/);
  });
});

describe('solver', () => {
  it('solves each published level with only legal moves', () => {
    for(const l of levels) {
      expect(validateLevel(l),`level ${l.id}`).toEqual([]);
      const solution=solve(l,initialPositions(l)); expect(solution.status,`level ${l.id}`).toBe('solved');
      let state=initialPositions(l);
      for(const move of solution.moves) {
        const next=applyMove(l,state,move); expect(next,`level ${l.id} move ${JSON.stringify(move)}`).not.toBeNull();
        state=next!; expect(validatePositions(l,state)).toEqual([]);
      }
      expect(isSolved(state)).toBe(true);
    }
  });
  it('calculates a solution from a changed current position', () => {
    const l=levels[1]; const current=applyMove(l,initialPositions(l),{bike:1,to:2})!;
    const result=solve(l,current); expect(result.status).toBe('solved');
    let p=current;
    for(const m of result.moves) p=applyMove(l,p,m)!;
    expect(isSolved(p)).toBe(true); expect(current).toEqual([0,2]);
  });
  it('reports exhaustively proven unsolvable independently of a search limit', () => {
    const l=fixture(); l.obstacles=[{x:3,y:2,kind:'tree'}];
    expect(solve(l,[0]).status).toBe('unsolvable');
    expect(solve(l,[0],{maxNodes:1}).status).toBe('limit');
  });
  it('keeps hints valid after a player takes a different legal route', () => {
    const l=levels[levels.length-1];
    let current=initialPositions(l);
    for(let n=0;n<12;n++) {
      const options=legalMoves(l,current);
      if(!options.length) break;
      // Choose a repeatable player deviation rather than replaying the solution.
      const choice=options[(n*7+3)%options.length];
      current=applyMove(l,current,choice)!;
      const result=solve(l,current);
      expect(result.status).toBe('solved');
      let simulated=current;
      for(const move of result.moves) {
        const next=applyMove(l,simulated,move);
        expect(next).not.toBeNull();
        simulated=next!;
      }
      expect(isSolved(simulated)).toBe(true);
    }
  });
  it('an independent swept-cell check agrees for all moves in sampled game states', () => {
    for(const l of levels) {
      let state=initialPositions(l);
      for(let turn=0;turn<12 && !isSolved(state);turn++) {
        for(let i=0;i<l.bikes.length;i++) {
          if(state[i]===-1) continue;
          const bike=l.bikes[i];
          const cells=new Set(l.obstacles.map(o=>`${o.x},${o.y}`));
          l.bikes.forEach((other,j)=> {
            if(j===i||state[j]===-1) return;
            for(let k=0;k<other.length;k++) cells.add(other.axis==='h'?`${state[j]+k},${other.lane}`:`${other.lane},${state[j]+k}`);
          });
          for(let target=0;target<=l.size-bike.length;target++) {
            let blocked=false;
            for(let coordinate=Math.min(state[i],target);coordinate<Math.max(state[i],target)+bike.length;coordinate++) {
              if(cells.has(bike.axis==='h'?`${coordinate},${bike.lane}`:`${bike.lane},${coordinate}`)) blocked=true;
            }
            const valid=target!==state[i] && !blocked;
            expect(applyMove(l,state,{bike:i,to:target})!==null).toBe(valid);
          }
        }
        const options=legalMoves(l,state);
        if(!options.length) break;
        state=applyMove(l,state,options[(turn*5+2)%options.length])!;
        expect(validatePositions(l,state)).toEqual([]);
      }
    }
  });
  it('returns no hint moves once everything has left', () => {
    expect(solve(fixture(),[-1])).toEqual({status:'solved',moves:[],visited:1});
  });
});
