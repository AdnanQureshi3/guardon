# 🛡️ Guardon — Catch Kubernetes Security Issues Before They Hit Production

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue?logo=google-chrome&logoColor=white)](https://chrome.google.com/webstore)
[![npm test](https://github.com/guardon-dev/guardon/actions/workflows/ci.yml/badge.svg)](https://github.com/guardon-dev/guardon/actions)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

> **Spot Kubernetes security misconfigurations instantly while reviewing code on GitHub/GitLab. No CI setup required.**

![Guardon product banner](./assets/product-banner.svg)

## 🚀 Quick Start (30 seconds)

1. **[Install from Chrome Web Store →](https://chrome.google.com/webstore)**
2. **Open any Kubernetes YAML on GitHub/GitLab**
3. **Click the Guardon icon** — violations appear instantly with suggested fixes

📺 **[2-minute demo video →](https://youtu.be/b-kzvAfV5r8)**

## Trailor
1. **<img width="1512" height="720" alt="Guardon-policy-Manager" src="https://github.com/user-attachments/assets/289ba080-9e8d-4364-ad19-320403ce68d9" />
2. **<img width="1672" height="782" alt="report-1" src="https://github.com/user-attachments/assets/3095a086-b0de-4d5e-9382-3ff747b5be02" />
3. **<img width="487" height="718" alt="report-2" src="https://github.com/user-attachments/assets/476ae101-be6d-4134-a534-333f03d11850" />



## ✨ Why Developers Love Guardon

- **🔍 Instant feedback** — No waiting for CI pipelines or security scans
- **🎯 Context-aware** — Works directly in your GitHub/GitLab workflow  
- **⚡ Zero setup** — Browser extension, no infrastructure changes
- **🛠️ Actionable fixes** — Copy-paste ready YAML patches
- **🔧 Fully customizable** — Import your own rules or Kyverno policies

## 🎯 Common Issues Guardon Catches

```yaml
# ❌ Privileged containers
securityContext:
  privileged: true  # Guardon flags this

# ❌ Missing resource limits  
containers:
- name: app
  image: nginx  # Guardon suggests adding limits

# ❌ Latest tags in production
containers:
- name: app
  image: nginx:latest  # Guardon suggests specific version
```

**💡 Pro tip:** Guardon shows you exactly what to fix and provides copy-paste ready solutions.

## 👥 Who Uses Guardon

- **Platform Engineers** — Catch misconfigurations during code review
- **Security Teams** — Enforce governance policies without blocking developers  
- **DevOps Engineers** — Prevent production incidents from bad YAML
- **Kubernetes Newcomers** — Learn security best practices as you code

> *"Guardon caught a privileged container in our deployment that would have been a security incident. Saved us hours of debugging!"* — Platform Engineering Team

## 🛠️ Features That Save Time

| Feature | Benefit |
|---------|---------|
| **Multi-document YAML parsing** | Handles complex manifests with multiple resources |
| **Kyverno policy import** | Reuse your existing governance policies |  
| **Smart fix suggestions** | Get patches you can copy-paste directly |
| **Custom rule engine** | Add your organization's specific requirements |
| **Dark mode support** | Easy on the eyes during late-night deployments |
| **Offline-first** | No network calls, works anywhere |

## 🔧 Development Setup (2 minutes)

**For Contributors & Custom Rules:**

```bash
# 1. Clone and setup
git clone https://github.com/guardon-dev/guardon.git
cd guardon
npm install

# 2. Load into Chrome
# Open chrome://extensions → Enable Developer mode → Load unpacked (select this folder)

# 3. Test your changes
npm test
```

**Requirements:** Node.js 16+ (for tests), any Chromium-based browser

## 💡 How It Works

**Simple workflow:**
1. **Browse** Kubernetes YAML on GitHub/GitLab
2. **Click** the Guardon extension icon  
3. **Review** security issues with explanations
4. **Copy** suggested fixes and apply them

**Advanced usage:**
- **Paste YAML directly** for ad-hoc validation
- **Import Kyverno policies** from your governance tooling
- **Create custom rules** for your organization's standards  
- **Batch validate** multiple YAML documents

### Popup Actions
- 🔧 **Preview patch** — See exactly what the fix looks like
- 📋 **Copy snippet** — Grab just the fixed value 
- ℹ️ **Explain** — Understand why this matters (with CIS/NIST references)

---

## 📚 Technical Documentation

<details>
<summary><strong>🔧 Custom Rules & Configuration</strong></summary>

### Rule Schema

- Rules are stored in extension storage and editable via the Options page (`src/options/options.html`).
- Rule schema (important fields):

  - `id`: unique rule identifier
  - `description`: human description
  - `kind`: optional comma-separated kinds to scope the rule
  - `match`: dot/array path to inspect (supports `[*]` for arrays)
  - `pattern`: a JavaScript RegExp string to evaluate against the target value
  - `required`: boolean — mark field as required
  - `severity`: `info` | `warning` | `error`
  - `fix`: optional JSON describing a suggested fix (action/value/hint)
  - `explain`: optional object { rationale: string, refs: string[] }

### Options Page Features
- Add/Edit/Delete rules
- Import from file or URL (background fetch fallback)
- Kyverno policy detection + preview of converted rules
- Import panel buttons: "Paste from clipboard" and "Cancel" (convenience and clear/close the import UI)
- Quick "Suggest resource fix" helper to populate the Fix JSON textarea with a sensible requests/limits suggestion for resource-related rules

</details>

<details>
<summary><strong>📦 Kyverno Policy Import</strong></summary>

- Located at `src/utils/kyvernoImporter.js`.
- Detects Kyverno Policy manifests (apiVersion contains `kyverno.io` and kind Policy/ClusterPolicy).
- Converts simple `validate.pattern` leaves into required checks and pattern-based rules. Also detects common env `name`/`value` entries and converts negative checks (`!value`) into pattern rules with sibling conditions.
- Converted rules are previewed in the Options page; you can import converted rules or store raw Kyverno policies for audit.

**Limitations:** the importer is heuristic and intentionally conservative — complex policies are not fully converted and are left for manual review.

</details>

<details>
<summary><strong>🏗️ Architecture Overview</strong></summary>

![Guardon architecture diagram (PNG)](./assets/guardon-architecture.png)

**High-level architecture:**
- **Popup UI:** user-triggered validation, YAML paste, and results/suggestions UI.
- **Content script:** message-driven page extractor that returns raw YAML when requested by the popup.
- **Background (service worker):** performs fallback fetches (raw content, import-from-URL), accesses storage.
- **Rules engine & utilities:** multi-doc YAML parsing, rule evaluation (kind filtering, wildcard per-element checks), suggestion generation and preview helpers, and Kyverno importer.

This diagram shows the main data flow: the popup requests YAML from the content script (or falls back to background fetch), sends YAML to the rules engine for validation, and displays violations and optional fix suggestions to the user.

</details>

<details>
<summary><strong>🧪 Development & Testing</strong></summary>

**Run unit tests and collect coverage:**

```bash
npm install
npm test
```

- Tests use Jest and target utility modules under `src/utils`. Coverage reports are stored in `coverage/`.

</details>

<details>
<summary><strong>📦 Building Distribution</strong></summary>

We provide small scripts that create a trimmed ZIP containing only the runtime files needed by the extension (manifest, popup/options, background, content script, runtime libs). Use these to produce the ZIP you upload to the Chrome Web Store.

**PowerShell (Windows):**
```powershell
.\scripts\build-dist.ps1
# or specify a custom filename
.\scripts\build-dist.ps1 -OutFile guardon-latest.zip
```

**Bash (Linux/macOS/WSL):**
```bash
chmod +x ./scripts/build-dist.sh
./scripts/build-dist.sh
# or with explicit output name
./scripts/build-dist.sh guardon-latest.zip
```

</details>

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Validation engine not available" | Open DevTools for popup and check console for import errors |
| Suggestions not appearing | Verify rules in Options page include `fix` and `explain` metadata |
| `npm install` fails | Check Node version (`node -v`) and share npm error logs for help |

---

## 📖 Additional Resources

- **[Governance & Maintainers](GOVERNANCE.md)** — Project governance and decision-making process
- **[Contributing Guidelines](CONTRIBUTING.md)** — Detailed contribution instructions and DCO process  
- **[Roadmap](ROADMAP.md)** — Planned features, milestones, and time horizons
- **[Security Policy](SECURITY.md)** — Responsible disclosure and security practices

## 📄 License

**Apache-2.0** — See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for the Kubernetes community**

[⭐ Star this project](https://github.com/guardon-dev/guardon) • [🐛 Report a bug](https://github.com/guardon-dev/guardon/issues) • [💡 Request a feature](https://github.com/guardon-dev/guardon/discussions)

</div>
