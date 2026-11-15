# 작은숲속 도마뱀마을 · 온라인 반응 모니터

주소(기존 GitHub Pages 공개 설정이 활성화돼 있는 경우):
https://jihoonohprograming.github.io/ball-simulation/gecko-monitor/

## 현재 동작
- 반응을 수동 기록/수정/분류/상태 관리, CSV 백업/복원
- 자동 수집 피드가 생성되면 공개 블로그·네이버 카페글·웹문서 검색 후보 표시
- 기록한 수동 반응과 관리자 대응 메모는 현재 브라우저의 localStorage에만 저장
- 자동 피드는 공개 저장소의 gecko-monitor/feed.json 에 게시되어 누구나 볼 수 있음
- API의 '중립/부정', 대응 필요는 키워드에 의한 검토 후보이며 실제 판단이 아님
- 공식 검색 API의 결과 포함 여부는 네이버 플레이스 검색 순위가 아님
- 네이버 플레이스 리뷰는 공식 수집 기능이 연결되지 않아 자동 수집되지 않음

## 자동 수집 활성화
GitHub 저장소 Settings → Secrets and variables → Actions → New repository secret:
- NAVER_CLIENT_ID
- NAVER_CLIENT_SECRET

기존 네이버 검색 API 이용 권한이 있는 키만 본 예시 엔드포인트에 사용할 수 있습니다.
2026년 7월 31일 이후 신규 신청은 네이버 클라우드 API HUB 경로로 이관되어
새로운 신청 방식과 인증/엔드포인트는 별도 구현이 필요할 수 있습니다.
https://developers.naver.com/products/terms/

GitHub → Actions → Little Forest public mention monitor → Run workflow 로 수동 실행을 시험합니다.
설정이 완료되면 한국시간 매일 09:17, 15:17, 21:17에 실행을 시도합니다.
GitHub Actions 예약 실행은 지연되거나 비활성화될 수 있습니다.
실패한 실행은 피드의 updatedAt을 바꾸지 않으며 확인 가능한 최신 수집 시간을 그대로 표시합니다.

## 중요 제한과 보안
- GitHub Pages는 정적 호스팅이므로 관리자 계정/권한 관리나 다중 기기 쓰기 동기화는 없음
- 브라우저 기록을 지우면 로컬 데이터도 사라지므로 CSV 파일로 주기적으로 백업
- 공개 GitHub 저장소에 비공개 고객 정보, 내부 대응 내용, API 키를 올리지 말 것
- 실제 플레이스 신규 리뷰 수집·순위 추적은 별도 적법한 API/협력 서비스 필요
