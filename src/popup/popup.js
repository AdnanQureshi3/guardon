document.addEventListener("DOMContentLoaded", async () => {
  const summary = document.getElementById("summary");
  const resultsTable = document.getElementById("resultsTable");
  const resultsBody = document.getElementById("resultsBody");
  const noYaml = document.getElementById("noYaml");
  const copyBtn = document.getElementById("copyReport");
  const statusBadge = document.getElementById("statusBadge");
  const bootStatus = document.getElementById("bootStatus");
  const suggestionModal = document.getElementById("suggestionModal");
  const suggestionPre = document.getElementById("suggestionPre");
  const suggestionHint = document.getElementById("suggestionHint");
  const copyPatchBtn = document.getElementById("copyPatchBtn");
  const downloadPatchBtn = document.getElementById("downloadPatchBtn");
  const closeSuggestionBtn = document.getElementById("closeSuggestionBtn");
  const explainModal = document.getElementById("explainModal");
  const explainTitle = document.getElementById("explainTitle");
  const explainRationale = document.getElementById("explainRationale");
  const explainRefs = document.getElementById("explainRefs");
  const closeExplainBtn = document.getElementById("closeExplainBtn");

  // Dynamically import the rules engine so we can show an error in the UI
  // if it fails to load (instead of a silent module load error).
  let validateYaml = null;
  try {
    const m = await import("../utils/rulesEngine.js");
    validateYaml = m.validateYaml;
    // preview helper for suggestions
    var previewPatchedYaml = m.previewPatchedYaml;
    if (bootStatus) {bootStatus.textContent = "Ready";}
  } catch (err) {
    // Failed to load rules engine in popup
    if (bootStatus) {bootStatus.textContent = "Error loading validation engine — see console for details.";}
    // Keep running so manual paste may still work; but mark validation unavailable.
  }
  // Try to import cluster schema validator (optional)
  let validateSchemaYaml = null;
  try {
    const csMod = await import("../utils/clusterSchema.js");
    validateSchemaYaml = csMod.validateYamlAgainstClusterSchemas;
  } catch (e) {
    // clusterSchema validator not available in popup
  }
  const validateAvailable = typeof validateYaml === "function";
  const previewAvailable = typeof previewPatchedYaml === "function";

  function showValidationUnavailable(note) {
    if (bootStatus) {bootStatus.textContent = note || "Validation engine not available.";}
    const summaryEl = document.getElementById("summary");
    if (summaryEl) {summaryEl.textContent = "Validation unavailable — see console for details.";}
    const statusBadge = document.getElementById("statusBadge");
    if (statusBadge) {
      statusBadge.textContent = "ERROR";
      statusBadge.className = "status error";
      statusBadge.style.display = "inline-block";
    }
  }

  // Theme toggle: read persisted preference and wire the toggle
  const themeToggle = document.getElementById("themeToggle");
  async function loadTheme() {
    try {
      const { popupTheme } = await chrome.storage.local.get("popupTheme");
      const theme = popupTheme || "light";
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.body && document.body.classList.add("dark");
      }
      if (themeToggle) {themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";}
    } catch (e) {
      // fallback: do nothing
    }
  }
  loadTheme();

  if (themeToggle) {
    themeToggle.addEventListener("click", async () => {
      const isDark = document.documentElement.classList.toggle("dark");
      if (document.body) {document.body.classList.toggle("dark", isDark);}
      try {
        await chrome.storage.local.set({ popupTheme: isDark ? "dark" : "light" });
      } catch (e) {
        // ignore
      }
      themeToggle.textContent = isDark ? "☀️" : "🌙";
    });
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Always show manual paste option for non-GitHub/GitLab pages
  const pageUrl = new URL(tab.url);
  const isGithub = pageUrl.host === "github.com" || pageUrl.host === "www.github.com";
  const isGitlab = pageUrl.host === "gitlab.com" || pageUrl.host === "www.gitlab.com";

  let yamlText = null;
  let fetchedFromGithub = false;
  let fetchedUrl = null;

  if (!isGithub && !isGitlab) {
    // Always show manual paste UI for non-GitHub/GitLab
    showManualPasteUI();
    return;
  }

  // Try to get YAML text/selection by messaging the content script first
  try {
    yamlText = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { type: "GET_YAML" }, (resp) => {
        if (chrome.runtime.lastError) {return resolve(null);}
        if (!resp) {return resolve(null);}
        if (typeof resp === "string") {return resolve(resp);}
        return resolve(resp.yamlText || null);
      });
    });
  } catch (err) {
    // sendMessage GET_YAML failed
    yamlText = null;
  }

  // If no YAML found, show manual paste UI on GitHub/GitLab
  if (!yamlText) {
    showManualPasteUI();
    return;
  }

  function showManualPasteUI() {
    noYaml.style.display = "block";
    statusBadge.textContent = "NO YAML";
    statusBadge.className = "status info";
    statusBadge.style.display = "inline-block";
    statusBadge.classList.add("pulse");
    const manualDiv = document.getElementById("manual");
    const manualArea = document.getElementById("manualYaml");
    if (manualDiv) {manualDiv.style.display = "block";}
    if (manualArea) {manualArea.style.display = "block";}
    const fetchedNotice = document.getElementById("fetchedNotice");
    if (fetchedNotice) {fetchedNotice.style.display = "none";}
    const validateManualBtn = document.getElementById("validateManual");
    if (validateManualBtn) {
      validateManualBtn.onclick = async () => {
        if (!validateAvailable) {
          showValidationUnavailable("Validation engine failed to load; cannot validate.");
          return;
        }
        const content = (document.getElementById("manualYaml") || { value: "" }).value;
        if (!content) {return;}
        try {
          // Run Guardon rules
          const { customRules } = await chrome.storage.local.get("customRules");
          const rules = customRules || [];
          let results = await validateYaml(content, rules);
          // Also run schema-based validation and merge results
          let schemaResults = [];
          let schemaDiagnostic = "";
          let schemaErrorSection = "";
          if (typeof validateSchemaYaml === "function") {
            const csData = await new Promise((resolve) => chrome.storage.local.get("clusterSchema", (d) => resolve(d && d.clusterSchema ? d.clusterSchema : { openapis: [], crds: [] })));
            schemaResults = await validateSchemaYaml(content, csData);
            if (Array.isArray(schemaResults) && schemaResults.length) {
              const existingKeys = new Set(results.map(r => `${r.ruleId}||${r.path}||${r.message}`));
              for (const sr of schemaResults) {
                const key = `${sr.ruleId}||${sr.path}||${sr.message}`;
                if (!existingKeys.has(key)) {
                  results.push(sr);
                  existingKeys.add(key);
                }
              }
            }
            if (schemaResults.length === 0) {
              if (csData && csData.openapis && Object.keys(csData.openapis).length > 0) {
                schemaDiagnostic = "Schema present, but no matching schema found for this resource. Check apiVersion/kind and schema keys.";
              } else {
                schemaDiagnostic = "No schema present for this resource.";
              }
            } else {
              const errorCount = schemaResults.filter(r => r.severity === "error").length;
              schemaDiagnostic = `Schema-based validation: ${schemaResults.length} issue(s), ${errorCount} error(s).`;
              schemaDiagnostic += "\n" + schemaResults.slice(0,3).map(r => `${r.path}: ${r.message}`).join("\n");
              schemaErrorSection = schemaResults.filter(r => r.severity === "error").map(r => `<li><b>${r.path}</b>: ${r.message}</li>`).join("");
            }
          } else {
            schemaDiagnostic = "Schema validator not available.";
          }
          // Show diagnostic in UI
          let diagEl = document.getElementById("schemaDiagnostic");
          if (!diagEl) {
            diagEl = document.createElement("div");
            diagEl.id = "schemaDiagnostic";
            diagEl.style.cssText = "margin:8px 0;padding:8px;border:1px solid #eee;background:#f9f9f9;font-size:12px;white-space:pre-wrap;";
            summary.parentNode.insertBefore(diagEl, summary.nextSibling);
          }
          diagEl.textContent = schemaDiagnostic;
          let errEl = document.getElementById("schemaErrorSection");
          if (!errEl) {
            errEl = document.createElement("ul");
            errEl.id = "schemaErrorSection";
            errEl.style.cssText = "margin:8px 0;padding:8px;border:1px solid #fbb;background:#fff0f0;font-size:13px;";
            diagEl.parentNode.insertBefore(errEl, diagEl.nextSibling);
          }
          errEl.innerHTML = schemaErrorSection;
          renderResults(results);
        } catch (err) {
          // Manual validation failed
          showValidationUnavailable("Validation failed — see console for details.");
        }
      };
    }
  }
  // ...existing code for GitHub/GitLab YAML extraction and validation...

  // If we fetched the YAML from GitHub, show a notice and hide manual controls
  if (fetchedFromGithub) {
    const fetchedNotice = document.getElementById("fetchedNotice");
    if (fetchedNotice) {
      fetchedNotice.textContent = `Validated file fetched from GitHub: ${fetchedUrl}`;
      fetchedNotice.style.display = "block";
    }
  // hide the manual block entirely when we fetched the YAML
  const manualDiv = document.getElementById("manual");
  if (manualDiv) {
    manualDiv.style.display = "none";
    const manualArea = document.getElementById("manualYaml");
    if (manualArea) {manualArea.style.display = "none";}
  }
  }

  const { customRules } = await chrome.storage.local.get("customRules");
  const rules = customRules || [];

  if (!rules.length) {
    summary.textContent = "No Guardon rules configured. Add them in Options.";
    statusBadge.textContent = "NO RULES";
    statusBadge.className = "status info";
    statusBadge.style.display = "inline-block";
    return;
  }

  if (!validateAvailable) {
    showValidationUnavailable("Validation engine failed to load; cannot validate YAML.");
    return;
  }
  let results = [];
  try {
    results = await validateYaml(yamlText, rules);
    // Also run schema-based validation (CRD/OpenAPI) if available and merge results
    let schemaResults = [];
    let schemaDiagnostic = "";
    let schemaErrorSection = "";
    try {
      if (typeof validateSchemaYaml === "function") {
        const csData = await new Promise((resolve) => chrome.storage.local.get("clusterSchema", (d) => resolve(d && d.clusterSchema ? d.clusterSchema : { openapis: [], crds: [] })));
        schemaResults = await validateSchemaYaml(yamlText, csData);
        if (Array.isArray(schemaResults) && schemaResults.length) {
          // Merge schemaResults; avoid duplicating identical messages
          const existingKeys = new Set(results.map(r => `${r.ruleId}||${r.path}||${r.message}`));
          for (const sr of schemaResults) {
            const key = `${sr.ruleId}||${sr.path}||${sr.message}`;
            if (!existingKeys.has(key)) {
              results.push(sr);
              existingKeys.add(key);
            }
          }
        }
        // Diagnostic: show what schema was matched and summary of results
        if (schemaResults.length === 0) {
          if (csData && csData.openapis && Object.keys(csData.openapis).length > 0) {
            schemaDiagnostic = "Schema present, but no matching schema found for this resource. Check apiVersion/kind and schema keys.";
          } else {
            schemaDiagnostic = "No schema present for this resource.";
          }
        } else {
          const errorCount = schemaResults.filter(r => r.severity === "error").length;
          schemaDiagnostic = `Schema-based validation: ${schemaResults.length} issue(s), ${errorCount} error(s).`;
          // Show first few errors
          schemaDiagnostic += "\n" + schemaResults.slice(0,3).map(r => `${r.path}: ${r.message}`).join("\n");
          // Show all schema errors in a dedicated section
          schemaErrorSection = schemaResults.filter(r => r.severity === "error").map(r => `<li><b>${r.path}</b>: ${r.message}</li>`).join("");
        }
      } else {
        schemaDiagnostic = "Schema validator not available.";
      }
    } catch (e) {
      schemaDiagnostic = "Schema validation error: " + (e && e.message);
      // Schema validation in popup failed
    }
    // Show diagnostic in UI
    let diagEl = document.getElementById("schemaDiagnostic");
    if (!diagEl) {
      diagEl = document.createElement("div");
      diagEl.id = "schemaDiagnostic";
      diagEl.style.cssText = "margin:8px 0;padding:8px;border:1px solid #eee;background:#f9f9f9;font-size:12px;white-space:pre-wrap;";
      summary.parentNode.insertBefore(diagEl, summary.nextSibling);
    }
    diagEl.textContent = schemaDiagnostic;
    // Show schema errors in a visible section if any
    let errEl = document.getElementById("schemaErrorSection");
    if (!errEl) {
      errEl = document.createElement("ul");
      errEl.id = "schemaErrorSection";
      errEl.style.cssText = "margin:8px 0;padding:8px;border:1px solid #fbb;background:#fff0f0;font-size:13px;";
      diagEl.parentNode.insertBefore(errEl, diagEl.nextSibling);
    }
    errEl.innerHTML = schemaErrorSection;
    // If parser produced a parse-error result, show the sanitized YAML text
    // that was passed to the parser so users can inspect what we validated.
    if (results && results.some(r => r.ruleId === "parse-error")) {
      // [popup] parse-error — sanitized YAML used for validation
      // Create a details block to show the sanitized YAML (if not present)
      let dbg = document.getElementById("debugYamlDetails");
      if (!dbg) {
        dbg = document.createElement("details");
        dbg.id = "debugYamlDetails";
        dbg.style.cssText = "margin-top:8px;padding:8px;border:1px solid #eee;background:#fff;max-height:240px;overflow:auto;font-family:monospace;";
        const summ = document.createElement("summary");
        summ.textContent = "Sanitized YAML used for validation (click to expand)";
        dbg.appendChild(summ);
        const pre = document.createElement("pre");
        pre.id = "debugYamlPre";
        pre.style.cssText = "white-space:pre-wrap;word-break:break-word;margin:8px 0;font-size:12px;";
        dbg.appendChild(pre);
        // add a small copy button
        const copyBtnDbg = document.createElement("button");
        copyBtnDbg.textContent = "Copy sanitized YAML";
        copyBtnDbg.style.cssText = "margin-top:6px;padding:6px 8px;";
        copyBtnDbg.addEventListener("click", async () => {
          try { await navigator.clipboard.writeText(document.getElementById("debugYamlPre").textContent || ""); showToast("Sanitized YAML copied"); } catch (e) { showToast("Copy failed", { background: "#b91c1c" }); }
        });
        dbg.appendChild(copyBtnDbg);
        const container = document.getElementById("summary") || document.body;
        container.parentNode.insertBefore(dbg, container.nextSibling);
      }
      const preEl = document.getElementById("debugYamlPre");
      if (preEl) {preEl.textContent = yamlText || "";}
    }
  } catch (err) {
    // Validation engine threw an error
    showValidationUnavailable("Validation failed — see console for details.");
    return;
  }

  if (results.length === 0) {
  summary.innerHTML = "✅ No violations found — your YAML meets Guardon checks!";
    statusBadge.textContent = "CLEAN";
    statusBadge.className = "status clean";
    statusBadge.style.display = "inline-block";
    // Hide manual input when we have a validated YAML (no need to prompt paste)
    const manualDiv = document.getElementById("manual");
    if (manualDiv) {manualDiv.style.display = "none";}
    return;
  }

  // Count by severity
  const errorCount = results.filter(r => r.severity === "error").length;
  const warningCount = results.filter(r => r.severity === "warning").length;
  const infoCount = results.filter(r => r.severity === "info").length;

  let badgeClass = "warning";
  let badgeText = "WARNINGS";
  if (errorCount > 0) {
    badgeClass = "error";
    badgeText = "ERRORS";
  }

  statusBadge.textContent = badgeText;
  statusBadge.className = `status ${badgeClass}`;
  statusBadge.style.display = "inline-block";

  resultsTable.style.display = "table";
  copyBtn.style.display = "inline-block";

  summary.innerHTML = `
    Found <b>${results.length}</b> violation(s):
    ${errorCount ? `❌ ${errorCount} error(s)` : ""}
    ${warningCount ? ` ⚠️ ${warningCount} warning(s)` : ""}
    ${infoCount ? ` ℹ️ ${infoCount} info(s)` : ""}
  `;

  resultsBody.innerHTML = "";
  results.forEach(r => {
    const tr = document.createElement("tr");
    const icon = r.severity === "error" ? "❌" : (r.severity === "warning" ? "⚠️" : "ℹ️");
    const tdSeverity = document.createElement("td");
    tdSeverity.className = r.severity;
    tdSeverity.innerHTML = `<span class="severity-icon">${icon}</span>${r.severity.toUpperCase()}`;

    const tdRule = document.createElement("td"); tdRule.textContent = r.ruleId;
    const tdMessage = document.createElement("td"); tdMessage.textContent = r.message;
  const tdActions = document.createElement("td");
  tdActions.className = "actions-cell";

    if (r.suggestion) {
  const previewBtn = document.createElement("button");
  previewBtn.type = "button";
  previewBtn.className = "action-btn icon-btn preview";
  previewBtn.title = "Preview patch";
  previewBtn.setAttribute("aria-label", "Preview patch");
  previewBtn.innerHTML = "🔧";
      previewBtn.addEventListener("click", async () => {
        if (!previewAvailable) {
          alert("Patch preview not available");
          return;
        }
        try {
          const patched = await previewPatchedYaml(yamlText, r.docIndex, r.suggestion, { fullStream: true });
          suggestionHint.textContent = r.suggestion.hint || (r.message || "Suggested fix");
          suggestionPre.textContent = patched || "Failed to generate preview";
          suggestionModal.style.display = "flex";
        } catch (e) {
          // Preview generation failed
          alert("Failed to generate patch preview");
        }
      });
      tdActions.appendChild(previewBtn);

  const copySnippetBtn = document.createElement("button");
  copySnippetBtn.type = "button";
  copySnippetBtn.className = "action-btn icon-btn copy";
  copySnippetBtn.title = "Copy snippet";
  copySnippetBtn.setAttribute("aria-label", "Copy snippet");
  copySnippetBtn.innerHTML = "📋";
      copySnippetBtn.addEventListener("click", async () => {
        try {
          const j = globalThis.jsyaml;
          let snippetYaml = "";
          if (r.suggestion.snippetYaml) {snippetYaml = r.suggestion.snippetYaml;}
          else if (r.suggestion.snippetObj && j) {snippetYaml = j.dump(r.suggestion.snippetObj, { noRefs: true });}
          else {snippetYaml = String(r.suggestion.snippetObj || r.suggestion.hint || "");}
          await navigator.clipboard.writeText(snippetYaml);
          showToast("Snippet copied to clipboard");
        } catch (e) { showToast("Failed to copy snippet", { background: "#b91c1c" }); }
      });
      tdActions.appendChild(copySnippetBtn);
    }

    // Try to find the original rule metadata so we can show an explanation modal
    try {
      const matched = (rules || []).find(rr => String(rr.id) === String(r.ruleId));
      if (matched && matched.explain && (matched.explain.rationale || (Array.isArray(matched.explain.refs) && matched.explain.refs.length))) {
  const explainBtn = document.createElement("button");
  explainBtn.type = "button";
  explainBtn.className = "action-btn icon-btn explain";
  explainBtn.title = "Explain policy (rationale & references)";
  explainBtn.setAttribute("aria-label", "Explain policy");
  explainBtn.innerHTML = "ℹ️";
        explainBtn.addEventListener("click", () => {
          explainTitle.textContent = matched.description ? `${matched.id} — ${matched.description}` : matched.id;
          explainRationale.textContent = matched.explain.rationale || "";
          // render refs as clickable links
          explainRefs.innerHTML = "";
          if (Array.isArray(matched.explain.refs) && matched.explain.refs.length) {
            const ul = document.createElement("ul");
            matched.explain.refs.forEach(u => {
              try {
                const li = document.createElement("li");
                const a = document.createElement("a");
                a.href = u;
                a.textContent = u;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                li.appendChild(a);
                ul.appendChild(li);
              } catch (e) {}
            });
            explainRefs.appendChild(ul);
          }
          if (explainModal) {explainModal.style.display = "flex";}
        });
        tdActions.appendChild(explainBtn);
      }
    } catch (e) { /* Explain button wiring failed */ }

    tr.appendChild(tdSeverity);
    tr.appendChild(tdRule);
    tr.appendChild(tdMessage);
    tr.appendChild(tdActions);
    resultsBody.appendChild(tr);
  });

  // Copy Report Button
  copyBtn.onclick = async () => {
    const report = {
      timestamp: new Date().toISOString(),
      total: results.length,
      errors: errorCount,
      warnings: warningCount,
      infos: infoCount,
      results,
    };
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    copyBtn.textContent = "✅ Copied!";
    setTimeout(() => (copyBtn.textContent = "📋 Copy Report"), 1500);
  };
  // Suggestion modal wiring
  if (closeSuggestionBtn) {closeSuggestionBtn.addEventListener("click", () => { if (suggestionModal) {suggestionModal.style.display = "none";} });}
  if (copyPatchBtn) {copyPatchBtn.addEventListener("click", async () => {
    try {
      const text = suggestionPre.textContent || "";
      await navigator.clipboard.writeText(text);
      showToast("Patched YAML copied");
    } catch (e) { showToast("Copy failed", { background: "#b91c1c" }); }
  });}
  if (downloadPatchBtn) {downloadPatchBtn.addEventListener("click", () => {
    try {
      const text = suggestionPre.textContent || "";
      const blob = new Blob([text], { type: "text/yaml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "patched.yaml"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      showToast("Downloaded patched YAML");
    } catch (e) { showToast("Download failed", { background: "#b91c1c" }); }
  });}
  // Explain modal wiring
  if (closeExplainBtn) {closeExplainBtn.addEventListener("click", () => { if (explainModal) {explainModal.style.display = "none";} });}
  
  // renderResults helper used by manual validation
  function renderResults(results) {
    if (!results || results.length === 0) {
    summary.innerHTML = "✅ No violations found — your YAML meets Guardon checks!";
      statusBadge.textContent = "CLEAN";
      statusBadge.className = "status clean";
      statusBadge.style.display = "inline-block";
      resultsTable.style.display = "none";
      copyBtn.style.display = "none";
      return;
    }
    const errorCount = results.filter(r => r.severity === "error").length;
    const warningCount = results.filter(r => r.severity === "warning").length;
    const infoCount = results.filter(r => r.severity === "info").length;
    let badgeClass = "warning";
    let badgeText = "WARNINGS";
    if (errorCount > 0) { badgeClass = "error"; badgeText = "ERRORS"; }
    statusBadge.textContent = badgeText;
    statusBadge.className = `status ${badgeClass}`;
    statusBadge.style.display = "inline-block";
    resultsTable.style.display = "table";
    copyBtn.style.display = "inline-block";
    summary.innerHTML = `Found <b>${results.length}</b> violation(s): ${errorCount ? `❌ ${errorCount} error(s)` : ""} ${warningCount ? ` ⚠️ ${warningCount} warning(s)` : ""} ${infoCount ? ` ℹ️ ${infoCount} info(s)` : ""}`;
    resultsBody.innerHTML = "";
    results.forEach(r => {
        const tr = document.createElement("tr");
        const icon = r.severity === "error" ? "❌" : (r.severity === "warning" ? "⚠️" : "ℹ️");
        const tdSeverity = document.createElement("td");
        tdSeverity.className = r.severity;
        tdSeverity.innerHTML = `<span class="severity-icon">${icon}</span>${r.severity.toUpperCase()}`;

        const tdRule = document.createElement("td"); tdRule.textContent = r.ruleId;
        const tdMessage = document.createElement("td"); tdMessage.textContent = r.message;
        const tdActions = document.createElement("td");

        if (r.suggestion) {
          const previewBtn = document.createElement("button");
          previewBtn.type = "button";
          previewBtn.textContent = "Preview Patch";
          previewBtn.addEventListener("click", async () => {
            if (!previewAvailable) {
              alert("Patch preview not available");
              return;
            }
            try {
              const patched = await previewPatchedYaml(yamlText, r.docIndex, r.suggestion, { fullStream: true });
              suggestionHint.textContent = r.suggestion.hint || (r.message || "Suggested fix");
              suggestionPre.textContent = patched || "Failed to generate preview";
              suggestionModal.style.display = "flex";
            } catch (e) {
              // Preview generation failed
              alert("Failed to generate patch preview");
            }
          });
          tdActions.appendChild(previewBtn);

          const copySnippetBtn = document.createElement("button");
          copySnippetBtn.type = "button";
          copySnippetBtn.textContent = "Copy Snippet";
          copySnippetBtn.addEventListener("click", async () => {
            try {
              const j = globalThis.jsyaml;
              let snippetYaml = "";
              if (r.suggestion.snippetYaml) {snippetYaml = r.suggestion.snippetYaml;}
              else if (r.suggestion.snippetObj && j) {snippetYaml = j.dump(r.suggestion.snippetObj, { noRefs: true });}
              else {snippetYaml = String(r.suggestion.snippetObj || r.suggestion.hint || "");}
              await navigator.clipboard.writeText(snippetYaml);
              showToast("Snippet copied to clipboard");
            } catch (e) { showToast("Failed to copy snippet", { background: "#b91c1c" }); }
          });
          tdActions.appendChild(copySnippetBtn);
        }

        // Explain button (if rule metadata includes explain)
        try {
          const matched = (rules || []).find(rr => String(rr.id) === String(r.ruleId));
          if (matched && matched.explain && (matched.explain.rationale || (Array.isArray(matched.explain.refs) && matched.explain.refs.length))) {
      const explainBtn = document.createElement("button");
      explainBtn.type = "button";
      explainBtn.className = "action-btn icon-btn explain";
      explainBtn.title = "Explain policy (rationale & references)";
      explainBtn.setAttribute("aria-label", "Explain policy");
      explainBtn.innerHTML = "ℹ️";
            explainBtn.addEventListener("click", () => {
              explainTitle.textContent = matched.description ? `${matched.id} — ${matched.description}` : matched.id;
              explainRationale.textContent = matched.explain.rationale || "";
              explainRefs.innerHTML = "";
              if (Array.isArray(matched.explain.refs) && matched.explain.refs.length) {
                const ul = document.createElement("ul");
                matched.explain.refs.forEach(u => {
                  try {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    a.href = u;
                    a.textContent = u;
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    li.appendChild(a);
                    ul.appendChild(li);
                  } catch (e) {}
                });
                explainRefs.appendChild(ul);
              }
              if (explainModal) {explainModal.style.display = "flex";}
            });
            tdActions.appendChild(explainBtn);
          }
        } catch (e) { /* Explain button wiring failed */ }

        tr.appendChild(tdSeverity);
        tr.appendChild(tdRule);
        tr.appendChild(tdMessage);
        tr.appendChild(tdActions);
        resultsBody.appendChild(tr);
    });
  }
});
