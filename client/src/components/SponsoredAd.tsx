import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye, MousePointer } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { trackMobileEvent } from "@/lib/mobileAnalytics";
import { SponsoredAd as SponsoredAdType } from "@shared/schema";
import { getTextColorForBackground } from "@/lib/colorUtils";

interface SponsoredAdProps {
  ad: SponsoredAdType;
}

export function SponsoredAd({ ad }: SponsoredAdProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Record impression when component mounts
  const impressionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/ads/${ad.id}/impression`, 'POST');
    },
    onSuccess: () => {
      // Silently track impression
      trackMobileEvent('ad_impression', { category: ad.category, ad_id: ad.id });
    },
  });

  // Record click when user clicks on ad
  const clickMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/ads/${ad.id}/click`, 'POST');
    },
    onSuccess: () => {
      trackMobileEvent('ad_click', { category: ad.category, ad_id: ad.id, cta_url: ad.ctaUrl });
      
      // Open ad URL in new tab
      if (ad.ctaUrl) {
        window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
      }
    },
    onError: (error) => {
      console.error('Error recording ad click:', error);
      toast({
        title: "Error",
        description: "Failed to track ad interaction",
        variant: "destructive",
      });
    },
  });

  // Record impression on mount
  React.useEffect(() => {
    impressionMutation.mutate();
  }, []);

  const handleAdClick = () => {
    clickMutation.mutate();
  };

  // Get the optimal text color based on background
  const backgroundColor = ad.backgroundColor || "#ffffff";
  const textColor = getTextColorForBackground(backgroundColor);

  return (
    <Card 
      className="relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
      style={{ 
        backgroundColor: backgroundColor,
        color: textColor 
      }}
      onClick={handleAdClick}
      data-testid={`sponsored-ad-${ad.id}`}
    >
      <CardContent className="p-4">
        {/* Sponsored Badge */}
        <div className="flex items-center justify-between mb-3">
          <Badge 
            variant="secondary" 
            className="text-xs font-medium"
            style={{ color: textColor, borderColor: textColor, backgroundColor: 'transparent' }}
            data-testid="sponsored-badge"
          >
            Sponsored
          </Badge>
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{ color: textColor, borderColor: textColor }}
            data-testid={`ad-category-${ad.category}`}
          >
            {ad.category}
          </Badge>
        </div>

        {/* Ad Image */}
        {ad.imageUrl && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full h-32 object-cover"
              data-testid="ad-image"
            />
          </div>
        )}

        {/* Ad Content */}
        <div className="space-y-2">
          <h3 
            className="font-semibold text-lg leading-tight"
            style={{ color: textColor }}
            data-testid="ad-title"
          >
            {ad.title}
          </h3>
          
          <p 
            className="text-sm line-clamp-3"
            style={{ color: textColor }}
            data-testid="ad-description"
          >
            {ad.description}
          </p>

          {/* Call to Action */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-2"
              data-testid="ad-cta-button"
            >
              <ExternalLink className="w-4 h-4" />
              {ad.ctaText || "Learn More"}
            </Button>

            {/* Ad Stats (for testing/debug) */}
            <div 
              className="flex items-center gap-3 text-xs"
              style={{ color: textColor }}
            >
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span data-testid="ad-impressions">{ad.impressions || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MousePointer className="w-3 h-3" />
                <span data-testid="ad-clicks">{ad.clicks || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading overlay for clicks */}
        {clickMutation.isPending && (
          <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

