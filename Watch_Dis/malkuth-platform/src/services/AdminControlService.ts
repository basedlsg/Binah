import {
  AdminControl,
  EngagementCampaign,
  EngagementParameters,
  CampaignStatus,
  EngagementPhase
} from '../types';
import { EngagementOrchestrator } from './EngagementOrchestrator';
import { EngagementAnalyticsService } from './EngagementAnalyticsService';
import { BackgroundJobService } from './BackgroundJobService';
import { EngagementQueueService } from './EngagementQueueService';
import { BotPersonaService } from './BotPersonaService';

export interface SystemStatus {
  overallStatus: 'healthy' | 'warning' | 'critical' | 'emergency';
  activeCampaigns: number;
  totalBots: number;
  queueSize: number;
  runningJobs: number;
  averageAuthenticityScore: number;
  systemLoad: number;
  alerts: Alert[];
  lastUpdate: Date;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  campaignId?: string;
  botId?: string;
  createdAt: Date;
  acknowledged: boolean;
  autoResolve: boolean;
}

export interface CampaignControl {
  campaignId: string;
  action: 'start' | 'pause' | 'resume' | 'stop' | 'emergency-stop';
  parameters?: Partial<EngagementParameters>;
  reason?: string;
  scheduledFor?: Date;
  executedBy: string;
}

export interface BotControl {
  botIds: string[];
  action: 'activate' | 'deactivate' | 'update' | 'delete';
  parameters?: any;
  reason?: string;
  executedBy: string;
}

export interface SystemControl {
  action: 'pause-all' | 'resume-all' | 'emergency-stop' | 'maintenance-mode';
  duration?: number; // minutes
  reason: string;
  executedBy: string;
}

export interface EngagementOverride {
  campaignId: string;
  type: 'velocity' | 'authenticity' | 'timing' | 'bot-selection';
  parameters: Record<string, any>;
  duration: number; // minutes
  reason: string;
  executedBy: string;
}

export class AdminControlService {
  private orchestrator: EngagementOrchestrator;
  private analyticsService: EngagementAnalyticsService;
  private backgroundJobService: BackgroundJobService;
  private queueService: EngagementQueueService;
  private botPersonaService: BotPersonaService;

  private systemStatus: SystemStatus;
  private alerts: Map<string, Alert> = new Map();
  private controlHistory: AdminControl[] = [];
  private emergencyMode: boolean = false;
  private maintenanceMode: boolean = false;

  private readonly maxHistorySize = 1000;
  private readonly alertRetentionHours = 72;
  private statusUpdateInterval: NodeJS.Timeout;

  constructor() {
    this.orchestrator = EngagementOrchestrator.getInstance();
    this.analyticsService = new EngagementAnalyticsService();
    this.backgroundJobService = new BackgroundJobService();
    this.queueService = new EngagementQueueService();
    this.botPersonaService = new BotPersonaService();

    this.systemStatus = this.initializeSystemStatus();
    this.startStatusMonitoring();
  }

  /**
   * Get current system status
   */
  public getSystemStatus(): SystemStatus {
    return { ...this.systemStatus };
  }

  /**
   * Get all active alerts
   */
  public getAlerts(type?: Alert['type']): Alert[] {
    let alerts = Array.from(this.alerts.values());
    
    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }
    
    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Execute campaign control action
   */
  public async executeCampaignControl(control: CampaignControl): Promise<void> {
    if (this.emergencyMode && control.action !== 'emergency-stop') {
      throw new Error('System is in emergency mode. Only emergency-stop actions allowed.');
    }

    const adminControl: AdminControl = {
      campaignId: control.campaignId,
      action: control.action,
      parameters: control.parameters,
      reason: control.reason,
      executedBy: control.executedBy,
      executedAt: new Date()
    };

    try {
      await this.orchestrator.executeAdminControl(adminControl);
      this.addToControlHistory(adminControl);
      
      this.createAlert({
        type: 'info',
        title: 'Campaign Control Executed',
        message: `Action "${control.action}" executed on campaign ${control.campaignId}`,
        campaignId: control.campaignId,
        autoResolve: true
      });

      console.log(`Campaign control executed: ${control.action} on ${control.campaignId} by ${control.executedBy}`);
    } catch (error) {
      this.createAlert({
        type: 'error',
        title: 'Campaign Control Failed',
        message: `Failed to execute "${control.action}" on campaign ${control.campaignId}: ${error.message}`,
        campaignId: control.campaignId,
        autoResolve: false
      });
      
      throw error;
    }
  }

  /**
   * Execute bot control action
   */
  public async executeBotControl(control: BotControl): Promise<void> {
    if (this.emergencyMode) {
      throw new Error('System is in emergency mode. Bot controls are disabled.');
    }

    try {
      for (const botId of control.botIds) {
        switch (control.action) {
          case 'activate':
            await this.botPersonaService.activateBot(botId);
            break;
          case 'deactivate':
            await this.botPersonaService.deactivateBot(botId);
            break;
          case 'update':
            await this.botPersonaService.updateBot(botId, control.parameters);
            break;
          case 'delete':
            await this.botPersonaService.deleteBot(botId);
            break;
        }
      }

      this.createAlert({
        type: 'info',
        title: 'Bot Control Executed',
        message: `Action "${control.action}" executed on ${control.botIds.length} bots`,
        autoResolve: true
      });

      console.log(`Bot control executed: ${control.action} on ${control.botIds.length} bots by ${control.executedBy}`);
    } catch (error) {
      this.createAlert({
        type: 'error',
        title: 'Bot Control Failed',
        message: `Failed to execute "${control.action}" on bots: ${error.message}`,
        autoResolve: false
      });
      
      throw error;
    }
  }

  /**
   * Execute system-wide control action
   */
  public async executeSystemControl(control: SystemControl): Promise<void> {
    try {
      switch (control.action) {
        case 'pause-all':
          await this.pauseAllCampaigns();
          this.backgroundJobService.pauseAllJobs();
          break;
          
        case 'resume-all':
          if (this.emergencyMode) {
            throw new Error('Cannot resume from emergency mode. Use emergency-stop first.');
          }
          await this.resumeAllCampaigns();
          this.backgroundJobService.resumeAllJobs();
          break;
          
        case 'emergency-stop':
          await this.activateEmergencyMode(control.reason);
          break;
          
        case 'maintenance-mode':
          await this.activateMaintenanceMode(control.duration || 60, control.reason);
          break;
      }

      this.createAlert({
        type: control.action === 'emergency-stop' ? 'critical' : 'warning',
        title: 'System Control Executed',
        message: `System action "${control.action}" executed: ${control.reason}`,
        autoResolve: control.action !== 'emergency-stop'
      });

      console.log(`System control executed: ${control.action} by ${control.executedBy} - ${control.reason}`);
    } catch (error) {
      this.createAlert({
        type: 'error',
        title: 'System Control Failed',
        message: `Failed to execute "${control.action}": ${error.message}`,
        autoResolve: false
      });
      
      throw error;
    }
  }

  /**
   * Apply engagement override
   */
  public async applyEngagementOverride(override: EngagementOverride): Promise<void> {
    if (this.emergencyMode) {
      throw new Error('System is in emergency mode. Overrides are disabled.');
    }

    try {
      const campaign = this.orchestrator.getAllCampaigns().find(c => c.id === override.campaignId);
      if (!campaign) {
        throw new Error(`Campaign ${override.campaignId} not found`);
      }

      // Apply override based on type
      await this.applyOverrideByType(campaign, override);

      // Schedule override expiration
      setTimeout(() => {
        this.expireEngagementOverride(override);
      }, override.duration * 60000);

      this.createAlert({
        type: 'warning',
        title: 'Engagement Override Applied',
        message: `Override "${override.type}" applied to campaign ${override.campaignId} for ${override.duration} minutes`,
        campaignId: override.campaignId,
        autoResolve: true
      });

      console.log(`Engagement override applied: ${override.type} on ${override.campaignId} by ${override.executedBy}`);
    } catch (error) {
      this.createAlert({
        type: 'error',
        title: 'Override Failed',
        message: `Failed to apply override "${override.type}": ${error.message}`,
        campaignId: override.campaignId,
        autoResolve: false
      });
      
      throw error;
    }
  }

  /**
   * Acknowledge alert
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;
    
    alert.acknowledged = true;
    console.log(`Alert ${alertId} acknowledged by ${acknowledgedBy}`);
    
    return true;
  }

  /**
   * Resolve alert
   */
  public resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;
    
    this.alerts.delete(alertId);
    console.log(`Alert ${alertId} resolved by ${resolvedBy}`);
    
    return true;
  }

  /**
   * Get control history
   */
  public getControlHistory(limit: number = 100): AdminControl[] {
    return this.controlHistory.slice(-limit);
  }

  /**
   * Get system health metrics
   */
  public getSystemHealthMetrics(): {
    cpu: number;
    memory: number;
    activeConnections: number;
    errorRate: number;
    responseTime: number;
    throughput: number;
  } {
    // Mock metrics - would integrate with actual system monitoring
    return {
      cpu: 45 + Math.random() * 20,
      memory: 60 + Math.random() * 20,
      activeConnections: 150 + Math.floor(Math.random() * 50),
      errorRate: Math.random() * 2,
      responseTime: 200 + Math.random() * 100,
      throughput: 500 + Math.random() * 200
    };
  }

  /**
   * Export system report
   */
  public exportSystemReport(): {
    timestamp: Date;
    systemStatus: SystemStatus;
    alerts: Alert[];
    controlHistory: AdminControl[];
    campaignSummary: any[];
    botSummary: any;
    queueStats: any;
    jobStats: any;
  } {
    return {
      timestamp: new Date(),
      systemStatus: this.systemStatus,
      alerts: this.getAlerts(),
      controlHistory: this.getControlHistory(50),
      campaignSummary: this.getCampaignSummary(),
      botSummary: this.botPersonaService.getBotStatistics(),
      queueStats: this.queueService.getQueueStats(),
      jobStats: this.backgroundJobService.getJobStatistics()
    };
  }

  /**
   * Initialize system status
   */
  private initializeSystemStatus(): SystemStatus {
    return {
      overallStatus: 'healthy',
      activeCampaigns: 0,
      totalBots: 0,
      queueSize: 0,
      runningJobs: 0,
      averageAuthenticityScore: 0,
      systemLoad: 0,
      alerts: [],
      lastUpdate: new Date()
    };
  }

  /**
   * Start status monitoring
   */
  private startStatusMonitoring(): void {
    this.statusUpdateInterval = setInterval(() => {
      this.updateSystemStatus();
      this.checkSystemHealth();
      this.cleanupOldAlerts();
    }, 30000); // Update every 30 seconds
  }

  /**
   * Update system status
   */
  private updateSystemStatus(): void {
    const activeCampaigns = this.orchestrator.getActiveCampaigns();
    const queueStats = this.queueService.getQueueStats();
    const jobStats = this.backgroundJobService.getJobStatistics();
    
    this.systemStatus = {
      overallStatus: this.calculateOverallStatus(),
      activeCampaigns: activeCampaigns.length,
      totalBots: this.botPersonaService.getBotStatistics().totalBots,
      queueSize: queueStats.pendingItems,
      runningJobs: jobStats.runningJobs,
      averageAuthenticityScore: this.calculateAverageAuthenticityScore(activeCampaigns),
      systemLoad: this.calculateSystemLoad(),
      alerts: this.getAlerts().slice(0, 10), // Include top 10 alerts
      lastUpdate: new Date()
    };
  }

  /**
   * Check system health and create alerts
   */
  private checkSystemHealth(): void {
    const activeCampaigns = this.orchestrator.getActiveCampaigns();
    const queueStats = this.queueService.getQueueStats();
    
    // Check for high queue size
    if (queueStats.pendingItems > 1000) {
      this.createAlert({
        type: 'warning',
        title: 'High Queue Size',
        message: `Queue has ${queueStats.pendingItems} pending items`,
        autoResolve: true
      });
    }
    
    // Check for low authenticity scores
    for (const campaign of activeCampaigns) {
      if (campaign.analytics.averageAuthenticityScore < 0.5) {
        this.createAlert({
          type: 'warning',
          title: 'Low Authenticity Score',
          message: `Campaign ${campaign.id} has authenticity score below 50%`,
          campaignId: campaign.id,
          autoResolve: false
        });
      }
    }
    
    // Check for failed jobs
    const jobStats = this.backgroundJobService.getJobStatistics();
    if (jobStats.failedJobs > 10) {
      this.createAlert({
        type: 'error',
        title: 'Multiple Job Failures',
        message: `${jobStats.failedJobs} background jobs have failed`,
        autoResolve: false
      });
    }
  }

  /**
   * Calculate overall system status
   */
  private calculateOverallStatus(): SystemStatus['overallStatus'] {
    if (this.emergencyMode) return 'emergency';
    if (this.maintenanceMode) return 'warning';
    
    const criticalAlerts = this.getAlerts('critical').length;
    const errorAlerts = this.getAlerts('error').length;
    const warningAlerts = this.getAlerts('warning').length;
    
    if (criticalAlerts > 0) return 'critical';
    if (errorAlerts > 3) return 'critical';
    if (errorAlerts > 0 || warningAlerts > 5) return 'warning';
    
    return 'healthy';
  }

  /**
   * Calculate average authenticity score across campaigns
   */
  private calculateAverageAuthenticityScore(campaigns: EngagementCampaign[]): number {
    if (campaigns.length === 0) return 0;
    
    const totalScore = campaigns.reduce((sum, campaign) => 
      sum + campaign.analytics.averageAuthenticityScore, 0
    );
    
    return totalScore / campaigns.length;
  }

  /**
   * Calculate system load metric
   */
  private calculateSystemLoad(): number {
    const queueStats = this.queueService.getQueueStats();
    const jobStats = this.backgroundJobService.getJobStatistics();
    
    // Simple load calculation based on queue size and running jobs
    const queueLoad = Math.min(1, queueStats.pendingItems / 1000);
    const jobLoad = Math.min(1, jobStats.runningJobs / 10);
    
    return (queueLoad + jobLoad) / 2;
  }

  /**
   * Create new alert
   */
  private createAlert(alertData: Omit<Alert, 'id' | 'createdAt' | 'acknowledged'>): void {
    const alert: Alert = {
      id: this.generateAlertId(),
      createdAt: new Date(),
      acknowledged: false,
      ...alertData
    };
    
    this.alerts.set(alert.id, alert);
    
    if (alert.type === 'critical') {
      console.error(`CRITICAL ALERT: ${alert.title} - ${alert.message}`);
    } else if (alert.type === 'error') {
      console.error(`ERROR ALERT: ${alert.title} - ${alert.message}`);
    } else if (alert.type === 'warning') {
      console.warn(`WARNING ALERT: ${alert.title} - ${alert.message}`);
    }
  }

  /**
   * Pause all active campaigns
   */
  private async pauseAllCampaigns(): Promise<void> {
    const activeCampaigns = this.orchestrator.getActiveCampaigns();
    
    for (const campaign of activeCampaigns) {
      await this.orchestrator.pauseCampaign(campaign.id);
    }
    
    console.log(`Paused ${activeCampaigns.length} campaigns`);
  }

  /**
   * Resume all paused campaigns
   */
  private async resumeAllCampaigns(): Promise<void> {
    const allCampaigns = this.orchestrator.getAllCampaigns();
    const pausedCampaigns = allCampaigns.filter(c => c.status === 'paused');
    
    for (const campaign of pausedCampaigns) {
      await this.orchestrator.resumeCampaign(campaign.id);
    }
    
    console.log(`Resumed ${pausedCampaigns.length} campaigns`);
  }

  /**
   * Activate emergency mode
   */
  private async activateEmergencyMode(reason: string): Promise<void> {
    this.emergencyMode = true;
    
    // Stop all campaigns
    await this.orchestrator.emergencyStopAll();
    
    // Pause all background jobs
    this.backgroundJobService.pauseAllJobs();
    
    this.createAlert({
      type: 'critical',
      title: 'EMERGENCY MODE ACTIVATED',
      message: `Emergency stop executed: ${reason}`,
      autoResolve: false
    });
    
    console.error(`EMERGENCY MODE ACTIVATED: ${reason}`);
  }

  /**
   * Activate maintenance mode
   */
  private async activateMaintenanceMode(durationMinutes: number, reason: string): Promise<void> {
    this.maintenanceMode = true;
    
    // Pause all campaigns
    await this.pauseAllCampaigns();
    
    // Schedule maintenance mode end
    setTimeout(() => {
      this.deactivateMaintenanceMode();
    }, durationMinutes * 60000);
    
    this.createAlert({
      type: 'warning',
      title: 'Maintenance Mode Active',
      message: `System in maintenance mode for ${durationMinutes} minutes: ${reason}`,
      autoResolve: true
    });
    
    console.log(`Maintenance mode activated for ${durationMinutes} minutes: ${reason}`);
  }

  /**
   * Deactivate maintenance mode
   */
  private deactivateMaintenanceMode(): void {
    this.maintenanceMode = false;
    
    this.createAlert({
      type: 'info',
      title: 'Maintenance Mode Ended',
      message: 'System maintenance completed. Normal operations resumed.',
      autoResolve: true
    });
    
    console.log('Maintenance mode deactivated');
  }

  /**
   * Apply override by type
   */
  private async applyOverrideByType(campaign: EngagementCampaign, override: EngagementOverride): Promise<void> {
    switch (override.type) {
      case 'velocity':
        // Override engagement velocity
        await this.applyVelocityOverride(campaign, override.parameters);
        break;
        
      case 'authenticity':
        // Override authenticity requirements
        await this.applyAuthenticityOverride(campaign, override.parameters);
        break;
        
      case 'timing':
        // Override timing patterns
        await this.applyTimingOverride(campaign, override.parameters);
        break;
        
      case 'bot-selection':
        // Override bot selection criteria
        await this.applyBotSelectionOverride(campaign, override.parameters);
        break;
    }
  }

  /**
   * Expire engagement override
   */
  private expireEngagementOverride(override: EngagementOverride): void {
    this.createAlert({
      type: 'info',
      title: 'Override Expired',
      message: `Engagement override "${override.type}" expired for campaign ${override.campaignId}`,
      campaignId: override.campaignId,
      autoResolve: true
    });
    
    console.log(`Override expired: ${override.type} for campaign ${override.campaignId}`);
  }

  /**
   * Add control action to history
   */
  private addToControlHistory(control: AdminControl): void {
    this.controlHistory.push(control);
    
    // Maintain history size limit
    if (this.controlHistory.length > this.maxHistorySize) {
      this.controlHistory = this.controlHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Clean up old alerts
   */
  private cleanupOldAlerts(): void {
    const cutoff = Date.now() - (this.alertRetentionHours * 3600000);
    
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.autoResolve && alert.createdAt.getTime() < cutoff) {
        this.alerts.delete(alertId);
      }
    }
  }

  /**
   * Get campaign summary
   */
  private getCampaignSummary(): any[] {
    return this.orchestrator.getAllCampaigns().map(campaign => ({
      id: campaign.id,
      status: campaign.status,
      authenticityScore: campaign.analytics.averageAuthenticityScore,
      totalEngagements: campaign.analytics.totalEngagements,
      successRate: campaign.analytics.successRate
    }));
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  // Placeholder override application methods
  private async applyVelocityOverride(campaign: EngagementCampaign, parameters: any): Promise<void> {
    // Implementation would modify campaign velocity parameters
    console.log(`Applying velocity override to campaign ${campaign.id}`);
  }

  private async applyAuthenticityOverride(campaign: EngagementCampaign, parameters: any): Promise<void> {
    // Implementation would modify authenticity requirements
    console.log(`Applying authenticity override to campaign ${campaign.id}`);
  }

  private async applyTimingOverride(campaign: EngagementCampaign, parameters: any): Promise<void> {
    // Implementation would modify timing patterns
    console.log(`Applying timing override to campaign ${campaign.id}`);
  }

  private async applyBotSelectionOverride(campaign: EngagementCampaign, parameters: any): Promise<void> {
    // Implementation would modify bot selection criteria
    console.log(`Applying bot selection override to campaign ${campaign.id}`);
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }
    
    this.backgroundJobService.destroy();
    this.queueService.destroy();
    
    console.log('Admin control service destroyed');
  }
}