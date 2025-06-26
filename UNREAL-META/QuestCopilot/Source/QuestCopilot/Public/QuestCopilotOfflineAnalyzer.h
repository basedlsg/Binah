// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#pragma once

#include "CoreMinimal.h"

/**
 * Offline Analysis Engine for Quest Dev Copilot
 * Provides intelligent error analysis without backend dependency
 */
class QUESTCOPILOT_API FQuestCopilotOfflineAnalyzer
{
public:
    FQuestCopilotOfflineAnalyzer();
    ~FQuestCopilotOfflineAnalyzer();

    // === ANALYSIS METHODS ===
    
    /** Analyze logs with offline intelligence */
    FString AnalyzeLogs(const FString& LogContent, const FString& Context = TEXT(""));
    
    /** Quick error classification */
    FString ClassifyError(const FString& LogContent);
    
    /** Generate fix suggestions */
    TArray<FString> GenerateFixSuggestions(const FString& ErrorType, const FString& LogContent);
    
    /** Get confidence score for analysis */
    float GetAnalysisConfidence(const FString& LogContent);

    // === ERROR DETECTION ===
    
    /** Detect Blueprint errors */
    bool DetectBlueprintErrors(const FString& LogContent, TArray<FString>& OutErrors);
    
    /** Detect build/packaging errors */
    bool DetectBuildErrors(const FString& LogContent, TArray<FString>& OutErrors);
    
    /** Detect memory issues */
    bool DetectMemoryIssues(const FString& LogContent, TArray<FString>& OutErrors);
    
    /** Detect rendering issues */
    bool DetectRenderingIssues(const FString& LogContent, TArray<FString>& OutErrors);
    
    /** Detect VR/Quest specific issues */
    bool DetectVRIssues(const FString& LogContent, TArray<FString>& OutErrors);

    // === PATTERN MATCHING ===
    
    /** Initialize error patterns */
    void InitializeErrorPatterns();
    
    /** Add custom error pattern */
    void AddErrorPattern(const FString& Category, const FString& Pattern, const FString& Description, const TArray<FString>& Solutions);
    
    /** Get all error categories */
    TArray<FString> GetErrorCategories() const;

    // === CONFIGURATION ===
    
    /** Set analysis depth (0=basic, 2=comprehensive) */
    void SetAnalysisDepth(int32 Depth);
    
    /** Enable/disable specific error detection */
    void SetErrorDetectionEnabled(const FString& Category, bool bEnabled);
    
    /** Get analysis statistics */
    struct FAnalysisStats
    {
        int32 TotalAnalyses = 0;
        int32 ErrorsDetected = 0;
        int32 SolutionsProvided = 0;
        float AverageConfidence = 0.0f;
    };
    FAnalysisStats GetAnalysisStats() const;

private:
    // Error pattern structure
    struct FErrorPattern
    {
        FString Category;
        FString Pattern;
        FString Description;
        TArray<FString> Solutions;
        float Confidence;
        int32 Priority;
        
        FErrorPattern() : Confidence(0.5f), Priority(1) {}
    };
    
    // Error patterns by category
    TMap<FString, TArray<FErrorPattern>> ErrorPatterns;
    TMap<FString, bool> CategoryEnabled;
    
    // Analysis configuration
    int32 AnalysisDepth;
    mutable FAnalysisStats AnalysisStats;
    
    // Pattern matching methods
    bool MatchesPattern(const FString& Content, const FString& Pattern) const;
    TArray<FErrorPattern> FindMatchingPatterns(const FString& LogContent) const;
    FString FormatAnalysisResult(const TArray<FErrorPattern>& MatchedPatterns, const FString& LogContent) const;
    
    // Error detection helpers
    void InitializeBlueprintPatterns();
    void InitializeBuildPatterns();
    void InitializeMemoryPatterns();
    void InitializeRenderingPatterns();
    void InitializeVRPatterns();
    
    // Analysis utilities
    FString ExtractErrorContext(const FString& LogContent, const FString& ErrorLine) const;
    float CalculateConfidence(const TArray<FErrorPattern>& Patterns) const;
    FString GenerateRecommendations(const TArray<FErrorPattern>& Patterns) const;
};
