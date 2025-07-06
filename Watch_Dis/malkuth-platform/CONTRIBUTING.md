# Contributing to Malkuth Platform

We welcome contributions to Malkuth Platform! This document provides guidelines for contributing to the project, whether you're fixing bugs, adding features, improving documentation, or suggesting enhancements.

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, education, socioeconomic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- Harassment, trolling, or discriminatory language
- Personal attacks or political discussions
- Publishing private information without permission
- Spam, self-promotion, or off-topic discussions
- Any conduct that could reasonably be considered inappropriate

### Enforcement

Project maintainers are responsible for clarifying standards and will take appropriate action in response to unacceptable behavior. Contact us at conduct@malkuth-platform.com to report issues.

## 🚀 Getting Started

### Development Environment Setup

1. **Prerequisites**
   ```bash
   # Node.js 18+ and npm
   node --version  # Should be 18.0.0 or higher
   npm --version   # Should be 8.0.0 or higher
   
   # Git
   git --version
   
   # FFmpeg (for video processing)
   ffmpeg -version
   ```

2. **Fork and Clone**
   ```bash
   # Fork the repository on GitHub
   # Then clone your fork
   git clone https://github.com/YOUR_USERNAME/malkuth-platform.git
   cd malkuth-platform
   
   # Add upstream remote
   git remote add upstream https://github.com/malkuth-org/malkuth-platform.git
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Configure your environment variables
   # See docs/configuration/ENVIRONMENT.md for details
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Verify Setup**
   - Visit http://localhost:3000
   - Check that all features load correctly
   - Run the test suite: `npm test` (when implemented)

### Project Structure Understanding

Before contributing, familiarize yourself with the project structure:

```
src/
├── app/                    # Next.js App Router
├── components/             # React components
├── services/              # Business logic services
├── lib/                   # Utility libraries
├── types/                 # TypeScript definitions
└── styles/                # Global styles

docs/                      # Documentation
├── technical/             # Technical documentation
├── api/                   # API documentation
├── user-guides/           # User documentation
└── configuration/         # Setup guides
```

## 📋 How to Contribute

### Types of Contributions

We welcome various types of contributions:

1. **Bug Reports** - Help us identify and fix issues
2. **Feature Requests** - Suggest new functionality
3. **Code Contributions** - Bug fixes, features, improvements
4. **Documentation** - Improve existing docs or add new ones
5. **Testing** - Add tests or improve test coverage
6. **Performance** - Optimize existing functionality
7. **Security** - Identify and fix security issues

### Bug Reports

**Before Submitting a Bug Report:**
- Check existing issues to avoid duplicates
- Verify the bug exists in the latest version
- Gather relevant information about your environment

**Bug Report Template:**
```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g. macOS 12.0]
- Browser: [e.g. Chrome 95.0]
- Version: [e.g. 1.0.0]
- Node.js: [e.g. 18.15.0]

## Additional Context
Screenshots, error logs, or other relevant information
```

### Feature Requests

**Before Submitting a Feature Request:**
- Check if the feature already exists
- Review existing feature requests
- Consider if it fits the project's goals

**Feature Request Template:**
```markdown
## Feature Summary
Brief description of the proposed feature

## Problem Statement
What problem does this feature solve?

## Proposed Solution
Detailed description of how the feature should work

## Alternatives Considered
Other approaches you've considered

## Additional Context
Mockups, examples, or related issues
```

### Code Contributions

#### 1. Choose or Create an Issue

- Look for issues labeled `good first issue` for beginners
- Check issues labeled `help wanted` for community contributions
- For new features, create a feature request first
- For significant changes, discuss with maintainers first

#### 2. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

#### 3. Make Your Changes

**Code Quality Guidelines:**
- Follow existing code style and patterns
- Write TypeScript with proper typing
- Add appropriate comments for complex logic
- Ensure responsive design for UI changes
- Follow accessibility best practices

**Commit Message Guidelines:**
```bash
# Format: type(scope): description
feat(bot-system): add new engagement style option
fix(upload): resolve video processing timeout issue
docs(api): update authentication examples
style(ui): improve button hover states
refactor(analytics): optimize metrics calculation
test(content): add upload validation tests
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

#### 4. Testing Your Changes

```bash
# Run the development server
npm run dev

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests (when implemented)
npm test

# Build for production
npm run build
```

**Testing Checklist:**
- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All existing functionality still works
- [ ] New functionality works as expected
- [ ] Responsive design tested
- [ ] Accessibility tested

#### 5. Submit a Pull Request

```bash
# Push your changes
git push origin feature/your-feature-name

# Create pull request on GitHub
```

**Pull Request Template:**
```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran and any relevant details

## Screenshots (if applicable)
Add screenshots to help explain your changes

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

## 🎨 Code Style Guidelines

### TypeScript Guidelines

```typescript
// Use explicit types for function parameters and return values
function calculateEngagementScore(
  bot: BotPersona, 
  content: Content
): number {
  // Implementation
}

// Use interfaces for object shapes
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// Use meaningful variable names
const authenticityScore = calculateAuthenticityScore(interaction);
const isValidContent = validateContentMetadata(content);

// Use optional chaining and nullish coalescing
const thumbnailUrl = content.metadata?.thumbnailUrl ?? '/default-thumbnail.jpg';
```

### React Component Guidelines

```tsx
// Use functional components with TypeScript
interface ContentCardProps {
  content: Content;
  onSelect?: (content: Content) => void;
  className?: string;
}

export function ContentCard({ 
  content, 
  onSelect, 
  className 
}: ContentCardProps) {
  const handleClick = useCallback(() => {
    onSelect?.(content);
  }, [content, onSelect]);

  return (
    <div 
      className={cn('content-card', className)}
      onClick={handleClick}
    >
      {/* Component JSX */}
    </div>
  );
}
```

### CSS/Styling Guidelines

```css
/* Use Tailwind CSS classes when possible */
.content-card {
  @apply flex flex-col p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow;
}

/* Use CSS custom properties for theming */
.content-card {
  background-color: var(--card-background);
  border-color: var(--card-border);
}

/* Follow BEM methodology for custom CSS */
.content-card__title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100;
}

.content-card__description {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-2;
}
```

### API Design Guidelines

```typescript
// Use consistent response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Use proper HTTP status codes
export async function POST(request: NextRequest) {
  try {
    const result = await processRequest(request);
    return NextResponse.json({ 
      success: true, 
      data: result 
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: { 
        code: 'PROCESSING_ERROR', 
        message: error.message 
      } 
    }, { status: 400 });
  }
}
```

## 📝 Documentation Guidelines

### Writing Style

- Use clear, concise language
- Write in second person ("you can", "your content")
- Use active voice when possible
- Include examples and code snippets
- Use consistent terminology throughout

### Documentation Structure

```markdown
# Title (H1 - One per document)

Brief introduction paragraph explaining the purpose.

## Section Title (H2)

### Subsection (H3)

Content with examples:

```typescript
// Code example with proper syntax highlighting
const example = "Include working code examples";
```

#### Important Notes (H4)

Use H4 for specific notes or warnings.
```

### Code Documentation

```typescript
/**
 * Calculates the authenticity score for a bot engagement
 * 
 * @param bot - The bot persona performing the engagement
 * @param content - The content being engaged with
 * @param engagementType - Type of engagement ('like', 'comment', etc.)
 * @returns Authenticity score between 0 and 1
 * 
 * @example
 * ```typescript
 * const score = calculateAuthenticityScore(bot, content, 'like');
 * console.log(`Authenticity: ${score * 100}%`);
 * ```
 */
export function calculateAuthenticityScore(
  bot: BotPersona,
  content: Content,
  engagementType: EngagementType
): number {
  // Implementation
}
```

## 🧪 Testing Guidelines

### Testing Philosophy

- Write tests that verify behavior, not implementation
- Focus on edge cases and error conditions
- Keep tests simple and focused
- Use descriptive test names

### Test Structure

```typescript
describe('BotPersonaService', () => {
  describe('createBot', () => {
    it('should create a bot with default parameters', async () => {
      const service = new BotPersonaService();
      const bot = await service.createBot();
      
      expect(bot).toBeDefined();
      expect(bot.id).toMatch(/^bot_\d+_[a-z0-9]+$/);
      expect(bot.isActive).toBe(true);
    });

    it('should create a bot with custom parameters', async () => {
      const service = new BotPersonaService();
      const params = {
        name: 'Test Bot',
        engagementStyle: 'professional' as EngagementStyle
      };
      
      const bot = await service.createBot(params);
      
      expect(bot.name).toBe('Test Bot');
      expect(bot.engagementStyle).toBe('professional');
    });

    it('should throw error when maximum bots reached', async () => {
      const service = new BotPersonaService();
      // Create maximum number of bots
      
      await expect(service.createBot()).rejects.toThrow('Maximum number of bots reached');
    });
  });
});
```

## 🔄 Development Workflow

### Daily Development

1. **Start of Day**
   ```bash
   git checkout main
   git pull upstream main
   npm install  # If package.json changed
   ```

2. **Work on Feature**
   ```bash
   git checkout -b feature/your-feature
   # Make changes
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Before Submitting PR**
   ```bash
   # Rebase on latest main
   git fetch upstream
   git rebase upstream/main
   
   # Run quality checks
   npm run lint
   npm run type-check
   npm run build
   
   # Push changes
   git push origin feature/your-feature
   ```

### Code Review Process

1. **Submit Pull Request**
   - Use the PR template
   - Link related issues
   - Add relevant labels
   - Request review from maintainers

2. **Address Feedback**
   - Respond to comments
   - Make requested changes
   - Push updates to same branch
   - Re-request review when ready

3. **Merge Process**
   - Maintainer will merge when approved
   - Branch will be automatically deleted
   - Update your local repository

## 🏷️ Issue Labels

We use labels to categorize issues and PRs:

**Type Labels:**
- `bug` - Something isn't working
- `feature` - New feature request
- `enhancement` - Improvement to existing feature
- `documentation` - Improvements to documentation
- `question` - Further information is requested

**Priority Labels:**
- `critical` - Critical issue requiring immediate attention
- `high` - High priority issue
- `medium` - Medium priority issue
- `low` - Low priority issue

**Difficulty Labels:**
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `advanced` - Requires deep knowledge of the codebase

**Component Labels:**
- `bot-system` - Related to bot personas
- `content-management` - Content upload/management
- `analytics` - Analytics and reporting
- `ui/ux` - User interface and experience
- `api` - API related changes
- `security` - Security related issues

## 📈 Performance Guidelines

### General Performance

- Minimize bundle size with dynamic imports
- Optimize images and media files
- Use appropriate caching strategies
- Implement lazy loading for large lists

### React Performance

```tsx
// Use React.memo for expensive components
export const ContentCard = React.memo(({ content }: ContentCardProps) => {
  // Component implementation
});

// Use useCallback for event handlers
const handleClick = useCallback((id: string) => {
  onContentSelect(id);
}, [onContentSelect]);

// Use useMemo for expensive calculations
const filteredContent = useMemo(() => {
  return content.filter(item => item.category === selectedCategory);
}, [content, selectedCategory]);
```

### Database Performance

```typescript
// Use indexes for frequently queried fields
// Implement pagination for large datasets
// Use connection pooling
// Cache frequently accessed data

const getContent = async (filters: ContentFilters) => {
  // Use proper indexing and pagination
  const query = buildOptimizedQuery(filters);
  return await executeQuery(query);
};
```

## 🔒 Security Guidelines

### Security Best Practices

1. **Input Validation**
   ```typescript
   // Validate all inputs
   const validateContentUpload = (file: File, metadata: ContentMetadata) => {
     if (!isValidFileType(file.type)) {
       throw new Error('Invalid file type');
     }
     if (file.size > MAX_FILE_SIZE) {
       throw new Error('File too large');
     }
     // Additional validation...
   };
   ```

2. **Authentication & Authorization**
   ```typescript
   // Check permissions before sensitive operations
   const requirePermission = (permission: Permission) => {
     return (req: Request, res: Response, next: NextFunction) => {
       if (!userHasPermission(req.user, permission)) {
         return res.status(403).json({ error: 'Insufficient permissions' });
       }
       next();
     };
   };
   ```

3. **Data Sanitization**
   ```typescript
   // Sanitize user inputs
   const sanitizeInput = (input: string): string => {
     return input
       .trim()
       .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
       .substring(0, MAX_INPUT_LENGTH);
   };
   ```

### Security Review Checklist

- [ ] Input validation implemented
- [ ] Authentication required for protected routes
- [ ] Authorization checks in place
- [ ] No sensitive data in logs
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting implemented

## 🎯 Best Practices

### General Development

1. **Keep it Simple** - Write clear, readable code
2. **Follow Patterns** - Use established patterns in the codebase
3. **Document Decisions** - Explain why, not just what
4. **Test Edge Cases** - Think about what could go wrong
5. **Consider Performance** - Write efficient code from the start

### Git Best Practices

1. **Atomic Commits** - One logical change per commit
2. **Clear Messages** - Explain what and why
3. **Rebase vs Merge** - Use rebase for feature branches
4. **Clean History** - Squash commits when appropriate

### Communication

1. **Be Respectful** - Treat everyone with respect
2. **Be Clear** - Communicate clearly and concisely
3. **Ask Questions** - Don't hesitate to ask for help
4. **Share Knowledge** - Help others learn and grow

## 🏆 Recognition

We appreciate all contributions to Malkuth Platform! Contributors will be:

- Listed in our CONTRIBUTORS.md file
- Mentioned in release notes for significant contributions
- Invited to our contributor Discord channel
- Eligible for special contributor badges
- Considered for the Malkuth Platform contributor program

## 📞 Getting Help

If you need help with contributing:

**Development Questions:**
- 💬 Discord: #development channel
- 📧 Email: dev@malkuth-platform.com
- 🐛 GitHub Issues: For bugs and feature requests

**Code Review Questions:**
- Comment on your PR
- Tag maintainers for urgent questions
- Join our weekly contributor calls

**General Questions:**
- 📚 Documentation: Check existing docs first
- 💬 Community: Ask in Discord #general
- 📧 Support: support@malkuth-platform.com

---

Thank you for contributing to Malkuth Platform! Your contributions help make the platform better for everyone. We look forward to working with you!