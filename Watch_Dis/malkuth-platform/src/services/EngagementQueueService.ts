import {
  Engagement,
  EngagementQueue,
  EngagementStatus,
  EngagementType,
  EngagementPhase
} from '../types';

export interface QueueStats {
  totalItems: number;
  pendingItems: number;
  processingItems: number;
  completedItems: number;
  failedItems: number;
  averageWaitTime: number;
  averageProcessingTime: number;
  throughputPerHour: number;
}

export interface QueueFilter {
  campaignId?: string;
  contentId?: string;
  botId?: string;
  type?: EngagementType;
  phase?: EngagementPhase;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  priority?: number;
  scheduledAfter?: Date;
  scheduledBefore?: Date;
}

export class EngagementQueueService {
  private queue: Map<string, EngagementQueue> = new Map();
  private processingQueue: Set<string> = new Set();
  private completedQueue: Map<string, EngagementQueue> = new Map();
  private failedQueue: Map<string, EngagementQueue> = new Map();
  
  private readonly maxQueueSize = 10000;
  private readonly maxRetries = 3;
  private readonly processingTimeout = 300000; // 5 minutes
  private readonly cleanupInterval = 3600000; // 1 hour
  
  private stats: QueueStats = {
    totalItems: 0,
    pendingItems: 0,
    processingItems: 0,
    completedItems: 0,
    failedItems: 0,
    averageWaitTime: 0,
    averageProcessingTime: 0,
    throughputPerHour: 0
  };

  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Schedule an engagement for execution
   */
  public async scheduleEngagement(engagement: Engagement): Promise<string> {
    if (this.queue.size >= this.maxQueueSize) {
      throw new Error('Queue is full');
    }

    const queueId = this.generateQueueId();
    const priority = this.calculatePriority(engagement);
    
    const queueItem: EngagementQueue = {
      id: queueId,
      priority,
      scheduledFor: engagement.scheduledAt,
      engagement,
      attempts: 0,
      status: 'pending'
    };

    this.queue.set(queueId, queueItem);
    this.updateStats();
    
    console.log(`Engagement scheduled: ${engagement.type} for content ${engagement.contentId} by bot ${engagement.botId}`);
    
    return queueId;
  }

  /**
   * Get pending engagements for a campaign
   */
  public async getPendingEngagements(campaignId?: string): Promise<EngagementQueue[]> {
    const now = new Date();
    const pending = Array.from(this.queue.values())
      .filter(item => {
        if (item.status !== 'pending') return false;
        if (item.scheduledFor.getTime() > now.getTime()) return false;
        if (campaignId && !this.isEngagementForCampaign(item.engagement, campaignId)) return false;
        return true;
      })
      .sort((a, b) => {
        // Sort by priority first, then by scheduled time
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.scheduledFor.getTime() - b.scheduledFor.getTime();
      });

    return pending;
  }

  /**
   * Mark engagement as processing
   */
  public async markAsProcessing(queueId: string): Promise<void> {
    const item = this.queue.get(queueId);
    if (!item) {
      throw new Error(`Queue item ${queueId} not found`);
    }

    item.status = 'processing';
    item.lastAttempt = new Date();
    item.attempts++;
    
    this.processingQueue.add(queueId);
    this.updateStats();
    
    // Set timeout for processing
    setTimeout(() => {
      this.handleProcessingTimeout(queueId);
    }, this.processingTimeout);
  }

  /**
   * Mark engagement as completed
   */
  public async markAsCompleted(queueId: string): Promise<void> {
    const item = this.queue.get(queueId);
    if (!item) {
      throw new Error(`Queue item ${queueId} not found`);
    }

    item.status = 'completed';
    item.engagement.status = 'completed';
    item.engagement.executedAt = new Date();
    
    // Move to completed queue
    this.completedQueue.set(queueId, item);
    this.queue.delete(queueId);
    this.processingQueue.delete(queueId);
    
    this.updateStats();
    
    console.log(`Engagement completed: ${item.engagement.type} for content ${item.engagement.contentId}`);
  }

  /**
   * Mark engagement as failed
   */
  public async markAsFailed(queueId: string, error?: string): Promise<void> {
    const item = this.queue.get(queueId);
    if (!item) {
      throw new Error(`Queue item ${queueId} not found`);
    }

    item.engagement.status = 'failed';
    
    // Check if we should retry
    if (item.attempts < this.maxRetries) {
      // Reschedule with exponential backoff
      const backoffDelay = Math.pow(2, item.attempts) * 60000; // 1, 2, 4 minutes
      item.scheduledFor = new Date(Date.now() + backoffDelay);
      item.status = 'pending';
      
      this.processingQueue.delete(queueId);
      
      console.log(`Engagement retry scheduled: ${item.engagement.type} (attempt ${item.attempts}/${this.maxRetries})`);
    } else {
      // Max retries reached, move to failed queue
      item.status = 'failed';
      
      this.failedQueue.set(queueId, item);
      this.queue.delete(queueId);
      this.processingQueue.delete(queueId);
      
      console.error(`Engagement failed permanently: ${item.engagement.type} for content ${item.engagement.contentId}`, error);
    }
    
    this.updateStats();
  }

  /**
   * Reschedule an engagement
   */
  public async rescheduleEngagement(engagement: Engagement, newScheduleTime?: Date): Promise<void> {
    // Find the queue item
    const queueItem = Array.from(this.queue.values()).find(item => 
      item.engagement.id === engagement.id
    );
    
    if (!queueItem) {
      throw new Error(`Engagement ${engagement.id} not found in queue`);
    }

    queueItem.scheduledFor = newScheduleTime || new Date(Date.now() + 300000); // 5 minutes default
    queueItem.status = 'pending';
    queueItem.attempts = 0;
    
    this.processingQueue.delete(queueItem.id);
    
    console.log(`Engagement rescheduled: ${engagement.type} for ${queueItem.scheduledFor}`);
  }

  /**
   * Cancel engagement
   */
  public async cancelEngagement(engagementId: string): Promise<void> {
    const queueItem = Array.from(this.queue.values()).find(item => 
      item.engagement.id === engagementId
    );
    
    if (!queueItem) {
      return; // Already processed or doesn't exist
    }

    queueItem.engagement.status = 'cancelled';
    this.queue.delete(queueItem.id);
    this.processingQueue.delete(queueItem.id);
    
    this.updateStats();
    
    console.log(`Engagement cancelled: ${engagementId}`);
  }

  /**
   * Cancel all engagements for a campaign
   */
  public async cancelCampaignEngagements(campaignId: string): Promise<void> {
    const toCancel = Array.from(this.queue.values()).filter(item =>
      this.isEngagementForCampaign(item.engagement, campaignId)
    );

    for (const item of toCancel) {
      await this.cancelEngagement(item.engagement.id);
    }
    
    console.log(`Cancelled ${toCancel.length} engagements for campaign ${campaignId}`);
  }

  /**
   * Get queue statistics
   */
  public getQueueStats(): QueueStats {
    return { ...this.stats };
  }

  /**
   * Get queue items with filtering
   */
  public getQueueItems(filter?: QueueFilter): EngagementQueue[] {
    let items = Array.from(this.queue.values());
    
    if (filter) {
      items = items.filter(item => this.matchesFilter(item, filter));
    }
    
    return items.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get processing history
   */
  public getProcessingHistory(hours: number = 24): Array<{
    timestamp: Date;
    completed: number;
    failed: number;
    throughput: number;
  }> {
    const history: Array<{
      timestamp: Date;
      completed: number;
      failed: number;
      throughput: number;
    }> = [];
    
    const cutoff = Date.now() - (hours * 3600000);
    
    // Aggregate by hour
    const hourlyData = new Map<number, { completed: number; failed: number }>();
    
    // Process completed items
    for (const item of this.completedQueue.values()) {
      if (item.engagement.executedAt && item.engagement.executedAt.getTime() > cutoff) {
        const hour = Math.floor(item.engagement.executedAt.getTime() / 3600000);
        const data = hourlyData.get(hour) || { completed: 0, failed: 0 };
        data.completed++;
        hourlyData.set(hour, data);
      }
    }
    
    // Process failed items
    for (const item of this.failedQueue.values()) {
      if (item.lastAttempt && item.lastAttempt.getTime() > cutoff) {
        const hour = Math.floor(item.lastAttempt.getTime() / 3600000);
        const data = hourlyData.get(hour) || { completed: 0, failed: 0 };
        data.failed++;
        hourlyData.set(hour, data);
      }
    }
    
    // Convert to array
    for (const [hour, data] of hourlyData.entries()) {
      history.push({
        timestamp: new Date(hour * 3600000),
        completed: data.completed,
        failed: data.failed,
        throughput: data.completed + data.failed
      });
    }
    
    return history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Pause queue processing
   */
  public pauseQueue(): void {
    // Implementation would pause the background processing
    console.log('Queue processing paused');
  }

  /**
   * Resume queue processing
   */
  public resumeQueue(): void {
    // Implementation would resume the background processing
    console.log('Queue processing resumed');
  }

  /**
   * Clear completed items from history
   */
  public clearHistory(olderThanHours: number = 168): void { // Default 7 days
    const cutoff = Date.now() - (olderThanHours * 3600000);
    
    // Clear old completed items
    for (const [id, item] of this.completedQueue.entries()) {
      if (item.engagement.executedAt && item.engagement.executedAt.getTime() < cutoff) {
        this.completedQueue.delete(id);
      }
    }
    
    // Clear old failed items
    for (const [id, item] of this.failedQueue.entries()) {
      if (item.lastAttempt && item.lastAttempt.getTime() < cutoff) {
        this.failedQueue.delete(id);
      }
    }
    
    this.updateStats();
  }

  /**
   * Calculate priority for engagement
   */
  private calculatePriority(engagement: Engagement): number {
    let priority = 50; // Base priority
    
    // Adjust based on engagement type
    switch (engagement.type) {
      case 'view':
        priority += 10; // Views are high priority
        break;
      case 'like':
        priority += 5;
        break;
      case 'comment':
        priority += 15; // Comments are highest priority
        break;
      case 'share':
        priority += 8;
        break;
    }
    
    // Adjust based on phase
    switch (engagement.phase) {
      case 'viral-growth':
        priority += 20;
        break;
      case 'discovery':
        priority += 15;
        break;
      case 'sustained-interest':
        priority += 10;
        break;
      case 'archive':
        priority += 5;
        break;
    }
    
    // Adjust based on scheduled time (older = higher priority)
    const age = Date.now() - engagement.scheduledAt.getTime();
    if (age > 0) {
      priority += Math.min(30, Math.floor(age / 3600000)); // +1 per hour late
    }
    
    return Math.max(1, Math.min(100, priority));
  }

  /**
   * Check if engagement belongs to campaign
   */
  private isEngagementForCampaign(engagement: Engagement, campaignId: string): boolean {
    // This would check your campaign-engagement relationship
    // For now, using a simple content-based check
    return engagement.contentId.includes(campaignId) || 
           engagement.metadata.context?.includes(campaignId);
  }

  /**
   * Handle processing timeout
   */
  private handleProcessingTimeout(queueId: string): void {
    if (this.processingQueue.has(queueId)) {
      console.warn(`Processing timeout for engagement ${queueId}`);
      this.markAsFailed(queueId, 'Processing timeout');
    }
  }

  /**
   * Update queue statistics
   */
  private updateStats(): void {
    this.stats.totalItems = this.queue.size + this.completedQueue.size + this.failedQueue.size;
    this.stats.pendingItems = Array.from(this.queue.values()).filter(item => item.status === 'pending').length;
    this.stats.processingItems = this.processingQueue.size;
    this.stats.completedItems = this.completedQueue.size;
    this.stats.failedItems = this.failedQueue.size;
    
    // Calculate average wait time
    const now = Date.now();
    const pendingItems = Array.from(this.queue.values()).filter(item => item.status === 'pending');
    if (pendingItems.length > 0) {
      const totalWaitTime = pendingItems.reduce((sum, item) => 
        sum + Math.max(0, now - item.scheduledFor.getTime()), 0
      );
      this.stats.averageWaitTime = totalWaitTime / pendingItems.length;
    }
    
    // Calculate throughput (last hour)
    const hourAgo = Date.now() - 3600000;
    const recentCompleted = Array.from(this.completedQueue.values()).filter(item =>
      item.engagement.executedAt && item.engagement.executedAt.getTime() > hourAgo
    );
    this.stats.throughputPerHour = recentCompleted.length;
  }

  /**
   * Check if queue item matches filter
   */
  private matchesFilter(item: EngagementQueue, filter: QueueFilter): boolean {
    if (filter.campaignId && !this.isEngagementForCampaign(item.engagement, filter.campaignId)) {
      return false;
    }
    
    if (filter.contentId && item.engagement.contentId !== filter.contentId) {
      return false;
    }
    
    if (filter.botId && item.engagement.botId !== filter.botId) {
      return false;
    }
    
    if (filter.type && item.engagement.type !== filter.type) {
      return false;
    }
    
    if (filter.phase && item.engagement.phase !== filter.phase) {
      return false;
    }
    
    if (filter.status && item.status !== filter.status) {
      return false;
    }
    
    if (filter.priority && item.priority !== filter.priority) {
      return false;
    }
    
    if (filter.scheduledAfter && item.scheduledFor.getTime() < filter.scheduledAfter.getTime()) {
      return false;
    }
    
    if (filter.scheduledBefore && item.scheduledFor.getTime() > filter.scheduledBefore.getTime()) {
      return false;
    }
    
    return true;
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.clearHistory();
      
      // Clean up stale processing items
      const staleTimeout = Date.now() - (this.processingTimeout * 2);
      for (const [queueId, item] of this.queue.entries()) {
        if (item.status === 'processing' && 
            item.lastAttempt && 
            item.lastAttempt.getTime() < staleTimeout) {
          this.markAsFailed(queueId, 'Stale processing item');
        }
      }
    }, this.cleanupInterval);
  }

  /**
   * Generate unique queue ID
   */
  private generateQueueId(): string {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}