const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function el(){return {value:'',style:{},dataset:{},children:[],append(...c){this.children.push(...c)},appendChild(c){this.children.push(c)},replaceChildren(...c){this.children=c},remove(){},classList:{toggle(){}},setAttribute(){},querySelectorAll:()=>[],getContext:()=>new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})}),clientWidth:1100,clientHeight:700,textContent:''}}
let elements={},saved={},ctx={document:{head:el(),body:el(),getElementById:id=>elements[id]??=el(),createElement:el,addEventListener(){}},localStorage:{getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v},performance:{now:()=>0},setTimeout,requestAnimationFrame(){},setInterval(){},addEventListener(){},Date,devicePixelRatio:1,console};
vm.createContext(ctx);
for(const f of ['city-brain.js','city-world.js'])vm.runInContext(fs.readFileSync('dist/'+f,'utf8'),ctx);
const source=fs.readFileSync('dist/index.html','utf8').split('<script>')[1].split('</script>')[0];
vm.runInContext(source,ctx);
vm.runInContext(fs.readFileSync('dist/city-society.js','utf8'),ctx);
vm.runInContext(`
  for(let i=0;i<144*14;i++)simulate();
  if(!S.inventions.length)throw Error('no invention');
  if(!Object.values(S.facilities).some(n=>n>0))throw Error('no expansion');
  if(!S.projects.some(q=>q.experiments?.length))throw Error('no experiments');
  if(!S.society?.groups?.length)throw Error('no resident group');
  if(!S.society?.dialogues?.length)throw Error('no resident dialogue');
  if(!S.society?.chronicle?.length)throw Error('no city chronicle');
  if(!S.inventions.some(q=>q.socialLineage))throw Error('invention has no social provenance');
  if(S.people.some(p=>![p.x,p.y,p.health,p.age].every(Number.isFinite)))throw Error('invalid resident');
  if(![S.food,S.energy,S.materials,S.ore].every(v=>Number.isFinite(v)&&v>=0))throw Error('resources');
  if(S.people.some(p=>!p.brain.updates))throw Error('learning');
  ui();render(1000);save();
  if(!valid(JSON.parse(JSON.stringify(S))))throw Error('saved world invalid');
  console.log(JSON.stringify({days:14,residents:S.people.length,inventions:S.inventions.length,groups:S.society.groups.length,dialogues:S.society.dialogues.length,facilities:S.facilities,ore:Math.floor(S.ore),saveBytes:JSON.stringify(S).length}));
`,ctx);
