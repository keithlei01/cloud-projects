export interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
}

export interface UsageRecord {
  timestamp: number;
  endpoint: string;
  accountType: string;
}

export interface RateLimitStatus {
  endpoint: string;
  accountType: string;
  remainingRequests: {
    perSecond: number;
    perMinute: number;
    perHour: number;
  };
  nextResetTime: {
    perSecond: number;
    perMinute: number;
    perHour: number;
  };
  warnings: string[];
}

export class RateLimitCalculator {
  private endpointConfigs: Map<string, RateLimitConfig> = new Map();
  private usageHistory: UsageRecord[] = [];

  /**
   * Adds rate limit configuration for an endpoint
   */
  addEndpoint(endpoint: string, config: RateLimitConfig): void {
    this.endpointConfigs.set(endpoint, config);
  }

  /**
   * Records an API request
   */
  recordRequest(endpoint: string, accountType: string): void {
    const record: UsageRecord = {
      timestamp: Date.now(),
      endpoint,
      accountType
    };
    this.usageHistory.push(record);
  }

  /**
   * Gets current rate limit status for an endpoint and account type
   */
  getStatus(endpoint: string, accountType: string): RateLimitStatus {
    const config = this.endpointConfigs.get(endpoint);
    if (!config) {
      throw new Error(`No rate limit configuration found for endpoint: ${endpoint}`);
    }

    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    // Filter usage history for this endpoint and account type
    const relevantUsage = this.usageHistory.filter(
      record => record.endpoint === endpoint && record.accountType === accountType
    );

    // Count requests in each time window
    const requestsPerSecond = relevantUsage.filter(
      record => record.timestamp >= oneSecondAgo
    ).length;

    const requestsPerMinute = relevantUsage.filter(
      record => record.timestamp >= oneMinuteAgo
    ).length;

    const requestsPerHour = relevantUsage.filter(
      record => record.timestamp >= oneHourAgo
    ).length;

    // Calculate remaining requests
    const remainingRequests = {
      perSecond: Math.max(0, config.requestsPerSecond - requestsPerSecond),
      perMinute: Math.max(0, config.requestsPerMinute - requestsPerMinute),
      perHour: Math.max(0, config.requestsPerHour - requestsPerHour)
    };

    // Calculate next reset times
    const nextResetTime = {
      perSecond: this.getNextResetTime(relevantUsage, oneSecondAgo, 1000),
      perMinute: this.getNextResetTime(relevantUsage, oneMinuteAgo, 60000),
      perHour: this.getNextResetTime(relevantUsage, oneHourAgo, 3600000)
    };

    // Generate warnings
    const warnings = this.generateWarnings(remainingRequests, config);

    return {
      endpoint,
      accountType,
      remainingRequests,
      nextResetTime,
      warnings
    };
  }

  /**
   * Calculates the next reset time for a time window
   */
  private getNextResetTime(
    usage: UsageRecord[],
    windowStart: number,
    windowSize: number
  ): number {
    const oldestRequestInWindow = usage
      .filter(record => record.timestamp >= windowStart)
      .sort((a, b) => a.timestamp - b.timestamp)[0];

    if (!oldestRequestInWindow) {
      return Date.now() + windowSize;
    }

    return oldestRequestInWindow.timestamp + windowSize;
  }

  /**
   * Generates warnings based on remaining requests
   */
  private generateWarnings(
    remaining: { perSecond: number; perMinute: number; perHour: number },
    config: RateLimitConfig
  ): string[] {
    const warnings: string[] = [];

    if (remaining.perSecond <= config.requestsPerSecond * 0.1) {
      warnings.push('Approaching per-second rate limit');
    }

    if (remaining.perMinute <= config.requestsPerMinute * 0.1) {
      warnings.push('Approaching per-minute rate limit');
    }

    if (remaining.perHour <= config.requestsPerHour * 0.1) {
      warnings.push('Approaching per-hour rate limit');
    }

    if (remaining.perSecond === 0) {
      warnings.push('Per-second rate limit exceeded');
    }

    if (remaining.perMinute === 0) {
      warnings.push('Per-minute rate limit exceeded');
    }

    if (remaining.perHour === 0) {
      warnings.push('Per-hour rate limit exceeded');
    }

    return warnings;
  }

  /**
   * Gets optimal delay before next request
   */
  getOptimalDelay(endpoint: string, accountType: string): number {
    const status = this.getStatus(endpoint, accountType);
    const now = Date.now();

    // If we have remaining requests, no delay needed
    if (status.remainingRequests.perSecond > 0) {
      return 0;
    }

    // Calculate delay until next second window resets
    const delayUntilReset = status.nextResetTime.perSecond - now;
    return Math.max(0, delayUntilReset);
  }

  /**
   * Cleans up old usage records (older than 1 hour)
   */
  cleanupOldRecords(): void {
    const oneHourAgo = Date.now() - 3600000;
    this.usageHistory = this.usageHistory.filter(
      record => record.timestamp >= oneHourAgo
    );
  }

  /**
   * Gets usage statistics for an endpoint
   */
  getUsageStats(endpoint: string, accountType: string): {
    totalRequests: number;
    averagePerSecond: number;
    averagePerMinute: number;
    averagePerHour: number;
  } {
    const relevantUsage = this.usageHistory.filter(
      record => record.endpoint === endpoint && record.accountType === accountType
    );

    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    const requestsInLastMinute = relevantUsage.filter(
      record => record.timestamp >= oneMinuteAgo
    ).length;

    const requestsInLastHour = relevantUsage.filter(
      record => record.timestamp >= oneHourAgo
    ).length;

    return {
      totalRequests: relevantUsage.length,
      averagePerSecond: requestsInLastMinute / 60,
      averagePerMinute: requestsInLastMinute,
      averagePerHour: requestsInLastHour
    };
  }
}
