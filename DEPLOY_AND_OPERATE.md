# DEPLOY_AND_OPERATE

이 문서를 운영 기준 문서의 단일 진입점으로 사용합니다.

## 1. Render 배포 순서
1. Render PostgreSQL 생성
2. 웹 서비스 생성 후 저장소 연결
3. Persistent Disk 연결 및 `UPLOAD_ROOT`를 디스크 마운트 경로로 지정
4. 환경변수 입력
5. 배포 후 `/healthz`, `/readyz` 확인
6. 관리자 계정/로그인/핵심 기능 수동 점검

## 2. 필수 환경변수
- `DATABASE_URL`
- `SESSION_SECRET`
- `UPLOAD_ROOT`
- `APP_BASE_URL`
- `ACCOUNT_ENCRYPTION_KEY`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`
- `VITE_TOSS_PAYMENTS_CLIENT_KEY`
- `TOSS_PAYMENTS_SECRET_KEY` 또는 `TOSS_SECRET_KEY`

세부 설명은 `ENVIRONMENT_VARIABLES.md`를 참고합니다.

## 3. Disk mount 확인 방법
1. `UPLOAD_ROOT`가 실제 Render Disk 마운트 경로인지 확인
2. `npm run verify:integrations` 실행
3. `.diagnostics/render-disk-check.txt` 생성 여부 확인

## 4. PostgreSQL 연결 확인 방법
1. `DATABASE_URL` 설정 확인
2. 배포 후 `/readyz` 확인
3. 필요 시 `npm run db:migrate` 실행
4. `schema_migrations` 테이블에 적용 이력 존재 확인

## 5. 관리자 점검 순서
1. 관리자 로그인
2. 회원가입/이메일 인증 확인
3. 콘텐츠 업로드/조회 확인
4. 결제 prepare/confirm 확인
5. 관리자 승인/정산 UI 확인
6. PDF 구매 후 권한 확인

## 6. 장애 시 확인 순서
1. `/healthz`, `/readyz` 상태 확인
2. Render 로그 확인
3. `DATABASE_URL`, `UPLOAD_ROOT`, 메일/결제 키 재확인
4. 최근 배포 변경점 확인
5. `npm run verify:integrations` 결과 재확인

## 7. 백업/복구 기본 절차
1. PostgreSQL 스냅샷/백업 주기 확인
2. 업로드 디스크 백업 경로 확인
3. 장애 시 DB 복구 후 업로드 파일 무결성 확인
4. 복구 뒤 관리자 핵심 점검 순서 재실행

## 8. 세부 문서
- 배포 체크리스트: `DEPLOYMENT_AND_RELEASE_CHECKLIST.md`
- 환경변수: `ENVIRONMENT_VARIABLES.md`
- 관리자 운영: `ADMIN_OPERATION_MANUAL.md`
- 장애 대응: `INCIDENT_RESPONSE_CHECKLIST.md`
- 백업/모니터링: `OPERATIONS_BACKUP_AND_MONITORING.md`
- DB/Render 설정: `SETUP_DB_AND_RENDER.md`
- 수동 E2E: `MANUAL_E2E_CHECKLIST.md`
