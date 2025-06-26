// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#pragma once

#include "CoreMinimal.h"
#include "Engine/DeveloperSettings.h"
#include "QuestCopilotSettings.generated.h"

/**
 * Settings for Quest Dev Copilot plugin
 */
UCLASS(config = Editor, defaultconfig, meta = (DisplayName = "Quest Dev Copilot"))
class QUESTCOPILOT_API UQuestCopilotSettings : public UDeveloperSettings
{
    GENERATED_BODY()

public:
    UQuestCopilotSettings();

    /** Backend API URL for Quest Copilot service */
    UPROPERTY(config, EditAnywhere, Category = "API Configuration", meta = (DisplayName = "Backend URL"))
    FString BackendURL;

    /** Enable automatic analysis when build fails */
    UPROPERTY(config, EditAnywhere, Category = "Automation", meta = (DisplayName = "Auto-analyze on Build Failure"))
    bool bAutoAnalyzeOnBuildFailure;

    /** Enable automatic fix application (requires confirmation) */
    UPROPERTY(config, EditAnywhere, Category = "Automation", meta = (DisplayName = "Enable Auto-fix"))
    bool bEnableAutoFix;

    /** Maximum log size to send to backend (in characters) */
    UPROPERTY(config, EditAnywhere, Category = "Performance", meta = (DisplayName = "Max Log Size", ClampMin = 1000, ClampMax = 100000))
    int32 MaxLogSize;

    /** Request timeout in seconds */
    UPROPERTY(config, EditAnywhere, Category = "Performance", meta = (DisplayName = "Request Timeout", ClampMin = 5, ClampMax = 120))
    int32 RequestTimeoutSeconds;

    /** Show notifications for analysis results */
    UPROPERTY(config, EditAnywhere, Category = "UI", meta = (DisplayName = "Show Result Notifications"))
    bool bShowNotifications;

    // UDeveloperSettings interface
    virtual FName GetCategoryName() const override;
    virtual FText GetSectionText() const override;

#if WITH_EDITOR
    virtual void PostEditChangeProperty(FPropertyChangedEvent& PropertyChangedEvent) override;
#endif
}; 