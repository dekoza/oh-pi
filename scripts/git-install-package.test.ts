import { existsSync, readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type PiManifest = {
	extensions?: string[];
	prompts?: string[];
	skills?: string[];
	themes?: string[];
};

type PackageManifest = {
	name?: string;
	workspaces?: string[];
	pi?: PiManifest;
	main?: string;
	exports?: string | Record<string, unknown>;
	scripts?: Record<string, string>;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	optionalDependencies?: Record<string, string>;
};

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, "..");

function readPackageJson(relativePath: string): PackageManifest {
	return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8")) as PackageManifest;
}

function toRootRelative(packageJsonPath: string, entry: string): string {
	const packageDir = path.posix.dirname(packageJsonPath);
	return `./${path.posix.join(packageDir, entry.replace(/^\.\//, ""))}`;
}

function getWorkspacePackageManifests(): string[] {
	return readdirSync(path.join(repoRoot, "packages"), { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => path.posix.join("packages", entry.name, "package.json"));
}

function isGitTracked(relativePath: string): boolean {
	try {
		execFileSync("git", ["ls-files", "--error-unmatch", relativePath], {
			cwd: repoRoot,
			stdio: "ignore",
		});
		return true;
	} catch {
		return false;
	}
}

function getRuntimeEntryPath(manifest: PackageManifest): string | undefined {
	if (typeof manifest.exports === "string") {
		return manifest.exports;
	}
	if (manifest.exports && typeof manifest.exports === "object") {
		const rootExport = manifest.exports["."];
		if (typeof rootExport === "string") {
			return rootExport;
		}
		if (rootExport && typeof rootExport === "object") {
			const importPath = (rootExport as { import?: unknown }).import;
			if (typeof importPath === "string") {
				return importPath;
			}
			const defaultPath = (rootExport as { default?: unknown }).default;
			if (typeof defaultPath === "string") {
				return defaultPath;
			}
		}
	}
	return manifest.main;
}

const extensionPackages = [
	"packages/extensions/package.json",
	"packages/ant-colony/package.json",
	"packages/subagents/package.json",
	"packages/plan/package.json",
	"packages/spec/package.json",
	"packages/web-remote/package.json",
	"packages/cursor/package.json",
	"packages/ollama/package.json",
];

describe("git-install package manifest", () => {
	it("aggregates the standalone pi packages at the repo root", () => {
		const rootManifest = readPackageJson("package.json");
		const expectedExtensionEntries = extensionPackages.flatMap((packageJsonPath) => {
			const manifest = readPackageJson(packageJsonPath);
			return (manifest.pi?.extensions ?? []).map((entry) => toRootRelative(packageJsonPath, entry));
		});

		expect(rootManifest.workspaces).toEqual(["packages/*"]);
		expect(rootManifest.pi?.extensions).toEqual(expectedExtensionEntries);
		expect(rootManifest.pi?.prompts).toEqual(["./packages/prompts/prompts"]);
		expect(rootManifest.pi?.skills).toEqual(["./packages/skills/skills"]);
		expect(rootManifest.pi?.themes).toEqual(["./packages/themes/themes"]);

		for (const extensionEntry of rootManifest.pi?.extensions ?? []) {
			expect(extensionEntry.endsWith(".ts")).toBe(true);
			expect(extensionEntry.includes("node_modules")).toBe(false);
		}
	});

	it("avoids npm-incompatible workspace protocol dependencies", () => {
		const manifestPaths = ["package.json", ...getWorkspacePackageManifests()];
		const dependencyKeys = [
			"dependencies",
			"devDependencies",
			"peerDependencies",
			"optionalDependencies",
		] as const;

		for (const manifestPath of manifestPaths) {
			const manifest = readPackageJson(manifestPath);
			for (const dependencyKey of dependencyKeys) {
				for (const [dependencyName, version] of Object.entries(manifest[dependencyKey] ?? {})) {
					expect(
						version.startsWith("workspace:"),
						`${manifestPath} uses unsupported ${dependencyKey}.${dependencyName}=${version}`,
					).toBe(false);
				}
			}
		}
	});

	it("builds missing workspace library entrypoints during root install", () => {
		const rootManifest = readPackageJson("package.json");
		const workspaceByName = new Map(
			getWorkspacePackageManifests().map((manifestPath) => {
				const manifest = readPackageJson(manifestPath);
				return [manifest.name, manifestPath] as const;
			}),
		);
		const postinstall = rootManifest.scripts?.postinstall ?? "";

		for (const packageJsonPath of extensionPackages) {
			const manifest = readPackageJson(packageJsonPath);
			for (const dependencyName of Object.keys(manifest.dependencies ?? {})) {
				const dependencyManifestPath = workspaceByName.get(dependencyName);
				if (!dependencyManifestPath) {
					continue;
				}
				const dependencyManifest = readPackageJson(dependencyManifestPath);
				const runtimeEntryPath = getRuntimeEntryPath(dependencyManifest);
				if (!runtimeEntryPath) {
					continue;
				}
				const runtimeEntryRepoPath = path.posix.join(
					path.posix.dirname(dependencyManifestPath),
					runtimeEntryPath.replace(/^\.\//, ""),
				);
				const runtimeEntryExists = existsSync(path.join(repoRoot, runtimeEntryRepoPath));
				if (runtimeEntryExists && isGitTracked(runtimeEntryRepoPath)) {
					continue;
				}
				expect(
					postinstall,
					`git-install root package does not build ${dependencyName}, but ${runtimeEntryPath} is not shipped as a tracked checkout artifact`,
				).toContain(dependencyName);
			}
		}
	});
});
