// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#pragma once

#include "CoreMinimal.h"
#include "Framework/Commands/Commands.h"
#include "Framework/Commands/UIAction.h"
#include "Framework/MultiBox/MultiBoxExtender.h"
#include "ToolMenus.h"

/**
 * Quest Copilot Quick Analysis Commands
 * Provides context menu integration for fast error analysis
 */
class FQuestCopilotCommands : public TCommands<FQuestCopilotCommands>
{
public:
    FQuestCopilotCommands();

    // TCommands<> interface
    virtual void RegisterCommands() override;

public:
    /** Quick analyze selected text */
    TSharedPtr<FUICommandInfo> QuickAnalyzeSelection;
    
    /** Analyze current output log */
    TSharedPtr<FUICommandInfo> AnalyzeOutputLog;
    
    /** Open detailed analysis tab */
    TSharedPtr<FUICommandInfo> OpenDetailedTab;
    
    /** Analyze last build error */
    TSharedPtr<FUICommandInfo> AnalyzeBuildError;
};

/**
 * Context Menu Integration for Quest Copilot
 * Adds "Analyze with Copilot" options to various Unreal Engine contexts
 */
class QUESTCOPILOT_API FQuestCopilotQuickAnalysis
{
public:
    /** Initialize context menu integration */
    static void Initialize();
    
    /** Shutdown context menu integration */
    static void Shutdown();

private:
    /** Extend output log context menu */
    static void ExtendOutputLogMenu();
    
    /** Extend text editor context menu */
    static void ExtendTextEditorMenu();
    
    /** Extend message log context menu */
    static void ExtendMessageLogMenu();
    
    /** Extend compiler results context menu */
    static void ExtendCompilerResultsMenu();

    // === CONTEXT MENU ACTIONS ===
    
    /** Quick analyze selected text action */
    static void ExecuteQuickAnalyzeSelection();
    
    /** Analyze output log action */
    static void ExecuteAnalyzeOutputLog();
    
    /** Open detailed tab action */
    static void ExecuteOpenDetailedTab();
    
    /** Analyze build error action */
    static void ExecuteAnalyzeBuildError();

    // === UTILITY METHODS ===
    
    /** Get selected text from current context */
    static FString GetSelectedText();
    
    /** Get output log content */
    static FString GetOutputLogContent();
    
    /** Get last build error */
    static FString GetLastBuildError();
    
    /** Extract error context from log */
    static FString ExtractErrorContext(const FString& LogContent);

    // === MENU EXTENSION DELEGATES ===
    
    /** Output log menu extender */
    static TSharedRef<FExtender> OnExtendOutputLogMenu(const TSharedRef<FUICommandList> CommandList, const TArray<FString> SelectedItems);
    
    /** Text editor menu extender */
    static TSharedRef<FExtender> OnExtendTextEditorMenu(const TSharedRef<FUICommandList> CommandList);
    
    /** Message log menu extender */
    static TSharedRef<FExtender> OnExtendMessageLogMenu(const TSharedRef<FUICommandList> CommandList);

private:
    /** Command list for quick analysis actions */
    static TSharedPtr<FUICommandList> CommandList;
    
    /** Menu extenders */
    static TSharedPtr<FExtender> OutputLogMenuExtender;
    static TSharedPtr<FExtender> TextEditorMenuExtender;
    static TSharedPtr<FExtender> MessageLogMenuExtender;
}; 