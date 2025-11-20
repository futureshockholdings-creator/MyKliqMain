import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Trash2, Edit, Plus, Eye, MousePointer, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SponsoredAd } from "@shared/schema";
import { getTextColorForBackground, isBlackBackground } from "@/lib/colorUtils";
import Footer from "@/components/Footer";

// Ad Preview Component with dynamic text colors
interface AdPreviewProps {
  title: string;
  description: string;
  backgroundColor: string;
  ctaText: string;
  category: string;
}

function AdPreview({ title, description, backgroundColor, ctaText, category }: AdPreviewProps) {
  const textColor = getTextColorForBackground(backgroundColor);
  
  return (
    <Card 
      className="relative overflow-hidden border-l-4 border-l-blue-500"
      style={{ backgroundColor }}
      data-testid="ad-preview"
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="text-xs">
            Sponsored
          </Badge>
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <h3 
            className="text-lg font-semibold leading-tight"
            style={{ color: textColor }}
            data-testid="preview-title"
          >
            {title}
          </h3>
          
          <p 
            className="text-sm leading-relaxed"
            style={{ color: textColor }}
            data-testid="preview-description"
          >
            {description}
          </p>
          
          <Button 
            size="sm" 
            className="mt-3"
            data-testid="preview-cta"
          >
            {ctaText}
          </Button>
        </div>
        
        <div className="text-xs mt-3 opacity-70" style={{ color: textColor }}>
          Text color: {isBlackBackground(backgroundColor) ? 'White (black background)' : 'Black (colored background)'}
        </div>
      </CardContent>
    </Card>
  );
}

const adFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  ctaText: z.string().min(1, "Call-to-action text is required").max(30, "CTA text too long"),
  ctaUrl: z.string().url("Must be a valid URL"),
  backgroundColor: z.string().default("#ffffff"),
  category: z.enum(["fitness", "tech", "food", "travel", "fashion", "entertainment", "education", "finance", "health", "lifestyle"]),
  targetInterests: z.array(z.string()).default([]),
  targetMusicGenres: z.array(z.string()).default([]),
  targetRelationshipStatus: z.array(z.string()).default([]),
  targetHobbies: z.array(z.string()).default([]),
  targetPetPreferences: z.array(z.string()).default([]),
  targetLifestyle: z.array(z.string()).default([]),
  targetAgeMin: z.number().min(13).max(100).optional(),
  targetAgeMax: z.number().min(13).max(100).optional(),
  priority: z.number().min(1).max(10).default(1),
  dailyBudget: z.number().min(0).optional(),
  costPerClick: z.number().min(0).optional(),
  startDate: z.string(),
  endDate: z.string(),
  advertiserName: z.string().min(1, "Advertiser name is required"),
  advertiserEmail: z.string().email("Must be a valid email"),
});

type AdFormData = z.infer<typeof adFormSchema>;

export default function AdsManager() {
  const { toast } = useToast();
  const [editingAd, setEditingAd] = useState<SponsoredAd | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Fetch ads
  const { data: ads = [], isLoading } = useQuery<SponsoredAd[]>({
    queryKey: ['/api/ads'],
  });

  // Form setup
  const form = useForm<AdFormData>({
    resolver: zodResolver(adFormSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      videoUrl: "",
      backgroundColor: "#ffffff",
      ctaText: "Learn More",
      ctaUrl: "",
      category: "lifestyle",
      targetInterests: [],
      targetMusicGenres: [],
      targetRelationshipStatus: [],
      targetHobbies: [],
      targetPetPreferences: [],
      targetLifestyle: [],
      priority: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      advertiserName: "",
      advertiserEmail: "",
    },
  });

  // Create ad mutation
  const createAdMutation = useMutation({
    mutationFn: async (data: AdFormData) => {
      const payload = {
        ...data,
        imageUrl: data.imageUrl || undefined,
        videoUrl: data.videoUrl || undefined,
        dailyBudget: data.dailyBudget || undefined,
        costPerClick: data.costPerClick || undefined,
        targetAgeMin: data.targetAgeMin || undefined,
        targetAgeMax: data.targetAgeMax || undefined,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        status: 'active' as const,
      };
      return apiRequest('/api/ads', 'POST', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ads'] });
      toast({ title: "Success", description: "Ad created successfully" });
      setShowForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create ad",
        variant: "destructive" 
      });
    },
  });

  // Update ad mutation
  const updateAdMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AdFormData }) => {
      const payload = {
        ...data,
        imageUrl: data.imageUrl || undefined,
        videoUrl: data.videoUrl || undefined,
        dailyBudget: data.dailyBudget || undefined,
        costPerClick: data.costPerClick || undefined,
        targetAgeMin: data.targetAgeMin || undefined,
        targetAgeMax: data.targetAgeMax || undefined,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };
      return apiRequest(`/api/ads/${id}`, 'PATCH', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ads'] });
      toast({ title: "Success", description: "Ad updated successfully" });
      setEditingAd(null);
      setShowForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update ad",
        variant: "destructive" 
      });
    },
  });

  // Delete ad mutation
  const deleteAdMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/ads/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ads'] });
      toast({ title: "Success", description: "Ad deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete ad",
        variant: "destructive" 
      });
    },
  });

  // Toggle ad status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'paused' }) => {
      return apiRequest(`/api/ads/${id}/status`, 'PATCH', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ads'] });
      toast({ title: "Success", description: "Ad status updated" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update ad status",
        variant: "destructive" 
      });
    },
  });

  const handleEdit = (ad: SponsoredAd) => {
    setEditingAd(ad);
    setShowForm(true);
    form.reset({
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl ?? "",
      videoUrl: ad.videoUrl ?? "",
      backgroundColor: ad.backgroundColor ?? "#ffffff",
      ctaText: ad.ctaText ?? "Learn More",
      ctaUrl: ad.ctaUrl,
      category: ad.category as "fitness" | "tech" | "food" | "travel" | "fashion" | "entertainment" | "education" | "finance" | "health" | "lifestyle",
      targetInterests: ad.targetInterests || [],
      targetMusicGenres: ad.targetMusicGenres || [],
      targetRelationshipStatus: ad.targetRelationshipStatus || [],
      targetHobbies: ad.targetHobbies || [],
      targetPetPreferences: ad.targetPetPreferences || [],
      targetLifestyle: ad.targetLifestyle || [],
      targetAgeMin: ad.targetAgeMin ? Number(ad.targetAgeMin) : undefined,
      targetAgeMax: ad.targetAgeMax ? Number(ad.targetAgeMax) : undefined,
      priority: Number(ad.priority),
      dailyBudget: ad.dailyBudget ? Number(ad.dailyBudget) : undefined,
      costPerClick: ad.costPerClick ? Number(ad.costPerClick) : undefined,
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : '',
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
      advertiserName: ad.advertiserName,
      advertiserEmail: ad.advertiserEmail,
    });
  };

  const onSubmit = (data: AdFormData) => {
    if (editingAd) {
      updateAdMutation.mutate({ id: editingAd.id, data });
    } else {
      createAdMutation.mutate(data);
    }
  };

  const handleNewAd = () => {
    setEditingAd(null);
    setShowForm(true);
    form.reset();
  };

  if (isLoading) {
    return <div className="p-6">Loading ads...</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">Sponsored Ads Manager</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your sponsored advertisements</p>
        </div>
        <Button onClick={handleNewAd} data-testid="new-ad-button">
          <Plus className="w-4 h-4 mr-2" />
          New Ad
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingAd ? 'Edit Ad' : 'Create New Ad'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList>
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="targeting">Targeting</TabsTrigger>
                    <TabsTrigger value="budget">Budget & Dates</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="ad-title-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="ad-category-select">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fitness">Fitness</SelectItem>
                                <SelectItem value="tech">Technology</SelectItem>
                                <SelectItem value="food">Food & Drink</SelectItem>
                                <SelectItem value="travel">Travel</SelectItem>
                                <SelectItem value="fashion">Fashion</SelectItem>
                                <SelectItem value="entertainment">Entertainment</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="health">Health</SelectItem>
                                <SelectItem value="lifestyle">Lifestyle</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="ad-description-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL (optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://..." data-testid="ad-image-url-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="videoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Video URL (optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://..." data-testid="ad-video-url-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="backgroundColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Background Color</FormLabel>
                          <FormControl>
                            <Input {...field} type="color" data-testid="ad-background-color-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="ctaText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Call-to-Action Text</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="ad-cta-text-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ctaUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Call-to-Action URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://..." data-testid="ad-cta-url-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="advertiserName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Advertiser Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="ad-advertiser-name-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="advertiserEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Advertiser Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" data-testid="ad-advertiser-email-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="targeting" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="targetAgeMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Age (optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="13" 
                                max="100"
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                data-testid="ad-age-min-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="targetAgeMax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Age (optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="13" 
                                max="100"
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                data-testid="ad-age-max-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="targetInterests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Interests (comma-separated)</FormLabel>
                          <FormControl>
                            <Input 
                              value={field.value.join(', ')}
                              onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                              placeholder="fitness, health, sports"
                              data-testid="ad-interests-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="budget" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority (1-10)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="1" 
                                max="10"
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="ad-priority-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dailyBudget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Daily Budget (optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                step="0.01"
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                data-testid="ad-budget-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="costPerClick"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cost per Click (optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                step="0.01"
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                data-testid="ad-cpc-input"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" data-testid="ad-start-date-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" data-testid="ad-end-date-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Real-time Ad Preview */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Preview</h3>
                  <AdPreview 
                    title={form.watch("title") || "Ad Title"}
                    description={form.watch("description") || "Ad description will appear here"}
                    backgroundColor={form.watch("backgroundColor") || "#ffffff"}
                    ctaText={form.watch("ctaText") || "Learn More"}
                    category={form.watch("category")}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createAdMutation.isPending || updateAdMutation.isPending}
                    data-testid="save-ad-button"
                  >
                    {editingAd ? 'Update Ad' : 'Create Ad'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingAd(null);
                      form.reset();
                    }}
                    data-testid="cancel-ad-button"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <h2 className="text-xl font-semibold text-black dark:text-white">Active Ads ({ads.length})</h2>
        {ads.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">No ads created yet</p>
            </CardContent>
          </Card>
        ) : (
          ads.map((ad) => {
            const backgroundColor = ad.backgroundColor || "#ffffff";
            const textColor = getTextColorForBackground(backgroundColor);
            
            return (
            <Card 
              key={ad.id} 
              data-testid={`ad-card-${ad.id}`}
              className="border-l-4 border-l-blue-500"
              style={{ backgroundColor }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 
                        className="text-lg font-semibold" 
                        style={{ color: textColor }}
                      >
                        {ad.title}
                      </h3>
                      <Badge 
                        variant={ad.status === 'active' ? 'default' : 'secondary'}
                        style={{ color: textColor, borderColor: textColor }}
                      >
                        {ad.status}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        style={{ color: textColor, borderColor: textColor }}
                      >
                        {ad.category}
                      </Badge>
                    </div>
                    
                    <p 
                      className="text-sm mb-3" 
                      style={{ color: textColor }}
                    >
                      {ad.description}
                    </p>
                    
                    <div 
                      className="flex items-center gap-4 text-sm" 
                      style={{ color: textColor }}
                    >
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{ad.impressions || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MousePointer className="w-4 h-4" />
                        <span>{ad.clicks || 0} clicks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{ad.startDate ? new Date(ad.startDate).toLocaleDateString() : 'N/A'} - {ad.endDate ? new Date(ad.endDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <span 
                        className="text-sm" 
                        style={{ color: textColor }}
                      >
                        Advertiser: {ad.advertiserName} ({ad.advertiserEmail})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={ad.status === 'active'}
                      onCheckedChange={(checked) => 
                        toggleStatusMutation.mutate({ 
                          id: ad.id, 
                          status: checked ? 'active' : 'paused' 
                        })
                      }
                      data-testid={`ad-status-toggle-${ad.id}`}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(ad)}
                      data-testid={`edit-ad-${ad.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteAdMutation.mutate(ad.id)}
                      disabled={deleteAdMutation.isPending}
                      data-testid={`delete-ad-${ad.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })
        )}
      </div>

      <Footer />
    </div>
  );
}