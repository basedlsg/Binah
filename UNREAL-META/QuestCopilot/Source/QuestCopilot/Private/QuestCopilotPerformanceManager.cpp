// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#include "QuestCopilotPerformanceManager.h"
#include "QuestCopilotModule.h"
#include "Misc/SecureHash.h"
#include "Misc/DateTime.h"
#include "HAL/PlatformMemory.h"
#include "Engine/Engine.h"
#include "HAL/PlatformFilemanager.h"
#include "Misc/Paths.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonWriter.h"
#include "HAL/PlatformProcess.h"

DEFINE_LOG_CATEGORY_STATIC(LogQuestCopilotPerformance, Log, All);

FQuestCopilotPerformanceManager::FQuestCopilotPerformanceManager()
    : MaxCacheEntries(100)
    , MemoryPressureThreshold(0.8f)
    , bPerformanceMonitoringEnabled(true)
    , CacheHitCount(0)
    , CacheMissCount(0)
    , TotalMemoryUsed(0)
    , PeakMemoryUsed(0)
    , MaxCacheSize(50 * 1024 * 1024) // 50MB default
    , bMemoryOptimizationEnabled(true)
{
    InitializeCache();
    StartPerformanceMonitoring();
    UE_LOG(LogQuestCopilot, Log, TEXT("Performance Manager initialized"));
}

FQuestCopilotPerformanceManager::~FQuestCopilotPerformanceManager()
{
    ClearAnalysisCache();
    ClearLazyWidgets();
    StopPerformanceMonitoring();
}

void FQuestCopilotPerformanceManager::InitializeCache()
{
    UE_LOG(LogQuestCopilotPerformance, Log, TEXT("Initializing performance cache with max size: %d MB"), MaxCacheSize / (1024 * 1024));
    
    // Create cache directory if it doesn't exist
    FString CacheDirectory = FPaths::ProjectSavedDir() / TEXT("QuestCopilot") / TEXT("Cache");
    IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
    
    if (!PlatformFile.DirectoryExists(*CacheDirectory))
    {
        PlatformFile.CreateDirectoryTree(*CacheDirectory);
    }
    
    CachePath = CacheDirectory;
    LoadCacheFromDisk();
}

void FQuestCopilotPerformanceManager::StartPerformanceMonitoring()
{
    UE_LOG(LogQuestCopilotPerformance, Log, TEXT("Starting performance monitoring"));
    
    // Record initial memory stats
    FPlatformMemoryStats InitialStats = FPlatformMemory::GetStats();
    InitialMemoryUsed = InitialStats.UsedPhysical;
    
    MonitoringStartTime = FDateTime::Now();
}

void FQuestCopilotPerformanceManager::StopPerformanceMonitoring()
{
    if (MonitoringStartTime != FDateTime::MinValue())
    {
        FTimespan MonitoringDuration = FDateTime::Now() - MonitoringStartTime;
        UE_LOG(LogQuestCopilotPerformance, Log, TEXT("Performance monitoring stopped. Duration: %s"), *MonitoringDuration.ToString());
        
        // Log final performance stats
        LogPerformanceStats();
        
        // Save cache to disk
        SaveCacheToDisk();
    }
}

void FQuestCopilotPerformanceManager::CacheAnalysisResult(const FString& LogHash, const FString& Result)
{
    if (!bMemoryOptimizationEnabled)
    {
        return;
    }
    
    // Check if we need to evict old entries
    if (GetCurrentCacheSize() + Result.Len() > MaxCacheSize)
    {
        EvictOldestCacheEntries();
    }
    
    // Create cache entry
    FCacheEntry Entry;
    Entry.Result = Result;
    Entry.Timestamp = FDateTime::Now();
    Entry.AccessCount = 1;
    Entry.Size = Result.Len() * sizeof(TCHAR);
    
    // Store in memory cache
    AnalysisCache.Add(LogHash, Entry);
    TotalMemoryUsed += Entry.Size;
    
    if (TotalMemoryUsed > PeakMemoryUsed)
    {
        PeakMemoryUsed = TotalMemoryUsed;
    }
    
    UE_LOG(LogQuestCopilotPerformance, VeryVerbose, TEXT("Cached analysis result for hash: %s (Size: %d bytes)"), *LogHash, Entry.Size);
}

bool FQuestCopilotPerformanceManager::GetCachedAnalysisResult(const FString& LogHash, FString& OutResult)
{
    if (!bMemoryOptimizationEnabled)
    {
        CacheMissCount++;
        return false;
    }
    
    if (FCacheEntry* Entry = AnalysisCache.Find(LogHash))
    {
        // Update access statistics
        Entry->AccessCount++;
        Entry->LastAccessed = FDateTime::Now();
        
        OutResult = Entry->Result;
        CacheHitCount++;
        
        UE_LOG(LogQuestCopilotPerformance, VeryVerbose, TEXT("Cache hit for hash: %s (Access count: %d)"), *LogHash, Entry->AccessCount);
        return true;
    }
    
    CacheMissCount++;
    UE_LOG(LogQuestCopilotPerformance, VeryVerbose, TEXT("Cache miss for hash: %s"), *LogHash);
    return false;
}

void FQuestCopilotPerformanceManager::ClearAnalysisCache()
{
    FScopeLock Lock(&CacheLock);
    AnalysisCache.Empty();
    CacheTimestamps.Empty();
    CacheStats = FCacheStats();
    TotalMemoryUsed = 0;
    CacheHitCount = 0;
    CacheMissCount = 0;
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
    if (!bMemoryOptimizationEnabled)
    {
        return;
    }
    
    UE_LOG(LogQuestCopilotPerformance, Log, TEXT("Starting memory optimization"));
    
    int32 InitialCacheSize = AnalysisCache.Num();
    int64 InitialMemoryUsage = TotalMemoryUsed;
    
    // Remove entries that haven't been accessed recently
    FDateTime CutoffTime = FDateTime::Now() - FTimespan::FromHours(24);
    
    TArray<FString> KeysToRemove;
    for (auto& CachePair : AnalysisCache)
    {
        if (CachePair.Value.LastAccessed < CutoffTime && CachePair.Value.AccessCount < 3)
        {
            KeysToRemove.Add(CachePair.Key);
        }
    }
    
    // Remove old entries
    for (const FString& Key : KeysToRemove)
    {
        if (FCacheEntry* Entry = AnalysisCache.Find(Key))
        {
            TotalMemoryUsed -= Entry->Size;
        }
        AnalysisCache.Remove(Key);
    }
    
    // Compact the cache map
    AnalysisCache.Compact();
    
    int32 FinalCacheSize = AnalysisCache.Num();
    int64 FinalMemoryUsage = TotalMemoryUsed;
    
    UE_LOG(LogQuestCopilotPerformance, Log, TEXT("Memory optimization complete. Removed %d entries, freed %d bytes"), 
           InitialCacheSize - FinalCacheSize, InitialMemoryUsage - FinalMemoryUsage);
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
    // Simple hash implementation for demo purposes
    // In production, use a proper cryptographic hash
    uint32 Hash = FCrc::StrCrc32(*LogContent);
    return FString::Printf(TEXT("%08X"), Hash);
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

void FQuestCopilotPerformanceManager::LogPerformanceStats() const
{
    FQuestCopilotPerformanceStats Stats = GetPerformanceStats();
    
    UE_LOG(LogQuestCopilotPerformance, Log, TEXT("=== QUEST COPILOT PERFORMANCE STATS ==="));
    UE_LOG(LogQuestCopilotPerformance, Log, TEXT("Cache Hit Rate: %.2f%% (%d hits, %d misses)"), 
           Stats.CacheHitRate * 100.0f, Stats.CacheHitCount, Stats.CacheMissCount);
    UE_LOG(LogQuestCopilotPerformance, Log, TEXT("Memory Usage: Current=%d KB, Peak=%d KB"), 
           Stats.CurrentMemoryUsage / 1024, Stats.PeakMemoryUsage / 1024);
    UE_LOG(LogQuestCopilotPerformance, Log, TEXT("Cache Entries: %d"), Stats.CacheEntryCount);
    UE_LOG(LogQuestCopilotPerformance, Log, TEXT("Memory Optimization Savings: %.2f%%"), 
           Stats.MemoryOptimizationSavings * 100.0f);
    UE_LOG(LogQuestCopilotPerformance, Log, TEXT("========================================"));
}

void FQuestCopilotPerformanceManager::SetMemoryOptimizationEnabled(bool bEnabled)
{
    bMemoryOptimizationEnabled = bEnabled;
    UE_LOG(LogQuestCopilotPerformance, Log, TEXT("Memory optimization %s"), 
           bEnabled ? TEXT("enabled") : TEXT("disabled"));
    
    if (!bEnabled)
    {
        ClearCache();
    }
}

int64 FQuestCopilotPerformanceManager::GetCurrentCacheSize() const
{
    return TotalMemoryUsed;
}

void FQuestCopilotPerformanceManager::EvictOldestCacheEntries()
{
    // Sort entries by last accessed time and remove oldest ones
    TArray<TPair<FString, FCacheEntry*>> SortedEntries;
    
    for (auto& CachePair : AnalysisCache)
    {
        SortedEntries.Add(TPair<FString, FCacheEntry*>(CachePair.Key, &CachePair.Value));
    }
    
    // Sort by last accessed time (oldest first)
    SortedEntries.Sort([](const TPair<FString, FCacheEntry*>& A, const TPair<FString, FCacheEntry*>& B)
    {
        return A.Value->LastAccessed < B.Value->LastAccessed;
    });
    
    // Remove oldest 25% of entries
    int32 EntriesToRemove = FMath::Max(1, SortedEntries.Num() / 4);
    
    for (int32 i = 0; i < EntriesToRemove && i < SortedEntries.Num(); i++)
    {
        const FString& Key = SortedEntries[i].Key;
        if (FCacheEntry* Entry = AnalysisCache.Find(Key))
        {
            TotalMemoryUsed -= Entry->Size;
        }
        AnalysisCache.Remove(Key);
    }
    
    UE_LOG(LogQuestCopilotPerformance, Log, TEXT("Evicted %d old cache entries"), EntriesToRemove);
}

void FQuestCopilotPerformanceManager::LoadCacheFromDisk()
{
    FString CacheFilePath = CachePath / TEXT("analysis_cache.json");
    
    if (!FPaths::FileExists(CacheFilePath))
    {
        UE_LOG(LogQuestCopilotPerformance, Log, TEXT("No existing cache file found"));
        return;
    }
    
    FString JsonString;
    if (!FFileHelper::LoadFileToString(JsonString, *CacheFilePath))
    {
        UE_LOG(LogQuestCopilotPerformance, Warning, TEXT("Failed to load cache file"));
        return;
    }
    
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);
    
    if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
    {
        // Load cache entries from JSON
        const TSharedPtr<FJsonObject>* CacheObject;
        if (JsonObject->TryGetObjectField(TEXT("cache"), CacheObject))
        {
            for (auto& CachePair : (*CacheObject)->Values)
            {
                const TSharedPtr<FJsonObject>* EntryObject;
                if (CachePair.Value->TryGetObject(EntryObject))
                {
                    FCacheEntry Entry;
                    (*EntryObject)->TryGetStringField(TEXT("result"), Entry.Result);
                    
                    FString TimestampString;
                    if ((*EntryObject)->TryGetStringField(TEXT("timestamp"), TimestampString))
                    {
                        FDateTime::Parse(TimestampString, Entry.Timestamp);
                    }
                    
                    (*EntryObject)->TryGetNumberField(TEXT("accessCount"), Entry.AccessCount);
                    Entry.Size = Entry.Result.Len() * sizeof(TCHAR);
                    Entry.LastAccessed = Entry.Timestamp;
                    
                    AnalysisCache.Add(CachePair.Key, Entry);
                    TotalMemoryUsed += Entry.Size;
                }
            }
        }
        
        UE_LOG(LogQuestCopilotPerformance, Log, TEXT("Loaded %d cache entries from disk"), AnalysisCache.Num());
    }
}

void FQuestCopilotPerformanceManager::SaveCacheToDisk()
{
    FString CacheFilePath = CachePath / TEXT("analysis_cache.json");
    
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    TSharedPtr<FJsonObject> CacheObject = MakeShareable(new FJsonObject);
    
    // Save cache entries to JSON
    for (const auto& CachePair : AnalysisCache)
    {
        TSharedPtr<FJsonObject> EntryObject = MakeShareable(new FJsonObject);
        EntryObject->SetStringField(TEXT("result"), CachePair.Value.Result);
        EntryObject->SetStringField(TEXT("timestamp"), CachePair.Value.Timestamp.ToString());
        EntryObject->SetNumberField(TEXT("accessCount"), CachePair.Value.AccessCount);
        
        CacheObject->SetObjectField(CachePair.Key, EntryObject);
    }
    
    JsonObject->SetObjectField(TEXT("cache"), CacheObject);
    JsonObject->SetStringField(TEXT("version"), TEXT("1.0"));
    JsonObject->SetStringField(TEXT("savedAt"), FDateTime::Now().ToString());
    
    FString OutputString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);
    
    if (FFileHelper::SaveStringToFile(OutputString, *CacheFilePath))
    {
        UE_LOG(LogQuestCopilotPerformance, Log, TEXT("Saved cache to disk: %s"), *CacheFilePath);
    }
    else
    {
        UE_LOG(LogQuestCopilotPerformance, Warning, TEXT("Failed to save cache to disk"));
    }
}

FQuestCopilotPerformanceStats FQuestCopilotPerformanceManager::GetPerformanceStats() const
{
    FQuestCopilotPerformanceStats Stats;
    
    Stats.CacheHitCount = CacheHitCount;
    Stats.CacheMissCount = CacheMissCount;
    Stats.CacheHitRate = (CacheHitCount + CacheMissCount) > 0 ? 
                        (float)CacheHitCount / (float)(CacheHitCount + CacheMissCount) : 0.0f;
    
    Stats.CurrentMemoryUsage = TotalMemoryUsed;
    Stats.PeakMemoryUsage = PeakMemoryUsed;
    Stats.CacheEntryCount = AnalysisCache.Num();
    
    // Get current system memory stats
    FPlatformMemoryStats CurrentStats = FPlatformMemory::GetStats();
    Stats.SystemMemoryUsage = CurrentStats.UsedPhysical;
    Stats.MemoryOptimizationSavings = InitialMemoryUsed > 0 ? 
                                     (float)(InitialMemoryUsed - CurrentStats.UsedPhysical) / (float)InitialMemoryUsed : 0.0f;
    
    return Stats;
}
