import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, content, description } = body;

    if (!type || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate initial bot engagement
    const initialEngagement = {
      views: Math.floor(Math.random() * 50) + 10,
      likes: Math.floor(Math.random() * 15) + 2,
      comments: Math.floor(Math.random() * 8) + 1,
      shares: Math.floor(Math.random() * 5) + 1
    };

    // Generate bot comments using Gemini
    const botComments = await generateBotComments(type, title, content);

    const newPost = {
      id: `post-${Date.now()}`,
      type,
      title,
      description: description || content.substring(0, 200),
      content: type === 'writing' ? content : undefined,
      author: "You",
      createdAt: new Date().toISOString(),
      fileUrl: `https://example.com/${type}-${Date.now()}`,
      thumbnailUrl: type === 'video' ? `https://picsum.photos/800/450?random=${Date.now()}` : undefined,
      duration: type === 'video' || type === 'music' ? Math.floor(Math.random() * 300) + 60 : undefined,
      engagement: initialEngagement,
      comments: botComments
    };

    return NextResponse.json({
      success: true,
      post: newPost,
      message: "Post created successfully"
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

async function generateBotComments(type: string, title: string, content: string) {
  const botPersonas = [
    { name: "Alex Chen", personality: "tech-savvy, analytical", avatar: "AC" },
    { name: "Luna Rodriguez", personality: "creative, enthusiastic", avatar: "LR" },
    { name: "Maya Patel", personality: "thoughtful, supportive", avatar: "MP" },
    { name: "Zoe Park", personality: "casual, trendy", avatar: "ZP" },
    { name: "Dr. James Wellington", personality: "academic, detailed", avatar: "JW" }
  ];

  const comments = [];
  const numComments = Math.floor(Math.random() * 3) + 1; // 1-3 comments

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    for (let i = 0; i < numComments; i++) {
      const bot = botPersonas[Math.floor(Math.random() * botPersonas.length)];
      
      const prompt = `Generate a ${bot.personality} comment for a ${type} post titled "${title}". 
      Content preview: "${content.substring(0, 200)}..."
      
      The comment should:
      - Sound natural and authentic
      - Reflect the personality: ${bot.personality}
      - Be 1-2 sentences, under 100 words
      - Be appropriate for the content type (${type})
      - Show genuine engagement
      
      Comment:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const commentText = response.text().trim();

      comments.push({
        id: `c-${Date.now()}-${i}`,
        author: bot.name,
        content: commentText,
        createdAt: new Date(Date.now() - Math.random() * 30 * 60 * 1000).toISOString(), // Within last 30 minutes
        isBot: true,
        avatar: bot.avatar
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } catch (error) {
    console.error('Error generating bot comments:', error);
    
    // Fallback to predefined comments if Gemini fails
    const fallbackComments = [
      "Great content! Really enjoyed this.",
      "This is exactly what I was looking for. Thanks for sharing!",
      "Impressive work! Looking forward to more content like this.",
      "Love the creativity here. Keep it up!",
      "Really well done. The quality is fantastic."
    ];

    for (let i = 0; i < numComments; i++) {
      const bot = botPersonas[Math.floor(Math.random() * botPersonas.length)];
      const fallbackText = fallbackComments[Math.floor(Math.random() * fallbackComments.length)];

      comments.push({
        id: `c-${Date.now()}-${i}`,
        author: bot.name,
        content: fallbackText,
        createdAt: new Date(Date.now() - Math.random() * 30 * 60 * 1000).toISOString(),
        isBot: true,
        avatar: bot.avatar
      });
    }
  }

  return comments;
}