# marketing (Edge Function)

GitHub Pages에서 **AI 생성 + 생성 이력 저장**을 처리합니다. (서버 역할)

## 배포

1. [Supabase CLI](https://supabase.com/docs/guides/cli) 설치 후 로그인  
2. 프로젝트 연결: `supabase link --project-ref asrelvaiylfkusztubtb`  
3. 배포: `supabase functions deploy marketing`

## 시크릿 (Dashboard → Edge Functions → marketing → Secrets)

| 이름 | 설명 |
|------|------|
| `LOVABLE_API_KEY` | Lovable AI Gateway (권장). 없으면 아래 사용 |
| `OPENAI_API_KEY` | OpenAI 직접 호출 시 (`gpt-4o-mini`) |

`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`는 Edge에서 자동 주입됩니다.

## 동작

프론트는 `supabase.functions.invoke("marketing", { body: { action, ... } })` 를 호출합니다.

- `generate` — 채널별 AI 생성 + `content_history` 저장  
- `regenerateChannel` — 채널 재생성  
- `listHistory` / `getHistory` / `rateHistory` / `deleteHistory` — `client_id` 기준 이력

AI 실패 시 데모 콘텐츠로 대체하며 `mode: "demo"` 로 표시됩니다.
