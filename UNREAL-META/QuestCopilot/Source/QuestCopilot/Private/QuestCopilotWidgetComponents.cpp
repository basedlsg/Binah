// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.

#include "QuestCopilotWidgetComponents.h"
#include "Widgets/Layout/SBorder.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/Layout/SVerticalBox.h"
#include "Widgets/Layout/SHorizontalBox.h"
#include "Widgets/Input/SButton.h"
#include "Widgets/Text/STextBlock.h"
#include "Widgets/Images/SImage.h"
#include "Styling/SlateColor.h"
#include "Styling/CoreStyle.h"
#include "Engine/Engine.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonReader.h"
#include "HAL/PlatformApplicationMisc.h"

#define LOCTEXT_NAMESPACE "QuestCopilotWidgetComponents"

//////////////////////////////////////////////////////////////////////////
// SQuestCopilotHeader

void SQuestCopilotHeader::Construct(const FArguments& InArgs)
{
    OnRefreshLogs = InArgs._OnRefreshLogs;
    IsRefreshEnabled = InArgs._IsRefreshEnabled;

    ChildSlot
    [
        SNew(SBorder)
        .BorderImage(FCoreStyle::Get().GetBrush("ToolPanel.GroupBorder"))
        .Padding(FMargin(8.0f, 4.0f))
        [
            SNew(SHorizontalBox)
            
            // Title
            + SHorizontalBox::Slot()
            .HAlign(HAlign_Left)
            .VAlign(VAlign_Center)
            .AutoWidth()
            [
                SNew(STextBlock)
                .Text(LOCTEXT("QuestCopilotTitle", "Quest Dev Copilot"))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 14))
                .ColorAndOpacity(FLinearColor(0.9f, 0.9f, 0.9f))
            ]
            
            // Spacer
            + SHorizontalBox::Slot()
            .HAlign(HAlign_Fill)
            .VAlign(VAlign_Center)
            .FillWidth(1.0f)
            [
                SNew(SBox)
                .HeightOverride(1.0f)
            ]
            
            // Refresh Button
            + SHorizontalBox::Slot()
            .HAlign(HAlign_Right)
            .VAlign(VAlign_Center)
            .AutoWidth()
            [
                SNew(SButton)
                .Text(LOCTEXT("RefreshLogsButton", "Refresh Logs"))
                .ToolTipText(LOCTEXT("RefreshLogsTooltip", "Refresh project logs from the current session"))
                .IsEnabled(IsRefreshEnabled)
                .OnClicked_Lambda([this]() -> FReply
                {
                    if (OnRefreshLogs.IsBound())
                    {
                        OnRefreshLogs.Execute();
                    }
                    return FReply::Handled();
                })
            ]
        ]
    ];
}

//////////////////////////////////////////////////////////////////////////
// SQuestCopilotStatus

void SQuestCopilotStatus::Construct(const FArguments& InArgs)
{
    ChildSlot
    [
        SNew(SBorder)
        .BorderImage(FCoreStyle::Get().GetBrush("ToolPanel.GroupBorder"))
        .Padding(FMargin(8.0f, 4.0f))
        [
            SAssignNew(StatusTextWidget, STextBlock)
            .Text(LOCTEXT("StatusReady", "Ready"))
            .ColorAndOpacity(FLinearColor::Green)
            .Justification(ETextJustify::Center)
        ]
    ];
}

void SQuestCopilotStatus::SetStatus(const FText& StatusText, const FLinearColor& Color)
{
    if (StatusTextWidget.IsValid())
    {
        StatusTextWidget->SetText(StatusText);
        StatusTextWidget->SetColorAndOpacity(Color);
    }
}

void SQuestCopilotStatus::SetAnalyzing(bool bIsAnalyzing)
{
    if (bIsAnalyzing)
    {
        SetStatus(LOCTEXT("StatusAnalyzing", "Analyzing..."), FLinearColor::Yellow);
    }
    else
    {
        SetStatus(LOCTEXT("StatusReady", "Ready"), FLinearColor::Green);
    }
}

//////////////////////////////////////////////////////////////////////////
// SQuestCopilotScreenshot

void SQuestCopilotScreenshot::Construct(const FArguments& InArgs)
{
    OnScreenshotClicked = InArgs._OnScreenshotClicked;
    IsEnabled = InArgs._IsEnabled;

    ChildSlot
    [
        SNew(SBorder)
        .BorderImage(FCoreStyle::Get().GetBrush("ToolPanel.GroupBorder"))
        .Padding(FMargin(8.0f, 4.0f))
        [
            SNew(SVerticalBox)
            
            // Screenshot Button and Status
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0.0f, 2.0f)
            [
                SNew(SHorizontalBox)
                
                + SHorizontalBox::Slot()
                .AutoWidth()
                .VAlign(VAlign_Center)
                [
                    SNew(SButton)
                    .Text(LOCTEXT("CaptureScreenshot", "Capture Screenshot"))
                    .ToolTipText(LOCTEXT("CaptureScreenshotTooltip", "Capture a screenshot to help with visual debugging"))
                    .IsEnabled(IsEnabled)
                    .OnClicked_Lambda([this]() -> FReply
                    {
                        if (OnScreenshotClicked.IsBound())
                        {
                            OnScreenshotClicked.Execute();
                        }
                        return FReply::Handled();
                    })
                ]
                
                + SHorizontalBox::Slot()
                .FillWidth(1.0f)
                .VAlign(VAlign_Center)
                .Padding(8.0f, 0.0f)
                [
                    SAssignNew(ScreenshotStatusText, STextBlock)
                    .Text(LOCTEXT("NoScreenshot", "No screenshot captured"))
                    .ColorAndOpacity(FLinearColor(0.6f, 0.6f, 0.6f))
                ]
            ]
            
            // Description Input
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0.0f, 4.0f, 0.0f, 0.0f)
            [
                SNew(SVerticalBox)
                
                + SVerticalBox::Slot()
                .AutoHeight()
                [
                    SNew(STextBlock)
                    .Text(LOCTEXT("ScreenshotDescription", "Screenshot Description (Optional):"))
                    .Font(FCoreStyle::GetDefaultFontStyle("Regular", 9))
                ]
                
                + SVerticalBox::Slot()
                .AutoHeight()
                .Padding(0.0f, 2.0f, 0.0f, 0.0f)
                [
                    SAssignNew(DescriptionBox, SEditableTextBox)
                    .HintText(LOCTEXT("ScreenshotDescriptionHint", "Describe what you see in the screenshot..."))
                ]
            ]
        ]
    ];
}

void SQuestCopilotScreenshot::SetScreenshotStatus(const FText& StatusText, const FLinearColor& Color)
{
    if (ScreenshotStatusText.IsValid())
    {
        ScreenshotStatusText->SetText(StatusText);
        ScreenshotStatusText->SetColorAndOpacity(Color);
    }
}

FString SQuestCopilotScreenshot::GetScreenshotDescription() const
{
    if (DescriptionBox.IsValid())
    {
        return DescriptionBox->GetText().ToString();
    }
    return FString();
}

void SQuestCopilotScreenshot::ClearDescription()
{
    if (DescriptionBox.IsValid())
    {
        DescriptionBox->SetText(FText::GetEmpty());
    }
}

//////////////////////////////////////////////////////////////////////////
// SQuestCopilotLogInput

void SQuestCopilotLogInput::Construct(const FArguments& InArgs)
{
    ChildSlot
    [
        SNew(SBorder)
        .BorderImage(FCoreStyle::Get().GetBrush("ToolPanel.GroupBorder"))
        .Padding(FMargin(8.0f, 4.0f))
        [
            SNew(SVerticalBox)
            
            // Label
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0.0f, 0.0f, 0.0f, 4.0f)
            [
                SNew(STextBlock)
                .Text(LOCTEXT("LogContentLabel", "Log Content:"))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 10))
            ]
            
            // Log Input Box
            + SVerticalBox::Slot()
            .FillHeight(1.0f)
            [
                SAssignNew(LogContentBox, SMultiLineEditableTextBox)
                .HintText(LOCTEXT("LogContentHint", "Paste your error logs here or click 'Refresh Logs' to load automatically..."))
                .AllowMultiLine(true)
                .IsReadOnly(false)
                .VScrollBarAlwaysVisible(true)
                .Font(FCoreStyle::GetDefaultFontStyle("Mono", 9))
            ]
        ]
    ];
}

void SQuestCopilotLogInput::SetLogContent(const FString& LogContent)
{
    if (LogContentBox.IsValid())
    {
        LogContentBox->SetText(FText::FromString(LogContent));
    }
}

FString SQuestCopilotLogInput::GetLogContent() const
{
    if (LogContentBox.IsValid())
    {
        return LogContentBox->GetText().ToString();
    }
    return FString();
}

void SQuestCopilotLogInput::ClearLogContent()
{
    if (LogContentBox.IsValid())
    {
        LogContentBox->SetText(FText::GetEmpty());
    }
}

bool SQuestCopilotLogInput::IsEmpty() const
{
    if (LogContentBox.IsValid())
    {
        return LogContentBox->GetText().IsEmpty();
    }
    return true;
}

//////////////////////////////////////////////////////////////////////////
// SQuestCopilotAnalyzeButton

void SQuestCopilotAnalyzeButton::Construct(const FArguments& InArgs)
{
    OnAnalyzeClicked = InArgs._OnAnalyzeClicked;
    IsEnabled = InArgs._IsEnabled;
    IsAnalyzing = InArgs._IsAnalyzing;

    ChildSlot
    [
        SNew(SBorder)
        .BorderImage(FCoreStyle::Get().GetBrush("ToolPanel.GroupBorder"))
        .Padding(FMargin(8.0f, 4.0f))
        [
            SNew(SBox)
            .HeightOverride(40.0f)
            [
                SNew(SButton)
                .Text(this, &SQuestCopilotAnalyzeButton::GetButtonText)
                .HAlign(HAlign_Center)
                .VAlign(VAlign_Center)
                .IsEnabled(IsEnabled)
                .OnClicked_Lambda([this]() -> FReply
                {
                    if (OnAnalyzeClicked.IsBound())
                    {
                        OnAnalyzeClicked.Execute();
                    }
                    return FReply::Handled();
                })
            ]
        ]
    ];
}

FText SQuestCopilotAnalyzeButton::GetButtonText() const
{
    if (IsAnalyzing.Get())
    {
        return LOCTEXT("AnalyzingButton", "Analyzing...");
    }
    return LOCTEXT("AnalyzeButton", "Analyze Error");
}

//////////////////////////////////////////////////////////////////////////
// SQuestCopilotResults

void SQuestCopilotResults::Construct(const FArguments& InArgs)
{
    OnAutoFixClicked = InArgs._OnAutoFixClicked;
    OnSourceClicked = InArgs._OnSourceClicked;

    ChildSlot
    [
        SNew(SBorder)
        .BorderImage(FCoreStyle::Get().GetBrush("ToolPanel.GroupBorder"))
        .Padding(FMargin(8.0f, 4.0f))
        [
            SNew(SVerticalBox)
            
            // Results Header
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0.0f, 0.0f, 0.0f, 8.0f)
            [
                SNew(STextBlock)
                .Text(LOCTEXT("AnalysisResults", "Analysis Results"))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 12))
            ]
            
            // Results Content
            + SVerticalBox::Slot()
            .FillHeight(1.0f)
            [
                SAssignNew(ResultsScrollBox, SScrollBox)
                .Orientation(Orient_Vertical)
                [
                    SAssignNew(ResultsContainer, SVerticalBox)
                ]
            ]
        ]
    ];

    SetDefaultMessage();
}

void SQuestCopilotResults::DisplayResults(const FString& JsonResponse)
{
    if (!ResultsContainer.IsValid())
    {
        return;
    }

    // Clear existing results
    ResultsContainer->ClearChildren();

    // Parse JSON response
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonResponse);
    
    if (!FJsonSerializer::Deserialize(Reader, JsonObject) || !JsonObject.IsValid())
    {
        // Show error message
        ResultsContainer->AddSlot()
        .AutoHeight()
        .Padding(8.0f)
        [
            SNew(STextBlock)
            .Text(LOCTEXT("JsonParseError", "Error: Could not parse analysis results"))
            .ColorAndOpacity(FLinearColor::Red)
        ];
        return;
    }

    // Extract data
    CurrentErrorType = JsonObject->GetStringField(TEXT("error_type"));
    CurrentConfidence = JsonObject->GetNumberField(TEXT("confidence"));
    CurrentSolution = JsonObject->GetStringField(TEXT("solution"));

    // Display error type and confidence
    ResultsContainer->AddSlot()
    .AutoHeight()
    .Padding(4.0f)
    [
        SNew(SHorizontalBox)
        
        + SHorizontalBox::Slot()
        .AutoWidth()
        [
            SNew(STextBlock)
            .Text(LOCTEXT("ErrorType", "Error Type: "))
            .Font(FCoreStyle::GetDefaultFontStyle("Bold", 10))
        ]
        
        + SHorizontalBox::Slot()
        .FillWidth(1.0f)
        [
            SNew(STextBlock)
            .Text(FText::FromString(CurrentErrorType))
            .ColorAndOpacity(FLinearColor(0.9f, 0.7f, 0.3f))
        ]
        
        + SHorizontalBox::Slot()
        .AutoWidth()
        [
            SNew(STextBlock)
            .Text(FText::FromString(FString::Printf(TEXT("(%.1f%% confidence)"), CurrentConfidence * 100.0f)))
            .ColorAndOpacity(FLinearColor(0.6f, 0.6f, 0.6f))
            .Font(FCoreStyle::GetDefaultFontStyle("Italic", 9))
        ]
    ];

    // Display solution
    if (!CurrentSolution.IsEmpty())
    {
        ResultsContainer->AddSlot()
        .AutoHeight()
        .Padding(4.0f, 8.0f, 4.0f, 4.0f)
        [
            SNew(SVerticalBox)
            
            + SVerticalBox::Slot()
            .AutoHeight()
            [
                SNew(STextBlock)
                .Text(LOCTEXT("Solution", "Solution:"))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 10))
            ]
            
            + SVerticalBox::Slot()
            .AutoHeight()
            .Padding(0.0f, 2.0f, 0.0f, 0.0f)
            [
                SNew(STextBlock)
                .Text(FText::FromString(CurrentSolution))
                .AutoWrapText(true)
                .ColorAndOpacity(FLinearColor(0.9f, 0.9f, 0.9f))
            ]
        ];
    }

    // Display auto-fixes
    const TArray<TSharedPtr<FJsonValue>>* AutoFixesArray;
    if (JsonObject->TryGetArrayField(TEXT("auto_fixes"), AutoFixesArray))
    {
        if (AutoFixesArray->Num() > 0)
        {
            ResultsContainer->AddSlot()
            .AutoHeight()
            .Padding(4.0f, 8.0f, 4.0f, 4.0f)
            [
                SNew(STextBlock)
                .Text(LOCTEXT("AutoFixes", "Auto-Fixes Available:"))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 10))
            ];

            for (int32 i = 0; i < AutoFixesArray->Num(); ++i)
            {
                FString FixDescription = (*AutoFixesArray)[i]->AsString();
                CurrentAutoFixes.Add(FixDescription);
                
                ResultsContainer->AddSlot()
                .AutoHeight()
                .Padding(8.0f, 2.0f, 4.0f, 2.0f)
                [
                    CreateAutoFixWidget(FixDescription, i)
                ];
            }
        }
    }

    // Display source references
    const TArray<TSharedPtr<FJsonValue>>* SourcesArray;
    if (JsonObject->TryGetArrayField(TEXT("sources"), SourcesArray))
    {
        if (SourcesArray->Num() > 0)
        {
            ResultsContainer->AddSlot()
            .AutoHeight()
            .Padding(4.0f, 8.0f, 4.0f, 4.0f)
            [
                SNew(STextBlock)
                .Text(LOCTEXT("Sources", "Related Sources:"))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 10))
            ];

            for (const auto& SourceValue : *SourcesArray)
            {
                TSharedPtr<FJsonObject> SourceObj = SourceValue->AsObject();
                if (SourceObj.IsValid())
                {
                    FString Title = SourceObj->GetStringField(TEXT("title"));
                    FString Url = SourceObj->GetStringField(TEXT("url"));
                    float Confidence = SourceObj->GetNumberField(TEXT("confidence"));
                    
                    ResultsContainer->AddSlot()
                    .AutoHeight()
                    .Padding(8.0f, 2.0f, 4.0f, 2.0f)
                    [
                        CreateSourceWidget(Title, Url, Confidence)
                    ];
                }
            }
        }
    }
}

void SQuestCopilotResults::ClearResults()
{
    if (ResultsContainer.IsValid())
    {
        ResultsContainer->ClearChildren();
        SetDefaultMessage();
    }
    
    CurrentErrorType.Empty();
    CurrentConfidence = 0.0f;
    CurrentSolution.Empty();
    CurrentAutoFixes.Empty();
}

void SQuestCopilotResults::SetDefaultMessage()
{
    if (ResultsContainer.IsValid())
    {
        ResultsContainer->AddSlot()
        .AutoHeight()
        .Padding(8.0f)
        [
            SNew(STextBlock)
            .Text(LOCTEXT("NoResults", "No analysis results yet. Click 'Analyze Error' to get started."))
            .ColorAndOpacity(FLinearColor(0.6f, 0.6f, 0.6f))
            .Justification(ETextJustify::Center)
        ];
    }
}

TSharedRef<SWidget> SQuestCopilotResults::CreateAutoFixWidget(const FString& FixDescription, int32 FixIndex)
{
    return SNew(SBorder)
        .BorderImage(FCoreStyle::Get().GetBrush("ToolPanel.DarkGroupBorder"))
        .Padding(FMargin(8.0f, 4.0f))
        [
            SNew(SHorizontalBox)
            
            + SHorizontalBox::Slot()
            .FillWidth(1.0f)
            .VAlign(VAlign_Center)
            [
                SNew(STextBlock)
                .Text(FText::FromString(FixDescription))
                .AutoWrapText(true)
                .ColorAndOpacity(FLinearColor(0.8f, 0.9f, 0.8f))
            ]
            
            + SHorizontalBox::Slot()
            .AutoWidth()
            .VAlign(VAlign_Center)
            .Padding(8.0f, 0.0f, 0.0f, 0.0f)
            [
                SNew(SButton)
                .Text(LOCTEXT("ApplyFix", "Apply"))
                .ToolTipText(LOCTEXT("ApplyFixTooltip", "Apply this auto-fix to your project"))
                .OnClicked_Lambda([this, FixIndex]() -> FReply
                {
                    if (OnAutoFixClicked.IsBound())
                    {
                        OnAutoFixClicked.Execute(FixIndex);
                    }
                    return FReply::Handled();
                })
            ]
        ];
}

TSharedRef<SWidget> SQuestCopilotResults::CreateSourceWidget(const FString& SourceTitle, const FString& SourceUrl, float Confidence)
{
    return SNew(SBorder)
        .BorderImage(FCoreStyle::Get().GetBrush("ToolPanel.DarkGroupBorder"))
        .Padding(FMargin(8.0f, 4.0f))
        [
            SNew(SHorizontalBox)
            
            + SHorizontalBox::Slot()
            .FillWidth(1.0f)
            .VAlign(VAlign_Center)
            [
                SNew(SVerticalBox)
                
                + SVerticalBox::Slot()
                .AutoHeight()
                [
                    SNew(STextBlock)
                    .Text(FText::FromString(SourceTitle))
                    .ColorAndOpacity(FLinearColor(0.7f, 0.8f, 1.0f))
                    .Font(FCoreStyle::GetDefaultFontStyle("Bold", 9))
                ]
                
                + SVerticalBox::Slot()
                .AutoHeight()
                [
                    SNew(STextBlock)
                    .Text(FText::FromString(FString::Printf(TEXT("Relevance: %.1f%%"), Confidence * 100.0f)))
                    .ColorAndOpacity(FLinearColor(0.6f, 0.6f, 0.6f))
                    .Font(FCoreStyle::GetDefaultFontStyle("Italic", 8))
                ]
            ]
            
            + SHorizontalBox::Slot()
            .AutoWidth()
            .VAlign(VAlign_Center)
            .Padding(8.0f, 0.0f, 0.0f, 0.0f)
            [
                SNew(SButton)
                .Text(LOCTEXT("OpenSource", "Open"))
                .ToolTipText(LOCTEXT("OpenSourceTooltip", "Open this source in your browser"))
                .OnClicked_Lambda([this, SourceUrl]() -> FReply
                {
                    if (OnSourceClicked.IsBound())
                    {
                        OnSourceClicked.Execute(SourceUrl);
                    }
                    return FReply::Handled();
                })
            ]
        ];
}

//////////////////////////////////////////////////////////////////////////
// FQuestCopilotWidgetFactory

TSharedRef<SQuestCopilotHeader> FQuestCopilotWidgetFactory::CreateHeader(
    FOnRefreshLogs OnRefreshLogs,
    TAttribute<bool> IsRefreshEnabled)
{
    return SNew(SQuestCopilotHeader)
        .OnRefreshLogs(OnRefreshLogs)
        .IsRefreshEnabled(IsRefreshEnabled);
}

TSharedRef<SQuestCopilotStatus> FQuestCopilotWidgetFactory::CreateStatus()
{
    return SNew(SQuestCopilotStatus);
}

TSharedRef<SQuestCopilotScreenshot> FQuestCopilotWidgetFactory::CreateScreenshot(
    FOnScreenshotClicked OnScreenshotClicked,
    TAttribute<bool> IsEnabled)
{
    return SNew(SQuestCopilotScreenshot)
        .OnScreenshotClicked(OnScreenshotClicked)
        .IsEnabled(IsEnabled);
}

TSharedRef<SQuestCopilotLogInput> FQuestCopilotWidgetFactory::CreateLogInput()
{
    return SNew(SQuestCopilotLogInput);
}

TSharedRef<SQuestCopilotAnalyzeButton> FQuestCopilotWidgetFactory::CreateAnalyzeButton(
    FOnAnalyzeClicked OnAnalyzeClicked,
    TAttribute<bool> IsEnabled,
    TAttribute<bool> IsAnalyzing)
{
    return SNew(SQuestCopilotAnalyzeButton)
        .OnAnalyzeClicked(OnAnalyzeClicked)
        .IsEnabled(IsEnabled)
        .IsAnalyzing(IsAnalyzing);
}

TSharedRef<SQuestCopilotResults> FQuestCopilotWidgetFactory::CreateResults(
    FOnAutoFixClicked OnAutoFixClicked,
    FOnSourceClicked OnSourceClicked)
{
    return SNew(SQuestCopilotResults)
        .OnAutoFixClicked(OnAutoFixClicked)
        .OnSourceClicked(OnSourceClicked);
}

#undef LOCTEXT_NAMESPACE