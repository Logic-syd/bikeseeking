/** Run against npm run dev. Full real-browser replay and review screenshots. */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { levels } from '../src/game/levels';
import { solve } from '../src/game/solver';
import { applyMove, initialPositions, validatePositions } from '../src/game/engine';
const browser=await chromium.launch({channel:process.env.PW_CHANNEL || (existsSync('/Applications/Google Chrome.app')?'chrome':undefined),headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},locale:'en-GB',hasTouch:true});
const errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));
await mkdir('artifacts',{recursive:true});
try {
  await page.goto(process.env.BROWSER_BASE_URL || 'http://127.0.0.1:5173/');
  await page.getByTestId('open-settings').click();await page.getByRole('switch',{name:'Reduce motion'}).click();await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.screenshot({path:'artifacts/home-mobile.png',fullPage:true});
  await page.getByTestId('start-game').click();
  for(const level of levels) {
    let state=initialPositions(level);const solution=solve(level,state);let moves=0;
    if(level.id===15) {await page.getByTestId('hint').click();await page.locator('.bike.hinted').waitFor();await page.screenshot({path:'artifacts/level15-mobile.png',fullPage:true});}
    for(const move of solution.moves){
      const bike=level.bikes[move.bike];const board=(await page.getByTestId('board').boundingBox())!;const box=(await page.getByTestId('bike-'+bike.id).boundingBox())!;
      const from={x:box.x+box.width/2,y:box.y+box.height/2};const target=move.to<0?(move.exit===1?level.size-bike.length+.8:-.8):move.to;
      const shift=(target-state[move.bike])*board.width/level.size;
      await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(from.x+(bike.axis==='h'?shift:0),from.y+(bike.axis==='v'?shift:0),{steps:4});await page.mouse.up();
      state=applyMove(level,state,move)!;moves++;
      const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('rad-raus:v1')!).session);
      if(JSON.stringify(saved.positions)!==JSON.stringify(state)||saved.moves!==moves) throw Error(`UI mismatch ${level.id}:${moves} ${JSON.stringify(saved)}`);
      if(validatePositions(level,saved.positions).length) throw Error('UI overlap');
    }
    await page.getByTestId('complete').waitFor();
    console.log(`PASS Level ${level.id}: ${moves} real drags, saved state equals engine after every move`);
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('Mobile horizontal overflow');
    if(level.id<levels.length) await page.getByTestId('next-level').click();
  }
  await page.screenshot({path:'artifacts/all-complete-mobile.png',fullPage:true});
  await page.getByTestId('level-select').click();await page.screenshot({path:'artifacts/levels-mobile.png',fullPage:true});
  await page.getByTestId('level-card-15').click();
  await page.getByTestId('open-settings').click();await page.getByRole('button',{name:'Deutsch',exact:true}).click();await page.getByRole('button',{name:'Schließen',exact:true}).click();
  await page.screenshot({path:'artifacts/level15-mobile-de.png',fullPage:true});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('German mobile horizontal overflow');
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:'artifacts/game-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Rad Raus! · Home'}).click();await page.screenshot({path:'artifacts/home-desktop.png',fullPage:true});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('Desktop horizontal overflow');
  if(errors.length) throw Error(errors.join('\n'));
  console.log('PASS mobile 390px / desktop 1440px, German layout, no page errors');
} finally {await browser.close();}
