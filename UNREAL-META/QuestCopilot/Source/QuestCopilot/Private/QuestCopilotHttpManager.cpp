// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#include "QuestCopilotHttpManager.h"
#include "QuestCopilotModule.h"
#include "QuestCopilotSettings.h"
#include "QuestCopilotSecurityManager.h"
#include "QuestCopilotPerformanceManager.h"
#include "QuestCopilotOfflineAnalyzer.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonWriter.h"
#include "Misc/DateTime.h"
#include "Misc/SecureHash.h"

FQuestCopilotHttpManager::FQuestCopilotHttpManager()
    : HttpModule(&FHttpModule::Get())
    , RequestTimeoutSeconds(30.0f)
    , bHTTPSRequired(true)
    , bCachingEnabled(true)
{
    const UQuestCopilotSettings* Settings = GetDefault<UQuestCopilotSettings>();
    if (Settings)
    {
        SetBackendURL(Settings->BackendURL);
        SetRequestTimeout(Settings->RequestTimeoutSeconds);
    }
    
    // Initialize managers
    SecurityManager = MakeShared<FQuestCopilotSecurityManager>();
    PerformanceManager = MakeShared<FQuestCopilotPerformanceManager>();
    OfflineAnalyzer = MakeShared<FQuestCopilotOfflineAnalyzer>();
    
    UE_LOG(LogQuestCopilot, Log, TEXT("HTTP Manager initialized with integrated components"));
}

FQuestCopilotHttpManager::~FQuestCopilotHttpManager()
{
    CancelAllRequests();
}

void FQuestCopilotHttpManager::SendAnalysisRequest(const FString& LogContent, const FString& Context, const FString& ScreenshotData, const FString& ScreenshotDescription, FOnHttpRequestComplete OnComplete)
{
    FScopeLock Lock(&RequestLock);
    
    // Start performance monitoring
    if (PerformanceManager.IsValid())
    {
        PerformanceManager->StartTimer(TEXT("AnalysisRequest"));
    }
    
    // Security validation
    if (SecurityManager.IsValid() && !SecurityManager->IsContentSafeForTransmission(LogContent))
    {
        UE_LOG(LogQuestCopilot, Error, TEXT("HTTP Manager: Content failed security validation"));
        OnComplete.ExecuteIfBound(false, TEXT("Content validation failed for security reasons"));
        if (PerformanceManager.IsValid())
        {
            PerformanceManager->EndTimer(TEXT("AnalysisRequest"));
        }
        return;
    }
    
    // Sanitize content
    FString SanitizedLogContent = LogContent;
    FString SanitizedContext = Context;
    if (SecurityManager.IsValid())
    {
        SanitizedLogContent = SecurityManager->SanitizeLogContent(LogContent);
        SanitizedContext = SecurityManager->SanitizeUserInput(Context);
    }
    
    // Check cache first
    FString LogHash = FMD5::HashAnsiString(*SanitizedLogContent);
    FString CachedResult;
    if (PerformanceManager.IsValid() && PerformanceManager->GetCachedAnalysisResult(LogHash, CachedResult))
    {
        UE_LOG(LogQuestCopilot, Log, TEXT("HTTP Manager: Serving cached analysis result"));
        OnComplete.ExecuteIfBound(true, CachedResult);
        if (PerformanceManager.IsValid())
        {
            PerformanceManager->EndTimer(TEXT("AnalysisRequest"));
        }
        return;
    }
    
    // Check if backend is available - if not, use offline analysis
    if (BackendURL.IsEmpty() || (SecurityManager.IsValid() && !SecurityManager->ValidateURL(BackendURL, bHTTPSRequired)))
    {
        UE_LOG(LogQuestCopilot, Warning, TEXT("HTTP Manager: Backend unavailable, using offline analysis"));
        PerformOfflineAnalysis(SanitizedLogContent, SanitizedContext, OnComplete);
        if (PerformanceManager.IsValid())
        {
            PerformanceManager->EndTimer(TEXT("AnalysisRequest"));
        }
        return;
    }
    
    if (LogContent.IsEmpty())
    {
        OnComplete.ExecuteIfBound(false, TEXT("Empty log content"));
        return;
    }

    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = HttpModule->CreateRequest();
    Request->SetVerb(TEXT("POST"));
    Request->SetURL(BackendURL + TEXT("/analyze"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->SetTimeout(RequestTimeoutSeconds);

    // Create JSON payload
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField(TEXT("log_content"), SanitizedLogContent);
    JsonObject->SetStringField(TEXT("context"), SanitizedContext);
    JsonObject->SetStringField(TEXT("timestamp"), FDateTime::Now().ToIso8601());
    
    if (!ScreenshotData.IsEmpty())
    {
        JsonObject->SetStringField(TEXT("screenshot_data"), ScreenshotData);
        if (!ScreenshotDescription.IsEmpty())
        {
            JsonObject->SetStringField(TEXT("screenshot_description"), ScreenshotDescription);
        }
    }

    FString OutputString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);
    Request->SetContentAsString(OutputString);

    // Bind completion callback
    Request->OnProcessRequestComplete().BindLambda([this, OnComplete, LogHash](FHttpRequestPtr Req, FHttpResponsePtr Resp, bool bSuccess)
    {
        FScopeLock Lock(&RequestLock);
        ActiveRequests.Remove(Req);
        
        if (!bSuccess || !Resp.IsValid())
        {
            // Fallback to offline analysis
            UE_LOG(LogQuestCopilot, Warning, TEXT("HTTP Manager: Request failed, falling back to offline analysis"));
            FString RequestContent = Req->GetContentAsString();
            if (!RequestContent.IsEmpty())
            {
                TSharedPtr<FJsonObject> JsonObject;
                TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(RequestContent);
                
                if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
                {
                    FString LogContent = JsonObject->GetStringField(TEXT("log_content"));
                    FString Context = JsonObject->GetStringField(TEXT("context"));
                    PerformOfflineAnalysis(LogContent, Context, OnComplete);
                    return;
                }
            }
            OnComplete.ExecuteIfBound(false, TEXT("Network error"));
            return;
        }
        
        int32 ResponseCode = Resp->GetResponseCode();
        if (ResponseCode != 200)
        {
            OnComplete.ExecuteIfBound(false, FString::Printf(TEXT("HTTP Error %d"), ResponseCode));
            return;
        }
        
        FString ResponseContent = Resp->GetContentAsString();
        
        // Cache successful response
        if (PerformanceManager.IsValid())
        {
            PerformanceManager->CacheAnalysisResult(LogHash, ResponseContent);
        }
        
        OnComplete.ExecuteIfBound(true, ResponseContent);
        
        if (PerformanceManager.IsValid())
        {
            PerformanceManager->EndTimer(TEXT("AnalysisRequest"));
        }
    });

    ActiveRequests.Add(Request);
    
    if (!Request->ProcessRequest())
    {
        ActiveRequests.Remove(Request);
        OnComplete.ExecuteIfBound(false, TEXT("Failed to send request"));
        if (PerformanceManager.IsValid())
        {
            PerformanceManager->EndTimer(TEXT("AnalysisRequest"));
        }
    }
}

void FQuestCopilotHttpManager::PerformOfflineAnalysis(const FString& LogContent, const FString& Context, FOnHttpRequestComplete OnComplete)
{
    if (PerformanceManager.IsValid())
    {
        PerformanceManager->StartTimer(TEXT("OfflineAnalysis"));
    }
    
    // Use offline analyzer for graceful degradation
    FString OfflineResult = TEXT("No offline analysis available");
    float Confidence = 0.0f;
    
    if (OfflineAnalyzer.IsValid())
    {
        OfflineResult = OfflineAnalyzer->AnalyzeLogs(LogContent, Context);
        Confidence = OfflineAnalyzer->GetAnalysisConfidence(LogContent);
    }
    
    // Format as JSON response for consistency
    TSharedPtr<FJsonObject> ResultJson = MakeShareable(new FJsonObject);
    ResultJson->SetStringField(TEXT("analysis_type"), TEXT("offline"));
    ResultJson->SetStringField(TEXT("result"), OfflineResult);
    ResultJson->SetNumberField(TEXT("confidence"), Confidence);
    ResultJson->SetStringField(TEXT("timestamp"), FDateTime::Now().ToIso8601());
    ResultJson->SetBoolField(TEXT("offline_mode"), true);
    
    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(ResultJson.ToSharedRef(), Writer);
    
    // Cache offline result
    if (PerformanceManager.IsValid())
    {
        FString LogHash = FMD5::HashAnsiString(*LogContent);
        PerformanceManager->CacheAnalysisResult(LogHash, JsonString);
    }
    
    UE_LOG(LogQuestCopilot, Log, TEXT("HTTP Manager: Offline analysis completed with confidence %.2f"), Confidence);
    OnComplete.ExecuteIfBound(true, JsonString);
    
    if (PerformanceManager.IsValid())
    {
        PerformanceManager->EndTimer(TEXT("OfflineAnalysis"));
    }
}

void FQuestCopilotHttpManager::SendQuickAnalysisRequest(const FString& LogContent, const FString& Context, FOnHttpRequestComplete OnComplete)
{
    SendAnalysisRequest(LogContent, Context, TEXT(""), TEXT(""), OnComplete);
}

void FQuestCopilotHttpManager::CancelAllRequests()
{
    FScopeLock Lock(&RequestLock);
    for (auto& Request : ActiveRequests)
    {
        if (Request.IsValid())
        {
            Request->CancelRequest();
        }
    }
    ActiveRequests.Empty();
}

bool FQuestCopilotHttpManager::HasPendingRequests() const
{
    FScopeLock Lock(&RequestLock);
    return ActiveRequests.Num() > 0;
}

int32 FQuestCopilotHttpManager::GetActiveRequestCount() const
{
    FScopeLock Lock(&RequestLock);
    return ActiveRequests.Num();
}

bool FQuestCopilotHttpManager::SetBackendURL(const FString& URL)
{
    if (URL.IsEmpty() || (!URL.StartsWith(TEXT("http://")) && !URL.StartsWith(TEXT("https://"))))
    {
        return false;
    }
    
    if (bHTTPSRequired && !URL.StartsWith(TEXT("https://")))
    {
        return false;
    }
    
    BackendURL = URL;
    return true;
}

FString FQuestCopilotHttpManager::GetBackendURL() const
{
    return BackendURL;
}

void FQuestCopilotHttpManager::SetRequestTimeout(float TimeoutSeconds)
{
    RequestTimeoutSeconds = FMath::Clamp(TimeoutSeconds, 5.0f, 120.0f);
}

void FQuestCopilotHttpManager::SetHTTPSRequired(bool bRequired)
{
    bHTTPSRequired = bRequired;
}

void FQuestCopilotHttpManager::SetCachingEnabled(bool bEnabled)
{
    bCachingEnabled = bEnabled;
    if (!bEnabled)
    {
        ClearCache();
    }
}

void FQuestCopilotHttpManager::ClearCache()
{
    if (PerformanceManager.IsValid())
    {
        PerformanceManager->ClearAnalysisCache();
    }
}
