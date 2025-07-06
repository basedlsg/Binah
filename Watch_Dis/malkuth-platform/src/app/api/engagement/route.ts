import { NextRequest, NextResponse } from 'next/server';
import { EngagementOrchestrator } from '../../../services/EngagementOrchestrator';
import { AdminControlService } from '../../../services/AdminControlService';
import { EngagementAnalyticsService } from '../../../services/EngagementAnalyticsService';
import { BotPersonaService } from '../../../services/BotPersonaService';
import { 
  Content, 
  EngagementParameters, 
  CampaignControl, 
  BotControl, 
  SystemControl 
} from '../../../types';

const orchestrator = EngagementOrchestrator.getInstance();
const adminService = new AdminControlService();
const analyticsService = new EngagementAnalyticsService();
const botService = new BotPersonaService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'create_campaign':
        return await createCampaign(params);
      
      case 'control_campaign':
        return await controlCampaign(params);
      
      case 'control_bots':
        return await controlBots(params);
      
      case 'control_system':
        return await controlSystem(params);
      
      case 'create_bot':
        return await createBot(params);
      
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Engagement API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'system_status':
        return getSystemStatus();
      
      case 'campaigns':
        return getCampaigns();
      
      case 'analytics':
        return getAnalytics(searchParams);
      
      case 'bots':
        return getBots();
      
      case 'alerts':
        return getAlerts();
      
      default:
        return NextResponse.json(
          { error: 'Unknown query type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Engagement API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create new engagement campaign
 */
async function createCampaign(params: {
  content: Content;
  parameters?: Partial<EngagementParameters>;
  autoStart?: boolean;
}) {
  try {
    const { content, parameters, autoStart = false } = params;
    
    const campaign = await orchestrator.createCampaign(content, parameters);
    
    if (autoStart) {
      await orchestrator.startCampaign(campaign.id);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        campaignId: campaign.id,
        status: campaign.status,
        targetMetrics: campaign.targetMetrics,
        analytics: campaign.analytics
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 400 }
    );
  }
}

/**
 * Control campaign operations
 */
async function controlCampaign(params: CampaignControl) {
  try {
    await adminService.executeCampaignControl(params);
    
    return NextResponse.json({
      success: true,
      message: `Campaign ${params.action} executed successfully`
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 400 }
    );
  }
}

/**
 * Control bot operations
 */
async function controlBots(params: BotControl) {
  try {
    await adminService.executeBotControl(params);
    
    return NextResponse.json({
      success: true,
      message: `Bot ${params.action} executed on ${params.botIds.length} bots`
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 400 }
    );
  }
}

/**
 * Control system operations
 */
async function controlSystem(params: SystemControl) {
  try {
    await adminService.executeSystemControl(params);
    
    return NextResponse.json({
      success: true,
      message: `System ${params.action} executed successfully`
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 400 }
    );
  }
}

/**
 * Create new bot persona
 */
async function createBot(params: any) {
  try {
    const bot = await botService.createBot(params);
    
    return NextResponse.json({
      success: true,
      data: {
        botId: bot.id,
        name: bot.name,
        engagementStyle: bot.engagementStyle,
        interests: bot.interests
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 400 }
    );
  }
}

/**
 * Get system status
 */
async function getSystemStatus() {
  try {
    const systemStatus = adminService.getSystemStatus();
    const healthMetrics = adminService.getSystemHealthMetrics();
    
    return NextResponse.json({
      success: true,
      data: {
        systemStatus,
        healthMetrics
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Get campaign information
 */
async function getCampaigns() {
  try {
    const allCampaigns = orchestrator.getAllCampaigns();
    const activeCampaigns = orchestrator.getActiveCampaigns();
    
    return NextResponse.json({
      success: true,
      data: {
        totalCampaigns: allCampaigns.length,
        activeCampaigns: activeCampaigns.length,
        campaigns: allCampaigns.map(campaign => ({
          id: campaign.id,
          contentId: campaign.contentId,
          status: campaign.status,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          targetMetrics: campaign.targetMetrics,
          analytics: campaign.analytics
        }))
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Get analytics data
 */
async function getAnalytics(searchParams: URLSearchParams) {
  try {
    const contentId = searchParams.get('contentId');
    const campaignId = searchParams.get('campaignId');
    const botId = searchParams.get('botId');
    
    let data: any = {};
    
    if (contentId) {
      data.contentPerformance = analyticsService.getContentPerformance(contentId);
      data.realTimeMetrics = analyticsService.getRealTimeMetrics(contentId);
      data.engagementTrends = analyticsService.getEngagementTrends(contentId);
      data.authenticityAnalysis = analyticsService.analyzeEngagementAuthenticity(contentId);
    }
    
    if (campaignId) {
      data.campaignAnalytics = analyticsService.getCampaignAnalytics(campaignId);
    }
    
    if (botId) {
      data.botActivity = analyticsService.getBotActivityReport?.(botId);
    }
    
    if (!contentId && !campaignId && !botId) {
      // Return overview analytics
      data.topPerformingContent = analyticsService.getTopPerformingContent();
      data.botLeaderboard = analyticsService.getBotLeaderboard();
      data.anomalies = analyticsService.getAnomalies();
    }
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Get bot information
 */
async function getBots() {
  try {
    const activeBots = await botService.getActiveBots();
    const botStats = botService.getBotStatistics();
    
    return NextResponse.json({
      success: true,
      data: {
        statistics: botStats,
        bots: activeBots.map(bot => ({
          id: bot.id,
          name: bot.name,
          engagementStyle: bot.engagementStyle,
          interests: bot.interests,
          demographics: bot.demographics,
          behaviorPatterns: bot.behaviorPatterns,
          isActive: bot.isActive
        }))
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Get system alerts
 */
async function getAlerts() {
  try {
    const alerts = adminService.getAlerts();
    
    return NextResponse.json({
      success: true,
      data: {
        total: alerts.length,
        critical: alerts.filter(a => a.type === 'critical').length,
        error: alerts.filter(a => a.type === 'error').length,
        warning: alerts.filter(a => a.type === 'warning').length,
        alerts: alerts.slice(0, 50) // Return latest 50 alerts
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}