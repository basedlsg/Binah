// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#include "QuestCopilotPerformanceManager.h"
#include "QuestCopilotModule.h"
#include "Misc/SecureHash.h"
#include "Misc/DateTime.h"
#include "HAL/PlatformMemory.h"

FQuestCopilotPerformanceManager::FQuestCopilotPerformanceManager()
    : MaxCacheEntries(100)
    , MemoryPressureThreshold(0.8f)
    , bPerformanceMonitoringEnabled(true)
{
    UE_LOG(LogQuestCopilot, Log, TEXT("Performance Manager initialized"));
}

FQuestCopilotPerformanceManager::~FQuestCopilotPerformanceManager()
{
    ClearAnalysisCache();
    ClearLazyWidgets();
}

void FQuestCopilotPerformanceManager::CacheAnalysisResult(const FString& LogHash, const FString& Result)
{
    FScopeLock Lock(&CacheLock);
    
    if (AnalysisCache.Num() >= MaxCacheEntries)
    {
        // Remove oldest entry
        FString OldestKey;
        FDateTime OldestTime = FDateTime::MaxValue();
        
        for (const auto& Pair : CacheTimestamps)
        {
            if (Pair.Value < OldestTime)
            {
                OldestTime = Pair.Value;
                OldestKey = Pair.Key;
            }
        }
        
        if (!OldestKey.IsEmpty())
        {
            AnalysisCache.Remove(OldestKey);
            CacheTimestamps.Remove(OldestKey);
        }
    }
    
    AnalysisCache.Add(LogHash, Result);
    CacheTimestamps.Add(LogHash, FDateTime::Now());
}

bool FQuestCopilotPerformanceManager::GetCachedAnalysisResult(const FString& LogHash, FString& OutResult)
{
    FScopeLock Lock(&CacheLock);
    
    if (const FString* CachedResult = AnalysisCache.Find(LogHash))
    {
        OutResult = *CachedResult;
        CacheStats.HitCount++;
        return true;
    }
    
    CacheStats.MissCount++;
    return false;
}

void FQuestCopilotPerformanceManager::ClearAnalysisCache()
{
    FScopeLock Lock(&CacheLock);
    AnalysisCache.Empty();
    CacheTimestamps.Empty();
    CacheStats = FCacheStats();
}

FQuestCopilotPerformanceManager::FCacheStats FQuestCopilotPerformanceManager::GetCacheStats() const
{
    FScopeLock Lock(&CacheLock);
    FCacheStats Stats = CacheStats;
    Stats.TotalEntries = AnalysisCache.Num();
    
    int32 TotalRequests = Stats.HitCount + Stats.MissCount;
    if (TotalRequests > 0)
    {
        Stats.HitRatio = (float)Stats.HitCount / TotalRequests;
    }
    
    return Stats;
}

void FQuestCopilotPerformanceManager::UpdateMemoryStats()
{
    FScopeLock Lock(&MemoryLock);
    FPlatformMemoryStats PlatformStats = FPlatformMemory::GetStats();
    MemoryStats.TotalMemoryBytes = PlatformStats.TotalPhysical;
}

FQuestCopilotPerformanceManager::FMemoryStats FQuestCopilotPerformanceManager::GetMemoryStats() const
{
    FScopeLock Lock(&MemoryLock);
    return MemoryStats;
}

void FQuestCopilotPerformanceManager::OptimizeMemoryUsage()
{
    // Basic implementation
}

bool FQuestCopilotPerformanceManager::ShouldOptimizeMemory() const
{
    return MemoryStats.MemoryPressureRatio > MemoryPressureThreshold;
}

void FQuestCopilotPerformanceManager::StartTimer(const FString& TimerName)
{
    if (!bPerformanceMonitoringEnabled) return;
    FScopeLock Lock(&TimerLock);
    ActiveTimers.Add(TimerName, FDateTime::Now());
}

void FQuestCopilotPerformanceManager::EndTimer(const FString& TimerName)
{
    if (!bPerformanceMonitoringEnabled) return;
    FScopeLock Lock(&TimerLock);
    
    if (const FDateTime* StartTime = ActiveTimers.Find(TimerName))
    {
        float ExecutionTime = (FDateTime::Now() - *StartTime).GetTotalMilliseconds();
        RecordExecutionTime(TimerName, ExecutionTime);
        ActiveTimers.Remove(TimerName);
    }
}

float FQuestCopilotPerformanceManager::GetAverageExecutionTime(const FString& TimerName) const
{
    FScopeLock Lock(&TimerLock);
    if (const TArray<float>* Times = ExecutionTimes.Find(TimerName))
    {
        return CalculateAverageTime(*Times);
    }
    return 0.0f;
}

FString FQuestCopilotPerformanceManager::GetPerformanceReport() const
{
    return TEXT("Performance Manager: Basic implementation");
}

void FQuestCopilotPerformanceManager::SetCacheSizeLimit(int32 MaxEntries)
{
    MaxCacheEntries = FMath::Max(10, MaxEntries);
}

void FQuestCopilotPerformanceManager::SetMemoryPressureThreshold(float Threshold)
{
    MemoryPressureThreshold = FMath::Clamp(Threshold, 0.1f, 0.95f);
}

void FQuestCopilotPerformanceManager::SetPerformanceMonitoringEnabled(bool bEnabled)
{
    bPerformanceMonitoringEnabled = bEnabled;
}

void FQuestCopilotPerformanceManager::RegisterLazyWidget(const FString& WidgetName, TFunction<TSharedRef<SWidget>()> WidgetFactory)
{
    FScopeLock Lock(&LazyWidgetLock);
    LazyWidgetFactories.Add(WidgetName, WidgetFactory);
}

TSharedPtr<SWidget> FQuestCopilotPerformanceManager::GetOrCreateLazyWidget(const FString& WidgetName)
{
    return nullptr; // Basic implementation
}

void FQuestCopilotPerformanceManager::ClearLazyWidgets()
{
    FScopeLock Lock(&LazyWidgetLock);
    LazyWidgetCache.Empty();
    LazyWidgetFactories.Empty();
}

void FQuestCopilotPerformanceManager::PerformCacheMaintenance()
{
    // Basic implementation
}

void FQuestCopilotPerformanceManager::RemoveOldCacheEntries()
{
    // Basic implementation
}

FString FQuestCopilotPerformanceManager::GenerateLogHash(const FString& LogContent)
{
    return FMD5::HashAnsiString(*LogContent);
}

void FQuestCopilotPerformanceManager::OptimizeCacheMemory()
{
    // Basic implementation
}

void FQuestCopilotPerformanceManager::OptimizeWidgetMemory()
{
    // Basic implementation
}

void FQuestCopilotPerformanceManager::RecordExecutionTime(const FString& TimerName, float ExecutionTime)
{
    TArray<float>& Times = ExecutionTimes.FindOrAdd(TimerName);
    Times.Add(ExecutionTime);
    
    if (Times.Num() > 100)
    {
        Times.RemoveAt(0);
    }
}

float FQuestCopilotPerformanceManager::CalculateAverageTime(const TArray<float>& Times) const
{
    if (Times.Num() == 0) return 0.0f;
    
    float Sum = 0.0f;
    for (float Time : Times)
    {
        Sum += Time;
    }
    
    return Sum / Times.Num();
}
