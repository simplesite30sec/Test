# 이메일 알림 시스템 설정 가이드

## Resend API 키 설정

### 1. Resend 계정 생성
1. https://resend.com 접속
2. GitHub 계정으로 로그인
3. API Keys 메뉴 클릭
4. "Create API Key" 클릭
5. 이름 입력 후 Permission을 "Sending Access"로 설정
6. API 키 복사 (한 번만 표시됩니다!)

### 2. 환경 변수 설정
`.env.local` 파일에 다음 추가:
```bash
RESEND_API_KEY=re_your_api_key_here
```

### 3. Cloudflare 환경 변수 설정
1. Cloudflare Pages 대시보드 접속
2. 프로젝트 선택 → Settings → Environment variables
3. Production 탭에서 "Add variable" 클릭
4. Variable name: `RESEND_API_KEY`
5. Value: Resend API 키 입력
6. "Save" 클릭

## 작동 방식

1. 사용자가 문의하기 폼 제출
2. Supabase `site_inquiries` 테이블에 저장
3. `/api/send-inquiry` API 호출
4. API가 `site_addons` 테이블에서 알림 이메일 주소 조회
5. Resend를 통해 이메일 발송
6. 이메일 실패해도 문의는 정상 저장됨 (Graceful degradation)

## 이메일 형식

```
제목: [사이트명] 새로운 문의가 도착했습니다

내용:
- 이름: [고객 이름]
- 연락처: [전화번호]
- 이메일: [이메일 주소]
- 문의 내용: [메시지]
```

## 제한사항

- **무료 플랜**: 월 3,000통, 일 100통
- **발신 주소**: onboarding@resend.dev (기본)
- **도메인 인증**: 커스텀 도메인 사용 시 DNS 설정 필요

## 문제 해결

### 이메일이 안 와요
1. Cloudflare 환경 변수 설정 확인
2. Add-on Store에서 알림 이메일 설정 확인
3. Resend 대시보드에서 전송 로그 확인

### 스팸함으로 가요
- 나중에 커스텀 도메인 설정하면 개선됩니다
- 현재는 테스트용 도메인이라 스팸으로 분류될 수 있습니다
