const assert=require('node:assert/strict');
const Society=require('../dist/city-society.js');
const DAY=86400000;
function citizen(id){return {id,name:'시민'+id,age:24+id%10,health:100,hunger:20,tired:20,social:20,traits:{curiosity:.3+(id%3)*.2,care:.35+(id%4)*.12,industry:.4+(id%5)*.08},skills:[1,1,1,1,1,1],route:[],history:[],bonds:{}}}
function city(){return {processed:0,people:Array.from({length:16},(_,i)=>citizen(i)),food:6000,energy:4000,materials:500,science:0,inventions:[],projects:[],facilities:{housing:0},counters:{births:0,deaths:0}}}
let s=city(), notes=[];
Society.beforeStep(s);
assert(s.society.groups.length===1,'a city starts forming a resident-led group');
let [a,b]=s.people;
assert(Society.meet(s,a,b,t=>notes.push(t)),'a meeting is recorded once');
assert.equal(s.society.dialogues.length,1);
assert(s.society.topics.length>=1);
assert(a.society.relations[b.id].trust>.3,'meeting changes a remembered relationship');
assert(a.society.journal.length,'a resident keeps a bounded personal record');
Society.meet(s,a,b,()=>{});
assert.equal(s.society.dialogues.length,1,'same pair cannot fabricate repeated dialogue in one moment');
s.processed=DAY;Society.daily(s,t=>notes.push(t));
assert(s.society.proposals.some(p=>p.status==='논의 중'),'groups open a collective question');
s.processed=DAY*2;Society.daily(s,t=>notes.push(t));
assert(s.society.proposals.some(p=>p.status==='채택'||p.status==='보류'),'a collective question receives a recorded outcome');
const options=[{key:'social',action:'이웃과 대화',score:1,reason:'x'},{key:'research',action:'연구',score:1,reason:'x'}];
Society.shapeOptions(s,a,options);
assert(options.every(o=>Number.isFinite(o.score)),'social context only adjusts existing, bounded actions');
const design={mechanism:'기본 구조'};Society.enrichDesign(a,design);
assert(design.socialLineage&&design.mechanism.includes('가설'),'inventions retain their social question as provenance');
const saved=JSON.parse(JSON.stringify(s));
assert.equal(saved.society.dialogues.length,s.society.dialogues.length);
console.log('PASS: resident memories, dialogue, groups, civic decisions, bounded option shaping, design provenance, save continuity');
