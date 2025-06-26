// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#include "QuestCopilotOfflineAnalyzer.h"
#include "QuestCopilotModule.h"
#include "Misc/Regex.h"

FQuestCopilotOfflineAnalyzer::FQuestCopilotOfflineAnalyzer()
    : AnalysisDepth(1)
{
    InitializeErrorPatterns();
    UE_LOG(LogQuestCopilot, Log, TEXT("Offline Analyzer initialized"));
}

FQuestCopilotOfflineAnalyzer::~FQuestCopilotOfflineAnalyzer()
{
}

void FQuestCopilotOfflineAnalyzer::InitializeErrorPatterns()
{
    InitializeBlueprintPatterns();
    InitializeBuildPatterns();
    InitializeMemoryPatterns();
    InitializeRenderingPatterns();
    InitializeVRPatterns();
}

void FQuestCopilotOfflineAnalyzer::InitializeBlueprintPatterns()
{
    TArray<FErrorPattern>& Patterns = ErrorPatterns.FindOrAdd(TEXT("Blueprint"));
    CategoryEnabled.Add(TEXT("Blueprint"), true);
    
    FErrorPattern Pattern;
    Pattern.Category = TEXT("Blueprint");
    Pattern.Pattern = TEXT("Blueprint.*Error");
    Pattern.Description = TEXT("Blueprint compilation error");
    Pattern.Solutions.Add(TEXT("Check Blueprint node connections"));
    Pattern.Solutions.Add(TEXT("Verify variable types"));
    Pattern.Solutions.Add(TEXT("Recompile Blueprint"));
    Pattern.Confidence = 0.8f;
    Patterns.Add(Pattern);
}

void FQuestCopilotOfflineAnalyzer::InitializeBuildPatterns()
{
    TArray<FErrorPattern>& Patterns = ErrorPatterns.FindOrAdd(TEXT("Build"));
    CategoryEnabled.Add(TEXT("Build"), true);
    
    FErrorPattern Pattern;
    Pattern.Category = TEXT("Build");
    Pattern.Pattern = TEXT("(Build|Packaging).*Error");
    Pattern.Description = TEXT("Build or packaging error");
    Pattern.Solutions.Add(TEXT("Clean and rebuild project"));
    Pattern.Solutions.Add(TEXT("Check project settings"));
    Pattern.Solutions.Add(TEXT("Verify asset references"));
    Pattern.Confidence = 0.75f;
    Patterns.Add(Pattern);
}

void FQuestCopilotOfflineAnalyzer::InitializeMemoryPatterns()
{
    TArray<FErrorPattern>& Patterns = ErrorPatterns.FindOrAdd(TEXT("Memory"));
    CategoryEnabled.Add(TEXT("Memory"), true);
    
    FErrorPattern Pattern;
    Pattern.Category = TEXT("Memory");
    Pattern.Pattern = TEXT("(Memory|OutOfMemory)");
    Pattern.Description = TEXT("Memory-related issue");
    Pattern.Solutions.Add(TEXT("Optimize texture sizes"));
    Pattern.Solutions.Add(TEXT("Check for memory leaks"));
    Pattern.Solutions.Add(TEXT("Reduce asset complexity"));
    Pattern.Confidence = 0.7f;
    Patterns.Add(Pattern);
}

void FQuestCopilotOfflineAnalyzer::InitializeRenderingPatterns()
{
    TArray<FErrorPattern>& Patterns = ErrorPatterns.FindOrAdd(TEXT("Rendering"));
    CategoryEnabled.Add(TEXT("Rendering"), true);
    
    FErrorPattern Pattern;
    Pattern.Category = TEXT("Rendering");
    Pattern.Pattern = TEXT("(Render|GPU|Shader).*Error");
    Pattern.Description = TEXT("Rendering or GPU error");
    Pattern.Solutions.Add(TEXT("Update graphics drivers"));
    Pattern.Solutions.Add(TEXT("Check shader compilation"));
    Pattern.Solutions.Add(TEXT("Verify GPU compatibility"));
    Pattern.Confidence = 0.65f;
    Patterns.Add(Pattern);
}

void FQuestCopilotOfflineAnalyzer::InitializeVRPatterns()
{
    TArray<FErrorPattern>& Patterns = ErrorPatterns.FindOrAdd(TEXT("VR"));
    CategoryEnabled.Add(TEXT("VR"), true);
    
    FErrorPattern Pattern;
    Pattern.Category = TEXT("VR");
    Pattern.Pattern = TEXT("(VR|Quest|Oculus).*Error");
    Pattern.Description = TEXT("VR/Quest specific error");
    Pattern.Solutions.Add(TEXT("Check VR device connection"));
    Pattern.Solutions.Add(TEXT("Verify Quest SDK integration"));
    Pattern.Solutions.Add(TEXT("Update VR runtime"));
    Pattern.Confidence = 0.8f;
    Patterns.Add(Pattern);
}

FString FQuestCopilotOfflineAnalyzer::AnalyzeLogs(const FString& LogContent, const FString& Context)
{
    AnalysisStats.TotalAnalyses++;
    
    TArray<FErrorPattern> MatchedPatterns = FindMatchingPatterns(LogContent);
    
    if (MatchedPatterns.Num() > 0)
    {
        AnalysisStats.ErrorsDetected++;
        AnalysisStats.SolutionsProvided += MatchedPatterns.Num();
    }
    
    return FormatAnalysisResult(MatchedPatterns, LogContent);
}

FString FQuestCopilotOfflineAnalyzer::ClassifyError(const FString& LogContent)
{
    TArray<FErrorPattern> MatchedPatterns = FindMatchingPatterns(LogContent);
    
    if (MatchedPatterns.Num() > 0)
    {
        return MatchedPatterns[0].Category;
    }
    
    return TEXT("Unknown");
}

TArray<FString> FQuestCopilotOfflineAnalyzer::GenerateFixSuggestions(const FString& ErrorType, const FString& LogContent)
{
    TArray<FString> Suggestions;
    
    if (const TArray<FErrorPattern>* Patterns = ErrorPatterns.Find(ErrorType))
    {
        for (const FErrorPattern& Pattern : *Patterns)
        {
            if (MatchesPattern(LogContent, Pattern.Pattern))
            {
                Suggestions.Append(Pattern.Solutions);
            }
        }
    }
    
    return Suggestions;
}

float FQuestCopilotOfflineAnalyzer::GetAnalysisConfidence(const FString& LogContent)
{
    TArray<FErrorPattern> MatchedPatterns = FindMatchingPatterns(LogContent);
    return CalculateConfidence(MatchedPatterns);
}

bool FQuestCopilotOfflineAnalyzer::DetectBlueprintErrors(const FString& LogContent, TArray<FString>& OutErrors)
{
    return MatchesPattern(LogContent, TEXT("Blueprint.*Error"));
}

bool FQuestCopilotOfflineAnalyzer::DetectBuildErrors(const FString& LogContent, TArray<FString>& OutErrors)
{
    return MatchesPattern(LogContent, TEXT("(Build|Packaging).*Error"));
}

bool FQuestCopilotOfflineAnalyzer::DetectMemoryIssues(const FString& LogContent, TArray<FString>& OutErrors)
{
    return MatchesPattern(LogContent, TEXT("(Memory|OutOfMemory)"));
}

bool FQuestCopilotOfflineAnalyzer::DetectRenderingIssues(const FString& LogContent, TArray<FString>& OutErrors)
{
    return MatchesPattern(LogContent, TEXT("(Render|GPU|Shader).*Error"));
}

bool FQuestCopilotOfflineAnalyzer::DetectVRIssues(const FString& LogContent, TArray<FString>& OutErrors)
{
    return MatchesPattern(LogContent, TEXT("(VR|Quest|Oculus).*Error"));
}

void FQuestCopilotOfflineAnalyzer::AddErrorPattern(const FString& Category, const FString& Pattern, const FString& Description, const TArray<FString>& Solutions)
{
    FErrorPattern NewPattern;
    NewPattern.Category = Category;
    NewPattern.Pattern = Pattern;
    NewPattern.Description = Description;
    NewPattern.Solutions = Solutions;
    NewPattern.Confidence = 0.5f;
    
    TArray<FErrorPattern>& Patterns = ErrorPatterns.FindOrAdd(Category);
    Patterns.Add(NewPattern);
}

TArray<FString> FQuestCopilotOfflineAnalyzer::GetErrorCategories() const
{
    TArray<FString> Categories;
    ErrorPatterns.GetKeys(Categories);
    return Categories;
}

void FQuestCopilotOfflineAnalyzer::SetAnalysisDepth(int32 Depth)
{
    AnalysisDepth = FMath::Clamp(Depth, 0, 2);
}

void FQuestCopilotOfflineAnalyzer::SetErrorDetectionEnabled(const FString& Category, bool bEnabled)
{
    CategoryEnabled.Add(Category, bEnabled);
}

FQuestCopilotOfflineAnalyzer::FAnalysisStats FQuestCopilotOfflineAnalyzer::GetAnalysisStats() const
{
    FAnalysisStats Stats = AnalysisStats;
    
    if (Stats.TotalAnalyses > 0)
    {
        Stats.AverageConfidence = (float)Stats.ErrorsDetected / Stats.TotalAnalyses;
    }
    
    return Stats;
}

bool FQuestCopilotOfflineAnalyzer::MatchesPattern(const FString& Content, const FString& Pattern) const
{
    FRegexPattern RegexPattern(Pattern);
    return FRegexMatcher(RegexPattern, Content).FindNext();
}

TArray<FQuestCopilotOfflineAnalyzer::FErrorPattern> FQuestCopilotOfflineAnalyzer::FindMatchingPatterns(const FString& LogContent) const
{
    TArray<FErrorPattern> MatchedPatterns;
    
    for (const auto& CategoryPair : ErrorPatterns)
    {
        const FString& Category = CategoryPair.Key;
        const TArray<FErrorPattern>& Patterns = CategoryPair.Value;
        
        // Skip disabled categories
        if (const bool* bEnabled = CategoryEnabled.Find(Category))
        {
            if (!*bEnabled) continue;
        }
        
        for (const FErrorPattern& Pattern : Patterns)
        {
            if (MatchesPattern(LogContent, Pattern.Pattern))
            {
                MatchedPatterns.Add(Pattern);
            }
        }
    }
    
    // Sort by confidence
    MatchedPatterns.Sort([](const FErrorPattern& A, const FErrorPattern& B)
    {
        return A.Confidence > B.Confidence;
    });
    
    return MatchedPatterns;
}

FString FQuestCopilotOfflineAnalyzer::FormatAnalysisResult(const TArray<FErrorPattern>& MatchedPatterns, const FString& LogContent) const
{
    FString Result = TEXT("Offline Analysis Results:\n\n");
    
    if (MatchedPatterns.Num() == 0)
    {
        Result += TEXT("No specific error patterns detected.\n");
        Result += TEXT("This may be a complex issue requiring detailed analysis.\n");
        return Result;
    }
    
    for (int32 i = 0; i < MatchedPatterns.Num(); i++)
    {
        const FErrorPattern& Pattern = MatchedPatterns[i];
        
        Result += FString::Printf(TEXT("%d. %s Error (Confidence: %.1f%%)\n"), 
            i + 1, *Pattern.Category, Pattern.Confidence * 100);
        Result += FString::Printf(TEXT("   Description: %s\n"), *Pattern.Description);
        
        Result += TEXT("   Suggested Solutions:\n");
        for (int32 j = 0; j < Pattern.Solutions.Num(); j++)
        {
            Result += FString::Printf(TEXT("   • %s\n"), *Pattern.Solutions[j]);
        }
        
        Result += TEXT("\n");
    }
    
    float OverallConfidence = CalculateConfidence(MatchedPatterns);
    Result += FString::Printf(TEXT("Overall Analysis Confidence: %.1f%%\n"), OverallConfidence * 100);
    Result += TEXT("\nNote: This is offline pattern matching. For comprehensive AI analysis, configure the backend service.");
    
    return Result;
}

FString FQuestCopilotOfflineAnalyzer::ExtractErrorContext(const FString& LogContent, const FString& ErrorLine) const
{
    // Basic implementation - return surrounding lines
    TArray<FString> Lines;
    LogContent.ParseIntoArray(Lines, TEXT("\n"));
    
    for (int32 i = 0; i < Lines.Num(); i++)
    {
        if (Lines[i].Contains(ErrorLine))
        {
            FString Context;
            int32 Start = FMath::Max(0, i - 2);
            int32 End = FMath::Min(Lines.Num() - 1, i + 2);
            
            for (int32 j = Start; j <= End; j++)
            {
                Context += Lines[j] + TEXT("\n");
            }
            
            return Context;
        }
    }
    
    return ErrorLine;
}

float FQuestCopilotOfflineAnalyzer::CalculateConfidence(const TArray<FErrorPattern>& Patterns) const
{
    if (Patterns.Num() == 0) return 0.0f;
    
    float TotalConfidence = 0.0f;
    for (const FErrorPattern& Pattern : Patterns)
    {
        TotalConfidence += Pattern.Confidence;
    }
    
    return TotalConfidence / Patterns.Num();
}

FString FQuestCopilotOfflineAnalyzer::GenerateRecommendations(const TArray<FErrorPattern>& Patterns) const
{
    FString Recommendations = TEXT("Recommendations:\n");
    
    TSet<FString> UniqueSolutions;
    for (const FErrorPattern& Pattern : Patterns)
    {
        for (const FString& Solution : Pattern.Solutions)
        {
            UniqueSolutions.Add(Solution);
        }
    }
    
    for (const FString& Solution : UniqueSolutions)
    {
        Recommendations += FString::Printf(TEXT("• %s\n"), *Solution);
    }
    
    return Recommendations;
}
