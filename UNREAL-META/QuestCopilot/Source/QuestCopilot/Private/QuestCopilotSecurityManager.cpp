// Copyright 2024 Quest Dev Copilot Team. All Rights Reserved.
#include "QuestCopilotSecurityManager.h"
#include "QuestCopilotModule.h"
#include "Misc/Regex.h"
#include "HAL/PlatformFilemanager.h"
#include "Misc/Paths.h"

// Static member initialization
FQuestCopilotSecurityManager::FSecurityConfig FQuestCopilotSecurityManager::SecurityConfig;
TArray<FString> FQuestCopilotSecurityManager::SensitivePatterns;
TArray<FString> FQuestCopilotSecurityManager::MaliciousPatterns;

FQuestCopilotSecurityManager::FQuestCopilotSecurityManager()
{
    InitializePatterns();
}

FQuestCopilotSecurityManager::~FQuestCopilotSecurityManager()
{
}

void FQuestCopilotSecurityManager::InitializePatterns()
{
    if (SensitivePatterns.Num() == 0)
    {
        // File path patterns
        SensitivePatterns.Add(TEXT("C:\\\\Users\\\\[^\\\\]+"));
        SensitivePatterns.Add(TEXT("/Users/[^/]+"));
        SensitivePatterns.Add(TEXT("/home/[^/]+"));
        
        // Network patterns
        SensitivePatterns.Add(TEXT("\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b"));
        SensitivePatterns.Add(TEXT("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"));
        
        // Machine identifiers
        SensitivePatterns.Add(TEXT("\\bMachine\\s*[Nn]ame\\s*:?\\s*[A-Za-z0-9-_]+"));
        SensitivePatterns.Add(TEXT("\\bComputer\\s*[Nn]ame\\s*:?\\s*[A-Za-z0-9-_]+"));
        
        // API keys and tokens
        SensitivePatterns.Add(TEXT("\\b[Aa]pi[Kk]ey\\s*:?\\s*[A-Za-z0-9-_]{20,}"));
        SensitivePatterns.Add(TEXT("\\b[Tt]oken\\s*:?\\s*[A-Za-z0-9-_]{20,}"));
        SensitivePatterns.Add(TEXT("\\b[Pp]assword\\s*:?\\s*[A-Za-z0-9-_@#$%^&*]{8,}"));
    }
    
    if (MaliciousPatterns.Num() == 0)
    {
        // Script injection patterns
        MaliciousPatterns.Add(TEXT("<script[^>]*>"));
        MaliciousPatterns.Add(TEXT("javascript:"));
        MaliciousPatterns.Add(TEXT("vbscript:"));
        MaliciousPatterns.Add(TEXT("onload\\s*="));
        MaliciousPatterns.Add(TEXT("onerror\\s*="));
        
        // SQL injection patterns
        MaliciousPatterns.Add(TEXT("\\b(union|select|insert|update|delete|drop|create|alter)\\s+", ESearchCase::IgnoreCase));
        MaliciousPatterns.Add(TEXT("\\b(exec|execute|sp_)\\s*\\(", ESearchCase::IgnoreCase));
        
        // Command injection patterns
        MaliciousPatterns.Add(TEXT("\\b(cmd|powershell|bash|sh)\\s*\\.exe"));
        MaliciousPatterns.Add(TEXT("\\b(rm|del|format)\\s+"));
    }
}

FString FQuestCopilotSecurityManager::SanitizeLogContent(const FString& LogContent)
{
    if (LogContent.IsEmpty())
        return LogContent;
    
    FString SanitizedContent = LogContent;
    
    // Remove sensitive data if anonymization is enabled
    if (SecurityConfig.bAnonymizationEnabled)
    {
        SanitizedContent = RemoveSensitiveData(SanitizedContent);
    }
    
    // Always sanitize for security
    SanitizedContent = SanitizeUserInput(SanitizedContent);
    
    return SanitizedContent;
}

FString FQuestCopilotSecurityManager::RemoveSensitiveData(const FString& LogContent)
{
    FString CleanContent = LogContent;
    
    // Anonymize file paths
    CleanContent = AnonymizeFilePaths(CleanContent);
    
    // Remove network information
    CleanContent = RemoveNetworkInfo(CleanContent);
    
    // Remove machine identifiers
    CleanContent = RemoveMachineIdentifiers(CleanContent);
    
    // Apply sensitive pattern replacements
    CleanContent = ApplyPatternReplacement(CleanContent, SensitivePatterns, TEXT("[REDACTED]"));
    
    return CleanContent;
}

FString FQuestCopilotSecurityManager::AnonymizeFilePaths(const FString& Content)
{
    FString AnonymizedContent = Content;
    
    // Replace Windows user paths
    FRegexPattern WindowsUserPattern(TEXT("C:\\\\Users\\\\[^\\\\]+"));
    AnonymizedContent = FRegexMatcher(WindowsUserPattern, AnonymizedContent).ReplaceAll(TEXT("C:\\Users\\[USER]"));
    
    // Replace Unix user paths
    FRegexPattern UnixUserPattern(TEXT("/Users/[^/]+"));
    AnonymizedContent = FRegexMatcher(UnixUserPattern, AnonymizedContent).ReplaceAll(TEXT("/Users/[USER]"));
    
    FRegexPattern LinuxUserPattern(TEXT("/home/[^/]+"));
    AnonymizedContent = FRegexMatcher(LinuxUserPattern, AnonymizedContent).ReplaceAll(TEXT("/home/[USER]"));
    
    return AnonymizedContent;
}

FString FQuestCopilotSecurityManager::RemoveNetworkInfo(const FString& Content)
{
    FString CleanContent = Content;
    
    // Remove IP addresses
    FRegexPattern IPPattern(TEXT("\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b"));
    CleanContent = FRegexMatcher(IPPattern, CleanContent).ReplaceAll(TEXT("[IP_ADDRESS]"));
    
    // Remove email addresses
    FRegexPattern EmailPattern(TEXT("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"));
    CleanContent = FRegexMatcher(EmailPattern, CleanContent).ReplaceAll(TEXT("[EMAIL]"));
    
    return CleanContent;
}

FString FQuestCopilotSecurityManager::RemoveMachineIdentifiers(const FString& Content)
{
    FString CleanContent = Content;
    
    // Remove machine names
    FRegexPattern MachineNamePattern(TEXT("\\bMachine\\s*[Nn]ame\\s*:?\\s*[A-Za-z0-9-_]+"));
    CleanContent = FRegexMatcher(MachineNamePattern, CleanContent).ReplaceAll(TEXT("Machine Name: [MACHINE]"));
    
    FRegexPattern ComputerNamePattern(TEXT("\\bComputer\\s*[Nn]ame\\s*:?\\s*[A-Za-z0-9-_]+"));
    CleanContent = FRegexMatcher(ComputerNamePattern, CleanContent).ReplaceAll(TEXT("Computer Name: [MACHINE]"));
    
    return CleanContent;
}

bool FQuestCopilotSecurityManager::ValidateURL(const FString& URL, bool bRequireHTTPS)
{
    if (URL.IsEmpty())
        return false;
    
    // Check basic URL format
    if (!URL.StartsWith(TEXT("http://")) && !URL.StartsWith(TEXT("https://")))
        return false;
    
    // Check HTTPS requirement
    if (bRequireHTTPS && !URL.StartsWith(TEXT("https://")))
        return false;
    
    // Check for suspicious patterns
    if (URL.Contains(TEXT("..")) || URL.Contains(TEXT("@")) || URL.Contains(TEXT("javascript:")))
        return false;
    
    return true;
}

FString FQuestCopilotSecurityManager::SanitizeUserInput(const FString& Input)
{
    FString SanitizedInput = Input;
    
    // Remove malicious patterns
    SanitizedInput = ApplyPatternReplacement(SanitizedInput, MaliciousPatterns, TEXT("[FILTERED]"));
    
    // Remove null bytes and control characters
    SanitizedInput = SanitizedInput.Replace(TEXT("\0"), TEXT(""));
    
    // Limit line length to prevent buffer overflow attacks
    TArray<FString> Lines;
    SanitizedInput.ParseIntoArray(Lines, TEXT("\n"));
    
    for (int32 i = 0; i < Lines.Num(); i++)
    {
        if (Lines[i].Len() > 10000) // 10KB per line limit
        {
            Lines[i] = Lines[i].Left(10000) + TEXT("...[TRUNCATED]");
        }
    }
    
    SanitizedInput = FString::Join(Lines, TEXT("\n"));
    
    return SanitizedInput;
}

bool FQuestCopilotSecurityManager::IsContentSafeForTransmission(const FString& Content)
{
    // Check size limits
    if (!IsContentSizeValid(Content))
        return false;
    
    // Check for malicious patterns
    if (ContainsMaliciousPatterns(Content))
        return false;
    
    return true;
}

bool FQuestCopilotSecurityManager::IsContentSizeValid(const FString& Content, int32 MaxSizeBytes)
{
    int32 ContentSize = Content.Len() * sizeof(TCHAR);
    return ContentSize <= MaxSizeBytes;
}

bool FQuestCopilotSecurityManager::ContainsMaliciousPatterns(const FString& Content)
{
    for (const FString& Pattern : MaliciousPatterns)
    {
        FRegexPattern RegexPattern(Pattern);
        if (FRegexMatcher(RegexPattern, Content).FindNext())
        {
            UE_LOG(LogQuestCopilot, Warning, TEXT("Security: Malicious pattern detected: %s"), *Pattern);
            return true;
        }
    }
    return false;
}

void FQuestCopilotSecurityManager::SetSecurityLevel(int32 Level)
{
    SecurityConfig.SecurityLevel = FMath::Clamp(Level, 0, 2);
    
    // Adjust settings based on security level
    switch (SecurityConfig.SecurityLevel)
    {
        case 0: // Permissive
            SecurityConfig.bAnonymizationEnabled = false;
            SecurityConfig.bHTTPSRequired = false;
            SecurityConfig.MaxContentSize = 5242880; // 5MB
            break;
            
        case 1: // Balanced (default)
            SecurityConfig.bAnonymizationEnabled = true;
            SecurityConfig.bHTTPSRequired = true;
            SecurityConfig.MaxContentSize = 1048576; // 1MB
            break;
            
        case 2: // Strict
            SecurityConfig.bAnonymizationEnabled = true;
            SecurityConfig.bHTTPSRequired = true;
            SecurityConfig.MaxContentSize = 524288; // 512KB
            break;
    }
    
    UE_LOG(LogQuestCopilot, Log, TEXT("Security level set to: %d"), Level);
}

void FQuestCopilotSecurityManager::SetAnonymizationEnabled(bool bEnabled)
{
    SecurityConfig.bAnonymizationEnabled = bEnabled;
    UE_LOG(LogQuestCopilot, Log, TEXT("Data anonymization: %s"), bEnabled ? TEXT("Enabled") : TEXT("Disabled"));
}

FQuestCopilotSecurityManager::FSecurityConfig FQuestCopilotSecurityManager::GetSecurityConfig()
{
    return SecurityConfig;
}

FString FQuestCopilotSecurityManager::ApplyPatternReplacement(const FString& Content, const TArray<FString>& Patterns, const FString& Replacement)
{
    FString ProcessedContent = Content;
    
    for (const FString& Pattern : Patterns)
    {
        FRegexPattern RegexPattern(Pattern);
        ProcessedContent = FRegexMatcher(RegexPattern, ProcessedContent).ReplaceAll(Replacement);
    }
    
    return ProcessedContent;
}
