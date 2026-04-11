# Release Checklist

## 1. 배포 전 자동 검증
아래 순서를 그대로 실행합니다.

```bash
npm run check
npm test
npm run build
npm run test:e2e:staging
npm run verify:integrations
npm run verify:release
```

- `npm run check`: TypeScript 정합성 확인
- `npm test`: 단위/통합 테스트 확인
- `npm run build`: 프로덕션 빌드 확인
- `npm run test:e2e:staging`: 실행형 E2E 확인
  - `DATABASE_URL`, `E2E_BASE_URL`가 없으면 부작용 없이 skip 되어야 합니다.
- `npm run verify:integrations`: 외부 연동 및 health/ready 점검 결과를 `docs/SERVICE_READINESS_VERIFICATION.md`에 기록합니다.
- `npm run verify:release`: 위 핵심 절차를 한 번에 집계합니다.

## 2. 배포 전 수동 검증
아래 항목은 실제 결과를 기록합니다.

| 항목 | 환경 | 일시 | 결과(PASS/FAIL) | 비고 |
|---|---|---|---|---|
| DB 연결 확인 |  |  |  |  |
| 이메일 발송 확인 |  |  |  |  |
| 회원가입 확인 |  |  |  |  |
| 비밀번호 재설정 확인 |  |  |  |  |
| 콘텐츠 업로드 확인 |  |  |  |  |
| 관리자 영상 제재 확인 |  |  |  |  |
| 결제 흐름 확인 |  |  |  |  |
| 정산 상태 변경 확인 |  |  |  |  |

## 3. 배포 후 자동 검증
배포 URL이 준비되면 아래를 실행합니다.

```bash
npm run verify:release:deployed
```

- `npm run smoke:check`: `/healthz`, `/readyz`, `/api/contents` 생존 확인
- `npm run verify:integrations`: 배포 환경 기준 DB, SMTP, Toss, Render Disk, health/ready를 다시 점검

## 4. 배포 후 수동 검증
| 항목 | 환경 | 일시 | 결과(PASS/FAIL) | 비고 |
|---|---|---|---|---|
| /healthz 응답 확인 |  |  |  |  |
| /readyz 응답 확인 |  |  |  |  |
| 관리자 로그인 확인 |  |  |  |  |
| 핵심 페이지 접근 확인 |  |  |  |  |
| 결제 sandbox 확인 |  |  |  |  |
| 정산 지급 상태 확인 |  |  |  |  |

## 5. 운영 원칙
- 문서와 실제 스크립트는 항상 같이 수정합니다.
- 외부 연동 검증 결과는 사람 기억이 아니라 문서로 남깁니다.
- E2E는 존재만 하는 테스트가 아니라 릴리즈 절차에 포함된 테스트여야 합니다.
