import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {	cleanupIsolatedWorktree,
	prepareColonyWorkspace,
	resumeColonyWorkspace,
} from "../extensions/ant-colony/worktree.js";

function sharedStorageOptions() {
	return { mode: "shared" as const, sharedRoot: mkTempDir("colony-storage-") };
}

const tmpDirs: string[] = [];

function mkTempDir(prefix: string): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
	tmpDirs.push(dir);
	return dir;
}

function initRepo(dir: string): void {
	execFileSync("git", ["-C", dir, "init"], { stdio: "pipe" });
	execFileSync("git", ["-C", dir, "config", "user.name", "Test Bot"], { stdio: "pipe" });
	execFileSync("git", ["-C", dir, "config", "user.email", "test@example.com"], { stdio: "pipe" });
	fs.writeFileSync(path.join(dir, "README.md"), "# temp\n", "utf-8");
	execFileSync("git", ["-C", dir, "add", "."], { stdio: "pipe" });
	execFileSync("git", ["-C", dir, "commit", "-m", "init"], { stdio: "pipe" });
}

afterEach(() => {
	for (const dir of tmpDirs.splice(0)) {
		try {
			fs.rmSync(dir, { recursive: true, force: true });
		} catch {
			/* ignore */
		}
	}
});

describe("worktree workspace isolation", () => {
	it("falls back to shared workspace outside git repos", () => {
		const cwd = mkTempDir("colony-no-git-");
		const workspace = prepareColonyWorkspace({ cwd, runtimeId: "c1", storageOptions: sharedStorageOptions() });

		expect(workspace.mode).toBe("shared");
		expect(workspace.executionCwd).toBe(cwd);
		expect(workspace.note).toContain("shared");
	});

	it("creates an isolated git worktree by default", () => {
		const repo = mkTempDir("colony-worktree-");
		const storageOptions = sharedStorageOptions();
		initRepo(repo);

		const workspace = prepareColonyWorkspace({ cwd: repo, runtimeId: "c2", storageOptions });
		expect(workspace.mode).toBe("worktree");
		expect(workspace.worktreeRoot).toBeTruthy();
		expect(workspace.executionCwd).not.toBe(repo);
		expect(fs.existsSync(workspace.executionCwd)).toBe(true);
		expect(workspace.worktreeRoot?.startsWith(storageOptions.sharedRoot)).toBe(true);

		const branch = execFileSync("git", ["-C", workspace.executionCwd, "rev-parse", "--abbrev-ref", "HEAD"], {
			encoding: "utf-8",
			stdio: ["ignore", "pipe", "pipe"],
		}).trim();
		expect(branch).toBe(workspace.branch);
	});

	it("reuses saved worktree metadata on resume", () => {
		const repo = mkTempDir("colony-resume-worktree-");
		const storageOptions = sharedStorageOptions();
		initRepo(repo);

		const initial = prepareColonyWorkspace({ cwd: repo, runtimeId: "c3", storageOptions });
		expect(initial.mode).toBe("worktree");

		const resumed = resumeColonyWorkspace({ cwd: repo, runtimeId: "c4", savedWorkspace: initial, storageOptions });
		expect(resumed.mode).toBe("worktree");
		expect(resumed.executionCwd).toBe(initial.executionCwd);
	});

	it("keeps worktree when uncommitted changes exist", () => {
		const repo = mkTempDir("colony-worktree-dirty-");
		const storageOptions = sharedStorageOptions();
		initRepo(repo);

		const workspace = prepareColonyWorkspace({ cwd: repo, runtimeId: "c4", storageOptions });
		expect(workspace.mode).toBe("worktree");
		if (!workspace.worktreeRoot) {
			throw new Error("Expected worktree root to be set.");
		}

		fs.writeFileSync(path.join(workspace.executionCwd, "notes.txt"), "dirty", "utf-8");
		const cleanup = cleanupIsolatedWorktree(workspace);

		expect(cleanup).toContain("skipped");
		expect(fs.existsSync(workspace.worktreeRoot)).toBe(true);
	});

	it("keeps worktree when branch has unmerged commits", () => {
		const repo = mkTempDir("colony-worktree-commits-");
		const storageOptions = sharedStorageOptions();
		initRepo(repo);

		const workspace = prepareColonyWorkspace({ cwd: repo, runtimeId: "c5", storageOptions });
		expect(workspace.mode).toBe("worktree");
		if (!workspace.worktreeRoot) {
			throw new Error("Expected worktree root to be set.");
		}

		fs.writeFileSync(path.join(workspace.executionCwd, "committed.txt"), "commit", "utf-8");
		execFileSync("git", ["-C", workspace.executionCwd, "add", "committed.txt"], { stdio: "pipe" });
		execFileSync("git", ["-C", workspace.executionCwd, "commit", "-m", "colony commit"], {
			stdio: "pipe",
		});

		const cleanup = cleanupIsolatedWorktree(workspace);

		expect(cleanup).toContain("skipped");
		expect(fs.existsSync(workspace.worktreeRoot)).toBe(true);
	});

	it("removes clean worktree", () => {
		const repo = mkTempDir("colony-worktree-clean-");
		const storageOptions = sharedStorageOptions();
		initRepo(repo);

		const workspace = prepareColonyWorkspace({ cwd: repo, runtimeId: "c6", storageOptions });
		expect(workspace.mode).toBe("worktree");
		if (!workspace.worktreeRoot) {
			throw new Error("Expected worktree root to be set.");
		}

		const cleanup = cleanupIsolatedWorktree(workspace);

		expect(cleanup).toContain("removed isolated worktree");
		expect(fs.existsSync(workspace.worktreeRoot)).toBe(false);
	});
});
