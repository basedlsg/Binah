// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#pragma once

#include "CoreMinimal.h"
#include "Widgets/SCompoundWidget.h"
#include "Widgets/Input/SMultiLineEditableTextBox.h"
#include "Widgets/Input/SEditableTextBox.h"
#include "Widgets/Input/SButton.h"
#include "Widgets/Text/STextBlock.h"
#include "Widgets/Layout/SScrollBox.h"

DECLARE_DELEGATE(FOnRefreshLogs);
DECLARE_DELEGATE(FOnAnalyzeClicked);
DECLARE_DELEGATE(FOnScreenshotClicked);
DECLARE_DELEGATE_OneParam(FOnAutoFixClicked, int32);
DECLARE_DELEGATE_OneParam(FOnSourceClicked, const FString&);

/**
 * Header widget component for Quest Dev Copilot
 */
class QUESTCOPILOT_API SQuestCopilotHeader : public SCompoundWidget
{
public:
    SLATE_BEGIN_ARGS(SQuestCopilotHeader)
        : _OnRefreshLogs()
        , _IsRefreshEnabled(true)
    {}
        SLATE_EVENT(FOnRefreshLogs, OnRefreshLogs)
        SLATE_ATTRIBUTE(bool, IsRefreshEnabled)
    SLATE_END_ARGS()

    void Construct(const FArguments& InArgs);

private:
    FOnRefreshLogs OnRefreshLogs;
    TAttribute<bool> IsRefreshEnabled;
};

/**
 * Status display widget component
 */
class QUESTCOPILOT_API SQuestCopilotStatus : public SCompoundWidget
{
public:
    SLATE_BEGIN_ARGS(SQuestCopilotStatus) {}
    SLATE_END_ARGS()

    void Construct(const FArguments& InArgs);
    
    /** Update status text and color */
    void SetStatus(const FText& StatusText, const FLinearColor& Color = FLinearColor::Green);
    
    /** Set analyzing state */
    void SetAnalyzing(bool bIsAnalyzing);

private:
    TSharedPtr<STextBlock> StatusTextWidget;
};

/**
 * Screenshot capture widget component
 */
class QUESTCOPILOT_API SQuestCopilotScreenshot : public SCompoundWidget
{
public:
    SLATE_BEGIN_ARGS(SQuestCopilotScreenshot)
        : _OnScreenshotClicked()
        , _IsEnabled(true)
    {}
        SLATE_EVENT(FOnScreenshotClicked, OnScreenshotClicked)
        SLATE_ATTRIBUTE(bool, IsEnabled)
    SLATE_END_ARGS()

    void Construct(const FArguments& InArgs);
    
    /** Set screenshot status */
    void SetScreenshotStatus(const FText& StatusText, const FLinearColor& Color);
    
    /** Get screenshot description */
    FString GetScreenshotDescription() const;
    
    /** Clear screenshot description */
    void ClearDescription();

private:
    TSharedPtr<STextBlock> ScreenshotStatusText;
    TSharedPtr<SEditableTextBox> DescriptionBox;
    FOnScreenshotClicked OnScreenshotClicked;
    TAttribute<bool> IsEnabled;
};

/**
 * Log content input widget component
 */
class QUESTCOPILOT_API SQuestCopilotLogInput : public SCompoundWidget
{
public:
    SLATE_BEGIN_ARGS(SQuestCopilotLogInput) {}
    SLATE_END_ARGS()

    void Construct(const FArguments& InArgs);
    
    /** Set log content */
    void SetLogContent(const FString& LogContent);
    
    /** Get log content */
    FString GetLogContent() const;
    
    /** Clear log content */
    void ClearLogContent();
    
    /** Check if log content is empty */
    bool IsEmpty() const;

private:
    TSharedPtr<SMultiLineEditableTextBox> LogContentBox;
};

/**
 * Analysis button widget component
 */
class QUESTCOPILOT_API SQuestCopilotAnalyzeButton : public SCompoundWidget
{
public:
    SLATE_BEGIN_ARGS(SQuestCopilotAnalyzeButton)
        : _OnAnalyzeClicked()
        , _IsEnabled(true)
        , _IsAnalyzing(false)
    {}
        SLATE_EVENT(FOnAnalyzeClicked, OnAnalyzeClicked)
        SLATE_ATTRIBUTE(bool, IsEnabled)
        SLATE_ATTRIBUTE(bool, IsAnalyzing)
    SLATE_END_ARGS()

    void Construct(const FArguments& InArgs);

private:
    FText GetButtonText() const;
    
    FOnAnalyzeClicked OnAnalyzeClicked;
    TAttribute<bool> IsEnabled;
    TAttribute<bool> IsAnalyzing;
};

/**
 * Analysis results widget component
 */
class QUESTCOPILOT_API SQuestCopilotResults : public SCompoundWidget
{
public:
    SLATE_BEGIN_ARGS(SQuestCopilotResults)
        : _OnAutoFixClicked()
        , _OnSourceClicked()
    {}
        SLATE_EVENT(FOnAutoFixClicked, OnAutoFixClicked)
        SLATE_EVENT(FOnSourceClicked, OnSourceClicked)
    SLATE_END_ARGS()

    void Construct(const FArguments& InArgs);
    
    /** Display analysis results */
    void DisplayResults(const FString& JsonResponse);
    
    /** Clear all results */
    void ClearResults();
    
    /** Set default message */
    void SetDefaultMessage();

private:
    /** Create auto-fix widget */
    TSharedRef<SWidget> CreateAutoFixWidget(const FString& FixDescription, int32 FixIndex);
    
    /** Create source reference widget */
    TSharedRef<SWidget> CreateSourceWidget(const FString& SourceTitle, const FString& SourceUrl, float Confidence);

    TSharedPtr<SScrollBox> ResultsScrollBox;
    TSharedPtr<SVerticalBox> ResultsContainer;
    
    FOnAutoFixClicked OnAutoFixClicked;
    FOnSourceClicked OnSourceClicked;
    
    // Analysis data
    FString CurrentErrorType;
    float CurrentConfidence;
    FString CurrentSolution;
    TArray<FString> CurrentAutoFixes;
};

/**
 * Widget factory for creating Quest Copilot components
 */
class QUESTCOPILOT_API FQuestCopilotWidgetFactory
{
public:
    /** Create header widget */
    static TSharedRef<SQuestCopilotHeader> CreateHeader(
        FOnRefreshLogs OnRefreshLogs,
        TAttribute<bool> IsRefreshEnabled
    );
    
    /** Create status widget */
    static TSharedRef<SQuestCopilotStatus> CreateStatus();
    
    /** Create screenshot widget */
    static TSharedRef<SQuestCopilotScreenshot> CreateScreenshot(
        FOnScreenshotClicked OnScreenshotClicked,
        TAttribute<bool> IsEnabled
    );
    
    /** Create log input widget */
    static TSharedRef<SQuestCopilotLogInput> CreateLogInput();
    
    /** Create analyze button widget */
    static TSharedRef<SQuestCopilotAnalyzeButton> CreateAnalyzeButton(
        FOnAnalyzeClicked OnAnalyzeClicked,
        TAttribute<bool> IsEnabled,
        TAttribute<bool> IsAnalyzing
    );
    
    /** Create results widget */
    static TSharedRef<SQuestCopilotResults> CreateResults(
        FOnAutoFixClicked OnAutoFixClicked,
        FOnSourceClicked OnSourceClicked
    );
}; 