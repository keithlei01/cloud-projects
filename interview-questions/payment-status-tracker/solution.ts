export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded'
  | 'partially_refunded';

export interface StatusChange {
  status: PaymentStatus;
  timestamp: number;
  reason?: string;
}

export interface Payment {
  id: string;
  status: PaymentStatus;
  history: StatusChange[];
  createdAt: number;
  updatedAt: number;
}

export interface StatusUpdateResult {
  success: boolean;
  error?: string;
  payment?: Payment;
}

export class PaymentStatusTracker {
  private payments: Map<string, Payment> = new Map();
  private validTransitions: Map<PaymentStatus, PaymentStatus[]> = new Map();

  constructor() {
    this.initializeValidTransitions();
  }

  /**
   * Initializes valid state transitions
   */
  private initializeValidTransitions(): void {
    this.validTransitions.set('pending', ['processing', 'canceled']);
    this.validTransitions.set('processing', ['succeeded', 'failed', 'canceled']);
    this.validTransitions.set('succeeded', ['refunded', 'partially_refunded']);
    this.validTransitions.set('failed', []);
    this.validTransitions.set('canceled', []);
    this.validTransitions.set('refunded', []);
    this.validTransitions.set('partially_refunded', ['refunded']);
  }

  /**
   * Creates a new payment with initial status
   */
  createPayment(id: string, initialStatus: PaymentStatus = 'pending'): Payment {
    const now = Date.now();
    const payment: Payment = {
      id,
      status: initialStatus,
      history: [{
        status: initialStatus,
        timestamp: now,
        reason: 'Payment created'
      }],
      createdAt: now,
      updatedAt: now
    };

    this.payments.set(id, payment);
    return payment;
  }

  /**
   * Updates payment status with validation
   */
  updateStatus(
    paymentId: string, 
    newStatus: PaymentStatus, 
    reason?: string
  ): StatusUpdateResult {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return {
        success: false,
        error: `Payment not found: ${paymentId}`
      };
    }

    // Check if transition is valid
    if (!this.isValidTransition(payment.status, newStatus)) {
      return {
        success: false,
        error: `Invalid state transition from ${payment.status} to ${newStatus}`
      };
    }

    // Update payment
    const now = Date.now();
    payment.status = newStatus;
    payment.updatedAt = now;
    
    payment.history.push({
      status: newStatus,
      timestamp: now,
      reason: reason || `Status changed to ${newStatus}`
    });

    return {
      success: true,
      payment: { ...payment }
    };
  }

  /**
   * Checks if a state transition is valid
   */
  private isValidTransition(currentStatus: PaymentStatus, newStatus: PaymentStatus): boolean {
    if (currentStatus === newStatus) {
      return false; // No self-transitions
    }

    const allowedTransitions = this.validTransitions.get(currentStatus);
    return allowedTransitions ? allowedTransitions.includes(newStatus) : false;
  }

  /**
   * Gets payment by ID
   */
  getPayment(paymentId: string): Payment | null {
    const payment = this.payments.get(paymentId);
    return payment ? { ...payment } : null;
  }

  /**
   * Gets all payments with a specific status
   */
  getPaymentsByStatus(status: PaymentStatus): Payment[] {
    return Array.from(this.payments.values())
      .filter(payment => payment.status === status)
      .map(payment => ({ ...payment }));
  }

  /**
   * Gets payment status history
   */
  getStatusHistory(paymentId: string): StatusChange[] {
    const payment = this.payments.get(paymentId);
    return payment ? [...payment.history] : [];
  }

  /**
   * Gets payments created within a time range
   */
  getPaymentsInTimeRange(startTime: number, endTime: number): Payment[] {
    return Array.from(this.payments.values())
      .filter(payment => payment.createdAt >= startTime && payment.createdAt <= endTime)
      .map(payment => ({ ...payment }));
  }

  /**
   * Gets payments that have been in a status for too long
   */
  getStuckPayments(status: PaymentStatus, maxDurationMs: number): Payment[] {
    const now = Date.now();
    return Array.from(this.payments.values())
      .filter(payment => {
        if (payment.status !== status) return false;
        
        const lastStatusChange = payment.history[payment.history.length - 1];
        if (!lastStatusChange) return false;
        return (now - lastStatusChange.timestamp) > maxDurationMs;
      })
      .map(payment => ({ ...payment }));
  }

  /**
   * Gets statistics about payment statuses
   */
  getStatusStatistics(): Record<PaymentStatus, number> {
    const stats: Record<PaymentStatus, number> = {
      pending: 0,
      processing: 0,
      succeeded: 0,
      failed: 0,
      canceled: 0,
      refunded: 0,
      partially_refunded: 0
    };

    for (const payment of this.payments.values()) {
      stats[payment.status]++;
    }

    return stats;
  }

  /**
   * Gets average processing time for completed payments
   */
  getAverageProcessingTime(): number {
    const completedPayments = Array.from(this.payments.values())
      .filter(payment => payment.status === 'succeeded' || payment.status === 'failed');

    if (completedPayments.length === 0) {
      return 0;
    }

    const totalTime = completedPayments.reduce((sum, payment) => {
      const processingStart = payment.history.find(h => h.status === 'processing');
      const processingEnd = payment.history.find(h => 
        h.status === 'succeeded' || h.status === 'failed'
      );

      if (processingStart && processingEnd) {
        return sum + (processingEnd.timestamp - processingStart.timestamp);
      }
      return sum;
    }, 0);

    return totalTime / completedPayments.length;
  }

  /**
   * Cancels a payment (if allowed)
   */
  cancelPayment(paymentId: string, reason?: string): StatusUpdateResult {
    return this.updateStatus(paymentId, 'canceled', reason);
  }

  /**
   * Refunds a payment (if allowed)
   */
  refundPayment(paymentId: string, reason?: string): StatusUpdateResult {
    return this.updateStatus(paymentId, 'refunded', reason);
  }

  /**
   * Gets all valid transitions for a status
   */
  getValidTransitions(status: PaymentStatus): PaymentStatus[] {
    return this.validTransitions.get(status) || [];
  }

  /**
   * Cleans up old payments (older than specified time)
   */
  cleanupOldPayments(olderThanMs: number): number {
    const cutoffTime = Date.now() - olderThanMs;
    let removedCount = 0;

    for (const [id, payment] of this.payments.entries()) {
      if (payment.createdAt < cutoffTime) {
        this.payments.delete(id);
        removedCount++;
      }
    }

    return removedCount;
  }
}
