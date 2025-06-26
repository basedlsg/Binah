// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#pragma once

#include "CoreMinimal.h"
#include "Widgets/SCompoundWidget.h"
#include "Widgets/Input/SMultiLineEditableTextBox.h"
#include "Widgets/Input/SEditableTextBox.h"
#include "Widgets/Input/SButton.h"
#include "Widgets/Text/STextBlock.h"
#include "Widgets/Layout/SScrollBox.h"
#include "Widgets/Layout/SSplitter.h"

// Forward declarations
class FQuestCopilotHttpManager;

DECLARE_DELEGATE_OneParam(FOnQuestCopilotAnalysisComplete, const FString&);

/**
 * Main Quest Dev Copilot widget with modular architecture
 * Provides AI-powered error analysis with improved UX and performance
 */
class QUESTCOPILOT_API SQuestCopilotWidget : public SCompoundWidget
{
public:
    SLATE_BEGIN_ARGS(SQuestCopilotWidget)
        : _OnAnalysisComplete()
    {}
        SLATE_EVENT(FOnQuestCopilotAnalysisComplete, OnAnalysisComplete)
    SLATE_END_ARGS()

    /** Construct the widget */
    void Construct(const FArguments& InArgs);

private:
    // === UI CREATION METHODS ===
    
    /** Create the main layout structure */
    TSharedRef<SWidget> CreateMainLayout();
    
    /** Create header section with title and controls */
    TSharedRef<SWidget> CreateHeaderSection();
    
    /** Create status display section */
    TSharedRef<SWidget> CreateStatusSection();
    
    /** Create log input section */
    TSharedRef<SWidget> CreateLogInputSection();
    
    /** Create results display section */
    TSharedRef<SWidget> CreateResultsSection();
    
    /** Create action buttons section */
    TSharedRef<SWidget> CreateActionSection();
    
    /** Create screenshot capture section */
    TSharedRef<SWidget> CreateScreenshotSection();

    // === EVENT HANDLERS ===
    
    /** Handle analyze button click */
    FReply OnAnalyzeButtonClicked();
    
    /** Handle refresh button click */
    FReply OnRefreshButtonClicked();
    
    /** Handle clear button click */
    FReply OnClearButtonClicked();
    
    /** Handle screenshot button click */
    FReply OnScreenshotButtonClicked();
    
    /** Handle log content changes */
    void OnLogContentChanged(const FText& Text);

    // === ANALYSIS METHODS ===
    
    /** Handle analysis completion from HTTP manager */
    void OnAnalysisComplete(bool bSuccess, const FString& Response);
    
    /** Display analysis results in UI */
    void DisplayAnalysisResults(const FString& JsonResponse);
    
    /** Show offline analysis options dialog */
    void ShowOfflineAnalysisDialog();
    
    /** Perform basic offline analysis */
    void PerformOfflineAnalysis();
    
    /** Analyze logs offline with pattern matching */
    FString AnalyzeLogsOffline(const FString& LogContent);

    // === UTILITY METHODS ===
    
    /** Get analyze button text based on state */
    FText GetAnalyzeButtonText() const;
    
    /** Check if analyze button should be enabled */
    TAttribute<bool> IsAnalyzeEnabled() const;
    
    /** Check if refresh button should be enabled */
    TAttribute<bool> IsRefreshEnabled() const;
    
    /** Get log statistics text */
    FText GetLogStatsText() const;
    
    /** Get analysis hint text */
    FText GetAnalysisHintText() const;
    
    /** Update status text with color */
    void UpdateStatusText(const FText& StatusText, const FLinearColor& Color = FLinearColor::Green);
    
    /** Update UI based on current state */
    void UpdateUI();
    
    /** Load project logs asynchronously */
    void AsyncLoadProjectLogs();
    
    /** Read project logs from file system */
    FString ReadProjectLogs();
    
    /** Get project context information */
    FString GetProjectContext();
    
    /** Clear all results */
    void ClearResults();

    // === MEMBER VARIABLES ===
    
    /** HTTP manager for secure request handling */
    TSharedPtr<FQuestCopilotHttpManager> HttpManager;
    
    /** Analysis completion callback */
    FOnQuestCopilotAnalysisComplete OnAnalysisComplete;
    
    /** Current analysis state */
    bool bIsAnalyzing;
    
    /** Screenshot capture state */
    bool bHasScreenshot;
    FString ScreenshotData;
    
    // === UI WIDGETS ===
    
    /** Status display */
    TSharedPtr<STextBlock> StatusText;
    
    /** Log content input */
    TSharedPtr<SMultiLineEditableTextBox> LogContentBox;
    
    /** Results display */
    TSharedPtr<SScrollBox> ResultsScrollBox;
    TSharedPtr<STextBlock> ResultsText;
    
    /** Action buttons */
    TSharedPtr<SButton> AnalyzeButton;
    TSharedPtr<SButton> RefreshButton;
    TSharedPtr<SButton> ScreenshotButton;
    
    /** Screenshot widgets */
    TSharedPtr<STextBlock> ScreenshotStatusText;
    TSharedPtr<SEditableTextBox> ScreenshotDescriptionBox;
};
