import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Bot personalities for variety
    const botPersonalities = [
      { name: "Alex", style: "tech-savvy and analytical", emoji: "🤓" },
      { name: "Luna", style: "creative and enthusiastic", emoji: "✨" },
      { name: "Maya", style: "thoughtful and supportive", emoji: "💭" },
      { name: "Zoe", style: "casual and trendy", emoji: "😎" },
      { name: "Dr. James", style: "academic and detailed", emoji: "📚" }
    ];

    const randomBot = botPersonalities[Math.floor(Math.random() * botPersonalities.length)];

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `You are ${randomBot.name}, an AI bot with a ${randomBot.style} personality. 
      Someone just uploaded a ${fileType} file called "${fileName}".
      
      Generate a brief, authentic comment (1-2 sentences, under 80 words) that:
      - Sounds natural and conversational
      - Reflects your ${randomBot.style} personality
      - Shows genuine interest in the ${fileType} content
      - Is appropriate for the file type
      - Feels like a real person commenting
      
      Comment:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let comment = response.text().trim();

      // Remove quotes if they exist
      comment = comment.replace(/^["']|["']$/g, '');

      return NextResponse.json({
        success: true,
        comment,
        botName: randomBot.name,
        botEmoji: randomBot.emoji
      });

    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      
      // Fallback comments by file type
      const fallbackComments = {
        image: [
          "Great shot! The composition is really well done.",
          "Love the colors and lighting in this image!",
          "This is exactly the kind of visual content I enjoy.",
          "Beautiful work! The details are impressive.",
          "Nice capture! Really well executed."
        ],
        video: [
          "Awesome video! The production quality looks great.",
          "Really enjoyed watching this! Well done.",
          "Great content! The editing is smooth.",
          "This is the kind of video content I love to see.",
          "Impressive work! Looking forward to more."
        ],
        audio: [
          "Great track! The sound quality is excellent.",
          "Love this! The mix is really well balanced.",
          "This is exactly my kind of music!",
          "Beautiful composition! Really well produced.",
          "Amazing audio work! Keep it coming."
        ],
        document: [
          "Interesting content! Thanks for sharing this.",
          "Great information! This is really useful.",
          "Excellent work! Very well written.",
          "This is exactly what I was looking for!",
          "Amazing document! Really comprehensive."
        ]
      };

      const comments = fallbackComments[fileType as keyof typeof fallbackComments] || fallbackComments.document;
      const fallbackComment = comments[Math.floor(Math.random() * comments.length)];

      return NextResponse.json({
        success: true,
        comment: fallbackComment,
        botName: randomBot.name,
        botEmoji: randomBot.emoji
      });
    }

  } catch (error) {
    console.error('Error generating comment:', error);
    return NextResponse.json(
      { error: 'Failed to generate comment' },
      { status: 500 }
    );
  }
}