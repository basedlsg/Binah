// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#include "QuestCopilotModule.h"
#include "QuestCopilotWidget.h"
#include "QuestCopilotQuickAnalysis.h"
#include "Framework/Docking/TabManager.h"
#include "Widgets/Docking/SDockTab.h"
#include "ToolMenus.h"
#include "LevelEditor.h"
#include "MessageLogModule.h"
#include "IMessageLogListing.h"
#include "Logging/MessageLog.h"
#include "HAL/PlatformFilemanager.h"
#include "Misc/FileHelper.h"
#include "Engine/Engine.h"

#define LOCTEXT_NAMESPACE "FQuestCopilotModule"

DEFINE_LOG_CATEGORY(LogQuestCopilot);

static const FName QuestCopilotTabName("QuestCopilot");

void FQuestCopilotModule::StartupModule()
{
    UE_LOG(LogQuestCopilot, Log, TEXT("Quest Copilot module starting up..."));

    // Initialize quick analysis context menu integration
    FQuestCopilotQuickAnalysis::Initialize();

    // Register tab spawner
    FGlobalTabmanager::Get()->RegisterNomadTabSpawner(QuestCopilotTabName, 
        FOnSpawnTab::CreateRaw(this, &FQuestCopilotModule::CreateQuestCopilotTab))
        .SetDisplayName(LOCTEXT("QuestCopilotTabTitle", "Quest Copilot"))
        .SetTooltipText(LOCTEXT("QuestCopilotTabTooltip", "AI-powered Quest VR debugging assistant"))
        .SetIcon(FSlateIcon(FEditorStyle::GetStyleSetName(), "LevelEditor.GameSettings"));

    // Register menu extensions
    RegisterMenuExtensions();

    // Hook into build system
    if (FModuleManager::Get().IsModuleLoaded("UnrealEd"))
    {
        // Register for build completion callbacks
        // This would connect to UE's build system notifications
        UE_LOG(LogQuestCopilot, Log, TEXT("Quest Copilot connected to build system"));
    }

    UE_LOG(LogQuestCopilot, Log, TEXT("Quest Copilot module startup complete"));
}

void FQuestCopilotModule::ShutdownModule()
{
    UE_LOG(LogQuestCopilot, Log, TEXT("Quest Copilot module shutting down..."));

    // Shutdown quick analysis context menu integration
    FQuestCopilotQuickAnalysis::Shutdown();

    // Unregister menu extensions
    UnregisterMenuExtensions();

    // Unregister tab spawner
    FGlobalTabmanager::Get()->UnregisterNomadTabSpawner(QuestCopilotTabName);

    // Clean up build system hooks
    if (BuildFinishedHandle.IsValid())
    {
        // Remove build finished delegate
        BuildFinishedHandle.Reset();
    }

    UE_LOG(LogQuestCopilot, Log, TEXT("Quest Copilot module shutdown complete"));
}

void FQuestCopilotModule::RegisterMenuExtensions()
{
    // Add menu entry to Windows menu
    UToolMenus* ToolMenus = UToolMenus::Get();
    if (ToolMenus)
    {
        UToolMenu* Menu = ToolMenus->ExtendMenu("LevelEditor.MainMenu.Window");
        if (Menu)
        {
            FToolMenuSection& Section = Menu->FindOrAddSection("WindowLayout");
            Section.AddMenuEntryWithCommandList(
                "QuestCopilot",
                LOCTEXT("QuestCopilotMenuLabel", "Quest Copilot"),
                LOCTEXT("QuestCopilotMenuTooltip", "Open Quest Copilot AI debugging assistant"),
                FSlateIcon(FEditorStyle::GetStyleSetName(), "LevelEditor.GameSettings"),
                FUIAction(
                    FExecuteAction::CreateLambda([]()
                    {
                        FGlobalTabmanager::Get()->TryInvokeTab(QuestCopilotTabName);
                    })
                ),
                nullptr
            );
        }

        // Add toolbar button
        UToolMenu* ToolbarMenu = ToolMenus->ExtendMenu("LevelEditor.LevelEditorToolBar.PlayToolBar");
        if (ToolbarMenu)
        {
            FToolMenuSection& ToolbarSection = ToolbarMenu->FindOrAddSection("Quest");
            ToolbarSection.AddEntry(FToolMenuEntry::InitToolBarButton(
                "QuestCopilot",
                FUIAction(
                    FExecuteAction::CreateLambda([]()
                    {
                        FGlobalTabmanager::Get()->TryInvokeTab(QuestCopilotTabName);
                    })
                ),
                LOCTEXT("QuestCopilotToolbarLabel", "Quest Copilot"),
                LOCTEXT("QuestCopilotToolbarTooltip", "Open Quest Copilot AI debugging assistant"),
                FSlateIcon(FEditorStyle::GetStyleSetName(), "LevelEditor.GameSettings")
            ));
        }
    }
}

void FQuestCopilotModule::UnregisterMenuExtensions()
{
    UToolMenus* ToolMenus = UToolMenus::Get();
    if (ToolMenus)
    {
        ToolMenus->RemoveSection("LevelEditor.MainMenu.Window", "QuestCopilot");
        ToolMenus->RemoveSection("LevelEditor.LevelEditorToolBar.PlayToolBar", "QuestCopilot");
    }
}

TSharedRef<SDockTab> FQuestCopilotModule::CreateQuestCopilotTab(const FSpawnTabArgs& Args)
{
    return SNew(SDockTab)
        .TabRole(ETabRole::NomadTab)
        [
            SNew(SQuestCopilotWidget)
            .OnAnalysisComplete_Lambda([this](const FString& Result)
            {
                // Handle analysis completion
                UE_LOG(LogQuestCopilot, Log, TEXT("Analysis complete: %s"), *Result);
            })
        ];
}

void FQuestCopilotModule::OnBuildFinished(bool bSuccess)
{
    if (!bSuccess)
    {
        UE_LOG(LogQuestCopilot, Warning, TEXT("Build failed - analyzing logs..."));
        
        // Auto-analyze logs when build fails
        AnalyzeProjectLogs();
    }
}

void FQuestCopilotModule::AnalyzeProjectLogs()
{
    // Get current project's log directory
    FString LogDir = FPaths::ProjectLogDir();
    FString LogFile = FPaths::Combine(LogDir, TEXT("UnrealBuildTool.log"));
    
    if (FPaths::FileExists(LogFile))
    {
        FString LogContent;
        if (FFileHelper::LoadFileToString(LogContent, *LogFile))
        {
            UE_LOG(LogQuestCopilot, Log, TEXT("Loaded log file for analysis: %s"), *LogFile);
            
            // Open Quest Copilot tab and populate with log content
            TSharedPtr<SDockTab> Tab = FGlobalTabmanager::Get()->TryInvokeTab(QuestCopilotTabName);
            if (Tab.IsValid())
            {
                // Find the widget and set log content
                TSharedPtr<SQuestCopilotWidget> Widget = StaticCastSharedPtr<SQuestCopilotWidget>(Tab->GetContent());
                if (Widget.IsValid())
                {
                    Widget->SetLogContent(LogContent);
                }
            }
        }
    }
}

#undef LOCTEXT_NAMESPACE

IMPLEMENT_MODULE(FQuestCopilotModule, QuestCopilot) 