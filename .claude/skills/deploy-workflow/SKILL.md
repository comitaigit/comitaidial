---
name: deploy-workflow
description: The required release path for any change to this project — dev first, then explicit CEO sign-off, then prod. Load before deploying anything (pushing images, running deploy.sh, or applying Terraform against the prod workspace), before merging a branch toward a production release, or whenever asked to "ship this", "deploy", "go live", or "colocar em produção".
---

# Deploy workflow — dev before prod, always with sign-off

Every change reaches production through the same path, no exceptions:

```
1. Ship to dev
2. CEO reviews dev and confirms it's okay
3. Only then ship to prod
```

Skipping straight to prod — even for a "tiny fix" — is not allowed. Production
is `comitai.app` / `api.comitai.app`; real users and real data live there.

## 1. Ship to dev first

- Merge the change into the `dev` branch.
- Build and push Docker images, then deploy them to the **dev** environment
  (`dev.comitai.app` / `dev.api.comitai.app`) per
  [infra/terraform/README.md](../../infra/terraform/README.md) — never deploy
  straight to the prod EC2 instance or the prod Terraform workspace at this
  step.
- Verify the change actually works in dev (open the app, exercise the
  changed flow) before asking anyone to review it.

## 2. Get explicit CEO sign-off — do not skip this

Once dev looks right, **stop and ask the CEO to check dev and confirm it's
okay** before doing anything to prod. This is a real approval gate, not a
formality:

- State plainly what changed and give the dev URL(s) to check
  (`https://dev.comitai.app`, `https://dev.api.comitai.app/health`). The CEO
  needs no setup at all for this — no cloning the repo, no local dev
  server — just opening that URL in a browser, since dev is already a real,
  running deployment.
- Optionally, the CEO can also review the actual code change (not just the
  running app) via **claude.ai with the GitHub connector** — no terminal,
  no Claude Code needed on their end. Connect once at claude.ai → Settings →
  Connectors → GitHub, then ask things like "show me what changed on dev"
  or "diff dev against main" in a normal conversation. This is a read/review
  channel only — it does not write code or deploy anything; that stays with
  whoever (or whichever Claude Code session) is driving the actual release.
- Wait for an explicit go-ahead ("looks good", "ship it", "approved" — an
  actual confirmation) before touching prod. Silence, or the CEO being busy,
  is not approval.
- If the CEO reports something wrong, fix it, redeploy to dev, and ask again
  — don't route around a "not yet" by going to prod anyway.

## 3. Ship to prod only after sign-off

- Merge `dev` into `main`.
- Build and push images, deploy to the **prod** environment
  (`comitai.app` / `api.comitai.app`), following the same
  [infra/terraform/README.md](../../infra/terraform/README.md) steps but
  against the `prod` Terraform workspace / prod EC2 instance.
- Never apply Terraform against the `prod` workspace, and never SSH into the
  prod instance to run `deploy.sh`, without having completed step 2 first.

## Why this exists

Comitai Dialer's prod environment (`comitai.app`) is customer-facing.
Untested or unreviewed changes going straight to prod risk breaking a live
product with no safety net — dev exists specifically to catch that first,
and the CEO's review is the second, independent check before anything
customer-facing changes.
