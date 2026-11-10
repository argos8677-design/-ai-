<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- AI content generation runs only in `src/lib/ai-generate.server.ts` via the Lovable AI Gateway; prompts per channel live in the `prompt_templates` table so they can be edited without code changes.
- When AI fails, the server falls back to rule-based demo content (`src/lib/demo-content.ts`) and labels it `mode: "demo"`; AI and demo results must stay visually distinguished.
- History tables are service-role only; server functions scope them by an anonymous browser `client_id` (no login yet).
- Product facts not stored in `products` must render as "회사 확인 필요" — never invent prices, deposits, specs or benefits.
