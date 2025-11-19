Planned items
-------------
The roadmap items below reflect core capabilities and long-term goals for Guardon. They are listed as roadmap entries without a timeline — prioritization will be driven by user demand, security needs, and contributor availability.

## 🤖 AI-Powered Security (Next Generation)

- **AI Security Explainer**
  - Provide intelligent, context-aware explanations for security violations using LLM-generated content. Include risk assessment, attack scenarios, real-world examples, and compliance mapping with clear opt-in privacy controls.

- **Smart Fix Generator**  
  - Generate context-aware security fixes that analyze YAML content, learn organizational patterns, and provide multiple remediation options with confidence scores and detailed explanations.

- **Natural Language Rule Creator**
  - Allow users to create custom security rules using natural language descriptions. AI translates requirements like "flag containers mounting sensitive host paths" into proper rule definitions.

- **Vulnerability Prediction Engine**
  - Implement machine learning to predict security issues before they become violations by analyzing configuration patterns, generating risk scores, and providing early warnings.

- **Security Learning Dashboard**
  - AI-powered analytics showing team security maturity, common mistakes, improvement trends, and personalized learning recommendations with industry benchmarking.

## 🛠️ Core Platform Features

- Telemetry (Opt-in)
  - Aggregate anonymous, opt-in statistics such as "top 5 violated rules" to help prioritize rule improvements and understand common misconfigurations.

- OPA / Rego Integration Support
  - Provide import and interpretation support for Gatekeeper/OPA Rego and Kyverno policies, enabling direct use of existing policy sets.

- Rule Severity & Scoring
  - Compute a compliance score for YAML (0–100) and attach severity-weighted scoring to rule sets for quick risk assessments.

- CIS Benchmark Checks
  - Map and offer canned rule packs that correspond to CIS Kubernetes Benchmark controls to support compliance workflows.

- VS Code Bridge
  - Package the validator as an NPM module and/or provide a VS Code extension that mirrors the same validation logic used in the browser popup.

- Pluggability
  - Define and support YAML rule packs compatible with Kyverno/OPA formats so teams can share packs and import them easily.

- Extension SDK
  - Provide a small JS API that lets other extension developers register new guardrails programmatically (plugin-style API), enabling ecosystem extensions.

- Open Data Schema
  - Publish an open JSON schema for guardrail rule definitions under a permissive license (CNCF-compatible) to encourage tooling and integrations.

Notes
-----
- Items above are intentionally phrased as product/engineering goals rather than timed milestones. If you'd like, we can convert individual items into tracked GitHub issues or project board cards and add estimated effort or priority markers.

Links
-----
- CONTRIBUTING.md
- RELEASE.md
- README.md
- Advanced import/conversion (Backlog)
  - Broader Kyverno support and conversion coverage, including conditional logic and complex patterns, or provide guidance for manual conversions.

- Enterprise & scale (Backlog)
  - Features such as organization-managed rule-sets, policy sync, or optional integration with a private policy registry (opt-in, requires auth design).

- Community & governance (Planned)
  - Grow maintainers, formalize release cadence, and continue to document governance and contribution paths.

Milestones & release cadence
----------------------------
- Milestone naming: use semantic versioning (vMAJOR.MINOR.PATCH). Attach ZIP artifacts to each GitHub Release.
- Suggested cadence: small patch releases as needed; aim for minor releases every 1–3 months while active.

Prioritization signals
----------------------
- User demand (issues, PRs, community requests)
- Security & correctness fixes (high priority)
- Ease-of-use and developer UX improvements

How to contribute / influence this roadmap
-----------------------------------------
- Open issues and label them `roadmap` or `priority`.
- Join Discussions to propose or vote on large items.
- Send PRs that implement small, focused improvements (tests + docs appreciated).

Ownership
---------
- Maintainers: see `MAINTAINERS.md` for current owners and contact points. Major decisions should be discussed in Issues or Discussions before implementation.

Links
-----
- CONTRIBUTING.md
- RELEASE.md
- README.md
