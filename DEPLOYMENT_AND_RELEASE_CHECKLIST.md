# 배포 / 릴리즈 체크리스트

## 1. 배포 전
1. `npm ci`
2. `npm run check`
3. `npm test`
4. `npm run build`
5. `.env.example`와 운영 환경변수 비교
6. `npm run verify:integrations`

## 2. Render 배포 직후
1. `/healthz` 확인
2. `/readyz` 확인
3. 관리자 로그인 확인
4. 일반 사용자 로그인 확인
5. 이메일 인증코드 발송 확인
6. 결제 준비 API 확인
7. 정산메뉴 월별 조회 확인

## 3. 재배포 후 추가 점검
1. 기존 업로드 썸네일 접근 가능 여부
2. 기존 업로드 영상 접근 가능 여부
3. 구매 완료 PDF 접근 권한 유지 여부
4. Render Disk 진단 파일 `.diagnostics/render-disk-check.txt` 생성 여부
