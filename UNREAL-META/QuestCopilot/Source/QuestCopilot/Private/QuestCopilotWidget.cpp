// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#include "QuestCopilotWidget.h"
#include "QuestCopilotModule.h"
#include "QuestCopilotSettings.h"
#include "QuestCopilotHttpManager.h"
#include "Widgets/Layout/SBorder.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/Input/SEditableTextBox.h"
#include "Framework/Notifications/NotificationManager.h"
#include "Widgets/Notifications/SNotificationList.h"
#include "EditorStyleSet.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonSerializer.h"
#include "Engine/Engine.h"
#include "Kismet/GameplayStatics.h"
#include "Misc/App.h"
#include "Misc/EngineVersion.h"
#include "Misc/DateTime.h"
#include "HAL/PlatformProcess.h"
#include "Misc/MessageDialog.h"

#define LOCTEXT_NAMESPACE "SQuestCopilotWidget"

void SQuestCopilotWidget::Construct(const FArguments& InArgs)
{
    // Initialize state
    bIsAnalyzing = false;
    bHasScreenshot = false;
    OnAnalysisComplete = InArgs._OnAnalysisComplete;
    
    // Create HTTP manager for secure, efficient requests
    HttpManager = MakeShared<FQuestCopilotHttpManager>();
    
    // Build modular UI layout
    ChildSlot
    [
        CreateMainLayout()
    ];

    // Initialize with project logs
    AsyncLoadProjectLogs();
}

TSharedRef<SWidget> SQuestCopilotWidget::CreateMainLayout()
{
    return SNew(SVerticalBox)
        
        // Header Section
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f)
        [
            CreateHeaderSection()
        ]

        // Status Section
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f, 5.0f)
        [
            CreateStatusSection()
        ]

        // Content Section (Splitter for better UX)
        + SVerticalBox::Slot()
        .FillHeight(1.0f)
        .Padding(10.0f)
        [
            SNew(SSplitter)
            .Orientation(Orient_Vertical)
            
            // Log Input Panel
            + SSplitter::Slot()
            .Value(0.4f)
            [
                CreateLogInputSection()
            ]
            
            // Results Panel
            + SSplitter::Slot()
            .Value(0.6f)
            [
                CreateResultsSection()
            ]
        ]
        
        // Action Section
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f)
        [
            CreateActionSection()
        ];
}

TSharedRef<SWidget> SQuestCopilotWidget::CreateHeaderSection()
{
    return SNew(SBorder)
        .BorderImage(FEditorStyle::GetBrush("ToolPanel.GroupBorder"))
        .Padding(8.0f)
        [
            SNew(SHorizontalBox)
            
            // Title
            + SHorizontalBox::Slot()
            .FillWidth(1.0f)
            .VAlign(VAlign_Center)
            [
                SNew(STextBlock)
                .Text(LOCTEXT("PluginTitle", "🤖 Quest Dev Copilot - AI Error Analysis"))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 16))
                .ColorAndOpacity(FLinearColor::White)
            ]
            
            // Controls
            + SHorizontalBox::Slot()
            .AutoWidth()
            .Padding(5.0f, 0.0f)
            [
                SNew(SHorizontalBox)
                
                // Refresh Button
                + SHorizontalBox::Slot()
                .AutoWidth()
                .Padding(0, 0, 5, 0)
                [
                    SAssignNew(RefreshButton, SButton)
                    .Text(LOCTEXT("RefreshButton", "🔄 Refresh"))
                    .OnClicked(this, &SQuestCopilotWidget::OnRefreshButtonClicked)
                    .IsEnabled(this, &SQuestCopilotWidget::IsRefreshEnabled)
                    .ToolTipText(LOCTEXT("RefreshTooltip", "Load latest project logs"))
                    .ButtonStyle(FEditorStyle::Get(), "FlatButton.Default")
                ]
                
                // Clear Button
                + SHorizontalBox::Slot()
                .AutoWidth()
                [
                    SNew(SButton)
                    .Text(LOCTEXT("ClearButton", "🗑️ Clear"))
                    .OnClicked(this, &SQuestCopilotWidget::OnClearButtonClicked)
                    .ToolTipText(LOCTEXT("ClearTooltip", "Clear all content and results"))
                    .ButtonStyle(FEditorStyle::Get(), "FlatButton.Default")
                ]
            ]
        ];
}

TSharedRef<SWidget> SQuestCopilotWidget::CreateStatusSection()
{
    return SNew(SBorder)
        .BorderImage(FEditorStyle::GetBrush("ToolPanel.DarkGroupBorder"))
        .Padding(8.0f)
        [
            SAssignNew(StatusText, STextBlock)
            .Text(LOCTEXT("StatusReady", "✅ Ready - Load logs or paste error content to begin analysis"))
            .ColorAndOpacity(FLinearColor::Green)
            .Font(FCoreStyle::GetDefaultFontStyle("Regular", 10))
            .AutoWrapText(true)
        ];
}

TSharedRef<SWidget> SQuestCopilotWidget::CreateLogInputSection()
{
    return SNew(SBorder)
        .BorderImage(FEditorStyle::GetBrush("ToolPanel.GroupBorder"))
        .Padding(8.0f)
        [
            SNew(SVerticalBox)
            
            // Header
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0, 0, 0, 5)
            [
                SNew(SHorizontalBox)
                
                + SHorizontalBox::Slot()
                .FillWidth(1.0f)
                [
                    SNew(STextBlock)
                    .Text(LOCTEXT("LogContentLabel", "📋 Log Content"))
                    .Font(FCoreStyle::GetDefaultFontStyle("Bold", 12))
                ]
                
                + SHorizontalBox::Slot()
                .AutoWidth()
                [
                    SNew(STextBlock)
                    .Text(this, &SQuestCopilotWidget::GetLogStatsText)
                    .Font(FCoreStyle::GetDefaultFontStyle("Regular", 9))
                    .ColorAndOpacity(FLinearColor::Gray)
                ]
            ]
            
            // Log Input
            + SVerticalBox::Slot()
            .FillHeight(1.0f)
            [
                SAssignNew(LogContentBox, SMultiLineEditableTextBox)
                .HintText(LOCTEXT("LogContentHint", "Paste your Unreal Engine error logs here...\n\nTip: Use 'Refresh' to auto-load project logs"))
                .IsReadOnly(false)
                .Font(FCoreStyle::GetDefaultFontStyle("Mono", 9))
                .OnTextChanged(this, &SQuestCopilotWidget::OnLogContentChanged)
            ]
        ];
}

TSharedRef<SWidget> SQuestCopilotWidget::CreateResultsSection()
{
    return SNew(SBorder)
        .BorderImage(FEditorStyle::GetBrush("ToolPanel.GroupBorder"))
        .Padding(8.0f)
        [
            SNew(SVerticalBox)
            
            // Header
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0, 0, 0, 5)
            [
                SNew(STextBlock)
                .Text(LOCTEXT("AnalysisResultsLabel", "🔍 Analysis Results"))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 12))
            ]
            
            // Results Content
            + SVerticalBox::Slot()
            .FillHeight(1.0f)
            [
                SAssignNew(ResultsScrollBox, SScrollBox)
                + SScrollBox::Slot()
                [
                    SAssignNew(ResultsText, STextBlock)
                    .Text(LOCTEXT("NoAnalysisYet", "🤖 Ready for analysis!\n\nLoad some log content and click 'Analyze Error' to get AI-powered insights and solutions."))
                    .AutoWrapText(true)
                    .ColorAndOpacity(FLinearColor::Gray)
                    .Justification(ETextJustify::Center)
                ]
            ]
        ];
}

TSharedRef<SWidget> SQuestCopilotWidget::CreateActionSection()
{
    return SNew(SHorizontalBox)
        
        // Screenshot Section
        + SHorizontalBox::Slot()
        .FillWidth(0.4f)
        .Padding(0, 0, 10, 0)
        [
            CreateScreenshotSection()
        ]
        
        // Main Action Button
        + SHorizontalBox::Slot()
        .FillWidth(0.6f)
        [
            SNew(SVerticalBox)
            
            + SVerticalBox::Slot()
            .AutoHeight()
            .HAlign(HAlign_Center)
            [
                SAssignNew(AnalyzeButton, SButton)
                .Text(this, &SQuestCopilotWidget::GetAnalyzeButtonText)
                .OnClicked(this, &SQuestCopilotWidget::OnAnalyzeButtonClicked)
                .IsEnabled(this, &SQuestCopilotWidget::IsAnalyzeEnabled)
                .ButtonStyle(FEditorStyle::Get(), "FlatButton.Success")
                .ContentPadding(FMargin(20, 8))
            ]
            
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0, 5, 0, 0)
            .HAlign(HAlign_Center)
            [
                SNew(STextBlock)
                .Text(this, &SQuestCopilotWidget::GetAnalysisHintText)
                .Font(FCoreStyle::GetDefaultFontStyle("Italic", 8))
                .ColorAndOpacity(FLinearColor::Gray)
                .AutoWrapText(true)
                .Justification(ETextJustify::Center)
            ]
        ];
}

TSharedRef<SWidget> SQuestCopilotWidget::CreateScreenshotSection()
{
    return SNew(SBorder)
        .BorderImage(FEditorStyle::GetBrush("ToolPanel.DarkGroupBorder"))
        .Padding(6.0f)
        [
            SNew(SVerticalBox)
            
            + SVerticalBox::Slot()
            .AutoHeight()
            [
                SNew(STextBlock)
                .Text(LOCTEXT("ScreenshotLabel", "📸 Visual Analysis"))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 10))
                .ColorAndOpacity(FLinearColor::Yellow)
            ]
            
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0, 3, 0, 0)
            [
                SAssignNew(ScreenshotButton, SButton)
                .Text(LOCTEXT("CaptureButton", "Capture Screenshot"))
                .OnClicked(this, &SQuestCopilotWidget::OnScreenshotButtonClicked)
                .IsEnabled(this, &SQuestCopilotWidget::IsAnalyzeEnabled)
                .ToolTipText(LOCTEXT("ScreenshotTooltip", "Capture screenshot for visual error analysis"))
                .ButtonStyle(FEditorStyle::Get(), "FlatButton.Default")
            ]
            
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0, 3, 0, 0)
            [
                SAssignNew(ScreenshotStatusText, STextBlock)
                .Text(LOCTEXT("NoScreenshot", "No screenshot"))
                .ColorAndOpacity(FLinearColor::Gray)
                .Font(FCoreStyle::GetDefaultFontStyle("Regular", 8))
            ]
        ];
}

// Event Handlers with improved error handling and UX

FReply SQuestCopilotWidget::OnAnalyzeButtonClicked()
{
    if (bIsAnalyzing)
    {
        // Cancel current analysis
        if (HttpManager.IsValid())
        {
            HttpManager->CancelAllRequests();
        }
        bIsAnalyzing = false;
        UpdateUI();
        UpdateStatusText(LOCTEXT("AnalysisCancelled", "⏹️ Analysis cancelled"), FLinearColor::Yellow);
        return FReply::Handled();
    }

    // Validate backend configuration
    if (!HttpManager.IsValid() || HttpManager->GetBackendURL().IsEmpty())
    {
        ShowOfflineAnalysisDialog();
        return FReply::Handled();
    }

    // Validate log content
    FString LogContent = LogContentBox->GetText().ToString();
    if (LogContent.IsEmpty())
    {
        UpdateStatusText(LOCTEXT("StatusNoLogs", "❌ No logs to analyze. Paste logs or click 'Refresh Logs'."), FLinearColor::Red);
        return FReply::Handled();
    }

    // Start analysis
    bIsAnalyzing = true;
    UpdateUI();
    UpdateStatusText(LOCTEXT("StatusAnalyzing", "🔄 Analyzing with AI... (Click to cancel)"), FLinearColor::Yellow);

    // Send request via HTTP manager
    FString Context = GetProjectContext();
    FString ScreenshotData = bHasScreenshot ? ScreenshotData : TEXT("");
    FString ScreenshotDesc = ScreenshotDescriptionBox.IsValid() ? ScreenshotDescriptionBox->GetText().ToString() : TEXT("");

    HttpManager->SendAnalysisRequest(
        LogContent,
        Context,
        ScreenshotData,
        ScreenshotDesc,
        FOnHttpRequestComplete::CreateSP(this, &SQuestCopilotWidget::OnAnalysisComplete)
    );

    return FReply::Handled();
}

void SQuestCopilotWidget::OnAnalysisComplete(bool bSuccess, const FString& Response)
{
    bIsAnalyzing = false;
    UpdateUI();

    if (!bSuccess)
    {
        UpdateStatusText(FText::FromString(FString::Printf(TEXT("❌ Analysis failed: %s"), *Response)), FLinearColor::Red);
        ShowOfflineAnalysisDialog();
        return;
    }

    UpdateStatusText(LOCTEXT("StatusComplete", "✅ Analysis complete"), FLinearColor::Green);
    DisplayAnalysisResults(Response);
}

void SQuestCopilotWidget::ShowOfflineAnalysisDialog()
{
    FText DialogText = LOCTEXT("OfflineAnalysisDialog", 
        "Backend service unavailable. Would you like to:\n\n"
        "• Configure backend URL in Project Settings\n"
        "• Use offline pattern matching (limited)\n"
        "• View setup instructions");

    EAppReturnType::Type Result = FMessageDialog::Open(
        EAppMsgType::YesNoCancel, 
        DialogText,
        LOCTEXT("OfflineAnalysisTitle", "Analysis Options")
    );

    switch (Result)
    {
        case EAppReturnType::Yes:
            // Open project settings
            break;
        case EAppReturnType::No:
            PerformOfflineAnalysis();
            break;
        case EAppReturnType::Cancel:
        default:
            break;
    }
}

void SQuestCopilotWidget::PerformOfflineAnalysis()
{
    FString LogContent = LogContentBox->GetText().ToString();
    FString OfflineResult = AnalyzeLogsOffline(LogContent);
    
    UpdateStatusText(LOCTEXT("OfflineAnalysisComplete", "✅ Offline analysis complete (limited)"), FLinearColor::Green);
    ResultsText->SetText(FText::FromString(OfflineResult));
    ResultsText->SetColorAndOpacity(FLinearColor::White);
}

FString SQuestCopilotWidget::AnalyzeLogsOffline(const FString& LogContent)
{
    // Basic pattern matching for common errors
    FString Result = TEXT("🔍 Offline Analysis Results\n\n");
    
    if (LogContent.Contains(TEXT("Error:")) || LogContent.Contains(TEXT("ERROR:")))
    {
        Result += TEXT("❌ Error detected in logs\n");
        
        if (LogContent.Contains(TEXT("Blueprint")))
        {
            Result += TEXT("💡 Blueprint-related error detected\n");
            Result += TEXT("• Check Blueprint compilation\n");
            Result += TEXT("• Verify node connections\n");
            Result += TEXT("• Check variable types\n\n");
        }
        
        if (LogContent.Contains(TEXT("Packaging")) || LogContent.Contains(TEXT("Build")))
        {
            Result += TEXT("📦 Build/Packaging error detected\n");
            Result += TEXT("• Check project settings\n");
            Result += TEXT("• Verify asset references\n");
            Result += TEXT("• Clean and rebuild\n\n");
        }
        
        if (LogContent.Contains(TEXT("Memory")) || LogContent.Contains(TEXT("OutOfMemory")))
        {
            Result += TEXT("💾 Memory-related issue detected\n");
            Result += TEXT("• Optimize texture sizes\n");
            Result += TEXT("• Check for memory leaks\n");
            Result += TEXT("• Reduce asset complexity\n\n");
        }
    }
    else
    {
        Result += TEXT("ℹ️ No obvious errors detected\n");
        Result += TEXT("• Logs appear normal\n");
        Result += TEXT("• For detailed analysis, configure backend service\n\n");
    }
    
    Result += TEXT("⚠️ Note: This is basic pattern matching. For comprehensive AI analysis, configure the backend service in Project Settings.");
    
    return Result;
}

// Utility methods for improved UX

FText SQuestCopilotWidget::GetLogStatsText() const
{
    if (!LogContentBox.IsValid())
        return FText::GetEmpty();
        
    FString LogContent = LogContentBox->GetText().ToString();
    int32 LineCount = LogContent.ParseIntoArray(TArray<FString>(), TEXT("\n")).Num();
    int32 CharCount = LogContent.Len();
    
    return FText::FromString(FString::Printf(TEXT("%d lines, %d chars"), LineCount, CharCount));
}

FText SQuestCopilotWidget::GetAnalysisHintText() const
{
    if (bIsAnalyzing)
        return LOCTEXT("AnalysisInProgress", "Analysis in progress...");
        
    if (!IsAnalyzeEnabled().Get())
        return LOCTEXT("AnalysisDisabledHint", "Add log content to enable analysis");
        
    return LOCTEXT("AnalysisReadyHint", "Click to analyze with AI");
}

void SQuestCopilotWidget::OnLogContentChanged(const FText& Text)
{
    // Auto-detect error types for better UX
    FString Content = Text.ToString();
    if (Content.Contains(TEXT("Error:")) || Content.Contains(TEXT("ERROR:")))
    {
        UpdateStatusText(LOCTEXT("ErrorDetected", "⚠️ Error detected in logs - ready for analysis"), FLinearColor::Yellow);
    }
    else if (!Content.IsEmpty())
    {
        UpdateStatusText(LOCTEXT("LogsLoaded", "📋 Logs loaded - ready for analysis"), FLinearColor::Green);
    }
    else
    {
        UpdateStatusText(LOCTEXT("StatusReady", "✅ Ready - Load logs or paste error content"), FLinearColor::Green);
    }
}

void SQuestCopilotWidget::AsyncLoadProjectLogs()
{
    // Load project logs asynchronously to avoid blocking UI
    AsyncTask(ENamedThreads::AnyBackgroundThreadNormalTask, [this]()
    {
        FString LogContent = ReadProjectLogs();
        
        // Update UI on main thread
        AsyncTask(ENamedThreads::GameThread, [this, LogContent]()
        {
            if (LogContentBox.IsValid() && LogContentBox->GetText().IsEmpty())
            {
                LogContentBox->SetText(FText::FromString(LogContent));
                if (!LogContent.IsEmpty())
                {
                    UpdateStatusText(LOCTEXT("ProjectLogsLoaded", "📁 Project logs loaded automatically"), FLinearColor::Green);
                }
            }
        });
    });
}

#undef LOCTEXT_NAMESPACE
