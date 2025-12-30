Quadros & Notas — GitHub-sync build
====================================

Resumo:
- Este build salva localmente (localStorage) e também permite sincronização via GitHub contents API.
- No app, insira:
  - owner/repo (ex: youruser/yourrepo)
  - Personal Access Token (classic) with repo scope (or repo:contents)
- The app will GET/PUT data/boards.json in that repo.

Security:
- Token is stored **only** in sessionStorage for convenience (not persisted).
- If you prefer, use a private repo.
- Do NOT paste a token in a public environment.

How to use:
1. Create a repo (or use an existing one).
2. Open index.html (or host on GitHub Pages).
3. Enter password: lovevenusforever
4. Enter owner/repo and your Personal Access Token.
5. Use Pull to fetch remote boards (or create remote from local if file missing).
6. Use Push to push merged data to the repo.

Notes:
- Merge strategy: Last-Write-Wins by board.lastModified.
- If boards.json doesn't exist, Push will create it.
- This is a simple sync suitable for single-user multi-device workflows.

If you want, I can also:
- Add a flow to request token via prompt rather than input
- Auto-pull on load when repo/token present in session
- Provide a tiny Node script to manage the JSON instead of using a token (if you prefer not to store token)
