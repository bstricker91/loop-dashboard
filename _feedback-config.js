// ─────────────────────────────────────────────────────────────────────────────
// Feedback Widget — GitHub Configuration
// ─────────────────────────────────────────────────────────────────────────────
// 1. Replace GITHUB_OWNER and GITHUB_REPO with your repo details.
// 2. Create a fine-grained GitHub Personal Access Token:
//    → github.com → Settings → Developer settings → Fine-grained tokens
//    → Repository access: only this repo
//    → Permissions required:
//        • Issues      → Read and write   (create issues)
//        • Contents    → Read and write   (upload screenshots to feedback-screenshots/)
// 3. Paste that token as GITHUB_TOKEN below.
// ─────────────────────────────────────────────────────────────────────────────

window.FEEDBACK_CONFIG = {
  GITHUB_OWNER: "bstricker91", // e.g. "luno"
  GITHUB_REPO:  "loop-dashboard",              // e.g. "loop-dashboard"
  GITHUB_TOKEN: "YOUR_GITHUB_PAT_HERE",  // Create at: github.com → Settings → Developer settings → Fine-grained tokens
  ISSUE_LABEL:  "review-feedback",             // label applied to all issues (create this label in your repo first)
};
