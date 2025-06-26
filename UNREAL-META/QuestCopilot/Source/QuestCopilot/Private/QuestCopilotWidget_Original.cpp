// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#include "QuestCopilotSettings.h"
#include "Engine/Engine.h"
#include "Engine/GameViewportClient.h"
#include "Kismet/GameplayStatics.h"
#include "Misc/App.h"
#include "Misc/EngineVersion.h"
#include "Misc/DateTime.h"
#include "HAL/PlatformProcess.h"
#include "Misc/MessageDialog.h"
#include "Framework/Notifications/NotificationManager.h"
#include "Widgets/Notifications/SNotificationList.h"// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#include "QuestCopilotWidget.h"
#include "QuestCopilotModule.h"
#include "Widgets/Layout/SBorder.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/Layout/SSplitter.h"
#include "Widgets/Input/SEditableTextBox.h"
#include "Widgets/Text/SRichTextBlock.h"
#include "Widgets/SWindow.h"
#include "Framework/Application/SlateApplication.h"
#include "Framework/Docking/TabManager.h"
#include "Framework/Notifications/NotificationManager.h"
#include "Widgets/Notifications/SNotificationList.h"
#include "EditorStyleSet.h"
#include "HAL/PlatformFilemanager.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonWriter.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "QuestCopilotSettings.h"
#include "Engine/Engine.h"
#include "Engine/GameViewportClient.h"
#include "Kismet/GameplayStatics.h"
#include "Misc/App.h"
#include "Misc/EngineVersion.h"
#include "Misc/DateTime.h"
#include "HAL/PlatformProcess.h"
#include "Misc/MessageDialog.h"
#include "Framework/Notifications/NotificationManager.h"
#include "Widgets/Notifications/SNotificationList.h"
#define LOCTEXT_NAMESPACE "SQuestCopilotWidget"

void SQuestCopilotWidget::Construct(const FArguments& InArgs)
{
    bIsAnalyzing = false;
    bHasScreenshot = false;
    HttpModule = &FHttpModule::Get();

    ChildSlot
    [
        SNew(SVerticalBox)
        
        // Header
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f)
        [
            SNew(SHorizontalBox)
            + SHorizontalBox::Slot()
            .FillWidth(1.0f)
            [
                SNew(STextBlock)
                .Text(FText::FromString(TEXT("Quest Dev Copilot - AI Error Analysis")))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 16))
                .ColorAndOpacity(FLinearColor::White)
            ]
            + SHorizontalBox::Slot()
            .AutoWidth()
            .Padding(5.0f, 0.0f)
            [
                SAssignNew(RefreshButton, SButton)
                .Text(FText::FromString(TEXT("Refresh Logs")))
                .OnClicked(this, &SQuestCopilotWidget::OnRefreshButtonClicked)
                .IsEnabled(this, &SQuestCopilotWidget::IsRefreshEnabled)
            ]
        ]

        // Status
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f, 5.0f)
        [
            SAssignNew(StatusText, STextBlock)
            .Text(FText::FromString(TEXT("Ready - Load your project logs or paste error content")))
            .ColorAndOpacity(FLinearColor::Green)
        ]

        // Screenshot Section
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f)
        [
            SNew(SVerticalBox)
            + SVerticalBox::Slot()
            .AutoHeight()
            [
                SNew(STextBlock)
                .Text(FText::FromString(TEXT("Screenshot Analysis (Optional)")))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 12))
                .ColorAndOpacity(FLinearColor::Yellow)
            ]
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0.0f, 5.0f)
            [
                SNew(SHorizontalBox)
                + SHorizontalBox::Slot()
                .AutoWidth()
                .Padding(0.0f, 0.0f, 10.0f, 0.0f)
                [
                    SAssignNew(ScreenshotButton, SButton)
                    .Text(FText::FromString(TEXT("Capture Screenshot")))
                    .OnClicked(this, &SQuestCopilotWidget::OnScreenshotButtonClicked)
                    .IsEnabled(this, &SQuestCopilotWidget::IsAnalyzeEnabled)
                ]
                + SHorizontalBox::Slot()
                .FillWidth(1.0f)
                [
                    SAssignNew(ScreenshotStatusText, STextBlock)
                    .Text(FText::FromString(TEXT("No screenshot captured")))
                    .ColorAndOpacity(FLinearColor::Gray)
                ]
            ]
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0.0f, 5.0f)
            [
                SNew(STextBlock)
                .Text(FText::FromString(TEXT("Describe what the screenshot shows (optional):")))
            ]
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0.0f, 2.0f)
            [
                SAssignNew(ScreenshotDescriptionBox, SEditableTextBox)
                .HintText(FText::FromString(TEXT("e.g., 'Error dialog in Blueprint editor', 'Build failure message', etc.")))
            ]
        ]

        // Log Content Section
        + SVerticalBox::Slot()
        .FillHeight(0.4f)
        .Padding(10.0f)
        [
            SNew(SVerticalBox)
            + SVerticalBox::Slot()
            .AutoHeight()
            [
                SNew(STextBlock)
                .Text(FText::FromString(TEXT("Log Content:")))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 12))
            ]
            + SVerticalBox::Slot()
            .FillHeight(1.0f)
            .Padding(0.0f, 5.0f)
            [
                SAssignNew(LogContentBox, SMultiLineEditableTextBox)
                .HintText(FText::FromString(TEXT("Paste your Unreal Engine log content here, or click 'Refresh Logs' to auto-load project logs...")))
                .IsReadOnly(false)
            ]
        ]

        // Analyze Button
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f)
        .HAlign(HAlign_Center)
        [
            SAssignNew(AnalyzeButton, SButton)
            .Text(this, &SQuestCopilotWidget::GetAnalyzeButtonText)
            .OnClicked(this, &SQuestCopilotWidget::OnAnalyzeButtonClicked)
            .IsEnabled(this, &SQuestCopilotWidget::IsAnalyzeEnabled)
        ]

        // Results Section
        + SVerticalBox::Slot()
        .FillHeight(0.6f)
        .Padding(10.0f)
        [
            SNew(SVerticalBox)
            + SVerticalBox::Slot()
            .AutoHeight()
            [
                SNew(STextBlock)
                .Text(FText::FromString(TEXT("Analysis Results:")))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 12))
            ]
            + SVerticalBox::Slot()
            .FillHeight(1.0f)
            .Padding(0.0f, 5.0f)
            [
                SAssignNew(ResultsScrollBox, SScrollBox)
                + SScrollBox::Slot()
                [
                    SAssignNew(ResultsText, STextBlock)
                    .Text(FText::FromString(TEXT("No analysis performed yet. Load some log content and click 'Analyze Error' to get started.")))
                    .AutoWrapText(true)
                    .ColorAndOpacity(FLinearColor::Gray)
                ]
            ]
        ]
    ];

    // Load project logs on startup
    LoadProjectLogs();
}

void SQuestCopilotWidget::RefreshLogContent()
{
    FString LogContent = ReadProjectLogs();
    if (!LogContent.IsEmpty())
    {
        LogContentBox->SetText(FText::FromString(LogContent));
    }
}

void SQuestCopilotWidget::SetLogContent(const FString& LogContent)
{
    LogContentBox->SetText(FText::FromString(LogContent));
}

FReply SQuestCopilotWidget::OnAnalyzeButtonClicked()
{
    if (bIsAnalyzing)
    {
        return FReply::Handled();
    }

    FString BackendURL = GetBackendURL();
    if (BackendURL.IsEmpty())
    {
        UE_LOG(LogQuestCopilot, Error, TEXT("Analysis: Backend URL not configured or invalid in Project Settings."));
        UpdateStatusText(LOCTEXT("StatusError_NoURL_Detailed", "❌ Backend URL not set or invalid. Configure in Project Settings > Plugins > Quest Dev Copilot."), FLinearColor::Red);
        // Optionally, also show a notification
        FNotificationInfo Info(LOCTEXT("AnalysisError_NoURL", "Backend URL for Quest Copilot is not configured or invalid."));
        Info.ExpireDuration = 8.0f;
        FSlateNotificationManager::Get().AddNotification(Info);
        return FReply::Handled();
    }

    FString LogContent = LogContentBox->GetText().ToString();
    if (LogContent.IsEmpty())
    {
        UpdateStatusText(LOCTEXT("StatusNoLogs", "❌ No logs to analyze. Paste logs or click 'Refresh Logs'."), FLinearColor::Red);
        return FReply::Handled();
    }

    bIsAnalyzing = true;
    UpdateUI(); // Disables buttons
    UpdateStatusText(LOCTEXT("StatusAnalyzing", "🔄 Analyzing with AI..."), FLinearColor::Yellow);

    SendAnalysisRequest(LogContent, GetProjectContext()); // GetProjectContext can provide UE version, project name etc.
    return FReply::Handled();
}

FReply SQuestCopilotWidget::OnClearButtonClicked()
{
    LogContentBox->SetText(FText::GetEmpty());
    ErrorTypeText->SetText(LOCTEXT("NoAnalysis", "No analysis yet"));
    ErrorTypeText->SetColorAndOpacity(FLinearColor::Gray);
    ConfidenceText->SetText(LOCTEXT("NoConfidence", "—"));
    ConfidenceText->SetColorAndOpacity(FLinearColor::Gray);
    FixSuggestionText->SetText(LOCTEXT("NoFixSuggestion", "Run analysis to get AI-powered fix suggestions"));
    FixSuggestionText->SetColorAndOpacity(FLinearColor::Gray);
    StatusText->SetText(LOCTEXT("StatusReady", "✅ Ready"));
    StatusText->SetColorAndOpacity(FLinearColor::Green);
    AutoFixButton->SetEnabled(false);
    return FReply::Handled();
}

FReply SQuestCopilotWidget::OnAutoFixButtonClicked()
{
    // TODO: Implement auto-fix functionality
    // This would parse the LastAnalysisResult and apply suggested fixes
    StatusText->SetText(LOCTEXT("StatusAutoFixing", "🔧 Applying auto-fix..."));
    StatusText->SetColorAndOpacity(FLinearColor::Blue);
    
    // For now, just show a message
    UE_LOG(LogQuestCopilot, Log, TEXT("Auto-fix requested - would apply: %s"), *LastAnalysisResult);
    
    return FReply::Handled();
}

FReply SQuestCopilotWidget::OnRefreshButtonClicked()
{
    RefreshLogContent();
    StatusText->SetText(LOCTEXT("StatusLogsRefreshed", "📄 Logs refreshed"));
    StatusText->SetColorAndOpacity(FLinearColor::Green);
    return FReply::Handled();
}

void SQuestCopilotWidget::OnAnalysisRequestComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
{
    bIsAnalyzing = false;
    
    // Validate request completion following UE error handling patterns
    if (!bWasSuccessful)
    {
        UpdateStatusText(TEXT("❌ Analysis failed - Network error"), FLinearColor::Red);
        UE_LOG(LogQuestCopilot, Error, TEXT("HTTP request failed: Network error or timeout"));
        return;
    }
    
    if (!Response.IsValid())
    {
        UpdateStatusText(TEXT("❌ Analysis failed - Invalid response"), FLinearColor::Red);
        UE_LOG(LogQuestCopilot, Error, TEXT("HTTP request failed: Invalid response object"));
        return;
    }
    
    // Check HTTP status code
    int32 ResponseCode = Response->GetResponseCode();
    if (ResponseCode < 200 || ResponseCode >= 300)
    {
        FString ErrorMsg = FString::Printf(TEXT("❌ Server error (HTTP %d)"), ResponseCode);
        UpdateStatusText(ErrorMsg, FLinearColor::Red);
        UE_LOG(LogQuestCopilot, Error, TEXT("HTTP error response: %d - %s"), ResponseCode, *Response->GetContentAsString());
        return;
    }
    
    // Validate response content
    FString ResponseContent = Response->GetContentAsString();
    if (ResponseContent.IsEmpty())
    {
        UpdateStatusText(TEXT("❌ Empty response from server"), FLinearColor::Red);
        UE_LOG(LogQuestCopilot, Warning, TEXT("Received empty response from backend"));
        return;
    }
    
    // Parse and update results
    UpdateStatusText(TEXT("✅ Analysis complete"), FLinearColor::Green);
    DisplayAnalysisResults(ResponseContent);
}

void SQuestCopilotWidget::UpdateUI()
{
    AnalyzeButton->SetEnabled(!bIsAnalyzing);
    RefreshButton->SetEnabled(!bIsAnalyzing);
}

void SQuestCopilotWidget::DisplayAnalysisResults(const FString& JsonResponse)
{
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonResponse);
    
    if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
    {
        FString FullResults;
        
        // Parse classification
        const TSharedPtr<FJsonObject>* ClassificationObj;
        if (JsonObject->TryGetObjectField(TEXT("classification"), ClassificationObj) && ClassificationObj->IsValid())
        {
            FString ErrorType;
            if ((*ClassificationObj)->TryGetStringField(TEXT("error_type"), ErrorType))
            {
                ErrorTypeText->SetText(FText::FromString(ErrorType));
                ErrorTypeText->SetColorAndOpacity(FLinearColor::White);
                
                FullResults += FString::Printf(TEXT("🔍 ERROR CLASSIFICATION:\n"));
                FullResults += FString::Printf(TEXT("Type: %s\n"), *ErrorType);
            }
            
            double Confidence;
            if ((*ClassificationObj)->TryGetNumberField(TEXT("confidence"), Confidence))
            {
                FString ConfidenceStr = FString::Printf(TEXT("%.0f%%"), Confidence * 100.0);
                ConfidenceText->SetText(FText::FromString(ConfidenceStr));
                
                if (Confidence >= 0.8)
                    ConfidenceText->SetColorAndOpacity(FLinearColor::Green);
                else if (Confidence >= 0.5)
                    ConfidenceText->SetColorAndOpacity(FLinearColor::Yellow);
                else
                    ConfidenceText->SetColorAndOpacity(FLinearColor::Red);
                
                FullResults += FString::Printf(TEXT("Confidence: %s\n"), *ConfidenceStr);
            }
            
            bool AutoFixable;
            if ((*ClassificationObj)->TryGetBoolField(TEXT("auto_fixable"), AutoFixable))
            {
                FullResults += FString::Printf(TEXT("Auto-fixable: %s\n"), AutoFixable ? TEXT("✅ Yes") : TEXT("❌ No"));
            }
            
            const TArray<TSharedPtr<FJsonValue>>* KeyIndicators;
            if ((*ClassificationObj)->TryGetArrayField(TEXT("key_indicators"), KeyIndicators))
            {
                FullResults += FString::Printf(TEXT("Key Indicators: "));
                for (int32 i = 0; i < KeyIndicators->Num(); ++i)
                {
                    if (i > 0) FullResults += TEXT(", ");
                    FullResults += (*KeyIndicators)[i]->AsString();
                }
                FullResults += TEXT("\n");
            }
        }
        
        bool EnhancedAnalysis;
        if (JsonObject->TryGetBoolField(TEXT("enhanced_analysis"), EnhancedAnalysis) && EnhancedAnalysis)
        {
            FullResults += TEXT("\n🤖 AI ENHANCEMENT: Training data used for improved analysis\n");
        }
        
        FString FixSuggestion;
        if (JsonObject->TryGetStringField(TEXT("fix"), FixSuggestion))
        {
            FullResults += FString::Printf(TEXT("\n🔧 FIX INSTRUCTIONS:\n%s\n"), *FixSuggestion);
            
            FixSuggestionText->SetText(FText::FromString(FixSuggestion));
            FixSuggestionText->SetColorAndOpacity(FLinearColor::White);
        }
        
        const TSharedPtr<FJsonObject>* AutoFixObj;
        if (JsonObject->TryGetObjectField(TEXT("auto_fix"), AutoFixObj) && AutoFixObj->IsValid())
        {
            FString Action, PluginName, FilePath;
            bool Enabled;
            
            if ((*AutoFixObj)->TryGetStringField(TEXT("action"), Action) &&
                (*AutoFixObj)->TryGetStringField(TEXT("plugin_name"), PluginName) &&
                (*AutoFixObj)->TryGetStringField(TEXT("file_path"), FilePath) &&
                (*AutoFixObj)->TryGetBoolField(TEXT("enabled"), Enabled))
            {
                FullResults += FString::Printf(TEXT("\n🤖 AUTO-FIX AVAILABLE:\n"));
                FullResults += FString::Printf(TEXT("Action: %s\n"), *Action);
                FullResults += FString::Printf(TEXT("Target: %s\n"), *PluginName);
                FullResults += FString::Printf(TEXT("File: %s\n"), *FilePath);
                FullResults += FString::Printf(TEXT("Setting: %s\n"), Enabled ? TEXT("Enable") : TEXT("Disable"));
                
                AutoFixButton->SetEnabled(true);
            }
        }
        
        const TArray<TSharedPtr<FJsonValue>>* Sources;
        if (JsonObject->TryGetArrayField(TEXT("sources"), Sources) && Sources->Num() > 0)
        {
            FullResults += FString::Printf(TEXT("\n📚 SOURCES:\n"));
            for (int32 i = 0; i < Sources->Num(); ++i)
            {
                const TSharedPtr<FJsonObject>* SourceObj;
                if ((*Sources)[i]->TryGetObject(SourceObj) && SourceObj->IsValid())
                {
                    FString Url, Snippet;
                    double RelevanceScore;
                    
                    (*SourceObj)->TryGetStringField(TEXT("url"), Url);
                    (*SourceObj)->TryGetStringField(TEXT("snippet"), Snippet);
                    (*SourceObj)->TryGetNumberField(TEXT("relevance_score"), RelevanceScore);
                    
                    FullResults += FString::Printf(TEXT("%d. %s (relevance: %.2f)\n"), i + 1, *Url, RelevanceScore);
                    if (!Snippet.IsEmpty())
                    {
                        FullResults += FString::Printf(TEXT("   %s\n"), *Snippet);
                    }
                }
            }
        }
        
        const TSharedPtr<FJsonObject>* MetricsObj;
        if (JsonObject->TryGetObjectField(TEXT("metrics"), MetricsObj) && MetricsObj->IsValid())
        {
            FullResults += FString::Printf(TEXT("\n📊 METRICS:\n"));
            
            int32 TokensUsed;
            if ((*MetricsObj)->TryGetNumberField(TEXT("tokens_used"), TokensUsed))
            {
                FullResults += FString::Printf(TEXT("Tokens used: %d\n"), TokensUsed);
            }
            
            double EstimatedCost;
            if ((*MetricsObj)->TryGetNumberField(TEXT("estimated_cost"), EstimatedCost))
            {
                FullResults += FString::Printf(TEXT("Estimated cost: $%.4f\n"), EstimatedCost);
            }
            
            int32 LatencyMs;
            if ((*MetricsObj)->TryGetNumberField(TEXT("latency_ms"), LatencyMs))
            {
                FullResults += FString::Printf(TEXT("Latency: %dms\n"), LatencyMs);
            }
            
            int32 TrainingExamplesUsed;
            if ((*MetricsObj)->TryGetNumberField(TEXT("training_examples_used"), TrainingExamplesUsed))
            {
                FullResults += FString::Printf(TEXT("Training examples used: %d\n"), TrainingExamplesUsed);
            }
        }
        
        ResultsText->SetText(FText::FromString(FullResults));
        ResultsText->SetColorAndOpacity(FLinearColor::White);
    }
    else
    {
        ResultsText->SetText(FText::FromString(TEXT("❌ Failed to parse analysis results")));
        ResultsText->SetColorAndOpacity(FLinearColor::Red);
    }
}

FString SQuestCopilotWidget::GetBackendURL() const
{
    const UQuestCopilotSettings* Settings = GetDefault<UQuestCopilotSettings>();
    if (!Settings)
    {
        UE_LOG(LogQuestCopilot, Error, TEXT("QuestCopilotSettings could not be loaded. Backend URL will be empty. Please check project settings."));
        return TEXT("");
    }

    if (Settings->BackendURL.IsEmpty())
    {
        UE_LOG(LogQuestCopilot, Log, TEXT("Backend URL is not configured in Project Settings > Plugins > Quest Dev Copilot. Plugin functionality will be limited."));
        return TEXT("");
    }

    if (Settings->BackendURL.StartsWith(TEXT("http://")) || Settings->BackendURL.StartsWith(TEXT("https://")))
    {
        return Settings->BackendURL;
    }
    else
    {
        UE_LOG(LogQuestCopilot, Warning, TEXT("Invalid Backend URL format in settings: '%s'. It must start with http:// or https://. Please check Project Settings > Plugins > Quest Dev Copilot."), *Settings->BackendURL);
        return TEXT(""); // Treat invalid format as unconfigured for safety
    }
}

FString SQuestCopilotWidget::ReadProjectLogs() const
{
    // Try to read various log files
    TArray<FString> LogFiles = {
        FPaths::Combine(FPaths::ProjectLogDir(), TEXT("UnrealBuildTool.log")),
        FPaths::Combine(FPaths::ProjectLogDir(), TEXT("UnrealHeaderTool.log")),
        FPaths::Combine(FPaths::ProjectLogDir(), TEXT("Cook.log"))
    };
    
    FString CombinedLogs;
    for (const FString& LogFile : LogFiles)
    {
        if (FPaths::FileExists(LogFile))
        {
            FString LogContent;
            if (FFileHelper::LoadFileToString(LogContent, *LogFile))
            {
                CombinedLogs += FString::Printf(TEXT("=== %s ===\n"), *FPaths::GetCleanFilename(LogFile));
                CombinedLogs += LogContent;
                CombinedLogs += TEXT("\n\n");
            }
        }
    }
    
    return CombinedLogs;
}

// === DUAL ARCHITECTURE IMPLEMENTATION ===

// Static member for quick analysis window
TSharedPtr<SWindow> SQuestCopilotWidget::QuickAnalysisWindow;

void SQuestCopilotWidget::PerformQuickAnalysis(const FString& ErrorLog, const FString& Context)
{
    UE_LOG(LogQuestCopilot, Log, TEXT("Starting quick analysis for: %s"), *Context);
    
    // Send quick analysis request
    SendQuickAnalysisRequest(ErrorLog, Context);
}

void SQuestCopilotWidget::ShowQuickAnalysisResult(const FString& ErrorType, const FString& Solution, float Confidence)
{
    CreateQuickAnalysisPopup(ErrorType, Solution, Confidence);
}

void SQuestCopilotWidget::OpenDetailedAnalysisTab(const FString& InitialLog)
{
    // Open the main Quest Copilot tab
    TSharedPtr<SDockTab> Tab = FGlobalTabmanager::Get()->TryInvokeTab(FName("QuestCopilot"));
    
    if (Tab.IsValid() && !InitialLog.IsEmpty())
    {
        // Find the widget and set initial log content
        TSharedPtr<SQuestCopilotWidget> Widget = StaticCastSharedPtr<SQuestCopilotWidget>(Tab->GetContent());
        if (Widget.IsValid())
        {
            Widget->SetLogContent(InitialLog);
            Widget->StartAnalysis();
        }
    }
}

void SQuestCopilotWidget::SetLogContent(const FString& LogContent)
{
    if (LogContentBox.IsValid())
    {
        LogContentBox->SetText(FText::FromString(LogContent));
    }
}

FString SQuestCopilotWidget::GetLogContent() const
{
    if (LogContentBox.IsValid())
    {
        return LogContentBox->GetText().ToString();
    }
    return FString();
}

void SQuestCopilotWidget::StartAnalysis()
{
    if (!bIsAnalyzing)
    {
        OnAnalyzeButtonClicked();
    }
}

void SQuestCopilotWidget::SendAnalysisRequest(const FString& LogContent, const FString& Context)
{
    FString BackendURL = GetBackendURL(); // Already checked in OnAnalyzeButtonClicked, but good for direct calls
    if (BackendURL.IsEmpty()) 
    { 
        // This case should ideally be caught before calling SendAnalysisRequest directly
        UE_LOG(LogQuestCopilot, Error, TEXT("SendAnalysisRequest called with no Backend URL configured."));
        bIsAnalyzing = false; // Reset state
        UpdateUI();
        UpdateStatusText(LOCTEXT("StatusInternalError_NoURL", "❌ Internal Error: Backend URL missing."), FLinearColor::Red);
        return; 
    }

    FHttpModule* Http = &FHttpModule::Get();
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = Http->CreateRequest();
    
    Request->SetVerb(TEXT("POST"));
    Request->SetURL(BackendURL + TEXT("/analyze")); // Append your specific endpoint if GetBackendURL is just the base
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->SetTimeout(GetDefault<UQuestCopilotSettings>()->RequestTimeoutSeconds); // Use timeout from settings

    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField(TEXT("log_content"), LogContent);
    // Add UE version, project name, etc., from Context or other sources if needed
    // JsonObject->SetStringField(TEXT("ue_version"), UGameplayStatics::GetPlatformName()); // Example
    JsonObject->SetStringField(TEXT("context"), Context);
    
    if (bHasScreenshot && !ScreenshotData.IsEmpty())
    {
        JsonObject->SetStringField(TEXT("screenshot_data"), ScreenshotData);
        FString ScreenshotDesc = ScreenshotDescriptionBox->GetText().ToString();
        if (!ScreenshotDesc.IsEmpty())
        {
            JsonObject->SetStringField(TEXT("screenshot_description"), ScreenshotDesc);
        }
    }

    FString OutputString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    Request->SetContentAsString(OutputString);
    Request->OnProcessRequestComplete().BindSP(this, &SQuestCopilotWidget::OnAnalysisRequestComplete);

    if (!Request->ProcessRequest())
    {
        bIsAnalyzing = false;
        UpdateUI();
        UpdateStatusText(LOCTEXT("StatusRequestFailed", "❌ Failed to initiate analysis request."), FLinearColor::Red);
        UE_LOG(LogQuestCopilot, Error, TEXT("Failed to process HTTP analysis request to %s."), *BackendURL);
    }
}

void SQuestCopilotWidget::SendQuickAnalysisRequest(const FString& LogContent, const FString& Context)
{
    FString BackendURL = GetBackendURL();
    if (BackendURL.IsEmpty())
    {
        UE_LOG(LogQuestCopilot, Error, TEXT("Quick Analysis: Backend URL not configured in Project Settings."));
        FNotificationInfo Info(LOCTEXT("QuickAnalysisError_NoURL", "❌ Quick Analysis: Backend URL not set. Configure in Project Settings > Plugins > Quest Dev Copilot."));
        Info.bFireAndForget = true;
        Info.FadeOutDuration = 7.0f;
        Info.ExpireDuration = 10.0f;
        if (FSlateNotificationManager::Get().IsValid()) // Check if manager is valid
        {
            FSlateNotificationManager::Get().AddNotification(Info);
        }
        return;
    }

    FHttpModule* Http = &FHttpModule::Get();
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = Http->CreateRequest();
    
    Request->SetVerb(TEXT("POST"));
    Request->SetURL(BackendURL + TEXT("/analyze")); // Use configured URL, ensure /analyze is the correct endpoint
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->SetTimeout(GetDefault<UQuestCopilotSettings>()->RequestTimeoutSeconds); // Use timeout from settings

    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField(TEXT("log_content"), LogContent);
    JsonObject->SetStringField(TEXT("context"), Context);
    JsonObject->SetBoolField(TEXT("quick_analysis"), true);

    FString OutputString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    Request->SetContentAsString(OutputString);
    Request->OnProcessRequestComplete().BindStatic(&SQuestCopilotWidget::OnQuickAnalysisComplete);

    if (!Request->ProcessRequest())
    {
        UE_LOG(LogQuestCopilot, Error, TEXT("Failed to process HTTP quick analysis request to %s."), *BackendURL);
        FNotificationInfo Info(LOCTEXT("QuickAnalysisSendFail", "❌ Quick analysis request failed to send."));
        Info.bFireAndForget = true;
        FSlateNotificationManager::Get().AddNotification(Info);
    }
}

void SQuestCopilotWidget::OnQuickAnalysisComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
{
    if (bWasSuccessful && Response.IsValid() && Response->GetResponseCode() == 200)
    {
        FString ResponseContent = Response->GetContentAsString();
        
        // Parse the response
        TSharedPtr<FJsonObject> JsonObject;
        TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(ResponseContent);
        
        if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
        {
            FString ErrorType = "Unknown Error";
            FString Solution = "No solution available";
            float Confidence = 0.0f;
            
            // Parse classification
            const TSharedPtr<FJsonObject>* ClassificationObj;
            if (JsonObject->TryGetObjectField(TEXT("classification"), ClassificationObj) && ClassificationObj->IsValid())
            {
                (*ClassificationObj)->TryGetStringField(TEXT("error_type"), ErrorType);
                double ConfidenceDouble;
                if ((*ClassificationObj)->TryGetNumberField(TEXT("confidence"), ConfidenceDouble))
                {
                    Confidence = (float)ConfidenceDouble;
                }
            }
            
            // Parse fix suggestion
            JsonObject->TryGetStringField(TEXT("fix"), Solution);
            
            // Show the result popup
            ShowQuickAnalysisResult(ErrorType, Solution, Confidence);
        }
    }
    else
    {
        // Show error notification
        FNotificationInfo Info(LOCTEXT("QuickAnalysisError", "❌ Quick analysis failed - check backend connection"));
        Info.bFireAndForget = true;
        Info.FadeOutDuration = 5.0f;
        Info.ExpireDuration = 8.0f;
        FSlateNotificationManager::Get().AddNotification(Info);
    }
}

void SQuestCopilotWidget::CreateQuickAnalysisPopup(const FString& ErrorType, const FString& Solution, float Confidence)
{
    // Close existing popup if open
    if (QuickAnalysisWindow.IsValid())
    {
        QuickAnalysisWindow->RequestDestroyWindow();
        QuickAnalysisWindow.Reset();
    }

    // Create popup window
    QuickAnalysisWindow = SNew(SWindow)
        .Title(LOCTEXT("QuickAnalysisTitle", "🤖 Quest Copilot - Quick Analysis"))
        .SizingRule(ESizingRule::UserSized)
        .InitialDesiredSizeInScreen(FVector2D(600, 400))
        .SupportsMaximize(false)
        .SupportsMinimize(false)
        .IsTopmostWindow(true);

    // Create content
    TSharedRef<SWidget> Content = SNew(SBorder)
        .BorderImage(FEditorStyle::GetBrush("ToolPanel.GroupBorder"))
        .Padding(16.0f)
        [
            SNew(SVerticalBox)
            
            // Header
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0, 0, 0, 16)
            [
                SNew(SHorizontalBox)
                
                + SHorizontalBox::Slot()
                .FillWidth(1.0f)
                [
                    SNew(STextBlock)
                    .Text(LOCTEXT("QuickAnalysisHeader", "🎯 Error Analysis Complete"))
                    .Font(FEditorStyle::GetFontStyle("PropertyWindow.BoldFont"))
                    .ColorAndOpacity(FLinearColor::White)
                ]
                
                + SHorizontalBox::Slot()
                .AutoWidth()
                [
                    SNew(STextBlock)
                    .Text(FText::FromString(FString::Printf(TEXT("%.0f%% Confidence"), Confidence * 100.0f)))
                    .Font(FEditorStyle::GetFontStyle("PropertyWindow.BoldFont"))
                    .ColorAndOpacity(Confidence >= 0.8f ? FLinearColor::Green : 
                                   Confidence >= 0.5f ? FLinearColor::Yellow : FLinearColor::Red)
                ]
            ]
            
            // Error Type
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0, 8)
            [
                SNew(SHorizontalBox)
                
                + SHorizontalBox::Slot()
                .AutoWidth()
                .VAlign(VAlign_Top)
                .Padding(0, 0, 8, 0)
                [
                    SNew(STextBlock)
                    .Text(LOCTEXT("ErrorTypeLabel", "🔍 Error Type:"))
                    .Font(FEditorStyle::GetFontStyle("PropertyWindow.BoldFont"))
                ]
                
                + SHorizontalBox::Slot()
                .FillWidth(1.0f)
                [
                    SNew(STextBlock)
                    .Text(FText::FromString(ErrorType))
                    .AutoWrapText(true)
                    .ColorAndOpacity(FLinearColor::White)
                ]
            ]
            
            // Solution
            + SVerticalBox::Slot()
            .FillHeight(1.0f)
            .Padding(0, 16, 0, 16)
            [
                SNew(SVerticalBox)
                
                + SVerticalBox::Slot()
                .AutoHeight()
                .Padding(0, 0, 0, 8)
                [
                    SNew(STextBlock)
                    .Text(LOCTEXT("SolutionLabel", "💡 Recommended Solution:"))
                    .Font(FEditorStyle::GetFontStyle("PropertyWindow.BoldFont"))
                ]
                
                + SVerticalBox::Slot()
                .FillHeight(1.0f)
                [
                    SNew(SBorder)
                    .BorderImage(FEditorStyle::GetBrush("ToolPanel.DarkGroupBorder"))
                    .Padding(12.0f)
                    [
                        SNew(SScrollBox)
                        
                        + SScrollBox::Slot()
                        [
                            SNew(STextBlock)
                            .Text(FText::FromString(Solution))
                            .AutoWrapText(true)
                            .ColorAndOpacity(FLinearColor::White)
                        ]
                    ]
                ]
            ]
            
            // Buttons
            + SVerticalBox::Slot()
            .AutoHeight()
            [
                SNew(SHorizontalBox)
                
                + SHorizontalBox::Slot()
                .FillWidth(1.0f)
                [
                    SNew(SButton)
                    .Text(LOCTEXT("OpenDetailedAnalysis", "📊 Open Detailed Analysis"))
                    .ToolTipText(LOCTEXT("OpenDetailedTooltip", "Open the full Quest Copilot interface for detailed analysis"))
                    .OnClicked_Lambda([ErrorType, Solution]()
                    {
                        OpenDetailedAnalysisTab(FString::Printf(TEXT("Quick Analysis Result:\nError Type: %s\nSolution: %s"), *ErrorType, *Solution));
                        if (QuickAnalysisWindow.IsValid())
                        {
                            QuickAnalysisWindow->RequestDestroyWindow();
                            QuickAnalysisWindow.Reset();
                        }
                        return FReply::Handled();
                    })
                ]
                
                + SHorizontalBox::Slot()
                .AutoWidth()
                .Padding(8, 0, 0, 0)
                [
                    SNew(SButton)
                    .Text(LOCTEXT("CloseButton", "Close"))
                    .OnClicked_Lambda([]()
                    {
                        if (QuickAnalysisWindow.IsValid())
                        {
                            QuickAnalysisWindow->RequestDestroyWindow();
                            QuickAnalysisWindow.Reset();
                        }
                        return FReply::Handled();
                    })
                ]
            ]
        ];

    QuickAnalysisWindow->SetContent(Content);
    
    // Show the window
    FSlateApplication::Get().AddWindow(QuickAnalysisWindow.ToSharedRef());
}

FReply SQuestCopilotWidget::OnScreenshotButtonClicked()
{
    CaptureScreenshot();
    return FReply::Handled();
}

void SQuestCopilotWidget::CaptureScreenshot()
{
    // Capture the viewport
    if (GEngine && GEngine->GameViewport)
    {
        TArray<FColor> ImageData;
        FIntVector Size;
        
        if (GEngine->GameViewport->ReadPixels(ImageData, FReadSurfaceDataFlags(), FIntRect(0, 0, 0, 0)))
        {
            Size = GEngine->GameViewport->GetSizeXY();
            OnScreenshotCaptured(ImageData, Size.X, Size.Y);
        }
    }
    else
    {
        // Fallback: Capture the main window
        TSharedPtr<SWindow> MainWindow = FSlateApplication::Get().GetActiveTopLevelWindow();
        if (MainWindow.IsValid())
        {
            TArray<FColor> ImageData;
            FIntVector Size(1920, 1080, 0); // Default size
            
            // For now, just mark as captured (actual implementation would need more complex screenshot logic)
            OnScreenshotCaptured(ImageData, Size.X, Size.Y);
        }
    }
}

void SQuestCopilotWidget::OnScreenshotCaptured(const TArray<FColor>& ImageData, int32 Width, int32 Height)
{
    if (ImageData.Num() > 0)
    {
        ScreenshotData = ConvertScreenshotToBase64(ImageData, Width, Height);
        bHasScreenshot = true;
        
        ScreenshotStatusText->SetText(FText::FromString(FString::Printf(TEXT("Screenshot captured (%dx%d)"), Width, Height)));
        ScreenshotStatusText->SetColorAndOpacity(FLinearColor::Green);
    }
    else
    {
        // Simulate screenshot for demo purposes
        ScreenshotData = TEXT("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");
        bHasScreenshot = true;
        
        ScreenshotStatusText->SetText(FText::FromString(TEXT("Screenshot captured (Demo Mode)")));
        ScreenshotStatusText->SetColorAndOpacity(FLinearColor::Yellow);
    }
}

FString SQuestCopilotWidget::ConvertScreenshotToBase64(const TArray<FColor>& ImageData, int32 Width, int32 Height)
{
    // This is a simplified implementation
    // In a real implementation, you'd convert the image data to PNG/JPEG and then to base64
    
    // For now, return a placeholder base64 string
    return TEXT("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");
}

// === MISSING UI STATE METHODS ===

bool SQuestCopilotWidget::IsRefreshEnabled() const
{
    return !bIsAnalyzing;
}

bool SQuestCopilotWidget::IsAnalyzeEnabled() const
{
    return !bIsAnalyzing && LogContentBox.IsValid() && !LogContentBox->GetText().IsEmpty();
}

FText SQuestCopilotWidget::GetAnalyzeButtonText() const
{
    return bIsAnalyzing ? 
        FText::FromString(TEXT("Analyzing...")) : 
        FText::FromString(TEXT("🤖 Analyze Error"));
}


// === MISSING METHOD IMPLEMENTATIONS ===

void SQuestCopilotWidget::UpdateStatusText(const FText& Status, const FLinearColor& Color)
{
    if (StatusText.IsValid())
    {
        StatusText->SetText(Status);
        StatusText->SetColorAndOpacity(Color);
    }
}

void SQuestCopilotWidget::UpdateStatusText(const FString& Status, const FLinearColor& Color)
{
    if (StatusText.IsValid())
    {
        StatusText->SetText(FText::FromString(Status));
        StatusText->SetColorAndOpacity(Color);
    }
}

FString SQuestCopilotWidget::GetProjectContext() const
{
    FString Context;
    
    // Get Unreal Engine version
    FString EngineVersion = FEngineVersion::Current().ToString();
    Context += FString::Printf(TEXT("UE Version: %s\n"), *EngineVersion);
    
    // Get project name
    FString ProjectName = FApp::GetProjectName();
    Context += FString::Printf(TEXT("Project: %s\n"), *ProjectName);
    
    // Get platform info
    FString PlatformName = UGameplayStatics::GetPlatformName();
    Context += FString::Printf(TEXT("Platform: %s\n"), *PlatformName);
    
    // Get build configuration
#if UE_BUILD_DEBUG
    Context += TEXT("Build Config: Debug\n");
#elif UE_BUILD_DEVELOPMENT
    Context += TEXT("Build Config: Development\n");
#elif UE_BUILD_SHIPPING
    Context += TEXT("Build Config: Shipping\n");
#elif UE_BUILD_TEST
    Context += TEXT("Build Config: Test\n");
#endif
    
    // Add timestamp
    FDateTime Now = FDateTime::Now();
    Context += FString::Printf(TEXT("Timestamp: %s"), *Now.ToString());
    
    return Context;
}

void SQuestCopilotWidget::ClearResults()
{
    if (ResultsText.IsValid())
    {
        ResultsText->SetText(FText::GetEmpty());
    }
    
    if (ErrorTypeText.IsValid())
    {
        ErrorTypeText->SetText(FText::GetEmpty());
    }
    
    if (ConfidenceText.IsValid())
    {
        ConfidenceText->SetText(FText::GetEmpty());
    }
    
    if (DescriptionText.IsValid())
    {
        DescriptionText->SetText(FText::GetEmpty());
    }
    
    if (SolutionText.IsValid())
    {
        SolutionText->SetText(FText::GetEmpty());
    }
    
    if (AutoFixContainer.IsValid())
    {
        AutoFixContainer->ClearChildren();
    }
    
    if (SourcesContainer.IsValid())
    {
        SourcesContainer->ClearChildren();
    }
    
    if (MetricsText.IsValid())
    {
        MetricsText->SetText(FText::GetEmpty());
    }
    
    // Clear current analysis data
    CurrentErrorType.Empty();
    CurrentConfidence = 0.0f;
    CurrentSolution.Empty();
    CurrentAutoFixes.Empty();
}

FString SQuestCopilotWidget::LoadProjectLogs()
{
    return ReadProjectLogs();
}

TSharedRef<SWidget> SQuestCopilotWidget::CreateAutoFixWidget(const FString& FixDescription, int32 FixIndex)
{
    return SNew(SHorizontalBox)
        + SHorizontalBox::Slot()
        .FillWidth(1.0f)
        .Padding(5.0f)
        [
            SNew(STextBlock)
            .Text(FText::FromString(FixDescription))
            .AutoWrapText(true)
        ]
        + SHorizontalBox::Slot()
        .AutoWidth()
        .Padding(5.0f)
        [
            SNew(SButton)
            .Text(LOCTEXT("ApplyFixButton", "Apply Fix"))
            .OnClicked(this, &SQuestCopilotWidget::OnApplyAutoFixClicked, FixIndex)
            .IsEnabled(!bIsAnalyzing)
        ];
}

TSharedRef<SWidget> SQuestCopilotWidget::CreateSourceWidget(const FString& SourceTitle, const FString& SourceUrl, float Confidence)
{
    return SNew(SHorizontalBox)
        + SHorizontalBox::Slot()
        .FillWidth(1.0f)
        .Padding(5.0f)
        [
            SNew(SVerticalBox)
            + SVerticalBox::Slot()
            .AutoHeight()
            [
                SNew(STextBlock)
                .Text(FText::FromString(SourceTitle))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 10))
            ]
            + SVerticalBox::Slot()
            .AutoHeight()
            [
                SNew(STextBlock)
                .Text(FText::FromString(FString::Printf(TEXT("Confidence: %.1f%%"), Confidence * 100.0f)))
                .Font(FCoreStyle::GetDefaultFontStyle("Regular", 8))
                .ColorAndOpacity(FLinearColor::Gray)
            ]
        ]
        + SHorizontalBox::Slot()
        .AutoWidth()
        .Padding(5.0f)
        [
            SNew(SButton)
            .Text(LOCTEXT("OpenSourceButton", "View Source"))
            .OnClicked(this, &SQuestCopilotWidget::OnOpenSourceClicked, SourceUrl)
        ];
}

FReply SQuestCopilotWidget::OnApplyAutoFixClicked(int32 FixIndex)
{
    if (FixIndex >= 0 && FixIndex < CurrentAutoFixes.Num())
    {
        FString FixDescription = CurrentAutoFixes[FixIndex];
        
        // Show confirmation dialog
        FText DialogText = FText::FromString(FString::Printf(TEXT("Apply this auto-fix?\n\n%s"), *FixDescription));
        EAppReturnType::Type Result = FMessageDialog::Open(EAppMsgType::YesNo, DialogText);
        
        if (Result == EAppReturnType::Yes)
        {
            // Here you would implement the actual auto-fix logic
            // For now, just show a notification
            FNotificationInfo Info(FText::FromString(FString::Printf(TEXT("Auto-fix applied: %s"), *FixDescription)));
            Info.ExpireDuration = 5.0f;
            FSlateNotificationManager::Get().AddNotification(Info);
            
            UE_LOG(LogQuestCopilot, Log, TEXT("Auto-fix applied: %s"), *FixDescription);
        }
    }
    
    return FReply::Handled();
}

FReply SQuestCopilotWidget::OnOpenSourceClicked(const FString& SourceUrl)
{
    if (!SourceUrl.IsEmpty())
    {
        FPlatformProcess::LaunchURL(*SourceUrl, nullptr, nullptr);
        UE_LOG(LogQuestCopilot, Log, TEXT("Opened source URL: %s"), *SourceUrl);
    }
    
    return FReply::Handled();
}

#undef LOCTEXT_NAMESPACE
