// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#include "QuestCopilotSettings.h"

#define LOCTEXT_NAMESPACE "QuestCopilotSettings"

UQuestCopilotSettings::UQuestCopilotSettings()
{
    // Default values
    BackendURL = TEXT("http://localhost:8000");
    bAutoAnalyzeOnBuildFailure = true;
    bEnableAutoFix = false; // Disabled by default for safety
    MaxLogSize = 10000;
    RequestTimeoutSeconds = 30;
    bShowNotifications = true;
}

FName UQuestCopilotSettings::GetCategoryName() const
{
    return TEXT("Plugins");
}

FText UQuestCopilotSettings::GetSectionText() const
{
    return LOCTEXT("QuestCopilotSettingsSection", "Quest Dev Copilot");
}

#if WITH_EDITOR
void UQuestCopilotSettings::PostEditChangeProperty(FPropertyChangedEvent& PropertyChangedEvent)
{
    Super::PostEditChangeProperty(PropertyChangedEvent);
    
    // Validate settings
    if (BackendURL.IsEmpty())
    {
        BackendURL = TEXT("http://localhost:8000");
    }
    
    // Ensure URL doesn't end with slash
    if (BackendURL.EndsWith(TEXT("/")))
    {
        BackendURL = BackendURL.LeftChop(1);
    }
    
    MaxLogSize = FMath::Clamp(MaxLogSize, 1000, 100000);
    RequestTimeoutSeconds = FMath::Clamp(RequestTimeoutSeconds, 5, 120);
}
#endif

#undef LOCTEXT_NAMESPACE 