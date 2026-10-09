import { test, expect, type Page, type Locator } from '@playwright/test';
import { levels } from '../src/game/levels';
import { applyMove, legalMoves, validatePositions } from '../src/game/engine';
import { solve } from '../src/game/solver';
let pageErrors:string[]=[];
test.beforeEach(async({page})=>{pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));});
test.afterEach(()=>{expect(pageErrors).toEqual([]);});
const bikes=(page:Page)=>page.locator('[data-bike-index]');
const count=async(page:Page)=>Number(await page.getByTestId('moves').innerText());
const saved=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('rad-raus:v1')!).session as {levelId:number;positions:number[];moves:number});
async function settle(page:Page){await expect(page.getByTestId('board')).toHaveAttribute('aria-busy','false');}
async function start(page:Page,id=1){await page.goto('/');if(id===1)await page.getByTestId('start-game').click();else{await page.getByTestId('level-select').click();await page.getByTestId(`level-card-${id}`).click();}await expect(page.getByTestId('board')).toBeVisible();}
async function snapshot(page:Page){return bikes(page).evaluateAll(nodes=>nodes.map(n=>({id:n.getAttribute('data-testid'),left:(n as HTMLElement).style.left,top:(n as HTMLElement).style.top})));}
async function drag(page:Page,bike:Locator,dx:number,dy:number){const box=(await bike.boundingBox())!;const x=box.x+box.width/2,y=box.y+box.height/2;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:8});await page.mouse.up();if(await page.getByTestId('board').count())await settle(page);}
async function integrity(page:Page){
  const state=await saved(page);expect(validatePositions(levels.find(l=>l.id===state.levelId)!,state.positions)).toEqual([]);
  const board=(await page.getByTestId('board').boundingBox())!;
  const boxes=await page.locator('[data-bike-index], .obstacle').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom};}));
  for(const b of boxes){expect(b.left).toBeGreaterThanOrEqual(board.x-2);expect(b.top).toBeGreaterThanOrEqual(board.y-2);expect(b.right).toBeLessThanOrEqual(board.x+board.width+2);expect(b.bottom).toBeLessThanOrEqual(board.y+board.height+2);}
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];expect(Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2).toBe(false);}
}

test('home, all levels and dense board fit 390px and 1440px',async({page},info)=>{
 for(const viewport of [{width:390,height:844},{width:1440,height:1000}]){
  await page.setViewportSize(viewport);await page.goto('/');
  const check=async(name:string)=>{expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);await page.screenshot({path:info.outputPath(`${name}-${viewport.width}.png`),fullPage:true,animations:'disabled'});};
  await check('home');await page.getByTestId('level-select').click();await expect(page.getByTestId('level-card-15')).toBeVisible();await check('levels');await page.getByTestId('level-card-15').click();await expect(page.getByTestId('board')).toBeVisible();await check('game');await integrity(page);
 }
});
test('click, tiny drag, Escape and pointercancel do not count',async({page})=>{
 await start(page);const original=await snapshot(page);const bike=bikes(page).first();await bike.click();await drag(page,bike,2,0);expect(await count(page)).toBe(0);
 const box=(await bike.boundingBox())!;await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width,box.y+box.height/2);await page.keyboard.press('Escape');await page.mouse.up();
 expect(await snapshot(page)).toEqual(original);expect(await count(page)).toBe(0);
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width,box.y+box.height/2);await bike.dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();expect(await count(page)).toBe(0);expect(await snapshot(page)).toEqual(original);
});
test('fences and blocked paths clamp without crossing bikes or obstacles',async({page})=>{
 await start(page);const width=(await page.getByTestId('board').boundingBox())!.width;
 await drag(page,bikes(page).first(),-width*2,0);await integrity(page);const s=await snapshot(page),n=await count(page);await drag(page,bikes(page).first(),-width*2,0);expect(await snapshot(page)).toEqual(s);expect(await count(page)).toBe(n);
 await start(page,2);const before=await snapshot(page);await drag(page,page.getByTestId('bike-A'),width*2,0);expect(await snapshot(page)).toEqual(before);expect(await count(page)).toBe(0);await integrity(page);
 // Late-level obstacles are also included in the DOM geometry checks.
 await start(page,15);for(const id of ['A','B','C']){const bike=page.getByTestId('bike-'+id);const box=(await bike.boundingBox())!;await drag(page,bike,box.width>box.height?width:0,box.width>box.height?0:width);await integrity(page);}
});
test('undo restores an exited vehicle and exact move count',async({page})=>{
 await start(page,2);const before=await snapshot(page);const width=(await page.getByTestId('board').boundingBox())!.width;await drag(page,page.getByTestId('bike-B'),0,width);await expect(page.getByTestId('bike-B')).toHaveCount(0);expect(await count(page)).toBe(1);await page.getByTestId('undo').click();expect(await snapshot(page)).toEqual(before);expect(await count(page)).toBe(0);await integrity(page);
});
test('direction button and keyboard use identical moves',async({page})=>{
 await start(page);await bikes(page).first().click();await page.getByTestId('move-positive').click();await settle(page);const after=await snapshot(page);expect(await count(page)).toBe(1);await page.getByTestId('undo').click();await bikes(page).first().click();await page.keyboard.press('ArrowRight');await settle(page);expect(await snapshot(page)).toEqual(after);expect(await count(page)).toBe(1);
});
test('rapid input during slide and exit animations cannot corrupt state',async({page})=>{
 await start(page);await bikes(page).first().click();await page.evaluate(()=>{for(let i=0;i<30;i++)document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));});await settle(page);expect(await count(page)).toBe(1);await integrity(page);await page.getByTestId('undo').click();expect(await count(page)).toBe(0);
 await start(page,2);const box=(await page.getByTestId('bike-B').boundingBox())!,board=(await page.getByTestId('board').boundingBox())!;await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2,board.y+board.height-5,{steps:4});await page.mouse.up();
 await page.evaluate(()=>{for(let i=0;i<30;i++){(document.querySelector('[data-testid="move-positive"]') as HTMLButtonElement).click();(document.querySelector('[data-testid="undo"]') as HTMLButtonElement).click();}});await settle(page);expect(await count(page)).toBe(1);await expect(page.getByTestId('bike-B')).toHaveCount(0);await integrity(page);
});
test('reload preserves the current state and hint is computed from that state',async({page})=>{
 await start(page,15);const state=await saved(page),l=levels[14];const moves=solve(l,state.positions).moves;expect(moves.length).toBeGreaterThan(0);
 // Make an ordinary player move before asking the worker.
 const playerMove=legalMoves(l,state.positions).find(m=>m.to>=0)!;const vehicle=l.bikes[playerMove.bike];const cell=(await page.getByTestId('board').boundingBox())!.width/l.size;const shift=(playerMove.to-state.positions[playerMove.bike])*cell;await drag(page,page.getByTestId('bike-'+vehicle.id),vehicle.axis==='h'?shift:0,vehicle.axis==='v'?shift:0);expect(await count(page)).toBe(1);const current=await saved(page);await page.reload();await page.getByTestId('start-game').click();expect(await saved(page)).toEqual(current);
 await page.getByTestId('hint').click();await expect(page.locator('.bike.hinted')).toHaveCount(1);expect(await saved(page)).toEqual(current);
 const expected=solve(l,current.positions).moves[0];await expect(page.getByTestId('bike-'+l.bikes[expected.bike].id)).toHaveClass(/hinted/);expect(applyMove(l,current.positions,expected)).not.toBeNull();await expect(page.getByTestId('hint-message')).toContainText(l.bikes[expected.bike].id);
});
test('restart confirmation and German settings persist',async({page})=>{
 await start(page);await bikes(page).first().click();await page.getByTestId('move-positive').click();await settle(page);await page.getByTestId('restart').click();await page.getByRole('button',{name:'Keep playing',exact:true}).click();expect(await count(page)).toBe(1);await page.getByTestId('restart').click();await page.getByRole('button',{name:'Start again',exact:true}).click();expect(await count(page)).toBe(0);
 await page.getByTestId('open-settings').click();await page.getByRole('switch',{name:'Bicycle bell'}).click();await page.getByRole('switch',{name:'Reduce motion'}).click();await page.getByRole('button',{name:'Deutsch',exact:true}).click();await page.getByRole('button',{name:'Schließen',exact:true}).click();await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','de');await page.getByTestId('open-settings').click();await expect(page.getByRole('switch',{name:'Fahrradklingel'})).toHaveAttribute('aria-checked','false');await expect(page.getByRole('switch',{name:'Weniger Bewegung'})).toHaveAttribute('aria-checked','true');
});
test('touch dragging a vertical bike does not scroll the page',async({page,context})=>{
 await start(page,2);const box=(await page.getByTestId('bike-B').boundingBox())!,board=(await page.getByTestId('board').boundingBox())!;const cdp=await context.newCDPSession(page);const x=box.x+box.width/2,startY=box.y+box.height/2,endY=board.y+board.height-8;const before=await page.evaluate(()=>scrollY);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:startY}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:startY+(endY-startY)*i/8}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await settle(page);expect(await page.evaluate(()=>scrollY)).toBe(before);expect(await count(page)).toBe(1);await expect(page.getByTestId('bike-B')).toHaveCount(0);await integrity(page);
});
