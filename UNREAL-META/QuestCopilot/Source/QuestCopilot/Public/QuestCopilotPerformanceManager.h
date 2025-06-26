// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#pragma once

#include "CoreMinimal.h"
#include "HAL/CriticalSection.h"

/**
 * Performance Manager for Quest Dev Copilot
 * Handles caching, memory optimization, and performance monitoring
 */
class QUESTCOPILOT_API FQuestCopilotPerformanceManager
{
public:
    FQuestCopilotPerformanceManager();
    ~FQuestCopilotPerformanceManager();

    // === CACHING SYSTEM ===
    
    /** Cache analysis result */
    void CacheAnalysisResult(const FString& LogHash, const FString& Result);
    
    /** Get cached analysis result */
    bool GetCachedAnalysisResult(const FString& LogHash, FString& OutResult);
    
    /** Clear analysis cache */
    void ClearAnalysisCache();
    
    /** Get cache statistics */
    struct FCacheStats
    {
        int32 TotalEntries = 0;
        int32 HitCount = 0;
        int32 MissCount = 0;
        float HitRatio = 0.0f;
        int32 MemoryUsageBytes = 0;
    };
    FCacheStats GetCacheStats() const;

    // === MEMORY MANAGEMENT ===
    
    /** Monitor memory usage */
    void UpdateMemoryStats();
    
    /** Get current memory usage */
    struct FMemoryStats
    {
        int32 WidgetMemoryBytes = 0;
        int32 CacheMemoryBytes = 0;
        int32 TotalMemoryBytes = 0;
        float MemoryPressureRatio = 0.0f;
    };
    FMemoryStats GetMemoryStats() const;
    
    /** Optimize memory usage */
    void OptimizeMemoryUsage();
    
    /** Check if memory optimization is needed */
    bool ShouldOptimizeMemory() const;

    // === PERFORMANCE MONITORING ===
    
    /** Start performance timer */
    void StartTimer(const FString& TimerName);
    
    /** End performance timer and log result */
    void EndTimer(const FString& TimerName);
    
    /** Get average execution time */
    float GetAverageExecutionTime(const FString& TimerName) const;
    
    /** Get performance report */
    FString GetPerformanceReport() const;

    // === OPTIMIZATION SETTINGS ===
    
    /** Set cache size limit */
    void SetCacheSizeLimit(int32 MaxEntries);
    
    /** Set memory pressure threshold */
    void SetMemoryPressureThreshold(float Threshold);
    
    /** Enable/disable performance monitoring */
    void SetPerformanceMonitoringEnabled(bool bEnabled);

    // === LAZY LOADING ===
    
    /** Register widget for lazy loading */
    void RegisterLazyWidget(const FString& WidgetName, TFunction<TSharedRef<SWidget>()> WidgetFactory);
    
    /** Get or create lazy widget */
    TSharedPtr<SWidget> GetOrCreateLazyWidget(const FString& WidgetName);
    
    /** Clear lazy widget cache */
    void ClearLazyWidgets();

private:
    // Cache management
    TMap<FString, FString> AnalysisCache;
    TMap<FString, FDateTime> CacheTimestamps;
    mutable FCacheStats CacheStats;
    int32 MaxCacheEntries;
    
    // Memory management
    mutable FMemoryStats MemoryStats;
    float MemoryPressureThreshold;
    
    // Performance monitoring
    TMap<FString, FDateTime> ActiveTimers;
    TMap<FString, TArray<float>> ExecutionTimes;
    bool bPerformanceMonitoringEnabled;
    
    // Lazy loading
    TMap<FString, TFunction<TSharedRef<SWidget>()>> LazyWidgetFactories;
    TMap<FString, TWeakPtr<SWidget>> LazyWidgetCache;
    
    // Thread safety
    mutable FCriticalSection CacheLock;
    mutable FCriticalSection MemoryLock;
    mutable FCriticalSection TimerLock;
    mutable FCriticalSection LazyWidgetLock;
    
    // Cache maintenance
    void PerformCacheMaintenance();
    void RemoveOldCacheEntries();
    FString GenerateLogHash(const FString& LogContent);
    
    // Memory optimization
    void OptimizeCacheMemory();
    void OptimizeWidgetMemory();
    
    // Performance utilities
    void RecordExecutionTime(const FString& TimerName, float ExecutionTime);
    float CalculateAverageTime(const TArray<float>& Times) const;
};
