/*
  A bounded social layer for the city.  It deliberately models remembered
  relationships, conversations, groups and collective decisions as data that
  can affect later work.  The sentences shown to an observer are generated
  from that data; this is not a claim that a resident has consciousness or a
  language model.
*/
(function(root){
  const DAY=86400000, MAX_GROUPS=6, MAX_DIALOGUES=48, MAX_TOPICS=28, MAX_CHRONICLE=72;
  const FIELDS=['food','energy','health','housing','research'];
  const FIELD_LABEL={food:'먹거리',energy:'에너지',health:'돌봄',housing:'주거',research:'탐구'};
  const FIELD_OBJECT={food:'먹거리를',energy:'에너지를',health:'돌봄을',housing:'주거를',research:'탐구를'};
  const VALUES=[
    ['돌봄','서로의 안전과 회복을 먼저 살피는 편입니다.'],
    ['탐구','알 수 없는 현상의 원인을 끝까지 찾고 싶어 합니다.'],
    ['자율','남이 정한 길보다 스스로 고른 일을 중요하게 생각합니다.'],
    ['연대','혼자보다 함께 해낼 수 있는 일을 찾습니다.'],
    ['안정','오늘의 생활을 무너지지 않게 지키려 합니다.'],
    ['창작','익숙한 도구와 방식을 새롭게 바꾸고 싶어 합니다.'],
    ['기록','사라질 경험을 말과 글로 남기려 합니다.']
  ];
  const ASPIRATIONS=['좋은 이웃이 되기','새 원리를 발견하기','함께 쓸 도구 만들기','도시의 기억 남기기','안전한 집짓기','다음 세대를 돌보기'];
  const GROUP_NAMES={
    food:['수확 나눔회','온실 협동조합','식탁 연구모임'],
    energy:['빛의 공방','전력 순환회','밤샘 발전 모임'],
    health:['돌봄 순환회','느린 회복 모임','이웃 건강회'],
    housing:['집과 골목 협의회','공간 나눔회','함께 짓는 모임'],
    research:['낯선 원리 연구회','관찰자 없는 탐구회','새벽 실험회']
  };
  let activeState=null, activeNote=null;

  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  function hash(value){let h=2166136261;for(const ch of String(value))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h>>>0}
  function pick(list,key){return list[hash(key)%list.length]}
  function chance(key,rate){return hash(key)%10000<Math.floor(rate*10000)}
  function dayOf(s){return Math.floor(s.processed/DAY)}
  function adults(s){return s.people.filter(p=>p.age>=16)}
  function personState(p){
    p.society=p.society||{};
    p.society.values=Array.isArray(p.society.values)&&p.society.values.length?p.society.values:null;
    if(!p.society.values){
      const first=pick(VALUES,p.id+'value-a')[0], second=pick(VALUES,p.id+'value-b')[0];
      p.society.values=[first,second===first?pick(VALUES,p.id+'value-c')[0]:second];
    }
    p.society.aspiration=p.society.aspiration||pick(ASPIRATIONS,p.id+'aspiration');
    p.society.question=p.society.question||questionFor(p);
    p.society.topics=Array.isArray(p.society.topics)?p.society.topics.slice(-10):[];
    p.society.journal=Array.isArray(p.society.journal)?p.society.journal.slice(-6):[];
    p.society.relations=p.society.relations&&typeof p.society.relations==='object'?p.society.relations:{};
    p.society.groups=Array.isArray(p.society.groups)?p.society.groups.slice(-3):[];
    return p.society;
  }
  function questionFor(p){
    const value=personStateBare(p).values?.[0]||pick(VALUES,p.id+'q')[0];
    return ({돌봄:'누구도 혼자 아프지 않으려면 무엇이 필요할까?',탐구:'아직 설명되지 않은 현상은 무엇일까?',자율:'내가 선택할 수 있는 일은 어디까지일까?',연대:'서로 다른 사람들이 함께 결정하려면 무엇이 필요할까?',안정:'내일도 안전하려면 오늘 무엇을 남겨야 할까?',창작:'기존 도구를 다르게 연결하면 무엇이 생길까?',기록:'이 도시에서 사라지지 않아야 할 이야기는 무엇일까?'})[value]||'오늘의 경험에서 무엇을 배울 수 있을까?'
  }
  function personStateBare(p){return p.society||{}}
  function init(s){
    s.society=s.society&&typeof s.society==='object'?s.society:{};
    const q=s.society;
    q.version=2;q.createdAt=Number.isFinite(q.createdAt)?q.createdAt:s.processed;
    q.nextId=Number.isFinite(q.nextId)?q.nextId:1;
    q.groups=Array.isArray(q.groups)?q.groups.slice(-MAX_GROUPS):[];
    q.topics=Array.isArray(q.topics)?q.topics.slice(-MAX_TOPICS):[];
    q.dialogues=Array.isArray(q.dialogues)?q.dialogues.slice(-MAX_DIALOGUES):[];
    q.chronicle=Array.isArray(q.chronicle)?q.chronicle.slice(-MAX_CHRONICLE):[];
    q.proposals=Array.isArray(q.proposals)?q.proposals.slice(-8):[];
    q.policies=q.policies&&typeof q.policies==='object'?q.policies:{};
    q.selectedDialogue=q.selectedDialogue||null;
    q.lastFormation=Number.isFinite(q.lastFormation)?q.lastFormation:-Infinity;
    if(q.populationCount!==s.people.length){
      for(const p of s.people)personState(p);
      q.populationCount=s.people.length;
    }
    return q;
  }
  function record(s,kind,title,detail,note){
    const q=init(s), event={id:q.nextId++,kind,title,detail,at:s.processed};
    q.chronicle.unshift(event);q.chronicle=q.chronicle.slice(0,MAX_CHRONICLE);
    if(note)note(title+(detail?' — '+detail:''));
    return event;
  }
  function pressureField(s){
    const n=Math.max(1,s.people.length), values={
      food:n*25/(s.food+1),energy:n*15/(s.energy+1),
      health:(100-s.people.reduce((sum,p)=>sum+p.health,0)/n)/12,
      housing:n/(180+(s.facilities?.housing||0)*36),research:1/(1+(s.inventions||[]).length/8)
    };
    return Object.keys(values).sort((a,b)=>values[b]-values[a])[0];
  }
  function focusFor(p,s){
    const values=personState(p).values;
    if(values.includes('돌봄'))return 'health';
    if(values.includes('탐구')||values.includes('창작'))return 'research';
    if(values.includes('안정'))return pressureField(s);
    return pick(['food','energy','housing','research'],p.id+'focus');
  }
  function groupById(s,id){const q=s.society?.groups?s.society:init(s);return q.groups.find(g=>g.id===id)}
  function labelGroup(g){return g?.name||'아직 소속 모임 없음'}
  function createGroup(s,founder,field,note){
    const q=init(s);if(!founder||q.groups.length>=MAX_GROUPS)return null;
    const state=personState(founder), name=founder.name+'의 '+pick(GROUP_NAMES[field]||GROUP_NAMES.research,founder.id+'group'+q.nextId);
    const candidates=adults(s).filter(p=>p.id!==founder.id).sort((a,b)=>{
      const av=personState(a).values.filter(v=>state.values.includes(v)).length, bv=personState(b).values.filter(v=>state.values.includes(v)).length;
      return bv-av||(hash(a.id+'member'+q.nextId)-hash(b.id+'member'+q.nextId));
    });
    const members=[founder.id,...candidates.slice(0,5).map(p=>p.id)];
    const group={id:'g'+q.nextId++,name,field,founder:founder.id,members,cohesion:.46,purpose:FIELD_LABEL[field]+' 문제를 함께 관찰하고 해법을 만들기',startedAt:s.processed,stories:[]};
    q.groups.push(group);q.lastFormation=s.processed;
    for(const id of members){const p=s.people.find(x=>x.id===id);if(p){const ps=personState(p);if(!ps.groups.includes(group.id))ps.groups.push(group.id)}}
    addTopic(s,{field,title:name+'의 첫 질문',claim:state.question,origin:founder.id,confidence:.48});
    record(s,'group',name+'가 생겼습니다.',group.purpose,note);
    return group;
  }
  function addTopic(s,input){
    const q=init(s), same=q.topics.find(t=>t.title===input.title);
    if(same){same.confidence=clamp((same.confidence||.2)+.06);same.at=s.processed;return same}
    const topic={id:'t'+q.nextId++,field:input.field||'research',title:input.title||'새로운 화제',claim:input.claim||'도시에서 확인할 질문이 생겼습니다.',origin:input.origin??null,confidence:input.confidence??.35,at:s.processed,heard:0};
    q.topics.unshift(topic);q.topics=q.topics.slice(0,MAX_TOPICS);return topic;
  }
  function remember(p,topic,at){
    const ps=personState(p), known=ps.topics.find(x=>x.id===topic.id);
    if(known){known.at=at;known.weight=clamp((known.weight||.25)+.08);return}
    ps.topics.unshift({id:topic.id,title:topic.title,field:topic.field,at,weight:.35});ps.topics=ps.topics.slice(0,10);
  }
  function relationship(a,b,at){
    const pa=personState(a),pb=personState(b), old=pa.relations[b.id]||{trust:.34,warmth:.32,friction:.05,lastAt:-Infinity,stories:0};
    old.trust=clamp(old.trust+(pa.values.some(v=>pb.values.includes(v))?.06:.015));
    old.warmth=clamp(old.warmth+.045);old.friction=clamp(old.friction-.012);old.lastAt=at;old.stories=(old.stories||0)+1;
    pa.relations[b.id]=old;
    const entries=Object.entries(pa.relations).sort((x,y)=>y[1].trust+y[1].warmth-x[1].trust-x[1].warmth).slice(0,12);
    pa.relations=Object.fromEntries(entries);return old;
  }
  function topicFor(s,a,b){
    const q=init(s), sharedGroup=personState(a).groups.find(id=>personState(b).groups.includes(id));
    const group=sharedGroup&&groupById(s,sharedGroup);
    const known=[...personState(a).topics,...personState(b).topics].map(x=>q.topics.find(t=>t.id===x.id)).filter(Boolean);
    if(group)return known.find(t=>t.field===group.field)||addTopic(s,{field:group.field,title:group.name+'의 관찰',claim:group.purpose,origin:group.founder,confidence:.4});
    return known[hash(a.id+'|'+b.id+'|'+Math.floor(s.processed/(DAY/2)))%Math.max(1,known.length)]||q.topics[0]||addTopic(s,{field:pressureField(s),title:'오늘의 공동 문제',claim:'생활 속 변화를 함께 확인해 보자는 제안입니다.',confidence:.3});
  }
  function lineFor(p,other,topic,first){
    const v=personState(p).values[0];
    const openings={돌봄:'당신은 괜찮은지 먼저 묻고 싶어요.',탐구:'지금의 현상에는 아직 다른 설명이 있을지도 몰라요.',자율:'각자가 선택할 여지를 남겨야 해요.',연대:'혼자 해결하기보다 같이 해보면 좋겠어요.',안정:'무너지지 않는 방식부터 찾아야 해요.',창작:'다르게 연결해 보면 어떨까요?',기록:'이 이야기는 잊히지 않게 남기고 싶어요.'};
    const endings=first?['당신은 어떻게 생각하나요?','함께 확인해 볼래요?','내일 다시 이야기해요.']:['그 관찰을 기억해 둘게요.','그럼 내가 할 수 있는 일을 찾아볼게요.','다음 만남 때 결과를 가져올게요.'];
    return `${p.name}: “${openings[v]||'생각을 나누고 싶어요.'} ${topic.title}에 관해 ${pick(endings,p.id+'|'+other.id+'|'+topic.id+'|'+first)}”`;
  }
  function meet(s,a,b,note){
    if(!s||!a||!b||a.id===b.id||a.age<16||b.age<16)return false;
    init(s);const prior=personState(a).relations[b.id];
    if(prior&&s.processed-prior.lastAt<DAY/12)return false;
    const topic=topicFor(s,a,b), relA=relationship(a,b,s.processed);relationship(b,a,s.processed);
    remember(a,topic,s.processed);remember(b,topic,s.processed);topic.heard=(topic.heard||0)+2;
    const dialogue={id:'d'+s.society.nextId++,at:s.processed,people:[a.id,b.id],topic:topic.id,title:topic.title,lines:[lineFor(a,b,topic,true),lineFor(b,a,topic,false)],trust:+relA.trust.toFixed(2)};
    s.society.dialogues.unshift(dialogue);s.society.dialogues=s.society.dialogues.slice(0,MAX_DIALOGUES);
    for(const p of [a,b]){const ps=personState(p);ps.journal.unshift({at:s.processed,text:topic.title+'에 대해 '+(p.id===a?b.name:a.name)+'과(와) 대화했습니다.'});ps.journal=ps.journal.slice(0,6)}
    let g=personState(a).groups.map(id=>groupById(s,id)).find(Boolean)||personState(b).groups.map(id=>groupById(s,id)).find(Boolean);
    if(g){g.cohesion=clamp(g.cohesion+.018);g.stories.push({at:s.processed,topic:topic.title});g.stories=g.stories.slice(-8)}
    inviteToGroup(s,a,b,topic,note);return true;
  }
  function inviteToGroup(s,a,b,topic,note){
    const pairs=[[a,b],[b,a]];
    for(const [host,guest] of pairs){
      const group=personState(host).groups.map(id=>groupById(s,id)).find(g=>g&&g.members.length<18&&g.field===topic.field);
      if(!group||personState(guest).groups.includes(group.id))continue;
      const shared=personState(host).values.filter(v=>personState(guest).values.includes(v)).length;
      if(shared||chance(host.id+'invite'+guest.id+'@'+dayOf(s),.12)){
        group.members.push(guest.id);personState(guest).groups.push(group.id);group.cohesion=clamp(group.cohesion+.025);
        record(s,'join',guest.name+'이(가) '+group.name+'에 합류했습니다.',topic.title+'을 함께 살피기로 했습니다.',note);break;
      }
    }
  }
  function beforeStep(s){
    const q=init(s);activeState=s;
    if(!q.groups.length&&s.people.length){const civicScore=p=>(p.traits?.curiosity||0)+(p.traits?.care||0)+(p.traits?.industry||0);const founder=adults(s).sort((a,b)=>civicScore(b)-civicScore(a))[0]||s.people[0];createGroup(s,founder,focusFor(founder,s),activeNote)}
    const gap=s.processed-q.lastFormation;
    if(q.groups.length<MAX_GROUPS&&gap>DAY*3&&chance('formation@'+dayOf(s),.18)){
      const free=adults(s).filter(p=>personState(p).groups.length===0).sort((a,b)=>hash(a.id+'form'+dayOf(s))-hash(b.id+'form'+dayOf(s)))[0];
      if(free)createGroup(s,free,focusFor(free,s),activeNote);
    }
  }
  function cooperation(s,key){
    const q=s.society?.policies?s.society:init(s), field={farm:'food',energy:'energy',materials:'housing',build:'housing',research:'research',service:'health'}[key];
    const norm=q.policies[field];if(!norm)return 0;
    const age=Math.max(0,(s.processed-norm.at)/DAY);return Math.max(0,norm.strength-age*.002);
  }
  function observeWork(s,p,key){
    const ps=personState(p);ps.lastWork={key,at:s.processed};
    if(key!=='research'||s.processed-(ps.lastResearchAt||-Infinity)<DAY/2)return;
    if(!chance(p.id+'research@'+Math.floor(s.processed/(DAY/2)),.16))return;
    ps.lastResearchAt=s.processed;const field=focusFor(p,s), topic=addTopic(s,{field,title:FIELD_LABEL[field]+'에 관한 '+p.name+'의 가설',claim:personState(p).question,origin:p.id,confidence:.34});remember(p,topic,s.processed);
    ps.journal.unshift({at:s.processed,text:'연구 중 「'+topic.title+'」을(를) 떠올렸습니다.'});ps.journal=ps.journal.slice(0,6);
  }
  function daily(s,note){
    const q=init(s);activeState=s;activeNote=note;
    for(const field of Object.keys(q.policies)){q.policies[field].strength=Math.max(0,q.policies[field].strength-.002);if(q.policies[field].strength<.002)delete q.policies[field]}
    for(const g of [...q.groups]){
      const members=g.members.map(id=>s.people.find(p=>p.id===id)).filter(Boolean);g.members=members.map(p=>p.id);
      const ties=members.length<2?0:members.reduce((sum,p)=>sum+members.filter(o=>o.id!==p.id).reduce((n,o)=>n+(personState(p).relations[o.id]?.trust||0),0)/(members.length-1),0)/members.length;
      g.cohesion=clamp(g.cohesion*.985+ties*.025);
      if(g.cohesion<.12||!members.length){q.groups=q.groups.filter(x=>x.id!==g.id);for(const p of s.people)personState(p).groups=personState(p).groups.filter(id=>id!==g.id);record(s,'group',g.name+'가 활동을 멈췄습니다.','구성원들이 각자의 길을 선택했습니다.',note)}
    }
    for(const proposal of q.proposals.filter(p=>p.status==='논의 중'&&p.due<=s.processed))resolveProposal(s,proposal,note);
    if(!q.proposals.some(p=>p.status==='논의 중')){
      const group=q.groups.sort((a,b)=>b.cohesion-a.cohesion)[0];if(group)createProposal(s,group,note);
    }
  }
  function createProposal(s,g,note){
    const q=init(s), topic=q.topics.find(t=>t.field===g.field)||addTopic(s,{field:g.field,title:g.name+'의 제안',claim:g.purpose,origin:g.founder});
    const proposal={id:'p'+q.nextId++,group:g.id,field:g.field,title:(FIELD_OBJECT[g.field]||FIELD_LABEL[g.field]+'을')+' 위한 '+g.name+'의 약속',detail:topic.claim,status:'논의 중',opened:s.processed,due:s.processed+DAY,support:0,opposition:0};
    q.proposals.unshift(proposal);q.proposals=q.proposals.slice(0,8);
    record(s,'proposal','공동 의제가 열렸습니다: '+proposal.title,proposal.detail,note);return proposal;
  }
  function resolveProposal(s,proposal,note){
    const voters=adults(s);let support=0;
    for(const p of voters){const ps=personState(p), group=groupById(s,proposal.group);let score=.35;
      if(ps.values.includes('연대')||ps.values.includes('돌봄'))score+=.22;
      if(ps.values.includes('안정')&&proposal.field!=='research')score+=.14;
      if(ps.values.includes('탐구')&&proposal.field==='research')score+=.18;
      if(group?.members.includes(p.id))score+=.25;
      score+=(hash(p.id+'vote'+proposal.id)%100)/600;if(score>=.57)support++;
    }
    proposal.support=support;proposal.opposition=voters.length-support;
    if(support>=Math.ceil(voters.length*.52)){
      proposal.status='채택';const prior=s.society.policies[proposal.field]?.strength||0;
      s.society.policies[proposal.field]={strength:clamp(prior+.035,0,.12),at:s.processed,proposal:proposal.id};
      record(s,'decision','도시가 공동 약속을 채택했습니다.',proposal.title+' · 찬성 '+support+'명, 반대 '+(voters.length-support)+'명',note);
    }else{proposal.status='보류';record(s,'decision','공동 약속이 보류되었습니다.',proposal.title+' · 찬성 '+support+'명, 반대 '+(voters.length-support)+'명',note)}
  }
  function shapeOptions(s,p,options){
    if(!s.society?.groups)init(s);const ps=personState(p);if(!ps.groups.length)return;
    const g=ps.groups.map(id=>groupById(s,id)).find(Boolean);if(!g)return;
    const phase=Math.floor(s.processed/(DAY/2)), attends=hash(p.id+'attend'+phase)%10<7;
    if(attends){const social=options.find(x=>x.key==='social');if(social){social.score+=17+g.cohesion*8;social.action='모임: '+g.name;social.reason=g.purpose+'에 대해 다른 구성원과 이야기를 나누기로 했습니다.'}}
    if(g.field==='research'||g.field==='food'||g.field==='energy'){
      const research=options.find(x=>x.key==='research');if(research&&hash(p.id+'researchGroup'+phase)%10<4){research.score+=10;research.action='공동 연구: '+g.name;research.reason=g.name+'에서 나눈 질문을 확인하기 위해 연구합니다.'}}
  }
  function enrichDesign(p,design){
    const s=activeState;if(!s||!design)return design;init(s);const ps=personState(p), known=ps.topics.map(x=>s.society.topics.find(t=>t.id===x.id)).filter(Boolean), topic=known[0]||s.society.topics[0];
    if(topic){design.socialLineage={topic:topic.title,field:topic.field,origin:topic.origin};design.mechanism=(design.mechanism||'')+' 이 가설은 「'+topic.title+'」에서 나온 질문을 구조화한 것입니다.'}
    design.collectiveContext=ps.groups.map(id=>groupById(s,id)?.name).filter(Boolean).join(', ')||'개인 관찰';return design;
  }
  function snapshot(s){
    const q=init(s);return {groups:q.groups.length,dialogues:q.dialogues.length,topics:q.topics.length,policies:Object.keys(q.policies).length,proposals:q.proposals.filter(p=>p.status==='논의 중').length};
  }
  function timeText(at){const d=new Date((root.START||Date.UTC(2026,10,8,7))+at);return d.toISOString().slice(5,16).replace('T',' ')}
  function selectedFromInspector(s){
    if(!root.document||!document.querySelector)return null;
    const label=document.querySelector('#inspect strong')?.textContent||'', name=label.split(' · ')[0];
    return s.people.find(p=>p.name===name)?.id??null;
  }
  function render(s,selectedId){
    if(!root.document||!document.getElementById)return;init(s);inject();const q=s.society;
    const stats=document.getElementById('societyStats');if(stats)stats.textContent='모임 '+q.groups.length+'개 · 기록된 대화 '+q.dialogues.length+'건 · 공유 화제 '+q.topics.length+'개 · 공동 약속 '+Object.keys(q.policies).length+'개';
    const groups=document.getElementById('socialGroups');if(groups){groups.replaceChildren(...q.groups.map(g=>{const d=document.createElement('div');d.className='societyItem';d.textContent=g.name+' · '+FIELD_LABEL[g.field]+' · '+g.members.length+'명 · 결속 '+Math.round(g.cohesion*100)+'%';return d}))}
    const talks=document.getElementById('socialTalks');if(talks){talks.replaceChildren(...q.dialogues.slice(0,6).map(d=>{const b=document.createElement('button');b.className='socialTalk';b.textContent=timeText(d.at)+' · '+d.title+' · '+d.lines.map(x=>x.split(':')[0]).join('·');b.onclick=()=>{q.selectedDialogue=d.id;render(s,selectedId)};return b}));const picked=q.dialogues.find(d=>d.id===q.selectedDialogue)||q.dialogues[0];const detail=document.getElementById('socialDialogueDetail');if(detail)detail.replaceChildren(...(picked?[...picked.lines.map(line=>{const p=document.createElement('p');p.textContent=line;return p}),(()=>{const p=document.createElement('small');p.textContent='서로의 신뢰도 '+Math.round(picked.trust*100)+'% · '+timeText(picked.at);return p})()]:[]))}
    const chronicle=document.getElementById('socialChronicle');if(chronicle)chronicle.replaceChildren(...q.chronicle.slice(0,8).map(e=>{const p=document.createElement('p');p.textContent=timeText(e.at)+' · '+e.title+(e.detail?' — '+e.detail:'');return p}));
    const p=s.people.find(x=>x.id===selectedId), inspect=document.getElementById('inspect');if(p&&inspect){const previous=document.getElementById('socialInspect');if(previous)previous.remove();const ps=personState(p),box=document.createElement('div');box.id='socialInspect';box.className='socialInspect';const h=document.createElement('h3');h.textContent='관계 · 기억 · 소속';box.append(h);const values=document.createElement('p');values.textContent='중요하게 여기는 것: '+ps.values.join(' · ')+' / 바라는 일: '+ps.aspiration;box.append(values);const groupsText=document.createElement('p');groupsText.textContent='소속: '+(ps.groups.map(id=>labelGroup(groupById(s,id))).join(', ')||'아직 없음');box.append(groupsText);const rel=Object.entries(ps.relations).sort((a,b)=>(b[1].trust+b[1].warmth)-(a[1].trust+a[1].warmth)).slice(0,3).map(([id,r])=>{const other=s.people.find(x=>x.id===+id);return other?other.name+'(신뢰 '+Math.round(r.trust*100)+'%)':''}).filter(Boolean);const relations=document.createElement('p');relations.textContent='가까운 관계: '+(rel.join(', ')||'아직 기록 없음');box.append(relations);const question=document.createElement('p');question.textContent='지금 품은 질문: '+ps.question;box.append(question);const journal=document.createElement('p');journal.textContent='최근 기록: '+(ps.journal.slice(0,2).map(x=>x.text).join(' / ')||'아직 없음');box.append(journal);inspect.append(box)}
  }
  function inject(){
    if(!root.document||!document.querySelector||document.getElementById('societyPanel'))return;
    const destination=document.querySelector('.bottom');if(!destination)return;
    const panel=document.createElement('section');panel.id='societyPanel';panel.className='panel';
    panel.innerHTML='<h3>관계와 도시의 기억</h3><p id="societyStats" class="hint"></p><div id="socialGroups" class="hint"></div><details open><summary>최근 대화</summary><div id="socialTalks" class="hint"></div><div id="socialDialogueDetail" class="hint"></div></details><details><summary>도시 연대기</summary><div id="socialChronicle" class="hint"></div></details><p class="hint">대화·소문·모임·공동 의제는 주민의 기억과 관계 상태에서 구성되며, 이후의 모임·연구·협업에 작은 영향을 줍니다. 문장은 관찰을 위한 규칙 기반 표현입니다.</p>';
    destination.append(panel);const style=document.createElement('style');style.textContent='.societyItem{padding:7px 0;border-bottom:1px solid #304448}.socialTalk{display:block;width:100%;text-align:left;font-size:12px;margin:5px 0;padding:7px}.socialInspect{border-top:1px solid #365057;margin-top:12px;padding-top:10px}.socialInspect p{font-size:12px;line-height:1.6;margin:7px 0}#socialDialogueDetail{padding:6px 4px;line-height:1.7}#socialChronicle p{font-size:12px;line-height:1.6;margin:7px 0}';document.head.append(style);
  }
  function attach(){
    if(root.__citySocietyAttached||!root.CityWorld||!root.CityBrain)return;root.__citySocietyAttached=true;
    const world=root.CityWorld, oldBefore=world.beforeStep, oldBond=world.bond, oldWork=world.work, oldDaily=world.daily;
    world.beforeStep=function(s){const value=oldBefore(s);beforeStep(s);return value};
    world.bond=function(a,b){const value=oldBond(a,b);if(activeState)meet(activeState,a,b,activeNote);return value};
    world.work=function(s,p,key,skill,multiplier){const value=oldWork(s,p,key,skill,type=>(multiplier?multiplier(type):1)*(1+cooperation(s,key)));if(value)observeWork(s,p,key);return value};
    world.daily=function(s,note){activeState=s;activeNote=note;const value=oldDaily(s,note);daily(s,note);return value};
    const oldDecide=root.CityBrain.decide;root.CityBrain.decide=function(p,options,context){if(activeState)shapeOptions(activeState,p,options);return oldDecide(p,options,context)};
    const oldBuild=root.InventionLab?.build;if(oldBuild)root.InventionLab.build=function(...args){return enrichDesign(args[0],oldBuild.apply(this,args))};
    inject();
    if(root.MutationObserver&&root.document){
      const inspect=document.getElementById('inspect');
      if(inspect){new root.MutationObserver(()=>{const id=activeState&&selectedFromInspector(activeState);if(activeState&&id!==null&&!document.getElementById('socialInspect'))render(activeState,id)}).observe(inspect,{childList:true,subtree:true})}
    }
    if(typeof root.setInterval==='function')root.setInterval(()=>{try{if(activeState)render(activeState,selectedFromInspector(activeState))}catch(_){/* page is still initialising */}},700);
  }
  const api={init,beforeStep,meet,daily,createGroup,addTopic,shapeOptions,enrichDesign,cooperation,snapshot,render,attach};
  root.CitySociety=api;if(typeof module!=='undefined')module.exports=api;
  if(root.document)attach();
})(globalThis);
