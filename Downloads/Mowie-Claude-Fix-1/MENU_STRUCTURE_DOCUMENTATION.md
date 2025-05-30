# Menu Structure Documentation 📋

## Phase 1 Discovery - Exact Current Menu Implementation

### Menu Header (MenuHeader.swift)
**Display Elements:**
- User profile image (64x64px, circular)
- User full name: `${user.firstname} ${user.lastname}`
- Green background: `UIColor.rgb(red: 0, green: 75, blue: 0)`
- Tap to take profile photo (delegates to CameraManager)

### Menu Items (MenuController.swift)
**Exact Menu Options from MenuOptions enum:**

1. **Profile** 
   - Text: "Profile"
   - Navigation: → `ProfilePageController(user: user)` in navigation controller
   - Full screen modal presentation

2. **Promo** 
   - Text: "Promo"  
   - Action: Shows alert "There are no promotions at this time. Try again later."
   - Alert with OK button

3. **Help**
   - Text: "Help"
   - Navigation: → `HelpPageController()` in navigation controller
   - Full screen modal presentation

4. **About Us**
   - Text: "About Us"
   - Navigation: → `AboutUsController()` in navigation controller
   - Full screen modal presentation

5. **Logout**
   - Text: "Logout"
   - Action: Shows confirmation action sheet "Are you sure you want to logout?"
   - Options: "Log Out" (destructive) or "Cancel"
   - On confirm: calls `signOut()` → presents `LoginController()`

### Commented Out Menu Items (Currently Inactive)
**These were removed but code still exists:**
- **Payments**: Would open Stripe billing portal via `ApiController`
- **Add Job**: Would show property size selection action sheet then `AddJobController`

### Menu Access Method
**Current Implementation:**
- Hamburger menu accessed via `MainControllerDelegate.handleMenuToggle()`
- Triggered from MainController (exact trigger button not yet located)
- Side menu slides from left, dims main content with black overlay
- Menu appears at `x: 0, y: 40` with 80px right margin for partial overlay

### User Type Handling
**No Different Menus for Customer vs Pro:**
- Same menu structure for all user types
- User object passed to menu but no conditional menu items
- Pro users have separate tab-based interface via `TabController`
- Customer users use this side menu system via `ContainerController`

### Animation Behavior
**Menu Slide Animation:**
- Duration: 0.3 seconds
- Easing: `.curveEaseOut`
- Main content slides right to `xOrigin` (screen.width - 80)
- Black overlay fades in with 0.5 alpha
- Status bar hidden when menu expanded

### Navigation Flow
**Current Architecture:**
```
Customer Users:
LoginController → ContainerController → MainController (with side menu)

Pro Users:  
LoginController → TabController (5 tabs, no side menu)
```

### Special Behaviors
1. **Profile Image Tap**: Opens camera for profile photo update
2. **Menu Dismissal**: Tap black overlay area to close menu
3. **Logout Confirmation**: Requires confirmation before signing out
4. **Modal Presentations**: All menu destinations use full screen modals
5. **Promo Alert**: Static message, no dynamic content

### Technical Implementation Details
**Menu Cell Styling:**
- Row height: 50pt
- Text color: White
- Font: System font, 18pt, medium weight
- Background: Clear
- Separator: White with 0.1 alpha
- No selection highlighting

**Container Integration:**
- Menu positioned at index 0 in view hierarchy
- Hidden by default, shown on toggle
- Menu controller added as child view controller
- Delegates to ContainerController for option handling

---

## Critical Findings for Tab Bar Implementation

### ✅ CONFIRMED: Safe to Replace for Customer Users
- Only customer users use this side menu
- Pro users already have TabController (different system)
- No complex business logic in menu items
- All navigation goes to simple view controllers

### ⚠️ MUST PRESERVE:
1. **Profile access** with same ProfilePageController
2. **Help page** access to HelpPageController  
3. **About Us** access to AboutUsController
4. **Logout confirmation** with same alert behavior
5. **Promo alert** with same static message

### 🚫 CAN SAFELY OMIT:
1. **Profile image tap** (not practical in tab bar)
2. **Menu header with user info** (can show in profile tab)

### 📋 RECOMMENDED TAB STRUCTURE:
Based on existing menu items that make sense as tabs:

1. **Home Tab** (keep existing main content)
2. **Profile Tab** (replace Profile menu item)
3. **Help Tab** (replace Help menu item) 
4. **About Tab** (replace About Us menu item)
5. **More Tab** (contain Promo + Logout)

**OR Simpler 4-Tab Structure:**
1. **Home** - Current MainController content
2. **Profile** - ProfilePageController 
3. **Help** - HelpPageController
4. **Settings** - About + Promo + Logout options

This preserves ALL functionality while providing better UX than side menu.