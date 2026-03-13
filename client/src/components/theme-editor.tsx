import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Type, Navigation, Image, Upload, X } from "lucide-react";
import type { UserTheme } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import { resolveAssetUrl } from "@/lib/apiConfig";
import { apiRequest } from "@/lib/queryClient";

interface ThemeEditorProps {
  theme?: UserTheme | null;
  onSave: (theme: Partial<UserTheme>) => void;
  onReset: () => void;
  onSurpriseMe?: () => void;
  isSaving?: boolean;
  isFetching?: boolean;
  isError?: boolean;
}

const defaultTheme = {
  primaryColor: "#FF1493",
  secondaryColor: "#00BFFF",
  fontFamily: "comic",
  fontColor: "#FFFFFF",
  navBgColor: "#1F2937",
  navActiveColor: "#FF1493",
  backgroundType: "solid",
  backgroundColor: "#000000",
  backgroundGradientStart: "#FF1493",
  backgroundGradientEnd: "#00BFFF",
};

export function ThemeEditor({ theme, onSave, onReset, onSurpriseMe, isSaving = false, isFetching = false, isError = false }: ThemeEditorProps) {
  // Normalize legacy "retro" values in both font and borderStyle
  const normalizeTheme = (t: UserTheme | null | undefined) => {
    if (!t) return defaultTheme;
    return {
      ...t,
      fontFamily: t.fontFamily === 'retro' ? 'comic' : t.fontFamily,
      borderStyle: t.borderStyle === 'retro' ? 'modern' : t.borderStyle
    };
  };
  
  const [currentTheme, setCurrentTheme] = useState(() => normalizeTheme(theme));

  useEffect(() => {
    // Don't overwrite user edits while saving or refetching
    // Only update when mutation is complete, fresh data has arrived, and there are no errors
    if (theme && !isSaving && !isFetching && !isError) {
      setCurrentTheme(normalizeTheme(theme));
    }
  }, [theme, isSaving, isFetching, isError]);

  const handleSave = () => {
    // Clone the object to decouple from reactive state
    onSave({ ...currentTheme });
  };

  const handleReset = () => {
    setCurrentTheme(defaultTheme);
    onReset();
  };

  const updateTheme = (key: string, value: any) => {
    setCurrentTheme(prev => ({ ...prev, [key]: value }));
  };



  return (
    <div className="space-y-6 pb-20">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-mykliq-purple mb-2">
          🎨 Theme Customization
        </h2>
        <p className="text-muted-foreground">Personalize your MyKliq experience</p>
      </div>

      {/* Banner & Colors */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Banner & Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-400">Primary Color</Label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={currentTheme.primaryColor || "#FF1493"}
                onChange={(e) => updateTheme('primaryColor', e.target.value)}
                className="w-12 h-10 rounded border-2 border-gray-600 cursor-pointer"
              />
              <Input
                value={currentTheme.primaryColor || "#FF1493"}
                onChange={(e) => updateTheme('primaryColor', e.target.value)}
                className="flex-1 bg-white border-gray-300 text-black"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-gray-400">Secondary Color</Label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={currentTheme.secondaryColor || "#00BFFF"}
                onChange={(e) => updateTheme('secondaryColor', e.target.value)}
                className="w-12 h-10 rounded border-2 border-gray-600 cursor-pointer"
              />
              <Input
                value={currentTheme.secondaryColor || "#00BFFF"}
                onChange={(e) => updateTheme('secondaryColor', e.target.value)}
                className="flex-1 bg-white border-gray-300 text-black"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background Customization */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-mykliq-green flex items-center gap-2">
            <Image className="w-5 h-5" />
            Background Style
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-400">Background Type</Label>
            <Select 
              value={currentTheme.backgroundType || "solid"} 
              onValueChange={(value) => updateTheme('backgroundType', value)}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid Color</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="pattern">Pattern</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentTheme.backgroundType === 'solid' && (
            <div>
              <Label className="text-gray-400">Background Color</Label>
              <div className="flex gap-2 mt-1">
                <input
                  type="color"
                  value={currentTheme.backgroundColor || "#000000"}
                  onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                  className="w-12 h-10 rounded border-2 border-gray-600 cursor-pointer"
                />
                <Input
                  value={currentTheme.backgroundColor || "#000000"}
                  onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                  className="flex-1 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          )}

          {currentTheme.backgroundType === 'gradient' && (
            <>
              <div>
                <Label className="text-gray-400">Gradient Start</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={currentTheme.backgroundGradientStart || "#FF1493"}
                    onChange={(e) => updateTheme('backgroundGradientStart', e.target.value)}
                    className="w-12 h-10 rounded border-2 border-gray-600 cursor-pointer"
                  />
                  <Input
                    value={currentTheme.backgroundGradientStart || "#FF1493"}
                    onChange={(e) => updateTheme('backgroundGradientStart', e.target.value)}
                    className="flex-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-400">Gradient End</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={currentTheme.backgroundGradientEnd || "#00BFFF"}
                    onChange={(e) => updateTheme('backgroundGradientEnd', e.target.value)}
                    className="w-12 h-10 rounded border-2 border-gray-600 cursor-pointer"
                  />
                  <Input
                    value={currentTheme.backgroundGradientEnd || "#00BFFF"}
                    onChange={(e) => updateTheme('backgroundGradientEnd', e.target.value)}
                    className="flex-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            </>
          )}

          {currentTheme.backgroundType === 'pattern' && (
            <div>
              <Label className="text-gray-400">Pattern Style</Label>
              <Select 
                value={currentTheme.backgroundPattern || "dots"} 
                onValueChange={(value) => updateTheme('backgroundPattern', value)}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dots">Dots</SelectItem>
                  <SelectItem value="lines">Lines</SelectItem>
                  <SelectItem value="waves">Waves</SelectItem>
                  <SelectItem value="geometric">Geometric</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {currentTheme.backgroundType === 'image' && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400">Background Image</Label>
                {(currentTheme as any).backgroundImageUrl ? (
                  <div className="mt-2 space-y-2">
                    <div className="relative w-full h-28 rounded-lg overflow-hidden border border-gray-600">
                      <img
                        src={resolveAssetUrl((currentTheme as any).backgroundImageUrl) || (currentTheme as any).backgroundImageUrl}
                        alt="Background preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => updateTheme('backgroundImageUrl', null)}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      allowedFileTypes={['image/*']}
                      onGetUploadParameters={async (file) => {
                        const data = await apiRequest('POST', '/api/objects/upload');
                        return { method: 'PUT' as const, url: data.uploadURL };
                      }}
                      onComplete={(result) => {
                        const uploaded = result.successful?.[0];
                        if (uploaded) {
                          const rawUrl: string = (uploaded as any).uploadURL || '';
                          // Normalize the presigned GCS URL to an /objects/... path
                          // matching what the server's normalizeObjectEntityPath does
                          let objectPath: string;
                          try {
                            const urlWithoutQuery = rawUrl.split('?')[0];
                            if (urlWithoutQuery.startsWith('https://storage.googleapis.com')) {
                              const parsed = new URL(urlWithoutQuery);
                              const uploadsIdx = parsed.pathname.indexOf('/uploads/');
                              if (uploadsIdx !== -1) {
                                objectPath = `/objects/${parsed.pathname.slice(uploadsIdx + 1)}`;
                              } else {
                                objectPath = parsed.pathname;
                              }
                            } else {
                              objectPath = urlWithoutQuery.replace(/^https?:\/\/[^/]+/, '');
                            }
                          } catch {
                            objectPath = rawUrl;
                          }
                          updateTheme('backgroundImageUrl', objectPath);
                        }
                      }}
                      buttonClassName="w-full bg-gray-700 border border-gray-600 hover:bg-gray-600 text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </ObjectUploader>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-gray-400">Image Fit</Label>
                <Select
                  value={(currentTheme as any).backgroundImageFit || 'cover'}
                  onValueChange={(value) => updateTheme('backgroundImageFit', value)}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover (fill screen)</SelectItem>
                    <SelectItem value="contain">Contain (fit inside)</SelectItem>
                    <SelectItem value="tile">Tile (repeat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Font Customization */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-secondary flex items-center gap-2">
            <Type className="w-5 h-5" />
            Font Style
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-400">Font Family</Label>
            <Select value={currentTheme.fontFamily || "comic"} onValueChange={(value) => updateTheme('fontFamily', value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comic">Comic Sans MS (Default)</SelectItem>
                <SelectItem value="helvetica">Helvetica (Clean)</SelectItem>
                <SelectItem value="times">Times New Roman (Classic)</SelectItem>
                <SelectItem value="impact">Impact (Bold)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-gray-400">Font Color</Label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={currentTheme.fontColor || "#FFFFFF"}
                onChange={(e) => updateTheme('fontColor', e.target.value)}
                className="w-12 h-10 rounded border-2 border-gray-600 cursor-pointer"
              />
              <Input
                value={currentTheme.fontColor || "#FFFFFF"}
                onChange={(e) => updateTheme('fontColor', e.target.value)}
                className="flex-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Bar */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Navigation Bar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-400">Background Color</Label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={currentTheme.navBgColor || "#1F2937"}
                onChange={(e) => updateTheme('navBgColor', e.target.value)}
                className="w-12 h-10 rounded border-2 border-gray-600 cursor-pointer"
              />
              <Input
                value={currentTheme.navBgColor || "#1F2937"}
                onChange={(e) => updateTheme('navBgColor', e.target.value)}
                className="flex-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-gray-400">Active Tab Color</Label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={currentTheme.navActiveColor || "#FF1493"}
                onChange={(e) => updateTheme('navActiveColor', e.target.value)}
                className="w-12 h-10 rounded border-2 border-gray-600 cursor-pointer"
              />
              <Input
                value={currentTheme.navActiveColor || "#FF1493"}
                onChange={(e) => updateTheme('navActiveColor', e.target.value)}
                className="flex-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-yellow-400">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="rounded-lg p-4 shadow-lg"
            style={{
              background: `linear-gradient(45deg, ${currentTheme.primaryColor || "#FF1493"}, ${currentTheme.secondaryColor || "#00BFFF"})`,
              color: currentTheme.fontColor || "#FFFFFF",
              fontFamily: (currentTheme.fontFamily || "comic") === "comic" ? "Comic Sans MS, cursive" : 
                          currentTheme.fontFamily === "helvetica" ? "Helvetica, sans-serif" :
                          currentTheme.fontFamily === "times" ? "Times New Roman, serif" :
                          currentTheme.fontFamily === "impact" ? "Impact, sans-serif" : "inherit"
            }}
          >
            <p className="font-bold mb-2">Your theme preview</p>
            <p className="text-sm opacity-80">This is how your posts will look</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="button-save-theme"
        >
          {isSaving ? "Saving..." : "💾 Save Theme"}
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
          data-testid="button-reset-theme"
        >
          Reset
        </Button>
        {onSurpriseMe && (
          <Button
            onClick={onSurpriseMe}
            variant="outline"
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-purple-600"
            data-testid="button-surprise-me"
          >
            🎲 Surprise Me
          </Button>
        )}
      </div>
    </div>
  );
}
