import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Type, Navigation, Sparkles, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserTheme } from "@shared/schema";

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
  borderStyle: "modern",
  enableSparkles: true,
  backgroundType: "solid",
  backgroundColor: "#000000",
  backgroundGradientStart: "#FF1493",
  backgroundGradientEnd: "#00BFFF",
  backgroundPattern: "dots",
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
                className="flex-1 bg-input border-border text-foreground"
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
                className="flex-1 bg-input border-border text-foreground"
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
            <Label className="text-muted-foreground">Background Type</Label>
            <Select 
              value={currentTheme.backgroundType || "solid"} 
              onValueChange={(value) => updateTheme('backgroundType', value)}
            >
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="solid">Solid Color</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="pattern">Pattern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentTheme.backgroundType === 'solid' && (
            <div>
              <Label className="text-muted-foreground">Background Color</Label>
              <div className="flex gap-2 mt-1">
                <input
                  type="color"
                  value={currentTheme.backgroundColor || "#000000"}
                  onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                  className="w-12 h-10 rounded border-2 border-border cursor-pointer"
                />
                <Input
                  value={currentTheme.backgroundColor || "#000000"}
                  onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                  className="flex-1 bg-input border-border text-foreground"
                />
              </div>
            </div>
          )}

          {currentTheme.backgroundType === 'gradient' && (
            <>
              <div>
                <Label className="text-muted-foreground">Gradient Start</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={currentTheme.backgroundGradientStart || "#FF1493"}
                    onChange={(e) => updateTheme('backgroundGradientStart', e.target.value)}
                    className="w-12 h-10 rounded border-2 border-border cursor-pointer"
                  />
                  <Input
                    value={currentTheme.backgroundGradientStart || "#FF1493"}
                    onChange={(e) => updateTheme('backgroundGradientStart', e.target.value)}
                    className="flex-1 bg-input border-border text-foreground"
                  />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Gradient End</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={currentTheme.backgroundGradientEnd || "#00BFFF"}
                    onChange={(e) => updateTheme('backgroundGradientEnd', e.target.value)}
                    className="w-12 h-10 rounded border-2 border-border cursor-pointer"
                  />
                  <Input
                    value={currentTheme.backgroundGradientEnd || "#00BFFF"}
                    onChange={(e) => updateTheme('backgroundGradientEnd', e.target.value)}
                    className="flex-1 bg-input border-border text-foreground"
                  />
                </div>
              </div>
            </>
          )}

          {currentTheme.backgroundType === 'pattern' && (
            <div>
              <Label className="text-muted-foreground">Pattern Style</Label>
              <Select 
                value={currentTheme.backgroundPattern || "dots"} 
                onValueChange={(value) => updateTheme('backgroundPattern', value)}
              >
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="dots">Dots</SelectItem>
                  <SelectItem value="lines">Lines</SelectItem>
                  <SelectItem value="waves">Waves</SelectItem>
                  <SelectItem value="geometric">Geometric</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Borders & Effects */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-orange-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Borders & Effects
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-400">Border Style</Label>
            <Select value={currentTheme.borderStyle || "retro"} onValueChange={(value) => updateTheme('borderStyle', value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retro">Retro Shadow (Default)</SelectItem>
                <SelectItem value="neon">Neon Glow</SelectItem>
                <SelectItem value="simple">Simple Border</SelectItem>
                <SelectItem value="gradient">Gradient Border</SelectItem>
                <SelectItem value="none">No Border</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-gray-400">Enable Sparkle Effects ✨</Label>
            <Switch
              checked={currentTheme.enableSparkles ?? true}
              onCheckedChange={(value) => updateTheme('enableSparkles', value)}
            />
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
            className={cn(
              "rounded-lg p-4 shadow-lg",
              currentTheme.borderStyle === "retro" && "shadow-[4px_4px_0px_#FF4500,8px_8px_0px_#8A2BE2]",
              currentTheme.borderStyle === "neon" && "shadow-[0_0_10px_#00FFFF,0_0_20px_#00FFFF,0_0_30px_#00FFFF]",
              currentTheme.borderStyle === "gradient" && "border-2 border-gradient-to-r from-pink-500 to-blue-500"
            )}
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
            {currentTheme.enableSparkles && (
              <div className="text-right">
                <span className="animate-pulse">✨</span>
              </div>
            )}
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
