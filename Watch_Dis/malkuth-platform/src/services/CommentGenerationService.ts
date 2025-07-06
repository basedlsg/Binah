import {
  Comment,
  CommentThread,
  ConversationNode,
  Content,
  BotPersona,
  EngagementStyle,
  EngagementPhase
} from '../types';

export class CommentGenerationService {
  private readonly commentTemplates: Map<EngagementStyle, string[]> = new Map();
  private readonly conversationStarters: string[] = [];
  private readonly replyTemplates: Map<string, string[]> = new Map();
  private readonly activeThreads: Map<string, CommentThread> = new Map();
  private readonly geminiApiKey: string;

  constructor(geminiApiKey?: string) {
    this.geminiApiKey = geminiApiKey || process.env.GEMINI_API_KEY || '';
    this.initializeTemplates();
  }

  /**
   * Generate a comment for content
   */
  public async generateComment(
    content: Content,
    bot: BotPersona,
    parentCommentId?: string
  ): Promise<Comment> {
    const isReply = !!parentCommentId;
    let commentText: string;

    if (isReply) {
      const parentComment = await this.getParentComment(parentCommentId);
      commentText = await this.generateReplyComment(content, bot, parentComment);
    } else {
      commentText = await this.generateRootComment(content, bot);
    }

    // Add authenticity variations
    commentText = this.addAuthenticityVariations(commentText, bot);

    const comment: Comment = {
      id: this.generateId(),
      contentId: content.id,
      authorId: bot.id,
      text: commentText,
      parentId: parentCommentId,
      createdAt: new Date(),
      isBot: true,
      likes: 0,
      replies: []
    };

    // Update thread tracking
    await this.updateThreadTracking(comment, content);

    return comment;
  }

  /**
   * Generate conversation thread between bots
   */
  public async generateConversationThread(
    content: Content,
    bots: BotPersona[],
    threadDepth: number = 3
  ): Promise<CommentThread> {
    const threadId = this.generateId();
    const rootBot = bots[0];
    
    // Generate root comment
    const rootComment = await this.generateComment(content, rootBot);
    
    const thread: CommentThread = {
      id: threadId,
      contentId: content.id,
      rootCommentId: rootComment.id,
      participants: [rootBot.id],
      depth: 0,
      conversationFlow: [],
      isActive: true,
      createdAt: new Date()
    };

    // Generate conversation flow
    await this.buildConversationFlow(thread, content, bots, threadDepth);
    
    this.activeThreads.set(threadId, thread);
    return thread;
  }

  /**
   * Generate batch comments for multiple bots
   */
  public async generateBatchComments(
    content: Content,
    bots: BotPersona[],
    phase: EngagementPhase
  ): Promise<Comment[]> {
    const comments: Comment[] = [];
    
    // Determine comment distribution based on phase
    const commentProbability = this.getCommentProbabilityByPhase(phase);
    
    for (const bot of bots) {
      if (Math.random() < commentProbability) {
        const comment = await this.generateComment(content, bot);
        comments.push(comment);
        
        // Add realistic delay between comments
        await this.addRealisticDelay(bot);
      }
    }

    return comments;
  }

  /**
   * Generate threaded conversation between bots
   */
  public async generateThreadedConversation(
    content: Content,
    participantBots: BotPersona[],
    maxReplies: number = 5
  ): Promise<Comment[]> {
    const comments: Comment[] = [];
    
    if (participantBots.length === 0) return comments;
    
    // Generate root comment
    const rootBot = participantBots[0];
    const rootComment = await this.generateComment(content, rootBot);
    comments.push(rootComment);
    
    // Generate replies
    let currentParentId = rootComment.id;
    const remainingBots = participantBots.slice(1);
    
    for (let i = 0; i < Math.min(maxReplies, remainingBots.length); i++) {
      const replyBot = remainingBots[i];
      const reply = await this.generateComment(content, replyBot, currentParentId);
      comments.push(reply);
      
      // Sometimes continue thread, sometimes start new branch
      if (Math.random() < 0.6) {
        currentParentId = reply.id;
      }
      
      // Add realistic timing between replies
      await this.addRealisticDelay(replyBot);
    }
    
    return comments;
  }

  /**
   * Get comment sentiment analysis
   */
  public analyzeSentiment(comment: Comment): 'positive' | 'neutral' | 'negative' {
    const text = comment.text.toLowerCase();
    
    // Simple sentiment analysis (could be enhanced with ML)
    const positiveWords = ['great', 'amazing', 'love', 'awesome', 'fantastic', 'good', 'nice', 'excellent'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'worst', 'sucks', 'disappointing'];
    
    const positiveScore = positiveWords.reduce((score, word) => 
      score + (text.includes(word) ? 1 : 0), 0
    );
    
    const negativeScore = negativeWords.reduce((score, word) => 
      score + (text.includes(word) ? 1 : 0), 0
    );
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  /**
   * Generate comment using Gemini AI
   */
  public async generateAIComment(
    content: Content,
    bot: BotPersona,
    context?: string
  ): Promise<string> {
    if (!this.geminiApiKey) {
      return this.generateTemplateComment(content, bot);
    }

    const prompt = this.buildAIPrompt(content, bot, context);
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 1,
            topP: 1,
            maxOutputTokens: 150,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return this.cleanupAIComment(generatedText);
    } catch (error) {
      console.error('AI comment generation failed:', error);
      return this.generateTemplateComment(content, bot);
    }
  }

  /**
   * Initialize comment templates
   */
  private initializeTemplates(): void {
    // Casual comments
    this.commentTemplates.set('casual', [
      'This is pretty cool!',
      'Nice one!',
      'I like this',
      'Cool stuff',
      'That\'s awesome',
      'Good job!',
      'Love it!',
      'This is great',
      'Nicely done',
      'Interesting!'
    ]);

    // Professional comments
    this.commentTemplates.set('professional', [
      'Excellent work on this project.',
      'This demonstrates strong technical skills.',
      'Well executed and professionally presented.',
      'I appreciate the attention to detail.',
      'This is a valuable contribution.',
      'Great insights shared here.',
      'Professional quality work.',
      'This adds significant value.',
      'Impressive execution.',
      'Well-researched and thorough.'
    ]);

    // Enthusiastic comments
    this.commentTemplates.set('enthusiastic', [
      'This is absolutely amazing!',
      'I LOVE this so much!',
      'WOW! This is incredible!',
      'This just made my day!',
      'AMAZING work! Keep it up!',
      'This is pure genius!',
      'I can\'t stop watching this!',
      'This is everything I needed!',
      'Fantastic! More please!',
      'This is mind-blowing!'
    ]);

    // Analytical comments
    this.commentTemplates.set('analytical', [
      'Interesting approach to this problem.',
      'The methodology here is sound.',
      'I notice some key patterns emerging.',
      'This data suggests several insights.',
      'The implementation could be optimized.',
      'Have you considered alternative approaches?',
      'The results align with my expectations.',
      'This raises some important questions.',
      'The analysis appears comprehensive.',
      'I\'d like to see more data points.'
    ]);

    // Humorous comments
    this.commentTemplates.set('humorous', [
      'This is funnier than my last relationship! 😂',
      'I laughed harder than I should have!',
      'My coffee just came out of my nose!',
      'This is comedy gold!',
      'I can\'t even... 😭',
      'This made me snort!',
      'Pure comedy genius!',
      'I\'m dying! 💀',
      'This is why I love the internet!',
      'My sides hurt from laughing!'
    ]);

    // Reply templates
    this.replyTemplates.set('agreement', [
      'I totally agree with this!',
      'Exactly my thoughts!',
      'Couldn\'t have said it better myself!',
      'This is so true!',
      'You nailed it!',
      'Perfect explanation!',
      'Spot on!',
      'Absolutely right!',
      'This resonates with me!',
      'You\'re absolutely correct!'
    ]);

    this.replyTemplates.set('question', [
      'What do you think about...?',
      'How did you figure that out?',
      'Can you explain more about...?',
      'What\'s your take on...?',
      'Have you tried...?',
      'What would happen if...?',
      'Do you have any tips for...?',
      'Where can I learn more about...?',
      'What\'s the best way to...?',
      'How long did this take you?'
    ]);

    this.replyTemplates.set('elaboration', [
      'Building on what you said...',
      'To add to your point...',
      'I\'d like to expand on this...',
      'This reminds me of...',
      'In my experience...',
      'I\'ve noticed that...',
      'Another thing to consider...',
      'From a different perspective...',
      'This connects to...',
      'I\'ve found that...'
    ]);
  }

  /**
   * Generate root comment
   */
  private async generateRootComment(content: Content, bot: BotPersona): Promise<string> {
    // Try AI generation first
    if (this.geminiApiKey) {
      const aiComment = await this.generateAIComment(content, bot);
      if (aiComment && aiComment.length > 10) {
        return aiComment;
      }
    }

    // Fallback to template-based generation
    return this.generateTemplateComment(content, bot);
  }

  /**
   * Generate reply comment
   */
  private async generateReplyComment(
    content: Content,
    bot: BotPersona,
    parentComment: Comment | null
  ): Promise<string> {
    if (!parentComment) {
      return this.generateRootComment(content, bot);
    }

    const context = `Replying to: "${parentComment.text}"`;
    
    // Try AI generation with context
    if (this.geminiApiKey) {
      const aiComment = await this.generateAIComment(content, bot, context);
      if (aiComment && aiComment.length > 10) {
        return aiComment;
      }
    }

    // Fallback to template-based reply
    return this.generateTemplateReply(bot, parentComment);
  }

  /**
   * Generate template-based comment
   */
  private generateTemplateComment(content: Content, bot: BotPersona): string {
    const templates = this.commentTemplates.get(bot.engagementStyle) || [];
    if (templates.length === 0) {
      return 'Great content!';
    }

    let template = templates[Math.floor(Math.random() * templates.length)];
    
    // Add content-specific context
    if (content.category && Math.random() < 0.3) {
      template = this.addContentContext(template, content);
    }

    return template;
  }

  /**
   * Generate template-based reply
   */
  private generateTemplateReply(bot: BotPersona, parentComment: Comment): string {
    const replyTypes = ['agreement', 'question', 'elaboration'];
    const replyType = replyTypes[Math.floor(Math.random() * replyTypes.length)];
    
    const templates = this.replyTemplates.get(replyType) || [];
    if (templates.length === 0) {
      return 'Thanks for sharing!';
    }

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Build AI prompt for comment generation
   */
  private buildAIPrompt(content: Content, bot: BotPersona, context?: string): string {
    const prompt = `
Generate a ${bot.engagementStyle} comment from the perspective of ${bot.name}, a ${bot.demographics.age}-year-old from ${bot.demographics.location}.

Bot Profile:
- Personality: ${bot.personality}
- Interests: ${bot.interests.join(', ')}
- Engagement Style: ${bot.engagementStyle}

Content:
- Title: ${content.title}
- Description: ${content.description}
- Category: ${content.category}
- Tags: ${content.tags.join(', ')}

${context ? `Context: ${context}` : ''}

Generate a realistic, authentic comment that:
1. Matches the bot's personality and engagement style
2. Is relevant to the content
3. Sounds natural and human-like
4. Is 1-2 sentences long
5. Includes appropriate enthusiasm level for the bot's style
6. Avoids being obviously AI-generated

Comment:`;

    return prompt;
  }

  /**
   * Clean up AI-generated comment
   */
  private cleanupAIComment(text: string): string {
    // Remove common AI artifacts
    let cleaned = text.replace(/^(Comment:|Response:|Reply:)/i, '').trim();
    
    // Remove quotation marks if they wrap the entire comment
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    // Ensure it's not too long
    if (cleaned.length > 280) {
      cleaned = cleaned.substring(0, 280).trim();
      // Try to end at a complete sentence
      const lastPeriod = cleaned.lastIndexOf('.');
      if (lastPeriod > 200) {
        cleaned = cleaned.substring(0, lastPeriod + 1);
      }
    }
    
    return cleaned;
  }

  /**
   * Add authenticity variations to comment
   */
  private addAuthenticityVariations(text: string, bot: BotPersona): string {
    let result = text;
    
    // Add occasional typos for casual bots
    if (bot.engagementStyle === 'casual' && Math.random() < 0.1) {
      result = this.addCasualTypos(result);
    }
    
    // Add emojis for enthusiastic bots
    if (bot.engagementStyle === 'enthusiastic' && Math.random() < 0.3) {
      result = this.addEmojis(result);
    }
    
    // Add technical terms for analytical bots
    if (bot.engagementStyle === 'analytical' && Math.random() < 0.2) {
      result = this.addTechnicalFlair(result);
    }
    
    return result;
  }

  /**
   * Add content context to comment
   */
  private addContentContext(template: string, content: Content): string {
    const contextPhrases = [
      `Great ${content.category} content!`,
      `Love this ${content.category}!`,
      `This ${content.category} is amazing!`,
      `Fantastic ${content.category} work!`
    ];
    
    if (Math.random() < 0.5) {
      return contextPhrases[Math.floor(Math.random() * contextPhrases.length)];
    }
    
    return template;
  }

  /**
   * Add casual typos to make comment more authentic
   */
  private addCasualTypos(text: string): string {
    const typoReplacements = [
      ['you', 'u'],
      ['your', 'ur'],
      ['are', 'r'],
      ['because', 'bc'],
      ['probably', 'prob'],
      ['definitely', 'def'],
      ['awesome', 'awsome'],
      ['amazing', 'amzing']
    ];
    
    let result = text;
    for (const [correct, typo] of typoReplacements) {
      if (Math.random() < 0.3 && result.includes(correct)) {
        result = result.replace(correct, typo);
        break; // Only one typo per comment
      }
    }
    
    return result;
  }

  /**
   * Add emojis to enthusiastic comments
   */
  private addEmojis(text: string): string {
    const emojis = ['😍', '🔥', '💯', '🎉', '👏', '❤️', '🤩', '⭐', '🎊', '🙌'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    return Math.random() < 0.5 ? `${text} ${emoji}` : `${emoji} ${text}`;
  }

  /**
   * Add technical flair to analytical comments
   */
  private addTechnicalFlair(text: string): string {
    const technicalPhrases = [
      'From a technical perspective,',
      'The implementation suggests',
      'Based on my analysis,',
      'The methodology indicates',
      'This approach demonstrates'
    ];
    
    const phrase = technicalPhrases[Math.floor(Math.random() * technicalPhrases.length)];
    return `${phrase} ${text.toLowerCase()}`;
  }

  /**
   * Build conversation flow for thread
   */
  private async buildConversationFlow(
    thread: CommentThread,
    content: Content,
    bots: BotPersona[],
    maxDepth: number
  ): Promise<void> {
    const rootComment = await this.generateComment(content, bots[0]);
    
    const rootNode: ConversationNode = {
      commentId: rootComment.id,
      authorId: bots[0].id,
      text: rootComment.text,
      timestamp: new Date(),
      responses: [],
      sentiment: this.analyzeSentiment(rootComment)
    };
    
    thread.conversationFlow.push(rootNode);
    
    // Generate responses
    for (let depth = 1; depth < maxDepth && depth < bots.length; depth++) {
      const bot = bots[depth];
      const reply = await this.generateComment(content, bot, rootComment.id);
      
      const replyNode: ConversationNode = {
        commentId: reply.id,
        authorId: bot.id,
        text: reply.text,
        timestamp: new Date(),
        responses: [],
        sentiment: this.analyzeSentiment(reply)
      };
      
      rootNode.responses.push(replyNode);
      thread.participants.push(bot.id);
      thread.depth = depth;
    }
  }

  /**
   * Get comment probability by phase
   */
  private getCommentProbabilityByPhase(phase: EngagementPhase): number {
    switch (phase) {
      case 'discovery':
        return 0.05; // 5% chance
      case 'viral-growth':
        return 0.15; // 15% chance
      case 'sustained-interest':
        return 0.08; // 8% chance
      case 'archive':
        return 0.02; // 2% chance
      default:
        return 0.05;
    }
  }

  /**
   * Update thread tracking
   */
  private async updateThreadTracking(comment: Comment, content: Content): Promise<void> {
    // Find or create thread
    const existingThread = Array.from(this.activeThreads.values()).find(t => 
      t.contentId === content.id && 
      (t.rootCommentId === comment.id || t.rootCommentId === comment.parentId)
    );
    
    if (existingThread) {
      existingThread.participants.push(comment.authorId);
      existingThread.depth = Math.max(existingThread.depth, comment.parentId ? 1 : 0);
    }
  }

  /**
   * Add realistic delay between comments
   */
  private async addRealisticDelay(bot: BotPersona): Promise<void> {
    const baseDelay = 2000; // 2 seconds base
    const randomDelay = Math.random() * 8000; // 0-8 seconds random
    const personalityMultiplier = bot.engagementStyle === 'enthusiastic' ? 0.5 : 1.0;
    
    const totalDelay = (baseDelay + randomDelay) * personalityMultiplier;
    await new Promise(resolve => setTimeout(resolve, totalDelay));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get parent comment (placeholder for database integration)
   */
  private async getParentComment(commentId: string): Promise<Comment | null> {
    // This would fetch from your database
    return null;
  }
}