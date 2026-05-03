export interface QueueTask<TInput, TOutput> {
  input: TInput
  resolve: (value: TOutput) => void
  reject: (error: Error) => void
}

export interface QueueOptions {
  concurrency?: number
  onProgress?: (completed: number, total: number) => void
  maxQueueSize?: number
}

export class UploadQueue<TInput, TOutput> {
  private queue: QueueTask<TInput, TOutput>[] = []
  private activeCount = 0
  private concurrency: number
  private completedCount = 0
  private totalCount = 0
  private onProgress?: (completed: number, total: number) => void
  private abortController: AbortController | null = null
  private isProcessing = false
  private maxQueueSize: number

  constructor(options: QueueOptions = {}) {
    this.concurrency = options.concurrency ?? 4
    this.onProgress = options.onProgress
    this.maxQueueSize = options.maxQueueSize ?? 1000
  }

  /**
   * Add a task to the queue
   */
  add(input: TInput): Promise<TOutput> {
    // Check queue size limit to prevent memory issues
    if (this.queue.length >= this.maxQueueSize) {
      return Promise.reject(new Error(`Queue size exceeds maximum (${this.maxQueueSize})`))
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ input, resolve, reject })
      this.totalCount++
      this.scheduleProcess()
    })
  }

  /**
   * Schedule processing to avoid recursive calls
   */
  private scheduleProcess() {
    if (!this.isProcessing && this.queue.length > 0) {
      this.isProcessing = true
      // Use setImmediate or queueMicrotask for better performance
      Promise.resolve().then(() => {
        this.isProcessing = false
        this.process().catch(err => {
          console.error('Queue processing error:', err)
        })
      })
    }
  }

  /**
   * Process the queue
   */
  private async process() {
    while (this.activeCount < this.concurrency && this.queue.length > 0) {
      if (this.abortController?.signal.aborted) {
        // Abort all remaining tasks
        while (this.queue.length > 0) {
          const task = this.queue.shift()!
          task.reject(new Error('Upload aborted'))
        }
        return
      }

      const task = this.queue.shift()!
      this.activeCount++

      // Process task and handle completion
      this.executeTask(task.input)
        .then((result) => {
          this.completedCount++
          this.onProgress?.(this.completedCount, this.totalCount)
          task.resolve(result)
        })
        .catch((error) => {
          task.reject(error as Error)
        })
        .finally(() => {
          this.activeCount--
          // Continue processing if there are more tasks
          if (this.queue.length > 0) {
            this.scheduleProcess()
          }
        })
    }
  }

  /**
   * Execute a single task - to be overridden by subclasses
   */
  protected async executeTask(input: TInput): Promise<TOutput> {
    throw new Error('executeTask must be implemented by subclass')
  }

  /**
   * Abort all pending tasks
   */
  abort() {
    if (!this.abortController) {
      this.abortController = new AbortController()
    }
    this.abortController.abort()
  }

  /**
   * Get the abort signal for tasks to check
   */
  getAbortSignal(): AbortSignal | null {
    return this.abortController?.signal ?? null
  }

  /**
   * Reset the queue state
   */
  reset() {
    // Reject all pending tasks
    while (this.queue.length > 0) {
      const task = this.queue.shift()!
      task.reject(new Error('Queue reset'))
    }
    
    this.activeCount = 0
    this.completedCount = 0
    this.totalCount = 0
    this.abortController = null
    this.isProcessing = false
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      pending: this.queue.length,
      active: this.activeCount,
      completed: this.completedCount,
      total: this.totalCount,
    }
  }
}

export interface FileReadTask {
  file: File
}

export interface FileReadResult {
  file: File
  content: string
}

/**
 * Queue for reading file contents with concurrency control
 */
export class FileReadQueue extends UploadQueue<FileReadTask, FileReadResult> {
  protected async executeTask(task: FileReadTask): Promise<FileReadResult> {
    const signal = this.getAbortSignal()
    
    if (signal?.aborted) {
      throw new Error('Upload aborted')
    }

    const content = await task.file.text()
    return {
      file: task.file,
      content,
    }
  }
}
