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
#include "Widgets/Input/SMultiLineEditableTextBox.h"
#include "Widgets/Layout/SSeparator.h"
#include "Widgets/Layout/SScrollBar.h"

#define LOCTEXT_NAMESPACE "QuestCopilotWidgetComponents"

//////////////////////////////////////////////////////////////////////////
// SQuestCopilotHeader

void SQuestCopilotHeader::Construct(const FArguments& InArgs)
{
    ChildSlot
    [
        SNew(SVerticalBox)
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f, 5.0f)
        [
            SNew(SHorizontalBox)
            + SHorizontalBox::Slot()
            .FillWidth(1.0f)
            [
                SNew(STextBlock)
                .Text(FText::FromString("Quest Dev Copilot"))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 18))
                .ColorAndOpacity(FLinearColor(0.2f, 0.7f, 1.0f))
            ]
            + SHorizontalBox::Slot()
            .AutoWidth()
            .Padding(5.0f, 0.0f)
            [
                SNew(STextBlock)
                .Text(FText::FromString("v1.0"))
                .Font(FCoreStyle::GetDefaultFontStyle("Regular", 10))
                .ColorAndOpacity(FLinearColor(0.6f, 0.6f, 0.6f))
            ]
        ]
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f, 0.0f, 10.0f, 5.0f)
        [
            SSeparator::New()
            .Orientation(Orient_Horizontal)
            .Thickness(1.0f)
            .ColorAndOpacity(FLinearColor(0.3f, 0.3f, 0.3f))
        ]
    ];
}

//////////////////////////////////////////////////////////////////////////
// SQuestCopilotStatus

void SQuestCopilotStatus::Construct(const FArguments& InArgs)
{
    StatusText = SNew(STextBlock)
        .Text(FText::FromString("Ready"))
        .Font(FCoreStyle::GetDefaultFontStyle("Regular", 12))
        .ColorAndOpacity(FLinearColor::Green);

    ChildSlot
    [
        SNew(SBox)
        .Padding(10.0f, 5.0f)
        [
            SNew(SHorizontalBox)
            + SHorizontalBox::Slot()
            .AutoWidth()
            .VAlign(VAlign_Center)
            [
                SNew(STextBlock)
                .Text(FText::FromString("Status: "))
                .Font(FCoreStyle::GetDefaultFontStyle("Bold", 12))
            ]
            + SHorizontalBox::Slot()
            .FillWidth(1.0f)
            .VAlign(VAlign_Center)
            [
                StatusText.ToSharedRef()
            ]
        ]
    ];
}

void SQuestCopilotStatus::UpdateStatus(const FText& NewStatus, const FLinearColor& Color)
{
    if (StatusText.IsValid())
    {
        StatusText->SetText(NewStatus);
        StatusText->SetColorAndOpacity(Color);
    }
}

//////////////////////////////////////////////////////////////////////////
// SQuestCopilotScreenshot

void SQuestCopilotScreenshot::Construct(const FArguments& InArgs)
{
    OnCaptureClicked = InArgs._OnCaptureClicked;
    bHasScreenshot = false;

    CaptureButton = SNew(SButton)
        .Text(FText::FromString("Capture Screenshot"))
        .OnClicked(this, &SQuestCopilotScreenshot::HandleCaptureClicked)
        .HAlign(HAlign_Center);

    StatusText = SNew(STextBlock)
        .Text(FText::FromString("No screenshot captured"))
        .Font(FCoreStyle::GetDefaultFontStyle("Regular", 10))
        .ColorAndOpacity(FLinearColor(0.6f, 0.6f, 0.6f));

    DescriptionBox = SNew(SEditableTextBox)
        .HintText(FText::FromString("Optional: Describe what the screenshot shows..."))
        .IsEnabled(false);

    ChildSlot
    [
        SNew(SVerticalBox)
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f, 5.0f)
        [
            SNew(STextBlock)
            .Text(FText::FromString("Screenshot"))
            .Font(FCoreStyle::GetDefaultFontStyle("Bold", 12))
        ]
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f, 5.0f)
        [
            CaptureButton.ToSharedRef()
        ]
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f, 2.0f)
        [
            StatusText.ToSharedRef()
        ]
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f, 5.0f)
        [
            DescriptionBox.ToSharedRef()
        ]
    ];
}

FReply SQuestCopilotScreenshot::HandleCaptureClicked()
{
    if (OnCaptureClicked.IsBound())
    {
        return OnCaptureClicked.Execute();
    }
    return FReply::Handled();
}

void SQuestCopilotScreenshot::SetScreenshotCaptured(bool bCaptured)
{
    bHasScreenshot = bCaptured;
    
    if (StatusText.IsValid())
    {
        if (bCaptured)
        {
            StatusText->SetText(FText::FromString("Screenshot captured successfully"));
            StatusText->SetColorAndOpacity(FLinearColor::Green);
        }
        else
        {
            StatusText->SetText(FText::FromString("No screenshot captured"));
            StatusText->SetColorAndOpacity(FLinearColor(0.6f, 0.6f, 0.6f));
        }
    }

    if (DescriptionBox.IsValid())
    {
        DescriptionBox->SetEnabled(bCaptured);
    }
}

FString SQuestCopilotScreenshot::GetDescription() const
{
    return DescriptionBox.IsValid() ? DescriptionBox->GetText().ToString() : FString();
}

//////////////////////////////////////////////////////////////////////////
// SQuestCopilotLogInput

void SQuestCopilotLogInput::Construct(const FArguments& InArgs)
{
    OnTextChanged = InArgs._OnTextChanged;

    LogInputBox = SNew(SMultiLineEditableTextBox)
        .Text(FText::FromString(""))
        .HintText(FText::FromString("Paste your Unreal Engine log content here..."))
        .OnTextChanged(this, &SQuestCopilotLogInput::HandleTextChanged)
        .Font(FCoreStyle::GetDefaultFontStyle("Mono", 10))
        .IsReadOnly(false)
        .AllowContextMenu(true)
        .VScrollBar(SNew(SScrollBar))
        .HScrollBar(SNew(SScrollBar));

    StatsText = SNew(STextBlock)
        .Text(FText::FromString("0 lines, 0 characters"))
        .Font(FCoreStyle::GetDefaultFontStyle("Regular", 10))
        .ColorAndOpacity(FLinearColor(0.6f, 0.6f, 0.6f));

    ChildSlot
    [
        SNew(SVerticalBox)
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f, 5.0f)
        [
            SNew(STextBlock)
            .Text(FText::FromString("Log Content"))
            .Font(FCoreStyle::GetDefaultFontStyle("Bold", 12))
        ]
        + SVerticalBox::Slot()
        .FillHeight(1.0f)
        .Padding(10.0f, 5.0f)
        [
            LogInputBox.ToSharedRef()
        ]
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f, 2.0f)
        [
            StatsText.ToSharedRef()
        ]
    ];
}

void SQuestCopilotLogInput::HandleTextChanged(const FText& Text)
{
    // Update statistics
    FString TextString = Text.ToString();
    int32 LineCount = TextString.CountChar('\n') + (TextString.IsEmpty() ? 0 : 1);
    int32 CharCount = TextString.Len();

    StatsText->SetText(FText::FromString(FString::Printf(TEXT("%d lines, %d characters"), LineCount, CharCount)));

    // Forward to parent callback
    if (OnTextChanged.IsBound())
    {
        OnTextChanged.Execute(Text);
    }
}

FText SQuestCopilotLogInput::GetLogText() const
{
    return LogInputBox.IsValid() ? LogInputBox->GetText() : FText::GetEmpty();
}

void SQuestCopilotLogInput::SetLogText(const FText& Text)
{
    if (LogInputBox.IsValid())
    {
        LogInputBox->SetText(Text);
    }
}

//////////////////////////////////////////////////////////////////////////
// SQuestCopilotAnalyzeButton

void SQuestCopilotAnalyzeButton::Construct(const FArguments& InArgs)
{
    OnClicked = InArgs._OnClicked;
    bIsAnalyzing = false;

    AnalyzeButton = SNew(SButton)
        .Text(this, &SQuestCopilotAnalyzeButton::GetButtonText)
        .IsEnabled(this, &SQuestCopilotAnalyzeButton::IsButtonEnabled)
        .OnClicked(this, &SQuestCopilotAnalyzeButton::HandleButtonClicked)
        .HAlign(HAlign_Center)
        .VAlign(VAlign_Center);

    ChildSlot
    [
        SNew(SBox)
        .Padding(10.0f, 5.0f)
        [
            AnalyzeButton.ToSharedRef()
        ]
    ];
}

FReply SQuestCopilotAnalyzeButton::HandleButtonClicked()
{
    if (OnClicked.IsBound())
    {
        return OnClicked.Execute();
    }
    return FReply::Handled();
}

FText SQuestCopilotAnalyzeButton::GetButtonText() const
{
    return bIsAnalyzing ? FText::FromString("Analyzing...") : FText::FromString("Analyze Logs");
}

bool SQuestCopilotAnalyzeButton::IsButtonEnabled() const
{
    return !bIsAnalyzing;
}

void SQuestCopilotAnalyzeButton::SetAnalyzing(bool bAnalyzing)
{
    bIsAnalyzing = bAnalyzing;
}

//////////////////////////////////////////////////////////////////////////
// SQuestCopilotResults

void SQuestCopilotResults::Construct(const FArguments& InArgs)
{
    ResultsScrollBox = SNew(SScrollBox);

    ChildSlot
    [
        SNew(SVerticalBox)
        + SVerticalBox::Slot()
        .AutoHeight()
        .Padding(10.0f, 5.0f)
        [
            SNew(STextBlock)
            .Text(FText::FromString("Analysis Results"))
            .Font(FCoreStyle::GetDefaultFontStyle("Bold", 12))
        ]
        + SVerticalBox::Slot()
        .FillHeight(1.0f)
        .Padding(10.0f, 5.0f)
        [
            SNew(SBox)
            .MinDesiredHeight(200.0f)
            [
                ResultsScrollBox.ToSharedRef()
            ]
        ]
    ];
}

void SQuestCopilotResults::DisplayResults(const FString& JsonResponse)
{
    if (!ResultsScrollBox.IsValid())
        return;

    // Clear previous results
    ResultsScrollBox->ClearChildren();

    // Parse and display formatted results
    TSharedPtr<SVerticalBox> ResultsContainer = SNew(SVerticalBox);

    // Add formatted analysis result
    ResultsContainer->AddSlot()
    .AutoHeight()
    .Padding(5.0f)
    [
        SNew(STextBlock)
        .Text(FText::FromString("Analysis Complete"))
        .Font(FCoreStyle::GetDefaultFontStyle("Bold", 14))
        .ColorAndOpacity(FLinearColor::Green)
    ];

    ResultsContainer->AddSlot()
    .AutoHeight()
    .Padding(5.0f, 10.0f)
    [
        SNew(SMultiLineEditableTextBox)
        .Text(FText::FromString(JsonResponse))
        .IsReadOnly(true)
        .Font(FCoreStyle::GetDefaultFontStyle("Mono", 10))
        .AllowContextMenu(true)
    ];

    ResultsScrollBox->AddSlot()
    [
        ResultsContainer.ToSharedRef()
    ];
}

void SQuestCopilotResults::ClearResults()
{
    if (ResultsScrollBox.IsValid())
    {
        ResultsScrollBox->ClearChildren();
    }
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
        .OnCaptureClicked(OnScreenshotClicked)
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
        .OnClicked(OnAnalyzeClicked)
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