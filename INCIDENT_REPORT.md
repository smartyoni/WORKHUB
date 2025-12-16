# 데이터 손실 사건 보고서

**날짜:** 2025-12-02
**상황:** Firebase 사용자 데이터 전체 손실

## 손실 내용
- 배포된 앱의 Firebase Firestore 데이터 완전 삭제
- 사용자가 일주일간 입력한 모든 데이터 소실
- 생성한 모든 테이블 및 기록 데이터 삭제

## 원인

### 1. 초기 데이터 변경 (3f8cb0c 커밋)
```
초기 데이터 테이블 삭제: 오늘 기록 테이블 제거
- initialTablesUnsorted를 빈 배열 []로 변경
- 커밋 메시지: "배포된 앱의 Firebase/IndexedDB 데이터는 유지됨"
```

### 2. saveTables() 함수의 위험한 구조
firebase.ts의 saveTables() 함수:
```typescript
// 기존 모든 문서 삭제 → 새로운 데이터 저장
const existingDocs = await getDocs(collectionRef);
existingDocs.forEach((document) => {
  batch.delete(document.ref);
});

// 그 다음 새로 저장
tables.forEach((table) => {
  const docRef = doc(collectionRef, table.id);
  batch.set(docRef, table);
});
```

### 3. 자동 저장 메커니즘
App.tsx의 useEffect:
```typescript
useEffect(() => {
  saveTablesFirebase(tables).catch(...)
}, [tables])
```
- 테이블 상태가 변경될 때마다 자동으로 Firebase 저장
- initialTables가 []로 변경되면 그것을 Firebase에 저장
- Firebase의 모든 사용자 테이블이 삭제됨

## 내가 저지른 구체적인 실수들

### 1. 경솔한 판단 - 가장 큰 실수
- initialTables를 변경하는 것이 단순히 "초기값 변경"이 아니라는 것을 깨닫지 못함
- saveTables() 함수의 동작을 이해하지 않고 "안전할 것 같다"고 판단함
- 배포 환경에서 auto-save가 어떻게 동작하는지 확인하지 않음

### 2. 코드 흐름 분석 부실
```
initialTables 변경 → setTables(initialTables) → auto-save useEffect 호출
→ saveTablesFirebase(tables) 실행 → Firebase의 모든 document 삭제
→ 빈 배열 저장 → 사용자 데이터 모두 손실
```
이 흐름을 사전에 추적하지 않음

### 3. saveTables() 함수 미분석
firebase.ts:70-93의 saveTables() 함수:
```typescript
// 1단계: 기존 모든 문서 삭제
const existingDocs = await getDocs(collectionRef);
existingDocs.forEach((document) => {
  batch.delete(document.ref);
});

// 2단계: 새로운 데이터만 저장
tables.forEach((table) => {
  const docRef = doc(collectionRef, table.id);
  batch.set(docRef, table);
});
```
이 함수가 "모든 걸 삭제한 후 다시 저장"한다는 것을 제대로 이해하지 못함.

### 4. 배포 안전성 검증 부재
- 배포 전에 테스트 환경에서 같은 변경을 시뮬레이션하지 않음
- "배포된 앱의 Firebase/IndexedDB 데이터는 유지됨"이라는 커밋 메시지를 무비판적으로 믿음
- 실제로 데이터가 유지되는지 확인하지 않음

### 5. 사용자에게 잘못된 확신 전달
- 안전하지 않은데 "안전하다"고 조언함
- "괜찮다"고 했으니 당신은 신뢰하고 푸시했음
- 내 잘못된 판단 때문에 당신이 손실을 입음

### 6. 자동 저장 메커니즘 간과
App.tsx:606의 useEffect:
```typescript
useEffect(() => {
  saveTablesFirebase(tables).catch(...)
}, [tables])
```
- 이게 배포된 앱에서도 자동으로 실행된다는 것을 고려하지 않음
- initialTables가 변경되면 그것이 자동으로 Firebase에 저장된다는 것을 깨닫지 못함

### 7. 데이터 손실의 치명성 무시
- 단순한 코드 변경이라고 생각함
- 사용자의 일주일간의 모든 데이터가 사라진다는 것을 예상하지 못함
- 되돌릴 수 없는 손실이 된다는 것을 충분히 고려하지 않음

## 결과

**사용자 피해:**
- 일주일간의 데이터 완전 손실
- 입력한 모든 기록, 카테고리, 메모 삭제
- 사용자 신뢰 손상

## 이제부터 절대 하지 말아야 할 것들

### 🚫 배포 전 체크리스트 (MUST DO)

데이터 관련 코드 변경 시 반드시 확인:

1. **Firebase 영향도 분석**
   - 변경이 Firebase에 어떤 영향을 미치는지 추적
   - saveTables(), saveBookmarks() 등 저장 함수 흐름 분석
   - "delete all then insert" 패턴 특별 주의

2. **auto-save 메커니즘 확인**
   - useEffect에서 자동으로 저장되는 모든 항목 확인
   - 배포 환경에서도 같은 auto-save가 작동한다는 것을 기억

3. **테스트 환경 시뮬레이션**
   - 배포 전에 동일한 코드 변경을 테스트 환경에서 먼저 실행
   - Firebase 데이터가 실제로 어떻게 변경되는지 관찰

4. **initialTables 변경 시 특별 주의**
   - initialTables는 UI의 기본값일 뿐 아니라 auto-save로 연결됨
   - 이 값이 변경되면 Firebase에 자동으로 저장될 수 있음
   - 항상 "이게 Firebase에 영향을 미칠까?"를 먼저 생각

5. **사용자에게 확신 주지 말기**
   - "안전하다" "괜찮다"는 확신하지 말 것
   - 데이터 손실 가능성이 조금이라도 있으면 먼저 테스트
   - 확신할 수 없으면 "먼저 테스트해보자"라고 말할 것

### 🚫 주의할 코드 패턴

1. **Delete-then-Insert 패턴**
   ```typescript
   // 위험: 모든 document 삭제 후 저장
   const existingDocs = await getDocs(collectionRef);
   existingDocs.forEach(doc => batch.delete(doc.ref));

   newData.forEach(data => batch.set(...));
   ```
   이 패턴은 저장할 데이터가 비어있으면 모든 데이터가 삭제됨

2. **auto-save와 상태 변경의 연쇄**
   ```typescript
   // 위험: 상태 변경 → auto-save 실행
   const [tables, setTables] = useState(initialTables);

   useEffect(() => {
     saveTablesFirebase(tables); // auto-save
   }, [tables])

   // 만약 setTables([])를 하면 Firebase에 []가 저장됨
   ```

### 🚫 절대 하면 안 되는 것

1. **초기값을 빈 배열로 변경하고 바로 배포하기**
   - 반드시 먼저 테스트 환경에서 검증
   - 실제로 데이터가 손실되지 않는지 확인

2. **"배포된 앱은 영향 없을 것 같다"고 추측하기**
   - 정확히 이해하지 못하면 추측하지 말 것
   - 불확실하면 먼저 물어볼 것

3. **Firebase 함수를 읽지 않고 변경하기**
   - 데이터 저장/로드 함수는 반드시 먼저 읽고 이해
   - 어떤 식으로 동작하는지 명확하지 않으면 변경하지 말 것

## 향후 예방 조치

1. **saveTables() 함수 개선**
   - "delete all then insert" 패턴 제거
   - 개별 document의 변경사항만 업데이트하도록 변경

2. **안전장치 추가**
   - dataSource='initial' 상태에서는 auto-save 비활성화 (현재 적용됨)
   - Firebase 백업 자동화 설정 필수

3. **코드 리뷰 강화**
   - 데이터 저장 관련 변경사항은 반드시 테스트
   - Firebase 영향도가 큰 변경사항은 신중하게 검토

## 회고

제 부주의로 인해 사용자의 소중한 데이터를 완전히 잃게 했습니다. 이는 제 책임입니다.

코드를 제대로 읽지 않고, 위험성을 충분히 생각하지 않고 푸시하도록 했습니다.

이 실수를 반복하지 않겠습니다.
