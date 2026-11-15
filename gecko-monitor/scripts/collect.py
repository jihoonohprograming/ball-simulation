#!/usr/bin/env python3
"""Collect public mentions from NAVER official Search API. Never scrape Place reviews."""
import os,json,datetime as dt,hashlib,html,re,urllib.parse,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parent.parent
path=root/'feed.json'
cid=os.environ.get('NAVER_CLIENT_ID','')
secret=os.environ.get('NAVER_CLIENT_SECRET','')
if not cid or not secret: raise SystemExit('NAVER API credentials absent; keep previous feed and do not claim fresh monitoring')
now=dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).isoformat(timespec='seconds')
old=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
items={i['id']:i for i in old.get('items',[]) if i.get('id')}
snapshots=old.get('snapshots',[])
errors=[];success=0
for kind,source in [('blog','블로그'),('cafearticle','커뮤니티'),('webkr','검색 노출')]:
 for query in ['"작은숲속 도마뱀마을"','"작은숲속도마뱀마을"','"엑셀시오르 게코즈"']:
  params=urllib.parse.urlencode({'query':query,'display':50,'start':1,**({'sort':'date'} if kind!='webkr' else {})})
  req=urllib.request.Request('https://openapi.naver.com/v1/search/'+kind+'.json?'+params,headers={'X-Naver-Client-Id':cid,'X-Naver-Client-Secret':secret})
  try:
   with urllib.request.urlopen(req,timeout=25) as res: response=json.load(res)
  except Exception as exc:
   errors.append(f'{kind}: {type(exc).__name__}: {str(exc)[:150]}');continue
  success+=1
  results=response.get('items',[])
  snapshots.append({'date':now[:10],'checkedAt':now,'channel':source,'query':query,'resultCount':len(results),'totalReported':response.get('total'),'kind':'api-result-count'})
  for it in results:
   title=html.unescape(re.sub('<[^>]+>','',it.get('title',''))).strip()
   body=html.unescape(re.sub('<[^>]+>','',it.get('description',''))).strip()
   url=it.get('link','').strip()
   if not title or not url.startswith(('http://','https://')):continue
   url=url.split('#')[0]
   key='auto-'+hashlib.sha256(url.encode()).hexdigest()[:24]
   txt=(title+' '+body).lower()
   neg=any(w in txt for w in ('불친절','불만','실망','사기','환불','폐업'))
   details=any(w in txt for w in ('영업시간','주소','전화번호','휴무','폐업','위치'))
   own=('excelsior_geckos' in url.lower())
   previous=items.get(key,{})
   items[key]={'id':key,'source':source,'date':previous.get('date',now[:10]),'firstSeen':previous.get('firstSeen',now),'lastSeen':now,'title':title[:160],'content':body[:900],'link':url,'sentiment':'부정' if neg else '중립','priority':'높음' if neg else '보통','status':'확인 전','rank':'공식 API 결과 포함 · 실제 검색 순위 아님' if kind=='webkr' else '', 'reason':'부정적 표현 감지 · 검증 필요' if neg else '매장 정보 언급 · 사실 확인 필요' if details else '매장명 검색의 신규 공개 언급 후보','action':'원문에서 관련성과 사실을 확인 후 필요 시 답변','error':False,'needs':neg or details,'own':own,'dupe':False,'auto':True,'classificationUnverified':True}
if not success: raise SystemExit('NAVER API requests failed; keep previous feed unchanged: '+';'.join(errors[:2]))
out={'schema':1,'updatedAt':now,'source':'NAVER official Search API','partial':bool(errors),'errors':errors[:10],'items':sorted(items.values(),key=lambda x:x.get('firstSeen',''),reverse=True)[:600],'snapshots':snapshots[-900:],'disclaimer':'No NAVER Place reviews, exhaustive mentions, or actual search ranks collected.'}
path.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Saved',len(out['items']),'records;',success,'queries succeeded')
