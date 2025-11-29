# 개발 서버 설정 가이드

## 개발서버 시작하기

```bash
npm run dev
```

### 정상 접속 주소
- **Local**: http://localhost:5173/WORKHUB/

---

## 문제해결 가이드

### 1. ERR_CONNECTION_REFUSED (연결 거부 오류)

**증상**: `localhost에서 연결을 거부했습니다.` 오류 발생

**원인**: 개발서버가 실행되지 않음

**해결 방법**:
```bash
# 1. 의존성 설치
npm install

# 2. 개발서버 시작
npm run dev
```

---

### 2. STATUS_ACCESS_VIOLATION (보안/방화벽 오류)

**증상**: `STATUS_ACCESS_VIOLATION` 오류로 페이지 접속 불가

**원인**: 호스트 바인딩이 명시적이지 않아 발생하는 보안 문제

**해결 방법**: `vite.config.ts`에서 다음과 같이 수정
```typescript
server: {
  host: '127.0.0.1',  // 명시적 호스트 바인딩
  port: 5173,
  strictPort: false,
}
```

---

### 3. 포트 충돌 (Port already in use)

**증상**: `Port 5173 is in use, trying another one...` 메시지가 나타나고 다른 포트(예: 5174)로 시작됨

**원인**: 이전 개발서버 프로세스가 포트를 점유 중

**해결 방법**:
```bash
# 이전 개발서버 프로세스 확인
netstat -ano | findstr :5173

# 프로세스 종료 (Windows)
taskkill /PID [PID번호] /F

# 또는 개발서버를 다시 시작
npm run dev
```

---

## Tailwind CSS 경고 무시해도 됨

**경고**: `Your 'content' configuration includes a pattern which looks like it's accidentally matching all of node_modules`

이는 Tailwind CSS의 경고로, 성능에 미치는 영향이 최소이므로 무시해도 됩니다.
필요시 `tailwind.config.js`에서 content 설정을 조정할 수 있습니다.

---

## 빠른 시작 체크리스트

- [ ] `npm install` 완료
- [ ] `npm run dev` 실행
- [ ] http://localhost:5173/WORKHUB/ 접속 확인
- [ ] 포트 충돌 시 이전 프로세스 종료 후 재시작
