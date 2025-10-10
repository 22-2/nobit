import { DEBUG_MODE } from "src/utils/constants";

/**
 * Test configuration interface for easy customization
 */
export interface TestConfig {
	threadIds: {
		standard: string;
		performance: string;
	};
	postCounts: {
		standard: number;
		performance: number;
	};
	timing: {
		minInterval: number; // seconds
		maxInterval: number; // seconds
	};
	anchorChance: number; // 0-1 probability
	templates: {
		authorIds: string[];
		contentVariations: string[];
		threadTitle: string;
	};
}

/**
 * Default test configuration - easily customizable
 */
const DEFAULT_TEST_CONFIG: TestConfig = {
	threadIds: {
		standard: "1759320900",
		performance: "1759470805",
	},
	postCounts: {
		standard: 10,
		performance: 1000,
	},
	timing: {
		minInterval: 5,
		maxInterval: 35,
	},
	anchorChance: 0.05,
	templates: {
		authorIds: [
			"can0y8at5",
			"VaIWYFUoe",
			"unuqbldXz",
			"nifwyLlxQ",
			"9Xu94Y12t",
			"kYUQFM4ib",
			"yrmmRxDI7",
			"ZygznWYK/",
			"/VhVczWbI",
			"faD8iIk7x",
			"1vvNtITu2",
			"aXTw4JhTq",
			"isaQer1Zi",
			"rTFUe6Ifo",
			"y01NCaPlG",
			"4HVvqVZ0Y",
			"maQYa4ZkR",
			"N12QPrLwe",
			"ftfLIY2D8",
			"kd4U.obHe",
		],
		contentVariations: [
			"面白くなりそうなのに…",
			"緊張感ないし",
			"普通に面白いわ",
			"ジュジュモジュの話しようや…！",
			"芥見本人が作画したほうが良かったな<br>あの絵だと安っぽい同人みたい",
			"まあ超序盤で話題になってる漫画って少なそうだし",
			"面白くなってないなら帰れ",
			"何故…",
			"話動きそうなのに",
			"カグラバチとか言う本物がいるからな",
			"面白いけど短期集中連載でダラダラ依頼こなしてるのが不安や",
			"五条復活させろ",
			"完結してから単行本で読むかもしれないぐらいの存在",
			"チェンソーマン2部とどっちがマシや？",
			"イタドールは普通に生きてそう",
			"そもそも呪術が渋谷以降ずっと酷かったやん<br>何を期待してるんや？",
			"短期集中連載ってどのくらいの期間の予定なんや？<br>10話分か？",
			"お前は結論を急ぎすぎる",
			"半年らしい",
			"今後の伏線たまに出てくるくらいでよう分からんキャラの日常回されても",
		],
		threadTitle: "【悲報】呪術廻戦モジュロ、びっくりするほど話題にならない",
	},
};

/**
 * Test helper class for ThreadManager
 * Contains all test-related functionality separated from the main ThreadManager
 *
 * Usage examples:
 *
 * // Update thread IDs
 * ThreadManagerTestHelper.updateConfig({
 *   threadIds: { standard: "1234567890", performance: "0987654321" }
 * });
 *
 * // Change post counts
 * ThreadManagerTestHelper.updateConfig({
 *   postCounts: { standard: 20, performance: 500 }
 * });
 *
 * // Customize content templates
 * ThreadManagerTestHelper.updateConfig({
 *   templates: {
 *     threadTitle: "新しいテストスレッド",
 *     contentVariations: ["カスタムコンテンツ1", "カスタムコンテンツ2"]
 *   }
 * });
 */
export class ThreadManagerTestHelper {
	private static config: TestConfig = DEFAULT_TEST_CONFIG;
	/**
	 * Update test configuration
	 */
	static updateConfig(newConfig: Partial<TestConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	/**
	 * Get current test configuration
	 */
	static getConfig(): TestConfig {
		return { ...this.config };
	}

	/**
	 * Reset configuration to defaults
	 */
	static resetConfig(): void {
		this.config = { ...DEFAULT_TEST_CONFIG };
	}

	/**
	 * Quick setup for custom test scenarios
	 */
	static setupCustomTest(options: {
		threadId?: string;
		postCount?: number;
		title?: string;
		authors?: string[];
		content?: string[];
	}): void {
		const updates: Partial<TestConfig> = {};

		if (options.threadId) {
			updates.threadIds = {
				...this.config.threadIds,
				standard: options.threadId,
			};
		}

		if (options.postCount) {
			updates.postCounts = {
				...this.config.postCounts,
				standard: options.postCount,
			};
		}

		if (options.title || options.authors || options.content) {
			updates.templates = {
				...this.config.templates,
				...(options.title && { threadTitle: options.title }),
				...(options.authors && { authorIds: options.authors }),
				...(options.content && { contentVariations: options.content }),
			};
		}

		this.updateConfig(updates);
	}

	/**
	 * Check if the URL is a test fixture URL
	 */
	static isTestFixtureUrl(url: string): boolean {
		const { standard, performance } = this.config.threadIds;
		return url.includes(standard) || url.includes(performance);
	}

	/**
	 * Check if we're in test environment
	 */
	static isTestEnvironment(): boolean {
		// Check multiple indicators for test environment
		return DEBUG_MODE;
	}

	/**
	 * Check if we should use test fixtures for this URL
	 */
	static shouldUseTestFixture(url: string): boolean {
		return this.isTestEnvironment() && this.isTestFixtureUrl(url);
	}

	/**
	 * Check if this is a performance test URL
	 */
	private static isPerformanceTestUrl(url: string): boolean {
		return (
			window.location?.href?.includes("performance") ||
			window.location?.href?.includes("1000") ||
			url.includes(this.config.threadIds.performance) ||
			(typeof window !== "undefined" &&
				(window as any).testFixtureData &&
				(window as any).testFixtureData.length > 50000)
		);
	}

	/**
	 * Load test fixture data directly (for test environment)
	 */
	static async loadTestFixture(url: string): Promise<string> {
		const isPerformanceTest = this.isPerformanceTestUrl(url);

		if (isPerformanceTest) {
			console.log(
				`🔥 ThreadManagerTestHelper: Loading actual 1000 posts fixture file`,
			);

			// Check if test fixture data is available in global scope
			if (typeof window !== "undefined" && (window as any).testFixtureData) {
				console.log(
					`🔥 ThreadManagerTestHelper: Using test fixture data from global scope`,
				);
				return (window as any).testFixtureData;
			}

			// Fallback to programmatic generation
			console.log(
				`🔥 ThreadManagerTestHelper: Falling back to programmatic 1000 posts generation`,
			);
			return this.load1000PostsFixture();
		}

		// Default: return standard test data
		return this.generateStandardTestData();
	}

	/**
	 * Generate standard test data (configurable post count)
	 */
	private static generateStandardTestData(): string {
		return this.generateLargeTestData(this.config.postCounts.standard);
	}

	/**
	 * Load performance test fixture data
	 */
	private static async load1000PostsFixture(): Promise<string> {
		return this.generateLargeTestData(this.config.postCounts.performance);
	}

	/**
	 * Generate performance test data (legacy method)
	 */
	private static async loadPerformanceFixture(): Promise<string> {
		// Return a representative sample of the 1000 posts fixture
		// This simulates the actual fixture content structure
		const samplePosts = [
			"エッヂの名無し<><>2025/10/03(木) 14:53:25.854 ID:/ygGkP1to<> なんなのか <>【悲報】エッヂが「ままみ」になってしまうwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",
			"エッヂの名無し<><>2025/10/03(木) 14:53:32.876 ID:/ygGkP1to<> 調べてきたよ <>",
			"エッヂの名無し<><>2025/10/03(木) 14:53:38.209 ID:/ygGkP1to<> え <>",
			"エッヂの名無し<><>2025/10/03(木) 14:53:42.101 ID:F.f2XaOLS<> お前が世界に行く前に言えよ <>",
			"エッヂの名無し<><>2025/10/03(木) 14:53:45.405 ID:/ygGkP1to<> なんで男の子はこんなでしかないのか <>",
		];

		// Generate 1000 posts based on the sample structure
		const posts: string[] = [];
		const baseTime = new Date("2025/10/03 14:53:25");

		// Use configured templates
		const { authorIds, contentVariations, threadTitle } = this.config.templates;

		// First post with thread title
		const firstPost = `エッヂの名無し<><>2025/10/03(木) 14:53:25.854 ID:${authorIds[0]}<> 話動きそうなのに <>${threadTitle}`;
		posts.push(firstPost);

		// Generate remaining posts
		const targetCount = this.config.postCounts.performance;
		for (let i = 1; i < targetCount; i++) {
			const { minInterval, maxInterval } = this.config.timing;
			const time = new Date(
				baseTime.getTime() +
					i *
						1000 *
						(Math.random() * (maxInterval - minInterval) + minInterval),
			);
			const timeStr = time
				.toLocaleString("ja-JP", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
					weekday: "short",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					fractionalSecondDigits: 3,
				})
				.replace(
					/(\d{4})\/(\d{2})\/(\d{2})\((.)\) (\d{2}):(\d{2}):(\d{2})\.(\d{3})/,
					"$1/$2/$3($4) $5:$6:$7.$8",
				);

			const authorId = authorIds[Math.floor(Math.random() * authorIds.length)];
			const content =
				contentVariations[Math.floor(Math.random() * contentVariations.length)];

			// Occasionally add anchor references
			let finalContent = content;
			if (Math.random() < this.config.anchorChance && i > 10) {
				const targetPost = Math.floor(Math.random() * (i - 5)) + 1;
				finalContent = `&gt;&gt;${targetPost}<br>${content}`;
			}

			const post = `エッヂの名無し<><>${timeStr} ID:${authorId}<> ${finalContent} <>`;
			posts.push(post);
		}

		return posts.join("\n");
	}

	/**
	 * Generate large test data for performance testing (fallback method)
	 */
	static generateLargeTestData(postCount: number): string {
		const posts: string[] = [];
		const baseTime = new Date("2025/10/01 21:15:00");

		// Use configured templates
		const { authorIds, contentVariations, threadTitle } = this.config.templates;

		// First post with thread title
		const firstPost = `エッヂの名無し<><>2025/10/01(水) 21:15:00.544 ID:${authorIds[0]}<> 話動きそうなのに <>${threadTitle}`;
		posts.push(firstPost);

		// Generate remaining posts
		for (let i = 1; i < postCount; i++) {
			const { minInterval, maxInterval } = this.config.timing;
			const time = new Date(
				baseTime.getTime() +
					i *
						1000 *
						(Math.random() * (maxInterval - minInterval) + minInterval),
			);
			const timeStr = time
				.toLocaleString("ja-JP", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
					weekday: "short",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					fractionalSecondDigits: 3,
				})
				.replace(
					/(\d{4})\/(\d{2})\/(\d{2})\((.)\) (\d{2}):(\d{2}):(\d{2})\.(\d{3})/,
					"$1/$2/$3($4) $5:$6:$7.$8",
				);

			const authorId = authorIds[Math.floor(Math.random() * authorIds.length)];
			const content =
				contentVariations[Math.floor(Math.random() * contentVariations.length)];

			// Occasionally add anchor references
			let finalContent = content;
			if (Math.random() < this.config.anchorChance && i > 5) {
				const targetPost = Math.floor(Math.random() * i) + 1;
				finalContent = `&gt;&gt;${targetPost}<br>${content}`;
			}

			const post = `エッヂの名無し<><>${timeStr} ID:${authorId}<> ${finalContent} <>`;
			posts.push(post);
		}

		return posts.join("\n");
	}
}
