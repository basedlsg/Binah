import { NextRequest, NextResponse } from 'next/server';
import { integrationService } from '@/services/IntegrationService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'health':
        const health = await integrationService.getSystemHealth();
        return NextResponse.json({ success: true, data: health });

      case 'analytics':
        const analytics = await integrationService.getRealTimeAnalytics();
        return NextResponse.json({ success: true, data: analytics });

      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            service: 'Integration Service',
            status: 'operational',
            timestamp: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Integration API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'initialize':
        await integrationService.initialize();
        return NextResponse.json({ success: true, message: 'Integration service initialized' });

      case 'create-campaign':
        if (!data.content) {
          return NextResponse.json(
            { success: false, error: 'Content data is required' },
            { status: 400 }
          );
        }
        const campaign = await integrationService.createContentCampaign(data.content, data.options);
        return NextResponse.json({ success: true, data: campaign });

      case 'create-bots':
        const count = data.count || 25;
        const bots = await integrationService.createBotBatch(count);
        return NextResponse.json({ success: true, data: bots });

      case 'generate-comment':
        if (!data.botId || !data.content) {
          return NextResponse.json(
            { success: false, error: 'Bot ID and content are required' },
            { status: 400 }
          );
        }
        const comment = await integrationService.generateBotComment(
          data.botId, 
          data.content, 
          data.context
        );
        return NextResponse.json({ success: true, data: { comment } });

      case 'emergency-stop':
        const reason = data.reason || 'Manual emergency stop';
        await integrationService.emergencyStop(reason);
        return NextResponse.json({ success: true, message: 'Emergency stop executed' });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Integration API POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'shutdown':
        await integrationService.shutdown();
        return NextResponse.json({ success: true, message: 'Integration service shutdown' });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Integration API DELETE error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}