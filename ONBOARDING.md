# Suggested First Week

A loose guide for getting comfortable with the codebase. Nothing here is mandatory — treat it as a menu of things worth doing, not a schedule to follow. Some of it will take longer than suggested, some less. That's fine.

The full system reference doc is in [README.md](README.md) — section numbers referenced below point there.

---

### Day 1 — Get it running and see it work

The only real goal today is to have both repos running locally and to watch the pipeline produce a real site for a real client.

- Get the backend running: `uvicorn app.api.routes:app --reload --port 8000`
- Get the frontend running: `npm run dev`
- Open `http://localhost:8000/docs` and browse the available endpoints — you don't need to understand them all, just get a feel for the surface area
- Run the free checks to make sure things are healthy:
  ```bash
  python3 -m pipeline_tests check-defaults
  python3 -m pipeline_tests check-prompts
  ```
- Pick any dental practice website and run the full demo workflow in the UI, **step by step** (not Yolo mode). Before clicking through each step, read the JSON output. Don't worry about understanding all of it — just notice what changes at each stage.

---

### Day 2 — Read the data model

The most important file in the whole system is `stinson-sitemap.json`. Everything — what pages exist, what sections are on each page, what the AI looks for, what images get preserved — is controlled from there.

- Read `app/schemas/_site_configs/sitemap/stinson-sitemap.json` fully
- Read a handful of section definitions in `app/schemas/_site_configs/static_models/stinson/stinson.py` — notice how the field descriptions are actually instructions to the LLM
- Run a smoke test and read the full output:
  ```bash
  python3 -m pipeline_tests smoke-page Home --full
  ```
- Pick any field in the output and try to find where it came from — trace it back through the Pydantic model, the sitemap query, and what the scraper would have found. You won't always be able to follow it all the way, and that's okay.

**If you want to go deeper:** find a `preserve_image: true` section in the sitemap and think about why that section shouldn't have its image replaced by the AI.

---

### Day 3 — Poke the frontend

The frontend workflow is driven by a pattern called `STEP_DATA_CONTRACT`. It's worth understanding even if you're mostly working on the backend.

- Read `src/constants/stepInputMappings.ts` — this defines what every step reads and writes
- Open one step runner (e.g. `runAllocateContent.ts`) and read it — notice how it gets its inputs from `generatedData`, calls the backend, and writes its output back
- In the UI, run the workflow to "Generate Content", then use the JSON editor to manually change a field value. Save it and continue. Does the change survive?

**If you want to go deeper:** read `src/hooks/useWorkflowStepRunner.ts` (the orchestrator) and find where step runners are registered — there's a map of step names to runner functions.

---

### Day 4 — Change what the AI writes

This is the most hands-on day and probably the most useful. The goal is to make a deliberate change to the AI's output and verify it worked.

The system has three layers that all influence what the LLM produces for any given field:
1. The Pydantic field description in `stinson.py`
2. The query string in `stinson-sitemap.json`
3. The system prompt in `prompt_builder.py`

Pick something about yesterday's generated output that could be better — anything concrete. Then:

1. Find the relevant Pydantic field and make its description more specific
2. Run a smoke test before and after:
   ```bash
   python3 -m pipeline_tests smoke-page Home --section hero
   ```
3. If it didn't change, don't worry — figuring out why is part of the learning. Is the scraper not finding the right source content? Is the instruction clear enough?

You don't have to touch all three layers today. Even changing one and seeing an effect in the output is a win.

---

### Day 5 — See how deployment works

- Read `.github/workflows/lightsail-deploy.yml` in the backend repo — the key part is the `jq` block that builds `containers.json`, which is where GitHub Secrets become environment variables in the running container
- Go to the [Lightsail dashboard](https://lightsail.aws.amazon.com/ls/webapp/us-west-2/container-services/automation-tools/deployments) and look at the current deployment — find the logs
- Trigger a manual deployment from the GitHub Actions UI (Actions tab → "Deploy to Lightsail" → Run workflow) just to see it happen
- Run the full workflow one more time in **Yolo mode** — compare the experience to Day 1's step-by-step run

**If you want to go deeper:** follow the checklist in Section 15 of the README to add a minimal no-op workflow step. You don't need it to do anything useful — just getting it to appear in the UI and complete successfully teaches you the full change surface.

---

### Things that will make more sense over time

Some parts of this codebase are only really understood by working with them repeatedly. Don't stress if these don't click in week one:

- Why `getStepEditData` and `getStepInputData` are different (Section 7 of the README explains it, but it only really clicks after you've accidentally mixed them up)
- The full middleware ordering and why it matters
- When to tweak a vector store query vs. a Pydantic description vs. the system prompt
- The difference between the frontend's CodeBuild/S3 deployment path and the backend's Lightsail path

Ask questions. The codebase is large but not that complicated once the pipeline clicks.
