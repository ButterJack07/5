import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('browser entry point and supporting modules parse successfully',()=>{
  for(const file of ['app.js','game.js','map.js','architecture.js','layout.js','input.js','server.js']){
    const path=fileURLToPath(new URL(file,import.meta.url));
    const result=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
    assert.equal(result.status,0,`${file}: ${result.stderr||result.error||'syntax check failed'}`);
  }
});
