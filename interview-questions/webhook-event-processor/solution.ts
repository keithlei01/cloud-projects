export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
  livemode: boolean;
  pending_webhooks?: number;
  request?: {
    id: string;
    idempotency_key?: string;
  };
}

export interface ProcessingResult {
  success: boolean;
  processed: boolean;
  error?: string;
  eventId: string;
  processingTime: number;
}

export interface EventFilter {
  types?: string[];
  livemode?: boolean;
  minCreated?: number;
  maxCreated?: number;
}

export interface ProcessingMetrics {
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
  eventsByType: Record<string, number>;
  failuresByType: Record<string, number>;
}

export class WebhookEventProcessor {
  private processedEvents: Set<string> = new Set();
  private eventHistory: Map<string, { timestamp: number; success: boolean }> = new Map();
  private processingTimes: number[] = [];
  private failureCounts: Map<string, number> = new Map();
  private successCounts: Map<string, number> = new Map();

  /**
   * Processes a webhook event
   */
  async processEvent(event: WebhookEvent): Promise<ProcessingResult> {
    const startTime = Date.now();
    const eventId = event.id;

    try {
      // Check for duplicate events
      if (this.processedEvents.has(eventId)) {
        return {
          success: true,
          processed: false,
          eventId,
          processingTime: Date.now() - startTime
        };
      }

      // Validate event
      const validationResult = this.validateEvent(event);
      if (!validationResult.valid) {
        throw new Error(validationResult.error);
      }

      // Process the event based on type
      const processResult = await this.processEventByType(event);
      
      // Mark as processed
      this.processedEvents.add(eventId);
      this.eventHistory.set(eventId, {
        timestamp: Date.now(),
        success: processResult.success
      });

      // Update metrics
      this.updateMetrics(event.type, processResult.success, Date.now() - startTime);

      return {
        success: processResult.success,
        processed: true,
        eventId,
        processingTime: Date.now() - startTime,
        ...(processResult.success ? {} : { error: processResult.error })
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(event.type, false, processingTime);

      return {
        success: false,
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        eventId,
        processingTime
      };
    }
  }

  /**
   * Validates a webhook event
   */
  private validateEvent(event: WebhookEvent): { valid: boolean; error?: string } {
    if (!event.id) {
      return { valid: false, error: 'Event ID is required' };
    }

    if (!event.type) {
      return { valid: false, error: 'Event type is required' };
    }

    if (!event.data || !event.data.object) {
      return { valid: false, error: 'Event data is required' };
    }

    if (!event.created || event.created <= 0) {
      return { valid: false, error: 'Event created timestamp is required' };
    }

    return { valid: true };
  }

  /**
   * Processes event based on its type
   */
  private async processEventByType(event: WebhookEvent): Promise<{ success: boolean; error?: string }> {
    switch (event.type) {
      case 'payment.succeeded':
        return this.handlePaymentSucceeded(event);
      
      case 'payment.failed':
        return this.handlePaymentFailed(event);
      
      case 'payment.canceled':
        return this.handlePaymentCanceled(event);
      
      case 'charge.dispute.created':
        return this.handleDisputeCreated(event);
      
      case 'customer.created':
        return this.handleCustomerCreated(event);
      
      case 'customer.updated':
        return this.handleCustomerUpdated(event);
      
      default:
        return this.handleGenericEvent(event);
    }
  }

  /**
   * Handles payment succeeded events
   */
  private async handlePaymentSucceeded(event: WebhookEvent): Promise<{ success: boolean; error?: string }> {
    try {
      const payment = event.data.object;
      console.log(`Payment succeeded: ${payment.id}, amount: ${payment.amount}`);
      
      // Simulate processing time
      await this.simulateProcessing(100);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to process payment succeeded event' };
    }
  }

  /**
   * Handles payment failed events
   */
  private async handlePaymentFailed(event: WebhookEvent): Promise<{ success: boolean; error?: string }> {
    try {
      const payment = event.data.object;
      console.log(`Payment failed: ${payment.id}, reason: ${payment.failure_reason}`);
      
      await this.simulateProcessing(50);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to process payment failed event' };
    }
  }

  /**
   * Handles payment canceled events
   */
  private async handlePaymentCanceled(event: WebhookEvent): Promise<{ success: boolean; error?: string }> {
    try {
      const payment = event.data.object;
      console.log(`Payment canceled: ${payment.id}`);
      
      await this.simulateProcessing(30);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to process payment canceled event' };
    }
  }

  /**
   * Handles dispute created events
   */
  private async handleDisputeCreated(event: WebhookEvent): Promise<{ success: boolean; error?: string }> {
    try {
      const dispute = event.data.object;
      console.log(`Dispute created: ${dispute.id}, amount: ${dispute.amount}`);
      
      await this.simulateProcessing(200);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to process dispute created event' };
    }
  }

  /**
   * Handles customer created events
   */
  private async handleCustomerCreated(event: WebhookEvent): Promise<{ success: boolean; error?: string }> {
    try {
      const customer = event.data.object;
      console.log(`Customer created: ${customer.id}, email: ${customer.email}`);
      
      await this.simulateProcessing(80);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to process customer created event' };
    }
  }

  /**
   * Handles customer updated events
   */
  private async handleCustomerUpdated(event: WebhookEvent): Promise<{ success: boolean; error?: string }> {
    try {
      const customer = event.data.object;
      console.log(`Customer updated: ${customer.id}`);
      
      await this.simulateProcessing(60);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to process customer updated event' };
    }
  }

  /**
   * Handles generic events
   */
  private async handleGenericEvent(event: WebhookEvent): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Processing generic event: ${event.type}`);
      
      await this.simulateProcessing(40);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to process generic event' };
    }
  }

  /**
   * Simulates processing time
   */
  private async simulateProcessing(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Updates processing metrics
   */
  private updateMetrics(eventType: string, success: boolean, processingTime: number): void {
    this.processingTimes.push(processingTime);
    
    if (success) {
      const count = this.successCounts.get(eventType) || 0;
      this.successCounts.set(eventType, count + 1);
    } else {
      const count = this.failureCounts.get(eventType) || 0;
      this.failureCounts.set(eventType, count + 1);
    }
  }

  /**
   * Gets processing metrics
   */
  getMetrics(): ProcessingMetrics {
    const totalProcessed = this.processedEvents.size;
    const totalFailed = Array.from(this.failureCounts.values()).reduce((sum, count) => sum + count, 0);
    const averageProcessingTime = this.processingTimes.length > 0 
      ? this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length 
      : 0;

    const eventsByType: Record<string, number> = {};
    for (const [type, count] of this.successCounts.entries()) {
      eventsByType[type] = count;
    }

    const failuresByType: Record<string, number> = {};
    for (const [type, count] of this.failureCounts.entries()) {
      failuresByType[type] = count;
    }

    return {
      totalProcessed,
      totalFailed,
      averageProcessingTime,
      eventsByType,
      failuresByType
    };
  }

  /**
   * Checks if an event has been processed
   */
  isEventProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  /**
   * Gets event processing history
   */
  getEventHistory(eventId: string): { timestamp: number; success: boolean } | null {
    return this.eventHistory.get(eventId) || null;
  }

  /**
   * Gets all processed event IDs
   */
  getProcessedEventIds(): string[] {
    return Array.from(this.processedEvents);
  }

  /**
   * Filters events by criteria
   */
  filterEvents(_filter: EventFilter): string[] {
    const processedIds = this.getProcessedEventIds();
    
    return processedIds.filter(eventId => {
      const history = this.eventHistory.get(eventId);
      if (!history) return false;

      // Apply filters here based on stored event data
      // For simplicity, we'll just return all processed events
      return true;
    });
  }

  /**
   * Cleans up old processed events
   */
  cleanupOldEvents(olderThanMs: number): number {
    const cutoffTime = Date.now() - olderThanMs;
    let removedCount = 0;

    for (const [eventId, history] of this.eventHistory.entries()) {
      if (history.timestamp < cutoffTime) {
        this.processedEvents.delete(eventId);
        this.eventHistory.delete(eventId);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Resets all processing state (for testing)
   */
  reset(): void {
    this.processedEvents.clear();
    this.eventHistory.clear();
    this.processingTimes = [];
    this.failureCounts.clear();
    this.successCounts.clear();
  }
}
