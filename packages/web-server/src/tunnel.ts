import { type ChildProcess, execFileSync, spawn } from "node:child_process";

export type TunnelProvider = "cloudflared" | "tailscale";

export interface TunnelInfo {
	publicUrl: string;
	provider: TunnelProvider;
	stop: () => void;
}

export function detectTunnelProvider(): TunnelProvider | undefined {
	try {
		execFileSync("which", ["cloudflared"], { stdio: "ignore" });
		return "cloudflared";
	} catch {
		// not found
	}
	try {
		execFileSync("which", ["tailscale"], { stdio: "ignore" });
		return "tailscale";
	} catch {
		// not found
	}
	return undefined;
}

export function startTunnel(port: number, provider?: TunnelProvider): Promise<TunnelInfo> {
	const resolved = provider ?? detectTunnelProvider();
	if (!resolved) {
		return Promise.reject(new Error("No tunnel provider found. Install cloudflared or tailscale."));
	}

	if (resolved === "cloudflared") {
		return startCloudflaredTunnel(port);
	}
	return startTailscaleTunnel(port);
}

function startCloudflaredTunnel(port: number): Promise<TunnelInfo> {
	return new Promise((resolve, reject) => {
		const proc: ChildProcess = spawn("cloudflared", ["tunnel", "--url", `http://localhost:${port}`], {
			stdio: ["ignore", "pipe", "pipe"],
		});

		let resolved = false;
		const timeout = setTimeout(() => {
			if (!resolved) {
				resolved = true;
				reject(new Error("Cloudflare tunnel timed out after 30s"));
			}
		}, 30000);

		const onData = (data: Buffer) => {
			const text = data.toString();
			// Cloudflared prints the URL to stderr
			const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
			if (match && !resolved) {
				resolved = true;
				clearTimeout(timeout);
				resolve({
					publicUrl: match[0],
					provider: "cloudflared",
					stop: () => {
						proc.kill("SIGTERM");
					},
				});
			}
		};

		proc.stderr?.on("data", onData);
		proc.stdout?.on("data", onData);

		proc.on("error", (err) => {
			if (!resolved) {
				resolved = true;
				clearTimeout(timeout);
				reject(err);
			}
		});

		proc.on("exit", (code) => {
			if (!resolved) {
				resolved = true;
				clearTimeout(timeout);
				reject(new Error(`cloudflared exited with code ${code}`));
			}
		});
	});
}

function startTailscaleTunnel(port: number): Promise<TunnelInfo> {
	return new Promise((resolve, reject) => {
		const proc: ChildProcess = spawn("tailscale", ["funnel", String(port)], {
			stdio: ["ignore", "pipe", "pipe"],
		});

		let resolved = false;
		const timeout = setTimeout(() => {
			if (!resolved) {
				resolved = true;
				reject(new Error("Tailscale funnel timed out after 30s"));
			}
		}, 30000);

		const onData = (data: Buffer) => {
			const text = data.toString();
			const match = text.match(/https:\/\/[^\s]+/);
			if (match && !resolved) {
				resolved = true;
				clearTimeout(timeout);
				resolve({
					publicUrl: match[0],
					provider: "tailscale",
					stop: () => {
						proc.kill("SIGTERM");
					},
				});
			}
		};

		proc.stdout?.on("data", onData);
		proc.stderr?.on("data", onData);

		proc.on("error", (err) => {
			if (!resolved) {
				resolved = true;
				clearTimeout(timeout);
				reject(err);
			}
		});

		proc.on("exit", (code) => {
			if (!resolved) {
				resolved = true;
				clearTimeout(timeout);
				reject(new Error(`tailscale exited with code ${code}`));
			}
		});
	});
}
