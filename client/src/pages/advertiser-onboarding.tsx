import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ArrowRight, ArrowLeft, Building, Image as ImageIcon, Target, DollarSign, Shield } from "lucide-react";
import Footer from "@/components/Footer";
import { ForcedLightSurface } from "@/components/ForcedLightSurface";

const formSchema = z.object({
  // Business Info
  businessName: z.string().min(2, "Business name is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  website: z.string().url("Valid website URL is required (must start with https://)"),
  taxId: z.string().optional(),
  businessAddress: z.string().optional(),
  
  // Ad Creative (JSON)
  title: z.string().min(60, "Title must be at least 60 characters").max(100, "Title must be max 100 characters"),
  description: z.string().min(150, "Description must be at least 150 characters").max(500, "Description must be max 500 characters"),
  ctaText: z.string().min(10, "CTA must be at least 10 characters").max(30, "CTA must be max 30 characters"),
  ctaUrl: z.string().url("Valid landing page URL required"),
  imageUrls: z.string().optional(),
  videoUrls: z.string().optional(),
  
  // Targeting (JSON)
  targetInterests: z.string().optional(),
  targetAgeMin: z.coerce.number().min(13).max(100).optional(),
  targetAgeMax: z.coerce.number().min(13).max(100).optional(),
  
  // Budget
  proposedDailyBudget: z.coerce.number().min(0).optional(),
  proposedCostPerClick: z.coerce.number().min(0).optional(),
  campaignStartDate: z.string().optional(),
  campaignEndDate: z.string().optional(),
  
  // Legal
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms"),
  privacyPolicyAccepted: z.boolean().refine(val => val === true, "You must accept the privacy policy"),
  businessLicenseVerified: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

const STEPS = [
  { id: 1, title: "Business Info", icon: Building },
  { id: 2, title: "Ad Creative", icon: ImageIcon },
  { id: 3, title: "Targeting", icon: Target },
  { id: 4, title: "Budget & Timeline", icon: DollarSign },
  { id: 5, title: "Legal & Compliance", icon: Shield },
];

export default function AdvertiserOnboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<string>("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      taxId: "",
      businessAddress: "",
      title: "",
      description: "",
      ctaText: "Learn More",
      ctaUrl: "",
      imageUrls: "",
      videoUrls: "",
      targetInterests: "",
      proposedDailyBudget: undefined,
      proposedCostPerClick: undefined,
      campaignStartDate: new Date().toISOString().split('T')[0],
      campaignEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      termsAccepted: false,
      privacyPolicyAccepted: false,
      businessLicenseVerified: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Transform form data to match API schema
      const payload = {
        businessName: data.businessName,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        website: data.website,
        taxId: data.taxId || null,
        businessAddress: data.businessAddress || null,
        adCreatives: {
          title: data.title,
          description: data.description,
          ctaText: data.ctaText,
          ctaUrl: data.ctaUrl,
          imageUrls: data.imageUrls ? data.imageUrls.split(',').map(s => s.trim()) : [],
          videoUrls: data.videoUrls ? data.videoUrls.split(',').map(s => s.trim()) : [],
        },
        targetingPrefs: {
          interests: data.targetInterests ? data.targetInterests.split(',').map(s => s.trim()) : [],
          ageMin: data.targetAgeMin,
          ageMax: data.targetAgeMax,
        },
        proposedDailyBudget: data.proposedDailyBudget?.toString() || null,
        proposedCostPerClick: data.proposedCostPerClick?.toString() || null,
        campaignStartDate: data.campaignStartDate || null,
        campaignEndDate: data.campaignEndDate || null,
        termsAccepted: data.termsAccepted,
        privacyPolicyAccepted: data.privacyPolicyAccepted,
        businessLicenseVerified: data.businessLicenseVerified,
      };

      return apiRequest('/api/advertiser-applications', 'POST', payload);
    },
    onSuccess: (response: any) => {
      setApplicationId(response.applicationId);
      setIsSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you within 2-3 business days.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate as any);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = (data: FormData) => {
    submitMutation.mutate(data);
  };

  const progress = (currentStep / STEPS.length) * 100;

  if (isSubmitted) {
    return (
      <ForcedLightSurface className="flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-2 border-green-600">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-20 h-20 text-green-600" />
            </div>
            <CardTitle className="text-3xl text-black">Application Submitted!</CardTitle>
            <CardDescription className="text-gray-700 text-lg mt-2">
              Thank you for your interest in advertising with MyKliq
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-800">
                <strong>Application ID:</strong> {applicationId}
              </p>
              <p className="text-sm text-gray-800 mt-2">
                Please save this ID for your records.
              </p>
            </div>
            
            <div className="space-y-2 text-gray-800">
              <h3 className="font-semibold text-black">What happens next?</h3>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li>Our ads team will review your application within 2-3 business days</li>
                <li>We'll verify your business information and creative assets</li>
                <li>You'll receive an email at <strong>{form.getValues('email')}</strong> with next steps</li>
                <li>If approved, we'll guide you through campaign setup and payment</li>
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-sm text-gray-700 mb-3">
                Questions? Contact our ads management team:
              </p>
              <a 
                href="mailto:mykliqadsmanagement@outlook.com"
                className="text-blue-600 hover:underline font-medium text-sm"
              >
                mykliqadsmanagement@outlook.com
              </a>
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/advertiser-requirements" className="flex-1">
                <Button variant="outline" className="w-full">
                  View Requirements
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        <Footer />
      </ForcedLightSurface>
    );
  }

  return (
    <ForcedLightSurface>
      <div className="w-full max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Advertiser Application</h1>
          <p className="text-gray-700">
            Complete this form to start advertising on MyKliq
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;

              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors
                    ${isActive ? 'border-blue-600 bg-blue-50' : ''}
                    ${isComplete ? 'border-green-600 bg-green-50' : ''}
                    ${!isActive && !isComplete ? 'border-gray-300 bg-white' : ''}
                  `}>
                    {isComplete ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Icon className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    )}
                  </div>
                  <p className={`text-xs mt-2 text-center hidden md:block ${isActive ? 'font-semibold text-black' : 'text-gray-600'}`}>
                    {step.title}
                  </p>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-2 border-black">
              <CardHeader>
                <CardTitle className="text-black flex items-center gap-2">
                  {(() => {
                    const Icon = STEPS[currentStep - 1].icon;
                    return <Icon className="w-6 h-6" />;
                  })()}
                  Step {currentStep}: {STEPS[currentStep - 1].title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentStep === 1 && (
                  <>
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Business Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Acme Corporation" data-testid="input-business-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Contact Person *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="John Doe" data-testid="input-contact-person" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Email *</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="john@acme.com" data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Phone *</FormLabel>
                            <FormControl>
                              <Input {...field} type="tel" placeholder="(555) 123-4567" data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Website *</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" placeholder="https://www.acme.com" data-testid="input-website" />
                          </FormControl>
                          <FormDescription className="text-gray-600">
                            Must be HTTPS and mobile-responsive
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Tax ID / EIN (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="12-3456789" data-testid="input-tax-id" />
                          </FormControl>
                          <FormDescription className="text-gray-600">
                            Will be encrypted and used for legal compliance only
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Business Address (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="123 Main St, City, State 12345" data-testid="input-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Ad Title * (60-100 characters)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Your compelling headline here" data-testid="input-title" />
                          </FormControl>
                          <FormDescription className="text-gray-600">
                            {field.value.length}/100 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Ad Description * (150-500 characters)</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} placeholder="Describe your product or service..." data-testid="input-description" />
                          </FormControl>
                          <FormDescription className="text-gray-600">
                            {field.value.length}/500 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="ctaText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Call-to-Action * (10-30 chars)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Shop Now" data-testid="input-cta-text" />
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
                            <FormLabel className="text-black">Landing Page URL *</FormLabel>
                            <FormControl>
                              <Input {...field} type="url" placeholder="https://..." data-testid="input-cta-url" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="imageUrls"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Image URLs (Optional, comma-separated)</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} placeholder="https://example.com/ad1.jpg, https://example.com/ad2.png" data-testid="input-image-urls" />
                          </FormControl>
                          <FormDescription className="text-gray-600">
                            Min 1200×628px, Max 5MB each, JPG/PNG/WebP
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="videoUrls"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Video URLs (Optional, comma-separated)</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} placeholder="https://example.com/video.mp4" data-testid="input-video-urls" />
                          </FormControl>
                          <FormDescription className="text-gray-600">
                            MP4 H.264, 1080p, 6-30 seconds, Max 100MB
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <FormField
                      control={form.control}
                      name="targetInterests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Target Interests (Optional, comma-separated)</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="fitness, health, technology, music" data-testid="input-interests" />
                          </FormControl>
                          <FormDescription className="text-gray-600">
                            What interests should your ads target?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="targetAgeMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Minimum Age (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="13" 
                                max="100"
                                placeholder="18"
                                data-testid="input-age-min"
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
                            <FormLabel className="text-black">Maximum Age (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="13" 
                                max="100"
                                placeholder="35"
                                data-testid="input-age-max"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {currentStep === 4 && (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="proposedDailyBudget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Daily Budget (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0"
                                step="0.01"
                                placeholder="50.00"
                                data-testid="input-daily-budget"
                              />
                            </FormControl>
                            <FormDescription className="text-gray-600">
                              Maximum daily spend in USD
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="proposedCostPerClick"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Cost Per Click (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0"
                                step="0.01"
                                placeholder="0.50"
                                data-testid="input-cpc"
                              />
                            </FormControl>
                            <FormDescription className="text-gray-600">
                              Proposed CPC in USD
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="campaignStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Campaign Start Date (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" data-testid="input-start-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="campaignEndDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Campaign End Date (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" data-testid="input-end-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {currentStep === 5 && (
                  <>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="termsAccepted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-terms"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-black">
                                I accept the{" "}
                                <Link href="/privacy-policy" className="text-blue-600 hover:underline">
                                  Terms of Service
                                </Link>
                                {" "}*
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="privacyPolicyAccepted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-privacy"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-black">
                                I accept the{" "}
                                <Link href="/privacy-policy" className="text-blue-600 hover:underline">
                                  Privacy Policy
                                </Link>
                                {" "}*
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="businessLicenseVerified"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-license"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-black">
                                I confirm that my business is properly registered and licensed
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                      <h3 className="font-semibold text-black mb-2">Compliance Requirements:</h3>
                      <ul className="text-sm text-gray-800 space-y-1 list-disc list-inside">
                        <li>All advertising claims must be truthful and substantiated</li>
                        <li>Content must be appropriate for users aged 13+</li>
                        <li>You must own or have rights to all creative assets</li>
                        <li>Ads must comply with GDPR, CCPA, and other privacy laws</li>
                        <li>MyKliq reserves the right to reject any advertisement</li>
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between gap-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  data-testid="button-prev"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto"
                  data-testid="button-next"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="ml-auto"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </form>
        </Form>

        <div className="text-center pt-4">
          <Link href="/advertiser-requirements">
            <Button variant="link" className="text-blue-600">
              View Advertiser Requirements
            </Button>
          </Link>
        </div>
      </div>
      
      <Footer />
    </ForcedLightSurface>
  );
}

function getFieldsForStep(step: number): string[] {
  switch (step) {
    case 1:
      return ['businessName', 'contactPerson', 'email', 'phone', 'website'];
    case 2:
      return ['title', 'description', 'ctaText', 'ctaUrl'];
    case 3:
      return []; // All optional
    case 4:
      return []; // All optional
    case 5:
      return ['termsAccepted', 'privacyPolicyAccepted'];
    default:
      return [];
  }
}
