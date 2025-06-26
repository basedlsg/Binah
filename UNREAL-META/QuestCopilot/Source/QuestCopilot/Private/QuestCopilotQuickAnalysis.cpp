// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#include "QuestCopilotQuickAnalysis.h"
#include "QuestCopilotWidget.h"
#include "QuestCopilotModule.h"
#include "Framework/Commands/UICommandList.h"
#include "Framework/MultiBox/MultiBoxBuilder.h"
#include "Framework/Notifications/NotificationManager.h"
#include "Widgets/Notifications/SNotificationList.h"
#include "EditorStyleSet.h"
#include "Engine/Engine.h"
#include "HAL/PlatformFilemanager.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Developer/OutputLog/Public/OutputLogModule.h"
#include "ToolMenus.h"

#define LOCTEXT_NAMESPACE "QuestCopilotQuickAnalysis"

// === COMMANDS IMPLEMENTATION ===

FQuestCopilotCommands::FQuestCopilotCommands()
    : TCommands<FQuestCopilotCommands>(
        TEXT("QuestCopilot"),
        NSLOCTEXT("Contexts", "QuestCopilot", "Quest Copilot"),
        NAME_None,
        FEditorStyle::GetStyleSetName())
{
}

void FQuestCopilotCommands::RegisterCommands()
{
    UI_COMMAND(QuickAnalyzeSelection, "Analyze with Copilot", "Quickly analyze selected error text with Quest Dev Copilot AI", EUserInterfaceActionType::Button, FInputChord());
    UI_COMMAND(AnalyzeOutputLog, "Analyze Output Log", "Analyze current output log for Quest VR errors", EUserInterfaceActionType::Button, FInputChord());
    UI_COMMAND(OpenDetailedTab, "Open Quest Copilot", "Open detailed Quest Dev Copilot analysis tab", EUserInterfaceActionType::Button, FInputChord());
    UI_COMMAND(AnalyzeBuildError, "Analyze Build Error", "Analyze the last build error with Quest Copilot", EUserInterfaceActionType::Button, FInputChord());
}

// === QUICK ANALYSIS IMPLEMENTATION ===

TSharedPtr<FUICommandList> FQuestCopilotQuickAnalysis::CommandList;
TSharedPtr<FExtender> FQuestCopilotQuickAnalysis::OutputLogMenuExtender;
TSharedPtr<FExtender> FQuestCopilotQuickAnalysis::TextEditorMenuExtender;
TSharedPtr<FExtender> FQuestCopilotQuickAnalysis::MessageLogMenuExtender;

void FQuestCopilotQuickAnalysis::Initialize()
{
    // Register commands
    FQuestCopilotCommands::Register();

    // Create command list
    CommandList = MakeShareable(new FUICommandList);
    
    // Bind commands
    const FQuestCopilotCommands& Commands = FQuestCopilotCommands::Get();
    
    CommandList->MapAction(
        Commands.QuickAnalyzeSelection,
        FExecuteAction::CreateStatic(&FQuestCopilotQuickAnalysis::ExecuteQuickAnalyzeSelection),
        FCanExecuteAction::CreateLambda([]() { return !GetSelectedText().IsEmpty(); })
    );
    
    CommandList->MapAction(
        Commands.AnalyzeOutputLog,
        FExecuteAction::CreateStatic(&FQuestCopilotQuickAnalysis::ExecuteAnalyzeOutputLog),
        FCanExecuteAction::CreateLambda([]() { return true; })
    );
    
    CommandList->MapAction(
        Commands.OpenDetailedTab,
        FExecuteAction::CreateStatic(&FQuestCopilotQuickAnalysis::ExecuteOpenDetailedTab),
        FCanExecuteAction::CreateLambda([]() { return true; })
    );
    
    CommandList->MapAction(
        Commands.AnalyzeBuildError,
        FExecuteAction::CreateStatic(&FQuestCopilotQuickAnalysis::ExecuteAnalyzeBuildError),
        FCanExecuteAction::CreateLambda([]() { return !GetLastBuildError().IsEmpty(); })
    );

    // Extend menus
    ExtendOutputLogMenu();
    ExtendTextEditorMenu();
    ExtendMessageLogMenu();
    ExtendCompilerResultsMenu();
}

void FQuestCopilotQuickAnalysis::Shutdown()
{
    // Unregister commands
    FQuestCopilotCommands::Unregister();
    
    // Clear extenders
    OutputLogMenuExtender.Reset();
    TextEditorMenuExtender.Reset();
    MessageLogMenuExtender.Reset();
    CommandList.Reset();
}

void FQuestCopilotQuickAnalysis::ExtendOutputLogMenu()
{
    // Extend the output log context menu
    UToolMenus* ToolMenus = UToolMenus::Get();
    if (ToolMenus)
    {
        UToolMenu* Menu = ToolMenus->ExtendMenu("OutputLog.ContextMenu");
        if (Menu)
        {
            FToolMenuSection& Section = Menu->FindOrAddSection("QuestCopilot");
            Section.Label = LOCTEXT("QuestCopilotSection", "Quest Dev Copilot");
            
            Section.AddMenuEntry(
                "AnalyzeOutputLog",
                LOCTEXT("AnalyzeOutputLog", "🤖 Analyze with Copilot"),
                LOCTEXT("AnalyzeOutputLogTooltip", "Analyze output log for Quest VR development errors"),
                FSlateIcon(FEditorStyle::GetStyleSetName(), "Icons.Analytics"),
                FUIAction(FExecuteAction::CreateStatic(&FQuestCopilotQuickAnalysis::ExecuteAnalyzeOutputLog))
            );
            
            Section.AddMenuEntry(
                "OpenDetailedTab",
                LOCTEXT("OpenDetailedTab", "📊 Open Quest Copilot Tab"),
                LOCTEXT("OpenDetailedTabTooltip", "Open detailed Quest Dev Copilot analysis interface"),
                FSlateIcon(FEditorStyle::GetStyleSetName(), "Icons.TabManager"),
                FUIAction(FExecuteAction::CreateStatic(&FQuestCopilotQuickAnalysis::ExecuteOpenDetailedTab))
            );
        }
    }
}

void FQuestCopilotQuickAnalysis::ExtendTextEditorMenu()
{
    // Extend text editor context menu for selected text analysis
    UToolMenus* ToolMenus = UToolMenus::Get();
    if (ToolMenus)
    {
        UToolMenu* Menu = ToolMenus->ExtendMenu("TextEditor.ContextMenu");
        if (Menu)
        {
            FToolMenuSection& Section = Menu->FindOrAddSection("QuestCopilot");
            Section.Label = LOCTEXT("QuestCopilotSection", "Quest Dev Copilot");
            
            Section.AddMenuEntry(
                "QuickAnalyzeSelection",
                LOCTEXT("QuickAnalyzeSelection", "🔍 Analyze with Copilot"),
                LOCTEXT("QuickAnalyzeSelectionTooltip", "Quickly analyze selected error text with Quest Dev Copilot AI"),
                FSlateIcon(FEditorStyle::GetStyleSetName(), "Icons.Search"),
                FUIAction(
                    FExecuteAction::CreateStatic(&FQuestCopilotQuickAnalysis::ExecuteQuickAnalyzeSelection),
                    FCanExecuteAction::CreateLambda([]() { return !GetSelectedText().IsEmpty(); })
                )
            );
        }
    }
}

void FQuestCopilotQuickAnalysis::ExtendMessageLogMenu()
{
    // Extend message log context menu
    UToolMenus* ToolMenus = UToolMenus::Get();
    if (ToolMenus)
    {
        UToolMenu* Menu = ToolMenus->ExtendMenu("MessageLog.ContextMenu");
        if (Menu)
        {
            FToolMenuSection& Section = Menu->FindOrAddSection("QuestCopilot");
            Section.Label = LOCTEXT("QuestCopilotSection", "Quest Dev Copilot");
            
            Section.AddMenuEntry(
                "AnalyzeMessage",
                LOCTEXT("AnalyzeMessage", "🤖 Analyze with Copilot"),
                LOCTEXT("AnalyzeMessageTooltip", "Analyze selected message with Quest Dev Copilot"),
                FSlateIcon(FEditorStyle::GetStyleSetName(), "Icons.Analytics"),
                FUIAction(FExecuteAction::CreateStatic(&FQuestCopilotQuickAnalysis::ExecuteQuickAnalyzeSelection))
            );
        }
    }
}

void FQuestCopilotQuickAnalysis::ExtendCompilerResultsMenu()
{
    // Extend compiler results context menu
    UToolMenus* ToolMenus = UToolMenus::Get();
    if (ToolMenus)
    {
        UToolMenu* Menu = ToolMenus->ExtendMenu("CompilerResults.ContextMenu");
        if (Menu)
        {
            FToolMenuSection& Section = Menu->FindOrAddSection("QuestCopilot");
            Section.Label = LOCTEXT("QuestCopilotSection", "Quest Dev Copilot");
            
            Section.AddMenuEntry(
                "AnalyzeBuildError",
                LOCTEXT("AnalyzeBuildError", "🔧 Analyze Build Error"),
                LOCTEXT("AnalyzeBuildErrorTooltip", "Analyze build error with Quest Dev Copilot"),
                FSlateIcon(FEditorStyle::GetStyleSetName(), "Icons.Error"),
                FUIAction(FExecuteAction::CreateStatic(&FQuestCopilotQuickAnalysis::ExecuteAnalyzeBuildError))
            );
        }
    }
}

// === CONTEXT MENU ACTIONS ===

void FQuestCopilotQuickAnalysis::ExecuteQuickAnalyzeSelection()
{
    FString SelectedText = GetSelectedText();
    if (!SelectedText.IsEmpty())
    {
        FString Context = FString::Printf(TEXT("Selected from: %s"), *FPaths::GetCleanFilename(FPaths::GetProjectFilePath()));
        SQuestCopilotWidget::PerformQuickAnalysis(SelectedText, Context);
        
        // Show notification
        FNotificationInfo Info(LOCTEXT("QuickAnalysisStarted", "🤖 Quest Copilot analyzing selected text..."));
        Info.bFireAndForget = true;
        Info.FadeOutDuration = 3.0f;
        Info.ExpireDuration = 5.0f;
        FSlateNotificationManager::Get().AddNotification(Info);
    }
}

void FQuestCopilotQuickAnalysis::ExecuteAnalyzeOutputLog()
{
    FString LogContent = GetOutputLogContent();
    if (!LogContent.IsEmpty())
    {
        FString Context = TEXT("Unreal Engine Output Log");
        SQuestCopilotWidget::PerformQuickAnalysis(LogContent, Context);
        
        // Show notification
        FNotificationInfo Info(LOCTEXT("OutputLogAnalysisStarted", "🤖 Quest Copilot analyzing output log..."));
        Info.bFireAndForget = true;
        Info.FadeOutDuration = 3.0f;
        Info.ExpireDuration = 5.0f;
        FSlateNotificationManager::Get().AddNotification(Info);
    }
}

void FQuestCopilotQuickAnalysis::ExecuteOpenDetailedTab()
{
    FString InitialLog = GetSelectedText();
    if (InitialLog.IsEmpty())
    {
        InitialLog = GetOutputLogContent();
    }
    
    SQuestCopilotWidget::OpenDetailedAnalysisTab(InitialLog);
}

void FQuestCopilotQuickAnalysis::ExecuteAnalyzeBuildError()
{
    FString BuildError = GetLastBuildError();
    if (!BuildError.IsEmpty())
    {
        FString Context = TEXT("Build/Compilation Error");
        SQuestCopilotWidget::PerformQuickAnalysis(BuildError, Context);
        
        // Show notification
        FNotificationInfo Info(LOCTEXT("BuildErrorAnalysisStarted", "🤖 Quest Copilot analyzing build error..."));
        Info.bFireAndForget = true;
        Info.FadeOutDuration = 3.0f;
        Info.ExpireDuration = 5.0f;
        FSlateNotificationManager::Get().AddNotification(Info);
    }
}

// === UTILITY METHODS ===

FString FQuestCopilotQuickAnalysis::GetSelectedText()
{
    // This would need to be implemented based on the current context
    // For now, return a placeholder that could be set by the active widget
    
    // In a real implementation, you'd access the currently focused text widget
    // and get its selected text. This is a simplified version.
    
    return TEXT(""); // Placeholder - would get actual selected text
}

FString FQuestCopilotQuickAnalysis::GetOutputLogContent()
{
    // Get the last N lines from the output log
    FString LogContent;
    
    // Access the output log module and get recent content
    FOutputLogModule& OutputLogModule = FModuleManager::LoadModuleChecked<FOutputLogModule>("OutputLog");
    
    // This is a simplified version - in practice you'd get the actual log content
    // from the output log widget or log file
    
    // For now, read from the project log file if available
    FString LogFilePath = FPaths::ProjectLogDir() / TEXT("ProjectName.log");
    if (FPaths::FileExists(LogFilePath))
    {
        TArray<FString> LogLines;
        if (FFileHelper::LoadFileToStringArray(LogLines, *LogFilePath))
        {
            // Get last 100 lines for analysis
            int32 StartIndex = FMath::Max(0, LogLines.Num() - 100);
            for (int32 i = StartIndex; i < LogLines.Num(); i++)
            {
                LogContent += LogLines[i] + TEXT("\n");
            }
        }
    }
    
    return LogContent;
}

FString FQuestCopilotQuickAnalysis::GetLastBuildError()
{
    // Get the most recent build error from logs
    FString LogContent = GetOutputLogContent();
    
    // Extract error context focusing on build/compilation errors
    return ExtractErrorContext(LogContent);
}

FString FQuestCopilotQuickAnalysis::ExtractErrorContext(const FString& LogContent)
{
    // Extract relevant error context from log content
    TArray<FString> Lines;
    LogContent.ParseIntoArrayLines(Lines);
    
    FString ErrorContext;
    bool bFoundError = false;
    
    // Look for common error patterns
    TArray<FString> ErrorPatterns = {
        TEXT("Error:"),
        TEXT("LogTemp: Error:"),
        TEXT("LogBlueprint: Error:"),
        TEXT("LogCompile: Error:"),
        TEXT("PackagingResults: Error:"),
        TEXT("LogShaderCompilers: Error:"),
        TEXT("LogAndroid: Error:")
    };
    
    for (int32 i = Lines.Num() - 1; i >= 0; i--)
    {
        const FString& Line = Lines[i];
        
        for (const FString& Pattern : ErrorPatterns)
        {
            if (Line.Contains(Pattern))
            {
                // Found an error, collect context
                int32 StartIndex = FMath::Max(0, i - 5); // 5 lines before
                int32 EndIndex = FMath::Min(Lines.Num() - 1, i + 10); // 10 lines after
                
                for (int32 j = StartIndex; j <= EndIndex; j++)
                {
                    ErrorContext += Lines[j] + TEXT("\n");
                }
                
                bFoundError = true;
                break;
            }
        }
        
        if (bFoundError)
        {
            break;
        }
    }
    
    return ErrorContext;
}

#undef LOCTEXT_NAMESPACE 