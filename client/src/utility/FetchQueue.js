/*
 * @utility/FetchQueue.js
 */

/**
 * A queue for promises that enforces a first-in-first-out
 * resolution order on the enqueued callBack.
 */
export class FetchQueue {
	/**
	 * Initializes the queue with a resolved promise.
	 * @param { Number } max The maximum number of promises that can be in the queue.
	 */
	constructor(max = 50) {
		this.max = max;
		this.queue = Promise.resolve();
		this.count = 0;
	}

	/**
	 * Enqueues the given promise, which passes the given result
	 * object to the given callBack function.
	 * @param { Promise } promise The promise to enqueue.
	 * @param { d3.selection } selection
	 * @param { Object } state
	 * @param { Function } callBack The callback to call once the prior promise resolves.
	 */
	enqueue(promise, selection, state, onClick, callBack) {
		this.count += 1;

		this.queue = this.queue.then(async () => {
			try {
				await promise;
				await callBack(selection, state, { onClick });
			} catch (err) {
				console.error(err);
			}
		});

		if (this.count >= this.max) {
			this.resetQueue();
		}
	}

	/**
	 * Resets the queue to a single resolved promise.
	 */
	resetQueue() {
		this.queue = Promise.resolve();
		this.count = 0;
	}
}
