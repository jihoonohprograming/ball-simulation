const assert=require('node:assert/strict');
const Speed=require('../dist/city-speed.js');

assert.deepEqual(Speed.SPEEDS,[1000,10000,100000]);
assert.equal(Speed.normalize(10000),10000);
assert.equal(Speed.normalize(1000000),1000,'unsupported speeds fall back safely');
assert.equal(Speed.extraElapsed(1000,1000),0);
assert.equal(Speed.extraElapsed(1000,10000),9000000);
assert.equal(Speed.extraElapsed(1000,100000),99000000);
const s={elapsed:50,speed:100000};
assert.equal(Speed.applyExtra(s,200),19800000);
assert.equal(s.elapsed,19800050);
assert.equal(Speed.applyExtra(null,200),0);
console.log('PASS: persisted selectable speed values and bounded accelerated elapsed time');
