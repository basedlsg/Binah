// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleManager.h"
#include "Framework/Docking/TabManager.h"

DECLARE_LOG_CATEGORY_EXTERN(LogQuestCopilot, Log, All);

class FQuestCopilotModule : public IModuleInterface
{
public:
    /** IModuleInterface implementation */
    virtual void StartupModule() override;
    virtual void ShutdownModule() override;

    /** Gets the singleton instance of this module */
    static FQuestCopilotModule& Get()
    {
        return FModuleManager::LoadModuleChecked<FQuestCopilotModule>("QuestCopilot");
    }

    /** Check if the module is loaded */
    static bool IsAvailable()
    {
        return FModuleManager::Get().IsModuleLoaded("QuestCopilot");
    }

private:
    /** Register menu extensions */
    void RegisterMenuExtensions();
    
    /** Unregister menu extensions */
    void UnregisterMenuExtensions();
    
    /** Create the Quest Copilot tab */
    TSharedRef<SDockTab> CreateQuestCopilotTab(const FSpawnTabArgs& Args);
    
    /** Handle when build finishes */
    void OnBuildFinished(bool bSuccess);
    
    /** Analyze current project logs */
    void AnalyzeProjectLogs();

private:
    /** Tab spawner for the Quest Copilot window */
    TSharedPtr<FTabManager::FTab> QuestCopilotTab;
    
    /** Delegate handle for build finished callback */
    FDelegateHandle BuildFinishedHandle;
};

#define QUEST_COPILOT_MODULE_NAME "QuestCopilot" 