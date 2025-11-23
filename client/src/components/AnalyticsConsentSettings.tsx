import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BarChart3, Shield } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsConsentSettingsProps {
  initialConsent: boolean;
}

export function AnalyticsConsentSettings({ initialConsent }: AnalyticsConsentSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(initialConsent);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateConsentMutation = useMutation({
    mutationFn: async ({ consent, previousValue }: { consent: boolean; previousValue: boolean }) => {
      return await apiRequest('PATCH', '/api/user/analytics-consent', { analyticsConsent: consent });
    },
    onSuccess: (_, { consent }) => {
      // Invalidate user query to refresh analytics consent status
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      toast({
        title: consent ? 'Analytics Enabled' : 'Analytics Disabled',
        description: consent 
          ? 'We\'ll use anonymous data to improve MyKliq.'
          : 'We won\'t collect analytics data from your account.',
      });
    },
    onError: (error, { previousValue }) => {
      // Revert to exact previous state before this mutation attempt
      setIsEnabled(previousValue);
      
      console.error('[Analytics] Failed to update consent:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to update analytics preference. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleToggle = async (checked: boolean) => {
    // Prevent rapid toggles - only allow one mutation at a time
    if (updateConsentMutation.isPending) {
      return;
    }
    
    // Store current state before optimistic update
    const previousValue = isEnabled;
    
    // Optimistically update UI
    setIsEnabled(checked);
    
    // Mutation will revert to previousValue on error
    updateConsentMutation.mutate({ consent: checked, previousValue });
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Analytics & Data Collection
        </CardTitle>
        <CardDescription className="text-purple-200">
          Control how MyKliq uses your anonymous usage data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="analytics-consent" className="flex flex-col space-y-1">
            <span className="font-medium text-white">Allow Analytics</span>
            <span className="text-sm text-purple-300">
              {isEnabled 
                ? "We're collecting anonymous usage data to improve MyKliq" 
                : "Analytics tracking is disabled for your account"}
            </span>
          </Label>
          <Switch
            id="analytics-consent"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={updateConsentMutation.isPending}
            data-testid="switch-analytics-consent"
          />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-200">
              <p className="font-semibold mb-2">Privacy-Focused Analytics</p>
              <ul className="space-y-1 list-disc list-inside text-purple-300">
                <li>Completely anonymous (your IP address is hidden)</li>
                <li>No cross-site tracking</li>
                <li>No advertising or data selling</li>
                <li>Helps us improve features you use</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-xs text-purple-400">
          You can change this anytime. Disabling analytics won't affect your MyKliq experience.
        </p>
      </CardContent>
    </Card>
  );
}
