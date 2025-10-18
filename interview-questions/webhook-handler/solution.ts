/**
 * Webhook Handler Solution
 * 
 * This solution implements a robust webhook handler system with:
 * 1. HTTP endpoint for receiving webhooks
 * 2. HMAC-SHA256 signature verification
 * 3. Event routing and processing
 * 4. Idempotency handling
 * 5. Database storage for audit trail
 * 6. Comprehensive error handling
 */

import * as crypto from 'crypto';
import * as express from 'express';
import { Database } from 'sqlite3';

export class WebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookError';
  }
}

export class InvalidSignatureError extends WebhookError {
  constructor(message: string = 'Invalid webhook signature') {
    super(message);
    this.name = 'InvalidSignatureError';
  }
}

export class ProcessingError extends WebhookError {
  constructor(message: string) {
    super(message);
    this.name = 'ProcessingError';
  }
}

export class DuplicateEventError extends WebhookError {
  constructor(message: string = 'Duplicate webhook event') {
    super(message);
    this.name = 'DuplicateEventError';
  }
}

export interface WebhookEvent {
  id: string;
  type: string;
  created: number;
  data: any;
  livemode: boolean;
  pending_webhooks: number;
  request_id?: string;
  idempotency_key?: string;
}

enum EventType {
  PAYMENT_SUCCEEDED = "payment.succeeded",
  PAYMENT_FAILED = "payment.failed",
  PAYMENT_REFUNDED = "payment.refunded",
  PAYMENT_DISPUTED = "payment.disputed",
  CUSTOMER_CREATED = "customer.created",
  CUSTOMER_UPDATED = "customer.updated",
  SUBSCRIPTION_CREATED = "subscription.created",
  SUBSCRIPTION_CANCELLED = "subscription.cancelled"
}

export class WebhookDatabase {
  private db: Database;

  constructor(dbPath: string = "webhooks.db") {
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  private initDatabase(): void {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS webhook_events (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          created INTEGER NOT NULL,
          data TEXT NOT NULL,
          livemode BOOLEAN NOT NULL,
          pending_webhooks INTEGER NOT NULL,
          request_id TEXT,
          idempotency_key TEXT,
          processed_at INTEGER,
          status TEXT DEFAULT 'pending',
          error_message TEXT,
          retry_count INTEGER DEFAULT 0,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);

      this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_webhook_events_type 
        ON webhook_events(type)
      `);

      this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_webhook_events_created 
        ON webhook_events(created)
      `);

      this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_webhook_events_idempotency 
        ON webhook_events(idempotency_key)
      `);
    });
  }

  storeEvent(event: WebhookEvent): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT OR IGNORE INTO webhook_events 
        (id, type, created, data, livemode, pending_webhooks, 
         request_id, idempotency_key, processed_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        event.id,
        event.type,
        event.created,
        JSON.stringify(event.data),
        event.livemode,
        event.pending_webhooks,
        event.request_id,
        event.idempotency_key,
        null,
        'pending'
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  getEvent(eventId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT * FROM webhook_events WHERE id = ?",
        [eventId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  updateEventStatus(
    eventId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE webhook_events 
        SET status = ?, error_message = ?, processed_at = ?
        WHERE id = ?
      `, [status, errorMessage, Math.floor(Date.now() / 1000), eventId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  incrementRetryCount(eventId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE webhook_events 
        SET retry_count = retry_count + 1
        WHERE id = ?
      `, [eventId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export class WebhookHandler {
  private webhookSecret: string;
  private db: WebhookDatabase;
  private eventHandlers: Map<string, (event: WebhookEvent) => void>;

  constructor(webhookSecret: string, db: WebhookDatabase) {
    this.webhookSecret = webhookSecret;
    this.db = db;
    this.eventHandlers = new Map();
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers(): void {
    this.eventHandlers.set(EventType.PAYMENT_SUCCEEDED, this.handlePaymentSucceeded.bind(this));
    this.eventHandlers.set(EventType.PAYMENT_FAILED, this.handlePaymentFailed.bind(this));
    this.eventHandlers.set(EventType.PAYMENT_REFUNDED, this.handlePaymentRefunded.bind(this));
    this.eventHandlers.set(EventType.PAYMENT_DISPUTED, this.handlePaymentDisputed.bind(this));
    this.eventHandlers.set(EventType.CUSTOMER_CREATED, this.handleCustomerCreated.bind(this));
    this.eventHandlers.set(EventType.CUSTOMER_UPDATED, this.handleCustomerUpdated.bind(this));
    this.eventHandlers.set(EventType.SUBSCRIPTION_CREATED, this.handleSubscriptionCreated.bind(this));
    this.eventHandlers.set(EventType.SUBSCRIPTION_CANCELLED, this.handleSubscriptionCancelled.bind(this));
  }

  registerHandler(eventType: string, handler: (event: WebhookEvent) => void): void {
    this.eventHandlers.set(eventType, handler);
  }

  verifySignature(payload: string, signatureHeader: string): boolean {
    try {
      // Parse signature header
      const elements = signatureHeader.split(',');
      let timestamp: string | undefined;
      let signature: string | undefined;

      for (const element of elements) {
        const [key, value] = element.split('=', 2);
        if (key === 't') {
          timestamp = value;
        } else if (key === 'v1') {
          signature = value;
        }
      }

      if (!timestamp || !signature) {
        return false;
      }

      // Check timestamp (prevent replay attacks)
      const currentTime = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTime - parseInt(timestamp)) > 300) { // 5 minutes tolerance
        console.warn(`Webhook timestamp too old: ${timestamp}`);
        return false;
      }

      // Compute expected signature
      const signedPayload = `${timestamp}.${payload}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(signedPayload)
        .digest('hex');

      // Compare signatures
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error(`Signature verification failed: ${error}`);
      return false;
    }
  }

  parseEvent(payload: string): WebhookEvent {
    try {
      const data = JSON.parse(payload);
      return {
        id: data.id,
        type: data.type,
        created: data.created,
        data: data.data,
        livemode: data.livemode,
        pending_webhooks: data.pending_webhooks,
        request_id: data.request?.id,
        idempotency_key: data.request?.idempotency_key
      };
    } catch (error) {
      throw new ProcessingError(`Failed to parse webhook payload: ${error}`);
    }
  }

  async verifyAndParse(payload: string, signatureHeader: string): Promise<WebhookEvent> {
    if (!this.verifySignature(payload, signatureHeader)) {
      throw new InvalidSignatureError('Invalid webhook signature');
    }
    return this.parseEvent(payload);
  }

  async processEvent(event: WebhookEvent): Promise<boolean> {
    // Check for duplicate events
    const existingEvent = await this.db.getEvent(event.id);
    if (existingEvent) {
      if (existingEvent.status === 'processed') {
        console.log(`Event ${event.id} already processed, skipping`);
        return true;
      } else if (existingEvent.status === 'failed' && existingEvent.retry_count >= 3) {
        console.warn(`Event ${event.id} failed too many times, skipping`);
        return false;
      }
    }

    // Store event in database
    const stored = await this.db.storeEvent(event);
    if (!stored) {
      console.warn(`Event ${event.id} already exists in database`);
    }

    try {
      // Get event handler
      const handler = this.eventHandlers.get(event.type);
      if (!handler) {
        console.warn(`No handler for event type: ${event.type}`);
        await this.db.updateEventStatus(event.id, 'skipped', 'No handler found');
        return true;
      }

      // Process event
      console.log(`Processing event ${event.id} of type ${event.type}`);
      handler(event);

      // Update status
      await this.db.updateEventStatus(event.id, 'processed');
      console.log(`Successfully processed event ${event.id}`);
      return true;
    } catch (error) {
      console.error(`Failed to process event ${event.id}: ${error}`);
      await this.db.updateEventStatus(event.id, 'failed', String(error));
      await this.db.incrementRetryCount(event.id);
      throw new ProcessingError(`Event processing failed: ${error}`);
    }
  }

  // Default event handlers
  private handlePaymentSucceeded(event: WebhookEvent): void {
    const paymentData = event.data.object;
    console.log(`Payment succeeded: ${paymentData.id} for $${paymentData.amount / 100}`);
    // Add your business logic here
  }

  private handlePaymentFailed(event: WebhookEvent): void {
    const paymentData = event.data.object;
    console.warn(`Payment failed: ${paymentData.id}`);
    // Add your business logic here
  }

  private handlePaymentRefunded(event: WebhookEvent): void {
    const paymentData = event.data.object;
    console.log(`Payment refunded: ${paymentData.id}`);
    // Add your business logic here
  }

  private handlePaymentDisputed(event: WebhookEvent): void {
    const paymentData = event.data.object;
    console.warn(`Payment disputed: ${paymentData.id}`);
    // Add your business logic here
  }

  private handleCustomerCreated(event: WebhookEvent): void {
    const customerData = event.data.object;
    console.log(`Customer created: ${customerData.id}`);
    // Add your business logic here
  }

  private handleCustomerUpdated(event: WebhookEvent): void {
    const customerData = event.data.object;
    console.log(`Customer updated: ${customerData.id}`);
    // Add your business logic here
  }

  private handleSubscriptionCreated(event: WebhookEvent): void {
    const subscriptionData = event.data.object;
    console.log(`Subscription created: ${subscriptionData.id}`);
    // Add your business logic here
  }

  private handleSubscriptionCancelled(event: WebhookEvent): void {
    const subscriptionData = event.data.object;
    console.log(`Subscription cancelled: ${subscriptionData.id}`);
    // Add your business logic here
  }
}

// Express.js application setup
export function createWebhookApp(webhookSecret: string): express.Application {
  const app = express();
  app.use(express.raw({ type: 'application/json' }));

  // Initialize webhook handler
  const db = new WebhookDatabase();
  const webhookHandler = new WebhookHandler(webhookSecret, db);

  app.post('/webhooks/stripe', async (req, res) => {
    const payload = req.body.toString();
    const sigHeader = req.headers['stripe-signature'] as string;

    if (!sigHeader) {
      return res.status(400).json({ error: 'Missing signature header' });
    }

    try {
      const event = await webhookHandler.verifyAndParse(payload, sigHeader);
      await webhookHandler.processEvent(event);
      res.json({ status: 'success' });
    } catch (error) {
      if (error instanceof InvalidSignatureError) {
        console.warn('Invalid webhook signature');
        res.status(400).json({ error: 'Invalid signature' });
      } else if (error instanceof ProcessingError) {
        console.error(`Webhook processing error: ${error.message}`);
        res.status(500).json({ error: error.message });
      } else {
        console.error(`Unexpected error: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  app.get('/webhooks/events/:eventId', async (req, res) => {
    try {
      const event = await db.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/webhooks/events', (req, res) => {
    // This would typically include pagination and filtering
    // For simplicity, we'll just return a message
    res.json({ message: 'Use database queries to list events' });
  });

  return app;
}

// Example usage
if (require.main === module) {
  const app = createWebhookApp("whsec_test_secret");
  const port = 5000;

  app.listen(port, () => {
    console.log(`Webhook server running on port ${port}`);
  });
}
