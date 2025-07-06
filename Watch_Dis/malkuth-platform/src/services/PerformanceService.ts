/**
 * Performance optimization service for Malkuth Platform
 * Handles caching, request optimization, and performance monitoring
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PerformanceMetrics {
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  geminiApiCalls: number;
  errors: number;
}

export class PerformanceService {
  private static instance: PerformanceService;
  private cache = new Map<string, CacheEntry<any>>();
  private metrics: PerformanceMetrics = {
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    geminiApiCalls: 0,
    errors: 0
  };
  private responseTimes: number[] = [];
  private readonly maxCacheSize = 1000;
  private readonly defaultTTL = parseInt(process.env.CACHE_TTL || '3600') * 1000;

  private constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanupExpiredCache(), 60000); // Every minute
  }

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Cache data with TTL
   */
  public async setCache<T>(key: string, data: T, ttl: number = this.defaultTTL): Promise<void> {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cached data
   */
  public async getCache<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.cacheMisses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.metrics.cacheMisses++;
      return null;
    }

    this.metrics.cacheHits++;
    return entry.data as T;
  }

  /**
   * Cache wrapper for async functions
   */
  public async cached<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = await this.getCache<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.setCache(key, result, ttl);
    return result;
  }

  /**
   * Measure and cache API response
   */
  public async measureAndCache<T>(
    operation: string,
    fn: () => Promise<T>,
    cacheKey?: string,
    ttl?: number
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      this.metrics.apiCalls++;
      
      let result: T;
      
      if (cacheKey) {
        result = await this.cached(cacheKey, fn, ttl);
      } else {
        result = await fn();
      }
      
      const responseTime = Date.now() - startTime;
      this.recordResponseTime(responseTime);
      
      return result;
    } catch (error) {
      this.metrics.errors++;
      const responseTime = Date.now() - startTime;
      this.recordResponseTime(responseTime);
      throw error;
    }
  }

  /**
   * Optimized batch processing
   */
  public async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 5,
    delayMs: number = 100
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      
      results.push(...batchResults);
      
      // Add delay between batches to prevent overwhelming the system
      if (i + batchSize < items.length && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return results;
  }

  /**
   * Debounced function execution
   */
  public debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          resolve(func(...args));
        }, wait);
      });
    };
  }

  /**
   * Throttled function execution
   */
  public throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => ReturnType<T> | undefined {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>): ReturnType<T> | undefined => {
      if (!inThrottle) {
        const result = func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
        return result;
      }
    };
  }

  /**
   * Memory-efficient data streaming
   */
  public async *streamData<T>(
    dataSource: () => AsyncGenerator<T>,
    chunkSize: number = 100
  ): AsyncGenerator<T[]> {
    let chunk: T[] = [];
    
    for await (const item of dataSource()) {
      chunk.push(item);
      
      if (chunk.length >= chunkSize) {
        yield chunk;
        chunk = [];
      }
    }
    
    if (chunk.length > 0) {
      yield chunk;
    }
  }

  /**
   * Preload critical data
   */
  public async preloadCriticalData(): Promise<void> {
    const criticalCacheKeys = [
      'active-bots',
      'system-config',
      'engagement-templates',
      'content-categories'
    ];

    await Promise.all(
      criticalCacheKeys.map(async (key) => {
        const cached = await this.getCache(key);
        if (!cached) {
          // Preload logic would go here
          console.log(`Preloading critical data: ${key}`);
        }
      })
    );
  }

  /**
   * Optimize Gemini API calls
   */
  public async optimizedGeminiCall<T>(
    prompt: string,
    cacheKey: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    this.metrics.geminiApiCalls++;
    
    return this.measureAndCache(
      'gemini-api',
      apiCall,
      `gemini:${cacheKey}`,
      30 * 60 * 1000 // 30 minutes cache for AI responses
    );
  }

  /**
   * Smart cache invalidation
   */
  public async invalidateCache(pattern: string): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`Invalidated ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): PerformanceMetrics & {
    cacheSize: number;
    cacheHitRate: number;
    uptime: number;
  } {
    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 
      ? (this.metrics.cacheHits / totalCacheRequests) * 100 
      : 0;

    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      uptime: process.uptime()
    };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      geminiApiCalls: 0,
      errors: 0
    };
    this.responseTimes = [];
  }

  /**
   * Compress data for storage
   */
  public compressData(data: any): string {
    // Simple compression (in production, use proper compression library)
    return JSON.stringify(data);
  }

  /**
   * Decompress data
   */
  public decompressData<T>(compressed: string): T {
    return JSON.parse(compressed) as T;
  }

  /**
   * Memory usage monitoring
   */
  public getMemoryUsage(): NodeJS.MemoryUsage & {
    cacheMemoryEstimate: number;
  } {
    const memUsage = process.memoryUsage();
    
    // Estimate cache memory usage
    let cacheMemoryEstimate = 0;
    for (const [key, entry] of this.cache) {
      cacheMemoryEstimate += Buffer.byteLength(key, 'utf8');
      cacheMemoryEstimate += Buffer.byteLength(JSON.stringify(entry.data), 'utf8');
    }

    return {
      ...memUsage,
      cacheMemoryEstimate
    };
  }

  /**
   * Performance recommendations
   */
  public getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();

    if (metrics.cacheHitRate < 50) {
      recommendations.push('Consider increasing cache TTL or improving cache key strategy');
    }

    if (metrics.averageResponseTime > 1000) {
      recommendations.push('Average response time is high - consider optimization');
    }

    if (metrics.errors / metrics.apiCalls > 0.05) {
      recommendations.push('Error rate is high - investigate error causes');
    }

    if (this.cache.size > this.maxCacheSize * 0.9) {
      recommendations.push('Cache is near capacity - consider increasing size or improving eviction');
    }

    if (metrics.geminiApiCalls > 1000) {
      recommendations.push('High Gemini API usage - consider more aggressive caching');
    }

    return recommendations;
  }

  /**
   * Record response time
   */
  private recordResponseTime(time: number): void {
    this.responseTimes.push(time);
    
    // Keep only last 100 response times for average calculation
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }
    
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * LRU eviction
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

export const performanceService = PerformanceService.getInstance();