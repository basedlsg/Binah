// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#include "QuestCopilotOfflineAnalyzer.h"
#include "QuestCopilotModule.h"
#include "Misc/Regex.h"
#include "Engine/Engine.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonWriter.h"
#include "HAL/PlatformFilemanager.h"
#include "Misc/Paths.h"
#include "Misc/DateTime.h"

DEFINE_LOG_CATEGORY_STATIC(LogQuestCopilotOffline, Log, All);

FQuestCopilotOfflineAnalyzer::FQuestCopilotOfflineAnalyzer()
    : bInitialized(false)
    , AnalysisVersion(TEXT("1.0"))
{
    InitializePatterns();
    LoadKnowledgeBase();
}

FQuestCopilotOfflineAnalyzer::~FQuestCopilotOfflineAnalyzer()
{
    SaveAnalysisStats();
}

void FQuestCopilotOfflineAnalyzer::InitializePatterns()
{
    UE_LOG(LogQuestCopilotOffline, Log, TEXT("Initializing VR-specific error patterns"));
    
    // Quest/VR Specific Patterns
    ErrorPatterns.Add(FErrorPattern{
        TEXT("Quest Guardian Boundary"),
        TEXT("Guardian.*boundary|Boundary.*guardian|OVR.*Guardian"),
        EErrorSeverity::Warning,
        TEXT("Quest Guardian boundary system issue. Check room setup and tracking."),
        TArray<FString>{TEXT("Recalibrate Guardian boundary"), TEXT("Clear Guardian history"), TEXT("Check room lighting")}
    });
    
    ErrorPatterns.Add(FErrorPattern{
        TEXT("Hand Tracking Lost"),
        TEXT("Hand.*tracking.*lost|OVR.*Hand.*tracking|HandTracking.*failed"),
        EErrorSeverity::Warning,
        TEXT("Hand tracking system lost tracking. Ensure hands are visible to cameras."),
        TArray<FString>{TEXT("Improve lighting conditions"), TEXT("Keep hands in camera view"), TEXT("Check hand tracking settings")}
    });
    
    ErrorPatterns.Add(FErrorPattern{
        TEXT("Oculus SDK Error"),
        TEXT("OVR.*Error|LibOVR.*failed|Oculus.*SDK.*error"),
        EErrorSeverity::High,
        TEXT("Oculus SDK integration error. Check SDK version compatibility."),
        TArray<FString>{TEXT("Update Oculus SDK"), TEXT("Verify SDK integration"), TEXT("Check platform settings")}
    });
    
    ErrorPatterns.Add(FErrorPattern{
        TEXT("VR Rendering Pipeline"),
        TEXT("VR.*render.*failed|Stereo.*render.*error|Eye.*buffer.*error"),
        EErrorSeverity::High,
        TEXT("VR rendering pipeline error. Check stereo rendering configuration."),
        TArray<FString>{TEXT("Verify VR render targets"), TEXT("Check stereo rendering settings"), TEXT("Update graphics drivers")}
    });
    
    ErrorPatterns.Add(FErrorPattern{
        TEXT("Quest Performance Warning"),
        TEXT("Quest.*performance|Mobile.*performance.*warning|Thermal.*throttling"),
        EErrorSeverity::Medium,
        TEXT("Quest performance issue detected. Device may be overheating or overloaded."),
        TArray<FString>{TEXT("Reduce rendering complexity"), TEXT("Optimize draw calls"), TEXT("Check thermal state")}
    });
    
    // Unreal Engine VR Patterns
    ErrorPatterns.Add(FErrorPattern{
        TEXT("VR Template Missing"),
        TEXT("VR.*template.*not.*found|VRPawn.*missing|VR.*GameMode.*error"),
        EErrorSeverity::Medium,
        TEXT("VR template components missing. Ensure VR template is properly configured."),
        TArray<FString>{TEXT("Add VR template"), TEXT("Configure VR Pawn"), TEXT("Set VR GameMode")}
    });
    
    ErrorPatterns.Add(FErrorPattern{
        TEXT("Motion Controller Error"),
        TEXT("Motion.*controller.*failed|VR.*controller.*error|Input.*VR.*failed"),
        EErrorSeverity::Medium,
        TEXT("VR motion controller input error. Check controller bindings and input system."),
        TArray<FString>{TEXT("Verify input bindings"), TEXT("Check controller drivers"), TEXT("Test input actions")}
    });
    
    ErrorPatterns.Add(FErrorPattern{
        TEXT("XR System Initialization"),
        TEXT("XR.*system.*failed|HMD.*initialization.*error|VR.*headset.*not.*found"),
        EErrorSeverity::High,
        TEXT("XR/VR system failed to initialize. Check headset connection and drivers."),
        TArray<FString>{TEXT("Restart VR runtime"), TEXT("Check USB connections"), TEXT("Update VR drivers")}
    });
    
    // Android/Quest Platform Patterns
    ErrorPatterns.Add(FErrorPattern{
        TEXT("Android Package Error"),
        TEXT("Android.*package.*error|APK.*build.*failed|Quest.*deployment.*error"),
        EErrorSeverity::High,
        TEXT("Android packaging error for Quest deployment. Check build configuration."),
        TArray<FString>{TEXT("Verify Android SDK"), TEXT("Check package settings"), TEXT("Clean and rebuild")}
    });
    
    ErrorPatterns.Add(FErrorPattern{
        TEXT("Quest Store Validation"),
        TEXT("Store.*validation.*failed|Quest.*store.*requirements|Oculus.*store.*error"),
        EErrorSeverity::Medium,
        TEXT("Quest Store validation requirements not met. Check store compliance."),
        TArray<FString>{TEXT("Review store requirements"), TEXT("Update app manifest"), TEXT("Check content guidelines")}
    });
    
    // Performance and Memory Patterns
    ErrorPatterns.Add(FErrorPattern{
        TEXT("Mobile Memory Warning"),
        TEXT("Mobile.*memory.*warning|Quest.*memory.*low|Android.*out.*of.*memory"),
        EErrorSeverity::High,
        TEXT("Quest device running low on memory. Optimize memory usage."),
        TArray<FString>{TEXT("Reduce texture sizes"), TEXT("Optimize mesh complexity"), TEXT("Use object pooling")}
    });
    
    ErrorPatterns.Add(FErrorPattern{
        TEXT("Frame Rate Drop"),
        TEXT("Frame.*rate.*drop|FPS.*below.*72|Rendering.*slow|Draw.*call.*limit"),
        EErrorSeverity::Medium,
        TEXT("Frame rate performance issue. Quest requires consistent 72/90 FPS."),
        TArray<FString>{TEXT("Optimize draw calls"), TEXT("Reduce polygon count"), TEXT("Use LOD system")}
    });
    
    bInitialized = true;
    UE_LOG(LogQuestCopilotOffline, Log, TEXT("Initialized %d error patterns"), ErrorPatterns.Num());
}

void FQuestCopilotOfflineAnalyzer::LoadKnowledgeBase()
{
    FString KnowledgeBasePath = FPaths::ProjectPluginsDir() / TEXT("QuestCopilot") / TEXT("Resources") / TEXT("knowledge_base.json");
    
    if (!FPaths::FileExists(KnowledgeBasePath))
    {
        UE_LOG(LogQuestCopilotOffline, Warning, TEXT("Knowledge base file not found: %s"), *KnowledgeBasePath);
        CreateDefaultKnowledgeBase();
        return;
    }
    
    FString JsonString;
    if (!FFileHelper::LoadFileToString(JsonString, *KnowledgeBasePath))
    {
        UE_LOG(LogQuestCopilotOffline, Warning, TEXT("Failed to load knowledge base"));
        return;
    }
    
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);
    
    if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
    {
        // Load additional patterns from knowledge base
        const TArray<TSharedPtr<FJsonValue>>* PatternsArray;
        if (JsonObject->TryGetArrayField(TEXT("patterns"), PatternsArray))
        {
            for (const auto& PatternValue : *PatternsArray)
            {
                const TSharedPtr<FJsonObject>* PatternObject;
                if (PatternValue->TryGetObject(PatternObject))
                {
                    FErrorPattern Pattern;
                    (*PatternObject)->TryGetStringField(TEXT("name"), Pattern.Name);
                    (*PatternObject)->TryGetStringField(TEXT("regex"), Pattern.RegexPattern);
                    (*PatternObject)->TryGetStringField(TEXT("description"), Pattern.Description);
                    
                    FString SeverityString;
                    if ((*PatternObject)->TryGetStringField(TEXT("severity"), SeverityString))
                    {
                        if (SeverityString == TEXT("High"))
                            Pattern.Severity = EErrorSeverity::High;
                        else if (SeverityString == TEXT("Medium"))
                            Pattern.Severity = EErrorSeverity::Medium;
                        else
                            Pattern.Severity = EErrorSeverity::Warning;
                    }
                    
                    const TArray<TSharedPtr<FJsonValue>>* SolutionsArray;
                    if ((*PatternObject)->TryGetArrayField(TEXT("solutions"), SolutionsArray))
                    {
                        for (const auto& SolutionValue : *SolutionsArray)
                        {
                            FString Solution;
                            if (SolutionValue->TryGetString(Solution))
                            {
                                Pattern.PossibleSolutions.Add(Solution);
                            }
                        }
                    }
                    
                    ErrorPatterns.Add(Pattern);
                }
            }
        }
        
        UE_LOG(LogQuestCopilotOffline, Log, TEXT("Loaded knowledge base with %d total patterns"), ErrorPatterns.Num());
    }
}

FQuestCopilotAnalysisResult FQuestCopilotOfflineAnalyzer::AnalyzeLogs(const FString& LogContent)
{
    if (!bInitialized)
    {
        UE_LOG(LogQuestCopilotOffline, Warning, TEXT("Analyzer not initialized"));
        return FQuestCopilotAnalysisResult();
    }
    
    UE_LOG(LogQuestCopilotOffline, Log, TEXT("Starting offline analysis of %d character log"), LogContent.Len());
    
    FQuestCopilotAnalysisResult Result;
    Result.AnalysisTimestamp = FDateTime::Now();
    Result.AnalysisVersion = AnalysisVersion;
    Result.LogSize = LogContent.Len();
    Result.AnalysisType = TEXT("Offline Pattern Matching");
    
    // Split log into lines for analysis
    TArray<FString> LogLines;
    LogContent.ParseIntoArrayLines(LogLines);
    Result.TotalLines = LogLines.Num();
    
    // Analyze each line against patterns
    TMap<FString, int32> PatternMatches;
    TArray<FString> MatchedLines;
    
    for (int32 LineIndex = 0; LineIndex < LogLines.Num(); LineIndex++)
    {
        const FString& Line = LogLines[LineIndex];
        
        for (const FErrorPattern& Pattern : ErrorPatterns)
        {
            FRegexPattern RegexPattern(Pattern.RegexPattern, ERegexPatternFlags::CaseInsensitive);
            FRegexMatcher Matcher(RegexPattern, Line);
            
            if (Matcher.FindNext())
            {
                PatternMatches.FindOrAdd(Pattern.Name)++;
                MatchedLines.Add(FString::Printf(TEXT("Line %d: %s"), LineIndex + 1, *Line));
                
                // Create error entry
                FDetectedError Error;
                Error.ErrorType = Pattern.Name;
                Error.Severity = Pattern.Severity;
                Error.Description = Pattern.Description;
                Error.LineNumber = LineIndex + 1;
                Error.LogLine = Line;
                Error.PossibleSolutions = Pattern.PossibleSolutions;
                Error.Confidence = CalculateConfidence(Pattern, Line);
                
                Result.DetectedErrors.Add(Error);
                
                UE_LOG(LogQuestCopilotOffline, VeryVerbose, TEXT("Pattern match: %s at line %d"), *Pattern.Name, LineIndex + 1);
            }
        }
    }
    
    // Generate summary
    Result.ErrorCount = Result.DetectedErrors.Num();
    Result.UniqueErrorTypes = PatternMatches.Num();
    
    // Calculate severity distribution
    for (const FDetectedError& Error : Result.DetectedErrors)
    {
        switch (Error.Severity)
        {
        case EErrorSeverity::High:
            Result.HighSeverityCount++;
            break;
        case EErrorSeverity::Medium:
            Result.MediumSeverityCount++;
            break;
        case EErrorSeverity::Warning:
            Result.WarningSeverityCount++;
            break;
        }
    }
    
    // Generate recommendations
    GenerateRecommendations(Result);
    
    // Performance analysis
    AnalyzePerformanceMetrics(LogContent, Result);
    
    UE_LOG(LogQuestCopilotOffline, Log, TEXT("Analysis complete: %d errors found across %d patterns"), 
           Result.ErrorCount, Result.UniqueErrorTypes);
    
    // Update statistics
    AnalysisStats.TotalAnalyses++;
    AnalysisStats.TotalErrorsFound += Result.ErrorCount;
    AnalysisStats.LastAnalysisTime = FDateTime::Now();
    
    return Result;
}

float FQuestCopilotOfflineAnalyzer::CalculateConfidence(const FErrorPattern& Pattern, const FString& LogLine)
{
    float Confidence = 0.5f; // Base confidence
    
    // Increase confidence based on pattern specificity
    if (Pattern.RegexPattern.Contains(TEXT("Quest")) || Pattern.RegexPattern.Contains(TEXT("OVR")))
    {
        Confidence += 0.3f; // VR-specific patterns are more confident
    }
    
    // Increase confidence for error severity indicators
    if (LogLine.Contains(TEXT("Error")) || LogLine.Contains(TEXT("FATAL")))
    {
        Confidence += 0.2f;
    }
    else if (LogLine.Contains(TEXT("Warning")) || LogLine.Contains(TEXT("WARN")))
    {
        Confidence += 0.1f;
    }
    
    // Increase confidence for Quest-specific terms
    if (LogLine.Contains(TEXT("Quest")) || LogLine.Contains(TEXT("Oculus")) || LogLine.Contains(TEXT("Android")))
    {
        Confidence += 0.1f;
    }
    
    return FMath::Clamp(Confidence, 0.0f, 1.0f);
}

void FQuestCopilotOfflineAnalyzer::GenerateRecommendations(FQuestCopilotAnalysisResult& Result)
{
    // High-level recommendations based on error patterns
    if (Result.HighSeverityCount > 0)
    {
        Result.Recommendations.Add(TEXT("Critical issues detected. Address high-severity errors first."));
    }
    
    if (Result.ErrorCount > 20)
    {
        Result.Recommendations.Add(TEXT("Multiple errors detected. Consider systematic debugging approach."));
    }
    
    // VR-specific recommendations
    bool bHasVRErrors = Result.DetectedErrors.ContainsByPredicate([](const FDetectedError& Error)
    {
        return Error.ErrorType.Contains(TEXT("VR")) || Error.ErrorType.Contains(TEXT("Quest"));
    });
    
    if (bHasVRErrors)
    {
        Result.Recommendations.Add(TEXT("VR-specific issues detected. Check Quest development guidelines."));
        Result.Recommendations.Add(TEXT("Ensure VR template and components are properly configured."));
    }
    
    // Performance recommendations
    bool bHasPerformanceErrors = Result.DetectedErrors.ContainsByPredicate([](const FDetectedError& Error)
    {
        return Error.ErrorType.Contains(TEXT("Performance")) || Error.ErrorType.Contains(TEXT("Memory"));
    });
    
    if (bHasPerformanceErrors)
    {
        Result.Recommendations.Add(TEXT("Performance issues detected. Optimize for Quest hardware constraints."));
        Result.Recommendations.Add(TEXT("Consider using Unreal Engine's VR performance profiling tools."));
    }
}

void FQuestCopilotOfflineAnalyzer::AnalyzePerformanceMetrics(const FString& LogContent, FQuestCopilotAnalysisResult& Result)
{
    // Extract performance metrics from logs
    FRegexPattern FPSPattern(TEXT("FPS[:\\s]*(\\d+)"), ERegexPatternFlags::CaseInsensitive);
    FRegexMatcher FPSMatcher(FPSPattern, LogContent);
    
    TArray<int32> FPSValues;
    while (FPSMatcher.FindNext())
    {
        FString FPSString = FPSMatcher.GetCaptureGroup(1);
        FPSValues.Add(FCString::Atoi(*FPSString));
    }
    
    if (FPSValues.Num() > 0)
    {
        int32 AverageFPS = 0;
        for (int32 FPS : FPSValues)
        {
            AverageFPS += FPS;
        }
        AverageFPS /= FPSValues.Num();
        
        Result.PerformanceMetrics.Add(TEXT("AverageFPS"), FString::FromInt(AverageFPS));
        
        if (AverageFPS < 72)
        {
            Result.Recommendations.Add(TEXT("Frame rate below Quest target (72 FPS). Optimize rendering performance."));
        }
    }
    
    // Extract memory usage
    FRegexPattern MemoryPattern(TEXT("Memory[:\\s]*(\\d+)\\s*MB"), ERegexPatternFlags::CaseInsensitive);
    FRegexMatcher MemoryMatcher(MemoryPattern, LogContent);
    
    if (MemoryMatcher.FindNext())
    {
        FString MemoryString = MemoryMatcher.GetCaptureGroup(1);
        int32 MemoryMB = FCString::Atoi(*MemoryString);
        Result.PerformanceMetrics.Add(TEXT("MemoryUsageMB"), FString::FromInt(MemoryMB));
        
        if (MemoryMB > 2048) // Quest 2 has ~3GB available to apps
        {
            Result.Recommendations.Add(TEXT("High memory usage detected. Optimize memory consumption for Quest."));
        }
    }
}

void FQuestCopilotOfflineAnalyzer::CreateDefaultKnowledgeBase()
{
    UE_LOG(LogQuestCopilotOffline, Log, TEXT("Creating default knowledge base"));
    
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField(TEXT("version"), TEXT("1.0"));
    JsonObject->SetStringField(TEXT("description"), TEXT("Quest Dev Copilot Default Knowledge Base"));
    
    TArray<TSharedPtr<FJsonValue>> PatternsArray;
    
    // Add a sample pattern to the knowledge base
    TSharedPtr<FJsonObject> SamplePattern = MakeShareable(new FJsonObject);
    SamplePattern->SetStringField(TEXT("name"), TEXT("Sample VR Error"));
    SamplePattern->SetStringField(TEXT("regex"), TEXT("VR.*sample.*error"));
    SamplePattern->SetStringField(TEXT("severity"), TEXT("Medium"));
    SamplePattern->SetStringField(TEXT("description"), TEXT("Sample VR error pattern"));
    
    TArray<TSharedPtr<FJsonValue>> SolutionsArray;
    SolutionsArray.Add(MakeShareable(new FJsonValueString(TEXT("Check VR configuration"))));
    SamplePattern->SetArrayField(TEXT("solutions"), SolutionsArray);
    
    PatternsArray.Add(MakeShareable(new FJsonValueObject(SamplePattern)));
    JsonObject->SetArrayField(TEXT("patterns"), PatternsArray);
    
    // Save to file
    FString OutputString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);
    
    FString KnowledgeBasePath = FPaths::ProjectPluginsDir() / TEXT("QuestCopilot") / TEXT("Resources") / TEXT("knowledge_base.json");
    FString Directory = FPaths::GetPath(KnowledgeBasePath);
    
    IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
    if (!PlatformFile.DirectoryExists(*Directory))
    {
        PlatformFile.CreateDirectoryTree(*Directory);
    }
    
    FFileHelper::SaveStringToFile(OutputString, *KnowledgeBasePath);
}

void FQuestCopilotOfflineAnalyzer::SaveAnalysisStats()
{
    FString StatsPath = FPaths::ProjectSavedDir() / TEXT("QuestCopilot") / TEXT("analysis_stats.json");
    
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetNumberField(TEXT("totalAnalyses"), AnalysisStats.TotalAnalyses);
    JsonObject->SetNumberField(TEXT("totalErrorsFound"), AnalysisStats.TotalErrorsFound);
    JsonObject->SetStringField(TEXT("lastAnalysisTime"), AnalysisStats.LastAnalysisTime.ToString());
    JsonObject->SetStringField(TEXT("version"), AnalysisVersion);
    
    FString OutputString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);
    
    FString Directory = FPaths::GetPath(StatsPath);
    IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
    if (!PlatformFile.DirectoryExists(*Directory))
    {
        PlatformFile.CreateDirectoryTree(*Directory);
    }
    
    FFileHelper::SaveStringToFile(OutputString, *StatsPath);
}

bool FQuestCopilotOfflineAnalyzer::IsInitialized() const
{
    return bInitialized;
}

int32 FQuestCopilotOfflineAnalyzer::GetPatternCount() const
{
    return ErrorPatterns.Num();
}

FString FQuestCopilotOfflineAnalyzer::GetAnalysisVersion() const
{
    return AnalysisVersion;
}
