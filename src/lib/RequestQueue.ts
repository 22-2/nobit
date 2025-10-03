type QueuedTask<T> = {
	task: () => Promise<T>;
	resolve: (value: T) => void;
	reject: (reason?: any) => void;
};

export class RequestQueue {
	private queue: QueuedTask<any>[] = [];
	private isProcessing = false;
	private readonly delay: number;

	constructor(delay = 300) {
		this.delay = delay;
	}

	private async processQueue(): Promise<void> {
		if (this.isProcessing || this.queue.length === 0) {
			return;
		}
		this.isProcessing = true;

		const item = this.queue.shift();
		if (!item) {
			this.isProcessing = false;
			return;
		}

		try {
			const result = await item.task();
			item.resolve(result);
		} catch (error) {
			item.reject(error);
		} finally {
			await this.sleep(this.delay);
			this.isProcessing = false;
			this.processQueue();
		}
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	enqueue<T>(task: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			this.queue.push({ task, resolve, reject });
			this.processQueue();
		});
	}

	get queueLength(): number {
		return this.queue.length;
	}

	get processing(): boolean {
		return this.isProcessing;
	}
}
