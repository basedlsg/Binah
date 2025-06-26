#!/usr/bin/env python3
"""
Create sample unsolved issues data for testing enhanced functionality
"""

import json
from pathlib import Path
from datetime import datetime, timedelta
import random

def create_sample_unsolved_data():
    """Create realistic sample data representing unsolved Quest development issues"""
    
    # Sample unsolved issues based on real Quest development problems
    sample_posts = [
        {
            "id": "unsolved_001",
            "forum": "epic",
            "title": "Quest 3 Random Black Screen with Custom Shaders - No Solution Found",
            "url": "https://forums.unrealengine.com/unreal-engine/vr-ar-development/quest-3-black-screen-custom-shaders",
            "content": """I've been struggling with this issue for weeks now. My Quest 3 application randomly shows a black screen when using custom shaders, but only on certain devices and only sometimes. The issue is completely intermittent and I can't reproduce it consistently.

What I've tried:
- Simplified shaders to basic materials
- Reduced texture sizes
- Disabled Mobile HDR
- Set VR Pixel Density to 0.8
- Tried different Vulkan settings

The logs show:
LogRenderer: Error: Unable to create eye render targets
LogVulkan: Warning: Memory allocation failed for render target
LogMetaXR: Error: Swapchain creation failed intermittently

This only happens on Quest 3 with specific firmware versions. Quest 2 works fine. Anyone else experiencing this? I'm desperate for a solution as this is blocking our production release.

Hardware specific issue? Driver problem? I've tried everything in the documentation.""",
            "excerpt": "Quest 3 black screen with custom shaders, intermittent issue, no consistent reproduction",
            "error_type": "black_screen",
            "date_scraped": (datetime.now() - timedelta(days=5)).isoformat(),
            "post_date": (datetime.now() - timedelta(days=5)).isoformat(),
            "word_count": 145,
            "has_solution": False,
            "solution_content": None,
            "upvotes": 23
        },
        {
            "id": "unsolved_002", 
            "forum": "meta",
            "title": "Unreal 5.3 + Quest: Multiple XR Plugin Conflicts After Update - Still Broken",
            "url": "https://community.developer.oculus.com/unreal-quest-multiple-xr-plugins-conflict",
            "content": """After updating to Unreal 5.3, I'm getting multiple XR plugin conflicts that I can't resolve. I've tried all the standard solutions but nothing works.

Error messages:
LogOpenXR: Error: Failed to create OpenXR instance, another XR system may be active
LogMetaXR: Error: Cannot initialize MetaXR when OpenXR is active
LogOculusXR: Warning: Legacy OculusXR detected alongside MetaXR

What makes this weird:
- Only OpenXR is enabled in plugins (MetaXR and OculusXR are disabled)
- Clean project rebuild doesn't help
- Happens on multiple machines
- Same project worked fine in UE 5.2

I've tried:
- Disabling all XR plugins except OpenXR
- Deleting Binaries and Intermediate folders
- Fresh engine installation
- Different project templates

This seems like a regression in UE 5.3. Anyone found a workaround? This is blocking our entire team from upgrading.""",
            "excerpt": "UE 5.3 XR plugin conflicts, regression from 5.2, blocking team upgrade",
            "error_type": "plugin_conflict",
            "date_scraped": (datetime.now() - timedelta(days=12)).isoformat(),
            "post_date": (datetime.now() - timedelta(days=12)).isoformat(),
            "word_count": 168,
            "has_solution": False,
            "solution_content": None,
            "upvotes": 47
        },
        {
            "id": "unsolved_003",
            "forum": "epic", 
            "title": "Android SDK 34 Quest Compatibility - No Official Guidance",
            "url": "https://forums.unrealengine.com/unreal-engine/android/android-sdk-34-quest-compatibility",
            "content": """Google is requiring Android SDK 34 for new Play Store submissions, but Quest development seems incompatible. Getting contradictory information everywhere.

Current situation:
- Google Play requires targetSdkVersion 34 for new apps
- Quest documentation says SDK 32 maximum
- MetaXR SDK crashes with SDK 34
- No official guidance from Meta or Epic

Errors with SDK 34:
LogAndroid: Error: MetaXR SDK requires Android Target SDK 32 or lower
LogAndroid: Error: Runtime crashes on Quest devices with SDK 34
LogPackaging: Error: APK validation failed for Quest store

This is a critical blocker for anyone wanting to publish on both Play Store and Quest Store. The ecosystem compatibility is broken.

Has anyone found a solution? Workarounds? Official timeline for SDK 34 support? This affects every Quest developer trying to reach broader Android audience.""",
            "excerpt": "Android SDK 34 incompatible with Quest, blocking dual platform publishing",
            "error_type": "sdk_mismatch",
            "date_scraped": (datetime.now() - timedelta(days=8)).isoformat(),
            "post_date": (datetime.now() - timedelta(days=8)).isoformat(),
            "word_count": 134,
            "has_solution": False,
            "solution_content": None,
            "upvotes": 62
        },
        {
            "id": "unsolved_004",
            "forum": "meta",
            "title": "Quest Pro Hand Tracking Memory Leak - Performance Degrades Over Time",
            "url": "https://community.developer.oculus.com/quest-pro-hand-tracking-memory-leak",
            "content": """Discovered a memory leak when using hand tracking on Quest Pro that causes performance to degrade over time. This only happens with hand tracking enabled and only on Quest Pro devices.

Symptoms:
- App starts at 72fps, gradually drops to 30fps over 10-15 minutes
- Memory usage increases from 2GB to 4GB+ 
- Hand tracking becomes laggy and unresponsive
- Only happens with Quest Pro, Quest 2 is fine

Technical details:
- Memory leak seems to be in native hand tracking code
- Profiler shows increasing allocations in XR subsystem
- No obvious leaks in our Blueprint or C++ code
- Happens with minimal test projects too

This is a serious issue for any Quest Pro app using hand tracking. Users report the app becomes unusable after extended sessions.

Native code issue? Quest Pro specific driver bug? Anyone else seeing this? We need to ship soon and this is a showstopper.""",
            "excerpt": "Quest Pro hand tracking memory leak, performance degradation, device-specific issue",
            "error_type": "other",
            "date_scraped": (datetime.now() - timedelta(days=15)).isoformat(),
            "post_date": (datetime.now() - timedelta(days=15)).isoformat(),
            "word_count": 156,
            "has_solution": False,
            "solution_content": None,
            "upvotes": 34
        },
        {
            "id": "unsolved_005",
            "forum": "epic",
            "title": "Unreal 5.4 Quest Packaging Fails - New Build System Issues",
            "url": "https://forums.unrealengine.com/unreal-engine/vr-ar-development/ue54-quest-packaging-fails",
            "content": """Since updating to Unreal 5.4, Quest packaging consistently fails with cryptic build system errors. This worked perfectly in 5.3.

Build errors:
UATHelper: Packaging (Android): ERROR: Cook failed
LogCook: Error: Failed to save package for platform Android
LogPackaging: Error: Unknown error in build pipeline

What's strange:
- Same project packages fine for Windows
- Android packaging works for non-VR projects
- Only affects Quest/VR projects
- Happens on multiple developer machines
- Fresh UE 5.4 installation doesn't help

Debugging attempts:
- Enabled verbose logging (no useful info)
- Tried different Android SDK/NDK versions
- Disabled all plugins except essentials
- Tested with blank VR template (also fails)

This seems like a regression in UE 5.4's build system specifically affecting VR Android builds. The error messages are completely unhelpful for debugging.

Considering downgrading to 5.3 but we need 5.4 features. Anyone found a solution?""",
            "excerpt": "UE 5.4 Quest packaging regression, build system failure, cryptic errors",
            "error_type": "packaging_error",
            "date_scraped": (datetime.now() - timedelta(days=3)).isoformat(),
            "post_date": (datetime.now() - timedelta(days=3)).isoformat(),
            "word_count": 178,
            "has_solution": False,
            "solution_content": None,
            "upvotes": 38
        }
    ]
    
    # Create output directory
    output_dir = Path("./quest-dev-copilot/scraper/scraped_data")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save sample data
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    posts_file = output_dir / f"forum_posts_{timestamp}_sample.json"
    
    with open(posts_file, 'w', encoding='utf-8') as f:
        json.dump(sample_posts, f, indent=2, ensure_ascii=False)
    
    # Create summary
    summary = {
        "total_posts_collected": len(sample_posts),
        "posts_by_forum": {
            "epic": len([p for p in sample_posts if p["forum"] == "epic"]),
            "meta": len([p for p in sample_posts if p["forum"] == "meta"])
        },
        "posts_by_error_type": {
            "black_screen": len([p for p in sample_posts if p["error_type"] == "black_screen"]),
            "plugin_conflict": len([p for p in sample_posts if p["error_type"] == "plugin_conflict"]),
            "sdk_mismatch": len([p for p in sample_posts if p["error_type"] == "sdk_mismatch"]),
            "packaging_error": len([p for p in sample_posts if p["error_type"] == "packaging_error"]),
            "other": len([p for p in sample_posts if p["error_type"] == "other"])
        },
        "posts_with_solutions": 0,  # All are unsolved
        "scrape_date_utc": datetime.utcnow().isoformat(),
        "data_type": "sample_unsolved_issues"
    }
    
    summary_file = output_dir / f"scrape_summary_{timestamp}_sample.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)
    
    print(f"✅ Created sample unsolved issues data:")
    print(f"   📝 Posts file: {posts_file}")
    print(f"   📊 Summary file: {summary_file}")
    print(f"   🎯 {len(sample_posts)} unsolved issues created")
    
    # Show breakdown
    print(f"\n📈 Sample Data Breakdown:")
    for error_type, count in summary["posts_by_error_type"].items():
        if count > 0:
            print(f"   - {error_type.replace('_', ' ').title()}: {count}")
    
    return posts_file, summary_file

if __name__ == "__main__":
    create_sample_unsolved_data() 