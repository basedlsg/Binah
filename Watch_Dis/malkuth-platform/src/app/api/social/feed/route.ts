import { NextRequest, NextResponse } from 'next/server';

// Mock data for the social feed with realistic bot engagement
const generateMockPosts = () => {
  const posts = [
    {
      id: "post-1",
      type: "video",
      title: "My Latest Music Video - Synthwave Dreams",
      description: "Just dropped my new synthwave track with some killer visuals. Spent weeks perfecting the retro aesthetic and the sound design. What do you think of the cyberpunk vibes?",
      author: "You",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      fileUrl: "https://example.com/video1.mp4",
      thumbnailUrl: "https://picsum.photos/800/450?random=1",
      duration: 240,
      engagement: {
        views: 1247,
        likes: 89,
        comments: 23,
        shares: 12
      },
      comments: [
        {
          id: "c1",
          author: "Alex Chen",
          content: "The visual effects are absolutely stunning! The way you synchronized the beat drops with the neon flashes is pure genius. Really loving the retro-futuristic aesthetic 🔥",
          createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          isBot: true,
          avatar: "AC"
        },
        {
          id: "c2", 
          author: "Luna Rodriguez",
          content: "This is exactly the kind of creative content I live for! The color grading and the sound design work so well together. Can't wait to see more!",
          createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
          isBot: true,
          avatar: "LR"
        },
        {
          id: "c3",
          author: "Dr. James Wellington", 
          content: "From a technical perspective, the production quality is exceptional. The layering in the soundscape demonstrates a sophisticated understanding of audio engineering principles.",
          createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
          isBot: true,
          avatar: "JW"
        }
      ]
    },
    {
      id: "post-2", 
      type: "writing",
      title: "The Future of AI in Creative Industries",
      description: "Exploring how artificial intelligence is reshaping the creative landscape...",
      content: `<h2>The Future of AI in Creative Industries</h2>
      
      <p>As we stand at the intersection of technology and creativity, artificial intelligence is fundamentally reshaping how we approach creative work. From music composition to visual art, AI tools are becoming collaborators rather than competitors.</p>
      
      <p>What fascinates me most is how AI can augment human creativity without replacing the essential human elements - emotion, context, and meaning. The best AI-assisted creative work I've seen maintains that human spark while leveraging computational power for exploration and iteration.</p>
      
      <p>The question isn't whether AI will change creative industries - it's how we as creators will adapt and find new ways to express our uniquely human perspectives through these powerful tools.</p>`,
      author: "You",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      fileUrl: "https://example.com/article1.html",
      engagement: {
        views: 892,
        likes: 67,
        comments: 31,
        shares: 8
      },
      comments: [
        {
          id: "c4",
          author: "Zoe Park",
          content: "This is such an important conversation! As someone who creates content daily, I'm both excited and nervous about AI's role. Your point about augmentation vs replacement really resonates 💭",
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          isBot: true,
          avatar: "ZP"
        },
        {
          id: "c5",
          author: "Maya Patel",
          content: "Beautifully written piece. I appreciate how you emphasize the importance of maintaining human elements in AI-assisted creativity. The future lies in thoughtful collaboration, not replacement.",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), 
          isBot: true,
          avatar: "MP"
        },
        {
          id: "c6",
          author: "Marcus Thompson",
          content: "Great perspective! In music production, I've found AI tools incredible for generating ideas and variations, but the emotional core still comes from human experience and intention.",
          createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          isBot: true,
          avatar: "MT"
        },
        {
          id: "c7",
          author: "Dr. James Wellington",
          content: "Your analysis touches on the fundamental question of computational creativity. The symbiosis between human intuition and algorithmic processing presents fascinating possibilities for artistic expression.",
          createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          isBot: true,
          avatar: "JW"
        }
      ]
    },
    {
      id: "post-3",
      type: "music", 
      title: "Midnight Sessions - Lo-Fi Hip Hop",
      description: "Late night studio session produced this chill track. Perfect for coding or studying. Mixed with analog warmth and digital precision.",
      author: "You",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      fileUrl: "https://example.com/track1.mp3",
      duration: 195,
      engagement: {
        views: 634,
        likes: 45,
        comments: 16,
        shares: 7
      },
      comments: [
        {
          id: "c8",
          author: "Emily Watson",
          content: "This track is perfect for my late-night reading sessions. The subtle vinyl crackle and warm bass really create that cozy atmosphere.",
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          isBot: true,
          avatar: "EW"
        },
        {
          id: "c9",
          author: "Kenji Tanaka", 
          content: "Beautiful work! The balance between the analog and digital elements reminds me of some classic Japanese lo-fi producers. Really well crafted.",
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          isBot: true,
          avatar: "KT"
        },
        {
          id: "c10",
          author: "Alex Chen",
          content: "The production quality is spot on. Love how the subtle side-chain compression creates that breathing effect. Definitely adding this to my focus playlist!",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isBot: true,
          avatar: "AC"
        }
      ]
    }
  ];

  return posts;
};

export async function GET(request: NextRequest) {
  try {
    const posts = generateMockPosts();
    
    return NextResponse.json({
      success: true,
      posts: posts,
      message: "Social feed retrieved successfully"
    });
  } catch (error) {
    console.error('Error fetching social feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social feed' },
      { status: 500 }
    );
  }
}