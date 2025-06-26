// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#pragma once

#include "CoreMinimal.h"

/**
 * Security Manager for Quest Dev Copilot
 * Handles data sanitization, validation, and privacy protection
 */
class QUESTCOPILOT_API FQuestCopilotSecurityManager
{
public:
    FQuestCopilotSecurityManager();
    ~FQuestCopilotSecurityManager();

    // === DATA SANITIZATION ===
    
    /** Sanitize log content for safe transmission */
    static FString SanitizeLogContent(const FString& LogContent);
    
    /** Remove sensitive information from logs */
    static FString RemoveSensitiveData(const FString& LogContent);
    
    /** Validate URL format and security */
    static bool ValidateURL(const FString& URL, bool bRequireHTTPS = true);
    
    /** Sanitize user input to prevent injection attacks */
    static FString SanitizeUserInput(const FString& Input);

    // === PRIVACY PROTECTION ===
    
    /** Remove file paths that might contain usernames */
    static FString AnonymizeFilePaths(const FString& Content);
    
    /** Remove IP addresses and network information */
    static FString RemoveNetworkInfo(const FString& Content);
    
    /** Remove machine-specific identifiers */
    static FString RemoveMachineIdentifiers(const FString& Content);

    // === VALIDATION ===
    
    /** Check if content is safe for transmission */
    static bool IsContentSafeForTransmission(const FString& Content);
    
    /** Validate content size limits */
    static bool IsContentSizeValid(const FString& Content, int32 MaxSizeBytes = 1048576); // 1MB default
    
    /** Check for malicious patterns */
    static bool ContainsMaliciousPatterns(const FString& Content);

    // === CONFIGURATION ===
    
    /** Set security level (0=permissive, 2=strict) */
    static void SetSecurityLevel(int32 Level);
    
    /** Enable/disable data anonymization */
    static void SetAnonymizationEnabled(bool bEnabled);
    
    /** Get current security configuration */
    struct FSecurityConfig
    {
        int32 SecurityLevel = 1;
        bool bAnonymizationEnabled = true;
        bool bHTTPSRequired = true;
        int32 MaxContentSize = 1048576;
    };
    static FSecurityConfig GetSecurityConfig();

private:
    static FSecurityConfig SecurityConfig;
    
    // Regex patterns for sensitive data detection
    static TArray<FString> SensitivePatterns;
    static TArray<FString> MaliciousPatterns;
    
    /** Initialize security patterns */
    static void InitializePatterns();
    
    /** Apply regex pattern replacement */
    static FString ApplyPatternReplacement(const FString& Content, const TArray<FString>& Patterns, const FString& Replacement);
};
