// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#pragma once

#include "CoreMinimal.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "Dom/JsonObject.h"

// Forward declarations
class FQuestCopilotSecurityManager;
class FQuestCopilotPerformanceManager;
class FQuestCopilotOfflineAnalyzer;

DECLARE_DELEGATE_TwoParams(FOnHttpRequestComplete, bool /*bSuccess*/, const FString& /*Response*/);

/**
 * HTTP Request Manager for Quest Dev Copilot
 * Handles all HTTP communication with proper lifecycle management,
 * caching, security, and error handling
 */
class QUESTCOPILOT_API FQuestCopilotHttpManager
{
public:
    FQuestCopilotHttpManager();
    ~FQuestCopilotHttpManager();

    // Request management
    void SendAnalysisRequest(const FString& LogContent, const FString& Context, const FString& ScreenshotData, const FString& ScreenshotDescription, FOnHttpRequestComplete OnComplete);
    void SendQuickAnalysisRequest(const FString& LogContent, const FString& Context, FOnHttpRequestComplete OnComplete);
    void CancelAllRequests();
    bool HasPendingRequests() const;
    int32 GetActiveRequestCount() const;

    // Configuration
    bool SetBackendURL(const FString& URL);
    FString GetBackendURL() const;
    void SetRequestTimeout(float TimeoutSeconds);
    void SetHTTPSRequired(bool bRequired);

    // Caching
    void SetCachingEnabled(bool bEnabled);
    void ClearCache();

private:
    // Core HTTP functionality
    FHttpModule* HttpModule;
    TArray<TSharedPtr<IHttpRequest, ESPMode::ThreadSafe>> ActiveRequests;
    FString BackendURL;
    float RequestTimeoutSeconds;
    bool bHTTPSRequired;
    bool bCachingEnabled;
    TMap<FString, FString> ResponseCache;
    mutable FCriticalSection RequestLock;
    
    // Integrated components
    TSharedPtr<FQuestCopilotSecurityManager> SecurityManager;
    TSharedPtr<FQuestCopilotPerformanceManager> PerformanceManager;
    TSharedPtr<FQuestCopilotOfflineAnalyzer> OfflineAnalyzer;
    
    // Helper methods
    void PerformOfflineAnalysis(const FString& LogContent, const FString& Context, FOnHttpRequestComplete OnComplete);
};
