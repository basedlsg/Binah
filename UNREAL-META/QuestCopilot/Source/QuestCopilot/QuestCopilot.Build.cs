// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
using UnrealBuildTool;

public class QuestCopilot : ModuleRules
{
    public QuestCopilot(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = ModuleRules.PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicIncludePaths.AddRange(
            new string[] {
                // ... add public include paths required here ...
            }
        );

        PrivateIncludePaths.AddRange(
            new string[] {
                // ... add other private include paths required here ...
            }
        );

        PublicDependencyModuleNames.AddRange(
            new string[]
            {
                "Core",
                "CoreUObject",
                "Engine",
                "UnrealEd",
                "ToolMenus",
                "EditorStyle",
                "EditorWidgets",
                "Slate",
                "SlateCore",
                "InputCore",
                "Json",
                "JsonUtilities",
                "HTTP",
                "Projects",
                "DesktopPlatform",
                "ApplicationCore"
            }
        );

        PrivateDependencyModuleNames.AddRange(
            new string[]
            {
                "EditorStyle",
                "EditorWidgets",
                "UnrealEd",
                "ToolMenus",
                "WorkspaceMenuStructure",
                "Slate",
                "SlateCore",
                "Json",
                "JsonUtilities",
                "HTTP",
                "Projects",
                "DesktopPlatform",
                "ApplicationCore",
                "GameplayStatics",
                "RenderCore",
                "RHI",
                "ImageWrapper"
            }
        );

        DynamicallyLoadedModuleNames.AddRange(
            new string[]
            {
                // ... add any modules that your module loads dynamically here ...
            }
        );

        // Enable optimization for production builds
        if (Target.Configuration == UnrealTargetConfiguration.Shipping)
        {
            OptimizeCode = CodeOptimization.Speed;
        }

        // Enable security features
        bEnableExceptions = true;
        bUseRTTI = true;
        
        // Performance optimizations
        bFasterWithoutUnity = true;
        MinFilesUsingPrecompiledHeaderOverride = 1;
    }
} 