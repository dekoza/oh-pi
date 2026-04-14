---
default: patch
---

Prevent ant-colony from deleting isolated worktrees when they contain uncommitted changes or unmerged commits, keeping the worktree available for manual review. Add coverage for cleanup behavior and document the new safety guard in the troubleshooting guide.
