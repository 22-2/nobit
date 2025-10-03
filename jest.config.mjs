export default {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
	transform: {
		"^.+\\.ts$": [
			"ts-jest",
			{
				tsconfig: "tsconfig.test.json",
			},
		],
	},
	collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/tests/**"],
	setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
	moduleNameMapper: {
		"^obsidian$": "<rootDir>/src/__mocks__/obsidian",
		"^src/(.*)$": "<rootDir>/src/$1",
	},
	// 並列実行の設定
	maxWorkers: "50%", // CPUコア数の50%を使用
	// CI環境での最適化
	...(process.env.CI && {
		maxWorkers: 2, // CI環境では固定値を使用
		cache: false, // CIではキャッシュを無効化
		verbose: true, // CI環境では詳細ログを出力
	}),
	// テストの並列実行を有効化
	testRunner: "jest-circus/runner",
	// カバレッジ設定
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "html"],
	coverageThreshold: {
		global: {
			branches: 70,
			functions: 70,
			lines: 70,
			statements: 70,
		},
	},
};
