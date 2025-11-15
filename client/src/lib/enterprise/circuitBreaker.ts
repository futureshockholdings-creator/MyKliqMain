/**
 * Circuit Breaker - Web Enterprise Edition
 * Prevents cascading failures by:
 * - Stopping requests to failing endpoints
 * - Auto-recovery with exponential backoff
 * - Fallback to cache/offline mode
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  nextRetryTime: number;
}

class CircuitBreaker {
  private circuits = new Map<string, CircuitStats>();
  
  private readonly FAILURE_THRESHOLD = 5; // Open after 5 failures
  private readonly SUCCESS_THRESHOLD = 2; // Close after 2 successes in half-open
  private readonly RESET_TIMEOUT = 60000; // 1 minute
  private readonly HALF_OPEN_TIMEOUT = 30000; // 30 seconds

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    endpoint: string,
    fn: () => Promise<T>,
    fallback?: () => T | Promise<T>
  ): Promise<T> {
    const circuit = this.getOrCreateCircuit(endpoint);

    // Check circuit state
    if (circuit.state === 'OPEN') {
      // Check if enough time has passed to try again
      if (Date.now() >= circuit.nextRetryTime) {
        console.log(`[CircuitBreaker] ${endpoint}: OPEN → HALF_OPEN (retry attempt)`);
        circuit.state = 'HALF_OPEN';
      } else {
        const waitTime = Math.round((circuit.nextRetryTime - Date.now()) / 1000);
        console.error(
          `[CircuitBreaker] Circuit OPEN for ${endpoint} (retry in ${waitTime}s)`
        );

        if (fallback) {
          console.log(`[CircuitBreaker] Using fallback for ${endpoint}`);
          return fallback();
        }

        throw new Error(
          `Service temporarily unavailable. Please try again in ${waitTime} seconds.`
        );
      }
    }

    try {
      // Execute the function
      const result = await fn();

      // Success - update circuit
      this.handleSuccess(endpoint, circuit);

      return result;
    } catch (error) {
      // Failure - update circuit
      this.handleFailure(endpoint, circuit);

      // Try fallback if available
      if (fallback) {
        console.log(`[CircuitBreaker] Request failed, using fallback for ${endpoint}`);
        return fallback();
      }

      throw error;
    }
  }

  /**
   * Handle successful request
   */
  private handleSuccess(endpoint: string, circuit: CircuitStats): void {
    if (circuit.state === 'HALF_OPEN') {
      // Increment success counter in half-open state
      circuit.successes++;

      // Close circuit after SUCCESS_THRESHOLD consecutive successes
      if (circuit.successes >= this.SUCCESS_THRESHOLD) {
        console.log(`[CircuitBreaker] ${endpoint}: HALF_OPEN → CLOSED (${circuit.successes} successes)`);
        circuit.state = 'CLOSED';
        circuit.failures = 0;
        circuit.successes = 0;
        // Reset retry timing so next failures use standard backoff
        circuit.lastFailureTime = 0;
        circuit.nextRetryTime = 0;
      }
    } else if (circuit.state === 'CLOSED') {
      // Reset all counters on success in closed state
      circuit.failures = 0;
      circuit.successes = 0;
      circuit.lastFailureTime = 0;
      circuit.nextRetryTime = 0;
    }
  }

  /**
   * Handle failed request
   */
  private handleFailure(endpoint: string, circuit: CircuitStats): void {
    circuit.failures++;
    circuit.successes = 0; // Reset success counter on failure
    circuit.lastFailureTime = Date.now();

    if (circuit.state === 'HALF_OPEN') {
      // Failed in half-open, go back to open
      console.error(`[CircuitBreaker] ${endpoint}: HALF_OPEN → OPEN (retry failed)`);
      circuit.state = 'OPEN';
      circuit.nextRetryTime = Date.now() + this.RESET_TIMEOUT * 2; // Double timeout
    } else if (circuit.failures >= this.FAILURE_THRESHOLD) {
      // Too many failures, open circuit
      console.error(
        `[CircuitBreaker] ${endpoint}: CLOSED → OPEN (${circuit.failures} failures)`
      );
      circuit.state = 'OPEN';
      circuit.nextRetryTime = Date.now() + this.RESET_TIMEOUT;
    }
  }

  /**
   * Get or create circuit for endpoint
   */
  private getOrCreateCircuit(endpoint: string): CircuitStats {
    let circuit = this.circuits.get(endpoint);

    if (!circuit) {
      circuit = {
        state: 'CLOSED',
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        nextRetryTime: 0,
      };
      this.circuits.set(endpoint, circuit);
    }

    return circuit;
  }

  /**
   * Manually reset circuit (admin action)
   */
  reset(endpoint: string): void {
    const circuit = this.circuits.get(endpoint);
    if (circuit) {
      console.log(`[CircuitBreaker] Manually resetting circuit for ${endpoint}`);
      circuit.state = 'CLOSED';
      circuit.failures = 0;
      circuit.successes = 0;
      circuit.lastFailureTime = 0;
      circuit.nextRetryTime = 0;
    }
  }

  /**
   * Reset all circuits
   */
  resetAll(): void {
    console.log('[CircuitBreaker] Resetting all circuits');
    this.circuits.clear();
  }

  /**
   * Get circuit stats for monitoring
   */
  getStats(endpoint?: string): CircuitStats | Map<string, CircuitStats> {
    if (endpoint) {
      return this.getOrCreateCircuit(endpoint);
    }
    return new Map(this.circuits);
  }

  /**
   * Get summary of all circuits
   */
  getSummary(): {
    total: number;
    open: number;
    halfOpen: number;
    closed: number;
  } {
    let open = 0;
    let halfOpen = 0;
    let closed = 0;

    this.circuits.forEach((circuit) => {
      switch (circuit.state) {
        case 'OPEN':
          open++;
          break;
        case 'HALF_OPEN':
          halfOpen++;
          break;
        case 'CLOSED':
          closed++;
          break;
      }
    });

    return {
      total: this.circuits.size,
      open,
      halfOpen,
      closed,
    };
  }
}

export const circuitBreaker = new CircuitBreaker();
