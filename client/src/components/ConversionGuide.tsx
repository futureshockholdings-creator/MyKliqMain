import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Music, 
  Download, 
  Disc, 
  Upload, 
  ExternalLink, 
  CheckCircle,
  AlertTriangle,
  Info,
  Headphones
} from "lucide-react";

interface ConversionGuideProps {
  fileName: string;
  fileFormat: string;
  onClose: () => void;
}

interface SoftwareRecommendation {
  name: string;
  price: string;
  rating: string;
}

interface Platform {
  name: string;
  type: string;
  drm: boolean;
}

interface ConversionMethod {
  title: string;
  difficulty: string;
  cost: string;
  time: string;
  legal: boolean;
  steps: string[];
  pros: string[];
  cons: string[];
  recommendedSoftware?: SoftwareRecommendation[];
  platforms?: Platform[];
}

export function ConversionGuide({ fileName, fileFormat, onClose }: ConversionGuideProps) {
  const [activeTab, setActiveTab] = useState("itunes");

  const conversionMethods: Record<string, ConversionMethod> = {
    itunes: {
      title: "iTunes Method",
      difficulty: "Easy",
      cost: "Free",
      time: "10-15 minutes",
      legal: true,
      steps: [
        "Open iTunes and create a new playlist",
        "Add your protected music files to the playlist",
        "Insert a blank CD into your computer",
        "Right-click the playlist and select 'Burn Playlist to Disc'",
        "Choose 'Audio CD' format and burn the disc",
        "Once burned, re-import the CD as MP3 or AAC",
        "The imported files will be DRM-free and ready to use"
      ],
      pros: ["100% legal", "Uses official Apple software", "High quality output"],
      cons: ["Requires blank CDs", "Takes some time", "Need CD drive"]
    },
    software: {
      title: "Desktop Software",
      difficulty: "Medium", 
      cost: "Free - $50",
      time: "5-10 minutes",
      legal: true,
      steps: [
        "Download reputable DRM removal software",
        "Install and launch the application", 
        "Add your protected music files",
        "Select output format (MP3 recommended)",
        "Start the conversion process",
        "Wait for conversion to complete",
        "Upload the converted files to MyKliq"
      ],
      recommendedSoftware: [
        { name: "TunesKit", price: "$45", rating: "4.5/5" },
        { name: "DRmare", price: "$35", rating: "4.3/5" },
        { name: "Sidify", price: "$40", rating: "4.4/5" }
      ],
      pros: ["Fast conversion", "Batch processing", "High quality"],
      cons: ["Costs money", "Need to download software"]
    },
    alternative: {
      title: "Alternative Sources",
      difficulty: "Easy",
      cost: "Varies",
      time: "2-5 minutes",
      legal: true,
      steps: [
        "Check if the artist offers DRM-free downloads",
        "Look for the same music on DRM-free platforms",
        "Purchase from stores like Bandcamp, Amazon MP3",
        "Download high-quality DRM-free version",
        "Upload directly to MyKliq"
      ],
      platforms: [
        { name: "Bandcamp", type: "Independent artists", drm: false },
        { name: "Amazon Music", type: "MP3 downloads", drm: false },
        { name: "7digital", type: "High-quality downloads", drm: false },
        { name: "HDtracks", type: "High-res audio", drm: false }
      ],
      pros: ["Instant access", "Support artists directly", "Often higher quality"],
      cons: ["May cost extra", "Not all music available"]
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music className="w-6 h-6 text-pink-400" />
              <div>
                <CardTitle className="text-white">DRM Conversion Guide</CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  How to convert "{fileName}" for web use
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose} className="text-gray-400">
              ×
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Alert className="mb-6 border-amber-500/30 bg-amber-500/10">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <AlertDescription className="text-amber-300">
              <strong>Important:</strong> We respect copyright laws. These methods are for personal use only and help you enjoy music you legally own.
            </AlertDescription>
          </Alert>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800">
              <TabsTrigger value="itunes" className="text-white">
                <Disc className="w-4 h-4 mr-2" />
                iTunes
              </TabsTrigger>
              <TabsTrigger value="software" className="text-white">
                <Download className="w-4 h-4 mr-2" />
                Software
              </TabsTrigger>
              <TabsTrigger value="alternative" className="text-white">
                <ExternalLink className="w-4 h-4 mr-2" />
                Alternatives
              </TabsTrigger>
            </TabsList>

            {Object.entries(conversionMethods).map(([key, method]) => (
              <TabsContent key={key} value={key} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-gray-800 border-gray-600">
                    <CardContent className="p-4 text-center">
                      <div className="text-sm text-gray-400">Difficulty</div>
                      <Badge variant={method.difficulty === "Easy" ? "default" : "secondary"} className="mt-1">
                        {method.difficulty}
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800 border-gray-600">
                    <CardContent className="p-4 text-center">
                      <div className="text-sm text-gray-400">Cost</div>
                      <div className="text-white font-medium mt-1">{method.cost}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800 border-gray-600">
                    <CardContent className="p-4 text-center">
                      <div className="text-sm text-gray-400">Time</div>
                      <div className="text-white font-medium mt-1">{method.time}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800 border-gray-600">
                    <CardContent className="p-4 text-center">
                      <div className="text-sm text-gray-400">Legal</div>
                      <CheckCircle className="w-5 h-5 text-green-400 mx-auto mt-1" />
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gray-800 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Step-by-Step Instructions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {method.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-pink-500 text-white text-sm flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="text-gray-300">{step}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Software recommendations */}
                {key === "software" && method.recommendedSoftware && (
                  <Card className="bg-gray-800 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Recommended Software</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {method.recommendedSoftware.map((software, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                            <div>
                              <div className="text-white font-medium">{software.name}</div>
                              <div className="text-sm text-gray-400">Rating: {software.rating}</div>
                            </div>
                            <Badge variant="outline" className="text-green-400 border-green-400">
                              {software.price}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Platform recommendations */}
                {key === "alternative" && method.platforms && (
                  <Card className="bg-gray-800 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">DRM-Free Platforms</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {method.platforms.map((platform, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                            <div>
                              <div className="text-white font-medium">{platform.name}</div>
                              <div className="text-sm text-gray-400">{platform.type}</div>
                            </div>
                            <Badge className="bg-green-500/20 text-green-400">
                              DRM-Free
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-green-500/10 border-green-500/30">
                    <CardHeader>
                      <CardTitle className="text-green-400 text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Pros
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {method.pros.map((pro, index) => (
                          <li key={index} className="text-green-300 text-sm">• {pro}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-yellow-500/10 border-yellow-500/30">
                    <CardHeader>
                      <CardTitle className="text-yellow-400 text-lg flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Considerations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {method.cons.map((con, index) => (
                          <li key={index} className="text-yellow-300 text-sm">• {con}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
            <div className="flex items-start gap-3">
              <Headphones className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <div className="text-blue-400 font-medium">After Conversion</div>
                <p className="text-blue-300 text-sm mt-1">
                  Once you've converted your music using any of these methods, simply upload the new DRM-free files to MyKliq. 
                  They'll work perfectly for profile music and sharing with your kliq!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}