// ─────────────────────────────────────────────────────────────────────────────
// Zaru Loop Dashboard — Review Feedback Widget
// Adds a floating button on every page. On submit, creates a GitHub issue
// tagged with the current page and the reviewer's name.
// Optional: attach a screenshot — uploaded to the repo and linked in the issue.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  // ── Helpers ──────────────────────────────────────────────────────────────

  function cfg() {
    return window.FEEDBACK_CONFIG || {};
  }

  function getPageName() {
    const title = document.title && document.title.trim();
    if (title) return title;
    const parts = window.location.pathname.split("/");
    return parts[parts.length - 1] || "Unknown Page";
  }

  function getPageFile() {
    const parts = window.location.pathname.split("/");
    return parts[parts.length - 1] || window.location.pathname;
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result.split(",")[1]); // strip data URI prefix
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const CSS = `
    #zaru-feedback-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: #1a1a2e;
      color: #fff;
      border: 1.5px solid rgba(255,255,255,0.12);
      border-radius: 999px;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.02em;
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
      transition: background 0.2s, transform 0.15s;
      user-select: none;
    }
    #zaru-feedback-btn:hover {
      background: #2a2a4e;
      transform: translateY(-1px);
    }
    #zaru-feedback-btn svg { flex-shrink: 0; }

    #zaru-feedback-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(3px);
      align-items: center;
      justify-content: center;
    }
    #zaru-feedback-overlay.open { display: flex; }

    #zaru-feedback-modal {
      background: #fff;
      border-radius: 14px;
      width: 100%;
      max-width: 460px;
      margin: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow: hidden;
    }

    #zaru-feedback-modal .fb-header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    #zaru-feedback-modal .fb-header h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #111;
      flex-shrink: 0;
    }
    #zaru-feedback-modal .fb-header .fb-page-tag {
      font-size: 11px;
      color: #666;
      background: #f4f4f6;
      padding: 3px 9px;
      border-radius: 999px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
    }
    #zaru-feedback-modal .fb-close {
      background: none;
      border: none;
      cursor: pointer;
      color: #999;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      transition: color 0.15s;
      flex-shrink: 0;
    }
    #zaru-feedback-modal .fb-close:hover { color: #333; }

    #zaru-feedback-modal .fb-body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    #zaru-feedback-modal label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #555;
      margin-bottom: 5px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    #zaru-feedback-modal label .fb-optional {
      font-weight: 400;
      color: #aaa;
      text-transform: none;
      letter-spacing: 0;
      font-size: 11px;
      margin-left: 4px;
    }

    #zaru-feedback-modal input[type="text"],
    #zaru-feedback-modal textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1.5px solid #e2e2e2;
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 14px;
      font-family: inherit;
      color: #111;
      background: #fafafa;
      transition: border-color 0.2s;
      outline: none;
    }
    #zaru-feedback-modal input[type="text"]:focus,
    #zaru-feedback-modal textarea:focus {
      border-color: #5b6ef5;
      background: #fff;
    }
    #zaru-feedback-modal textarea {
      resize: vertical;
      min-height: 100px;
    }

    /* Screenshot upload area */
    #zaru-fb-screenshot-area {
      border: 1.5px dashed #d0d0d8;
      border-radius: 8px;
      background: #fafafa;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      overflow: hidden;
    }
    #zaru-fb-screenshot-area:hover,
    #zaru-fb-screenshot-area.drag-over {
      border-color: #5b6ef5;
      background: #f0f1ff;
    }
    #zaru-fb-screenshot-area .fb-upload-prompt {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px;
      color: #888;
      font-size: 13px;
    }
    #zaru-fb-screenshot-area .fb-upload-prompt svg { flex-shrink: 0; }
    #zaru-fb-screenshot-area .fb-preview-wrap {
      display: none;
      position: relative;
    }
    #zaru-fb-screenshot-area.has-file .fb-upload-prompt { display: none; }
    #zaru-fb-screenshot-area.has-file .fb-preview-wrap  { display: block; }

    #zaru-fb-screenshot-preview {
      display: block;
      width: 100%;
      max-height: 160px;
      object-fit: cover;
      border-radius: 0;
    }
    #zaru-fb-screenshot-clear {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(0,0,0,0.55);
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      font-size: 14px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #zaru-fb-screenshot-name {
      padding: 6px 10px;
      font-size: 11px;
      color: #666;
      background: #f4f4f6;
      border-top: 1px solid #eee;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #zaru-feedback-modal .fb-footer {
      padding: 0 24px 20px;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    #zaru-feedback-modal .fb-btn-cancel {
      padding: 9px 18px;
      border: 1.5px solid #e2e2e2;
      background: #fff;
      color: #444;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }
    #zaru-feedback-modal .fb-btn-cancel:hover { background: #f5f5f5; }

    #zaru-feedback-modal .fb-btn-submit {
      padding: 9px 20px;
      background: #1a1a2e;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, opacity 0.2s;
      display: flex;
      align-items: center;
      gap: 7px;
    }
    #zaru-feedback-modal .fb-btn-submit:hover { background: #2d2d5a; }
    #zaru-feedback-modal .fb-btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

    #zaru-feedback-modal .fb-status {
      font-size: 13px;
      text-align: center;
      padding: 0 24px 16px;
      display: none;
      line-height: 1.5;
    }
    #zaru-feedback-modal .fb-status.success { color: #15803d; display: block; }
    #zaru-feedback-modal .fb-status.error   { color: #b91c1c; display: block; }
    #zaru-feedback-modal .fb-status a {
      color: inherit;
      font-weight: 600;
    }
    #zaru-feedback-modal .fb-progress {
      font-size: 11px;
      color: #888;
      text-align: center;
      padding: 0 24px 10px;
      display: none;
    }
    #zaru-feedback-modal .fb-progress.visible { display: block; }
  `;

  // ── Build DOM ─────────────────────────────────────────────────────────────

  function init() {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    // Floating trigger button
    const btn = document.createElement("button");
    btn.id = "zaru-feedback-btn";
    btn.setAttribute("aria-label", "Leave feedback");
    btn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      Leave feedback
    `;
    document.body.appendChild(btn);

    // Hidden file input
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.id = "zaru-fb-file-input";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    // Modal overlay
    const overlay = document.createElement("div");
    overlay.id = "zaru-feedback-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Leave feedback");
    overlay.innerHTML = `
      <div id="zaru-feedback-modal">
        <div class="fb-header">
          <h2>Leave feedback</h2>
          <span class="fb-page-tag" title="${getPageName()}">${getPageName()}</span>
          <button class="fb-close" id="zaru-fb-close" title="Close" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="fb-body">
          <div>
            <label for="zaru-fb-name">Your name</label>
            <input id="zaru-fb-name" type="text" placeholder="e.g. Kash" autocomplete="name" />
          </div>
          <div>
            <label for="zaru-fb-comment">Feedback / issue</label>
            <textarea id="zaru-fb-comment" placeholder="Describe the issue or suggestion…"></textarea>
          </div>
          <div>
            <label>Screenshot <span class="fb-optional">— optional</span></label>
            <div id="zaru-fb-screenshot-area" role="button" tabindex="0" aria-label="Attach screenshot">
              <div class="fb-upload-prompt">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                Click or drag an image here
              </div>
              <div class="fb-preview-wrap">
                <img id="zaru-fb-screenshot-preview" alt="Screenshot preview" />
                <button id="zaru-fb-screenshot-clear" title="Remove screenshot" aria-label="Remove screenshot">✕</button>
                <div id="zaru-fb-screenshot-name"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="fb-progress" id="zaru-fb-progress"></div>

        <div class="fb-footer">
          <button class="fb-btn-cancel" id="zaru-fb-cancel">Cancel</button>
          <button class="fb-btn-submit" id="zaru-fb-submit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            Create issue
          </button>
        </div>
        <div class="fb-status" id="zaru-fb-status"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    // ── Bind events ───────────────────────────────────────────────────────

    btn.addEventListener("click", openModal);
    document.getElementById("zaru-fb-close").addEventListener("click", closeModal);
    document.getElementById("zaru-fb-cancel").addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
    document.getElementById("zaru-fb-submit").addEventListener("click", submitFeedback);

    // Screenshot area — click to open file picker
    const screenshotArea = document.getElementById("zaru-fb-screenshot-area");
    screenshotArea.addEventListener("click", (e) => {
      if (e.target.id === "zaru-fb-screenshot-clear") return;
      fileInput.click();
    });
    screenshotArea.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.id !== "zaru-fb-screenshot-clear") {
        e.preventDefault();
        fileInput.click();
      }
    });

    // Drag-and-drop
    screenshotArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      screenshotArea.classList.add("drag-over");
    });
    screenshotArea.addEventListener("dragleave", () => screenshotArea.classList.remove("drag-over"));
    screenshotArea.addEventListener("drop", (e) => {
      e.preventDefault();
      screenshotArea.classList.remove("drag-over");
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) setScreenshot(file);
    });

    fileInput.addEventListener("change", () => {
      if (fileInput.files[0]) setScreenshot(fileInput.files[0]);
    });

    document.getElementById("zaru-fb-screenshot-clear").addEventListener("click", (e) => {
      e.stopPropagation();
      clearScreenshot();
    });

    // Keyboard: escape closes modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
    });

    // Pre-fill saved name
    const savedName = localStorage.getItem("zaru_fb_reviewer_name");
    if (savedName) document.getElementById("zaru-fb-name").value = savedName;
  }

  // ── Screenshot helpers ────────────────────────────────────────────────────

  let _selectedFile = null;

  function setScreenshot(file) {
    _selectedFile = file;
    const area    = document.getElementById("zaru-fb-screenshot-area");
    const preview = document.getElementById("zaru-fb-screenshot-preview");
    const nameEl  = document.getElementById("zaru-fb-screenshot-name");

    area.classList.add("has-file");
    nameEl.textContent = file.name;

    const reader = new FileReader();
    reader.onload = (e) => { preview.src = e.target.result; };
    reader.readAsDataURL(file);
  }

  function clearScreenshot() {
    _selectedFile = null;
    document.getElementById("zaru-fb-screenshot-area").classList.remove("has-file");
    document.getElementById("zaru-fb-screenshot-preview").src = "";
    document.getElementById("zaru-fb-screenshot-name").textContent = "";
    document.getElementById("zaru-fb-file-input").value = "";
  }

  // ── Modal open / close ────────────────────────────────────────────────────

  function openModal() {
    document.getElementById("zaru-feedback-overlay").classList.add("open");
    document.getElementById("zaru-fb-status").className = "fb-status";
    document.getElementById("zaru-fb-status").textContent = "";
    document.getElementById("zaru-fb-progress").className = "fb-progress";
    const nameField = document.getElementById("zaru-fb-name");
    if (!nameField.value) nameField.focus();
    else document.getElementById("zaru-fb-comment").focus();
  }

  function closeModal() {
    document.getElementById("zaru-feedback-overlay").classList.remove("open");
    document.getElementById("zaru-fb-comment").value = "";
    clearScreenshot();
  }

  // ── GitHub API ────────────────────────────────────────────────────────────

  function hasValidToken(config) {
    return Boolean(config.GITHUB_TOKEN) && !config.GITHUB_TOKEN.startsWith("YOUR_");
  }

  // Fallback used when no token is configured (e.g. on the deployed public site).
  // Opens GitHub's "new issue" page with title/body/labels pre-populated.
  // Reviewer clicks "Submit new issue" themselves; if they attached a screenshot,
  // they drag it into GitHub's editor before submitting.
  function submitViaUrlPrefill() {
    const config  = cfg();
    const name    = document.getElementById("zaru-fb-name").value.trim();
    const comment = document.getElementById("zaru-fb-comment").value.trim();

    localStorage.setItem("zaru_fb_reviewer_name", name);

    const pageName = getPageName();
    const pageFile = getPageFile();
    const pageUrl  = window.location.href;

    const screenshotNote = _selectedFile
      ? `\n\n> 📎 Screenshot ready: please drag **${_selectedFile.name}** into this issue before submitting.`
      : "";

    const issueTitle = `[Review] ${pageName} — ${name}`;
    const issueBody  = [
      `**Page:** ${pageName} (\`${pageFile}\`)`,
      `**Reviewer:** ${name}`,
      `**URL:** ${pageUrl}`,
      ``,
      `---`,
      ``,
      comment,
    ].join("\n") + screenshotNote;

    const params = new URLSearchParams({ title: issueTitle, body: issueBody });
    if (config.ISSUE_LABEL) params.set("labels", config.ISSUE_LABEL);

    const url = `https://github.com/${config.GITHUB_OWNER}/${config.GITHUB_REPO}/issues/new?${params.toString()}`;
    window.open(url, "_blank", "noopener");

    showStatus(
      "success",
      _selectedFile
        ? `✓ GitHub opened in a new tab. <strong>Drag your screenshot into the issue</strong>, then click <em>Submit new issue</em>.`
        : `✓ GitHub opened in a new tab. Click <em>Submit new issue</em> to finish.`
    );
  }

  async function uploadScreenshot(file, config) {
    const timestamp = Date.now();
    const ext       = file.name.split(".").pop() || "png";
    const safeName  = sanitizeFilename(file.name.replace(/\.[^.]+$/, ""));
    const path      = `feedback-screenshots/${timestamp}-${safeName}.${ext}`;
    const b64       = await toBase64(file);

    const url = `https://api.github.com/repos/${config.GITHUB_OWNER}/${config.GITHUB_REPO}/contents/${path}`;

    const resp = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${config.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        message: `chore: add feedback screenshot from ${getPageFile()}`,
        content: b64,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(`Screenshot upload failed (${resp.status}): ${err.message || "Unknown"}`);
    }

    const data = await resp.json();
    // Return the raw URL so it renders inline in the GitHub issue
    return data.content.download_url;
  }

  async function submitFeedback() {
    const config   = cfg();
    const name     = document.getElementById("zaru-fb-name").value.trim();
    const comment  = document.getElementById("zaru-fb-comment").value.trim();
    const submitBtn = document.getElementById("zaru-fb-submit");
    const progressEl = document.getElementById("zaru-fb-progress");

    if (!name) {
      showStatus("error", "Please enter your name.");
      document.getElementById("zaru-fb-name").focus();
      return;
    }
    if (!comment) {
      showStatus("error", "Please describe the issue or feedback.");
      document.getElementById("zaru-fb-comment").focus();
      return;
    }
    if (!hasValidToken(config)) {
      // Hybrid fallback: no token available (deployed public site) — open
      // GitHub's issue form pre-filled instead of calling the API directly.
      submitViaUrlPrefill();
      return;
    }

    localStorage.setItem("zaru_fb_reviewer_name", name);

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating…";
    document.getElementById("zaru-fb-status").className = "fb-status";

    const pageName = getPageName();
    const pageFile = getPageFile();
    const pageUrl  = window.location.href;

    // ── 1. Upload screenshot if present ───────────────────────────────────
    let screenshotMarkdown = "";
    if (_selectedFile) {
      progressEl.textContent = "Uploading screenshot…";
      progressEl.classList.add("visible");
      try {
        const rawUrl = await uploadScreenshot(_selectedFile, config);
        screenshotMarkdown = `\n\n### Screenshot\n![screenshot](${rawUrl})`;
      } catch (e) {
        // Non-fatal: warn but continue
        screenshotMarkdown = `\n\n> ⚠️ Screenshot upload failed: ${e.message}`;
      }
      progressEl.textContent = "Creating issue…";
    }

    // ── 2. Create the issue ───────────────────────────────────────────────
    const issueTitle = `[Review] ${pageName} — ${name}`;
    const issueBody  = [
      `**Page:** ${pageName} (\`${pageFile}\`)`,
      `**Reviewer:** ${name}`,
      `**URL:** ${pageUrl}`,
      ``,
      `---`,
      ``,
      comment,
    ].join("\n") + screenshotMarkdown;

    const url = `https://api.github.com/repos/${config.GITHUB_OWNER}/${config.GITHUB_REPO}/issues`;

    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          title:  issueTitle,
          body:   issueBody,
          labels: config.ISSUE_LABEL ? [config.ISSUE_LABEL] : [],
        }),
      });

      progressEl.className = "fb-progress";

      if (resp.ok) {
        const data = await resp.json();
        showStatus(
          "success",
          `✓ Issue #${data.number} created. <a href="${data.html_url}" target="_blank" rel="noopener">View on GitHub ↗</a>`
        );
        document.getElementById("zaru-fb-comment").value = "";
        clearScreenshot();
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
          </svg>
          Create issue`;
      } else {
        const err = await resp.json().catch(() => ({}));
        showStatus("error", `GitHub error ${resp.status}: ${err.message || "Unknown error"}`);
        submitBtn.disabled = false;
        submitBtn.textContent = "Create issue";
      }
    } catch (e) {
      progressEl.className = "fb-progress";
      showStatus("error", "Network error — check your connection and try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Create issue";
    }
  }

  function showStatus(type, html) {
    const el = document.getElementById("zaru-fb-status");
    el.className = "fb-status " + type;
    el.innerHTML = html;
  }

  // ── Boot ──────────────────────────────────────────────────────────────────

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
