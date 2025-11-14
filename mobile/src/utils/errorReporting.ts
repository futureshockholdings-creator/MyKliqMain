import { Platform } from 'react-native';

export interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  userId?: string;
}

class ErrorReportingService {
  private userId?: string;
  private appVersion: string = '1.0.0';
  
  setUserId(userId: string | undefined) {
    this.userId = userId;
  }

  setAppVersion(version: string) {
    this.appVersion = version;
  }

  async logError(error: Error, componentStack?: string, isFatal: boolean = false): Promise<void> {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      componentStack,
      timestamp: new Date().toISOString(),
      platform: Platform.OS as 'ios' | 'android' | 'web',
      appVersion: this.appVersion,
      userId: this.userId,
    };

    console.error('[Error Report]', {
      ...errorReport,
      isFatal,
    });

    if (__DEV__) {
      console.error('Stack trace:', error.stack);
      if (componentStack) {
        console.error('Component stack:', componentStack);
      }
    }
  }

  async logWarning(message: string, context?: Record<string, any>): Promise<void> {
    console.warn('[Warning]', message, context);
  }

  async logInfo(message: string, context?: Record<string, any>): Promise<void> {
    console.log('[Info]', message, context);
  }
}

export const errorReporting = new ErrorReportingService();
