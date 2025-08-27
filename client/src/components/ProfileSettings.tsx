import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Heart, MapPin, Utensils, Music, Users, BookOpen, Film, Gamepad2, X, Plus, Settings, Calendar, Phone, Mail } from "lucide-react";

interface ProfileSettingsProps {
  user: any;
}

// TagInput component moved outside to prevent re-creation on each render
const TagInput = ({ 
  label, 
  items, 
  setItems, 
  newItem, 
  setNewItem, 
  placeholder,
  icon: Icon,
  onAddItem,
  onRemoveItem
}: {
  label: string;
  items: string[];
  setItems: (items: string[]) => void;
  newItem: string;
  setNewItem: (item: string) => void;
  placeholder: string;
  icon: any;
  onAddItem: (items: string[], setItems: (items: string[]) => void, newItem: string, setNewItem: (item: string) => void) => void;
  onRemoveItem: (items: string[], setItems: (items: string[]) => void, itemToRemove: string) => void;
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewItem(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAddItem(items, setItems, newItem, setNewItem);
    }
  };

  const handleAddClick = () => {
    onAddItem(items, setItems, newItem, setNewItem);
  };

  const handleRemoveItem = (itemToRemove: string) => {
    onRemoveItem(items, setItems, itemToRemove);
  };

  return (
    <div className="space-y-2">
      <Label className="text-foreground flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </Label>
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="bg-input border-border text-foreground flex-1"
          onKeyDown={handleKeyDown}
          data-testid={`input-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddClick}
          className="border-primary text-primary hover:bg-primary/20"
          data-testid={`button-add-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            {item}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-auto p-0 text-muted-foreground hover:text-foreground"
              onClick={() => handleRemoveItem(item)}
              data-testid={`button-remove-${label.toLowerCase().replace(/\s+/g, '-')}-${index}`}
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Basic profile fields
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [kliqName, setKliqName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  
  // Security questions for password recovery
  const [securityAnswer1, setSecurityAnswer1] = useState(""); // First car
  const [securityAnswer2, setSecurityAnswer2] = useState(""); // Mother's maiden name
  const [securityAnswer3, setSecurityAnswer3] = useState(""); // Favorite teacher's last name
  const [securityPin, setSecurityPin] = useState(""); // 4-digit PIN

  // Extended profile details
  const [interests, setInterests] = useState<string[]>([]);
  const [favoriteLocations, setFavoriteLocations] = useState<string[]>([]);
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>([]);
  const [musicGenres, setMusicGenres] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<string[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<string[]>([]);
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [petPreferences, setPetPreferences] = useState("");
  const [lifestyle, setLifestyle] = useState("");

  // Temporary input states for adding new items
  const [newInterest, setNewInterest] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newFood, setNewFood] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [newHobby, setNewHobby] = useState("");
  const [newMovie, setNewMovie] = useState("");
  const [newBook, setNewBook] = useState("");

  // Initialize state when user data changes or dialog opens
  useEffect(() => {
    if (user && isOpen) {
      setBio(user.bio || "");
      setPhoneNumber(user.phoneNumber || "");
      setKliqName(user.kliqName || "My Kliq");
      setBirthdate(user.birthdate || "");
      setSecurityAnswer1(user.securityAnswer1 ? "****" : ""); // Don't show actual answers
      setSecurityAnswer2(user.securityAnswer2 ? "****" : "");
      setSecurityAnswer3(user.securityAnswer3 ? "****" : "");
      setSecurityPin(user.securityPin ? "****" : ""); // Don't show actual PIN
      setInterests(user.interests || []);
      setFavoriteLocations(user.favoriteLocations || []);
      setFavoriteFoods(user.favoriteFoods || []);
      setMusicGenres(user.musicGenres || []);
      setHobbies(user.hobbies || []);
      setFavoriteMovies(user.favoriteMovies || []);
      setFavoriteBooks(user.favoriteBooks || []);
      setRelationshipStatus(user.relationshipStatus || "");
      setPetPreferences(user.petPreferences || "");
      setLifestyle(user.lifestyle || "");
    }
  }, [user, isOpen]);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return await apiRequest("PUT", "/api/user/profile", profileData);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!birthdate) {
      toast({
        title: "Birthdate Required",
        description: "Please provide your birthdate to save your profile.",
        variant: "destructive",
      });
      return;
    }

    const profileData: any = {
      // Basic profile fields
      bio,
      phoneNumber,
      kliqName,
      birthdate,
      // Extended profile details
      interests,
      favoriteLocations,
      favoriteFoods,
      musicGenres,
      hobbies,
      favoriteMovies,
      favoriteBooks,
      relationshipStatus,
      petPreferences,
      lifestyle,
    };

    // Only include security answers if they're not the placeholder "****" and not empty
    if (securityAnswer1 && securityAnswer1 !== "****") {
      profileData.securityAnswer1 = securityAnswer1;
    }
    if (securityAnswer2 && securityAnswer2 !== "****") {
      profileData.securityAnswer2 = securityAnswer2;
    }
    if (securityAnswer3 && securityAnswer3 !== "****") {
      profileData.securityAnswer3 = securityAnswer3;
    }
    // Include security PIN if provided and not the placeholder
    if (securityPin && securityPin !== "****") {
      profileData.securityPin = securityPin;
    }

    updateProfileMutation.mutate(profileData);
  };

  const addItem = (items: string[], setItems: (items: string[]) => void, newItem: string, setNewItem: (item: string) => void) => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      setItems([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (items: string[], setItems: (items: string[]) => void, itemToRemove: string) => {
    setItems(items.filter(item => item !== itemToRemove));
  };



  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-primary text-primary hover:bg-primary/20"
          data-testid="button-edit-profile-settings"
        >
          <Settings className="w-4 h-4 mr-2" />
          Profile Settings
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Profile Settings</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Manage your basic information, interests, and personal details
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-muted">
            <TabsTrigger value="basic" className="data-[state=active]:bg-primary/20">Basic Info</TabsTrigger>
            <TabsTrigger value="interests" className="data-[state=active]:bg-primary/20">Interests</TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-primary/20">Favorites</TabsTrigger>
            <TabsTrigger value="lifestyle" className="data-[state=active]:bg-primary/20">Lifestyle</TabsTrigger>
            <TabsTrigger value="entertainment" className="data-[state=active]:bg-primary/20">Entertainment</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Bio
                    </Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell your kliq about yourself..."
                      className="bg-input border-border text-foreground"
                      rows={3}
                      data-testid="textarea-bio"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="bg-input border-border text-foreground"
                      data-testid="input-phone-number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Kliq Name
                    </Label>
                    <Input
                      value={kliqName}
                      onChange={(e) => setKliqName(e.target.value)}
                      placeholder="My Kliq"
                      className="bg-input border-border text-foreground"
                      data-testid="input-kliq-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Birthdate *
                    </Label>
                    <Input
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className="bg-input border-border text-foreground"
                      data-testid="input-birthdate"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Questions Section */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Security Questions (Password Recovery)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">
                      1. What was your very first car you owned?
                    </Label>
                    <Input
                      value={securityAnswer1}
                      onChange={(e) => setSecurityAnswer1(e.target.value)}
                      placeholder="Enter your answer..."
                      className="bg-input border-border text-foreground"
                      data-testid="input-security-answer-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">
                      2. What is your mother's maiden last name?
                    </Label>
                    <Input
                      value={securityAnswer2}
                      onChange={(e) => setSecurityAnswer2(e.target.value)}
                      placeholder="Enter your answer..."
                      className="bg-input border-border text-foreground"
                      data-testid="input-security-answer-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">
                      3. What is the last name of your favorite teacher in school?
                    </Label>
                    <Input
                      value={securityAnswer3}
                      onChange={(e) => setSecurityAnswer3(e.target.value)}
                      placeholder="Enter your answer..."
                      className="bg-input border-border text-foreground"
                      data-testid="input-security-answer-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">
                      4-Digit Security PIN
                    </Label>
                    <Input
                      type="password"
                      value={securityPin}
                      onChange={(e) => {
                        // Allow normal typing, then filter to 4 digits
                        const value = e.target.value.replace(/\D/g, '').substring(0, 4);
                        setSecurityPin(value);
                      }}
                      placeholder="Enter 4-digit PIN..."
                      className="bg-input border-border text-foreground"
                      maxLength={10}
                      data-testid="input-security-pin"
                    />
                    <p className="text-xs text-muted-foreground">
                      This PIN adds an extra layer of security for password recovery
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interests" className="space-y-4">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Your Interests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TagInput
                  label="Interests"
                  items={interests}
                  setItems={setInterests}
                  newItem={newInterest}
                  setNewItem={setNewInterest}
                  placeholder="e.g., Photography, Travel, Technology"
                  icon={Heart}
                  onAddItem={addItem}
                  onRemoveItem={removeItem}
                />
                <TagInput
                  label="Hobbies"
                  items={hobbies}
                  setItems={setHobbies}
                  newItem={newHobby}
                  setNewItem={setNewHobby}
                  placeholder="e.g., Reading, Gaming, Cooking"
                  icon={Gamepad2}
                  onAddItem={addItem}
                  onRemoveItem={removeItem}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Favorites
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TagInput
                  label="Favorite Locations"
                  items={favoriteLocations}
                  setItems={setFavoriteLocations}
                  newItem={newLocation}
                  setNewItem={setNewLocation}
                  placeholder="e.g., Paris, Tokyo, New York"
                  icon={MapPin}
                  onAddItem={addItem}
                  onRemoveItem={removeItem}
                />
                <TagInput
                  label="Favorite Foods"
                  items={favoriteFoods}
                  setItems={setFavoriteFoods}
                  newItem={newFood}
                  setNewItem={setNewFood}
                  placeholder="e.g., Pizza, Sushi, Tacos"
                  icon={Utensils}
                  onAddItem={addItem}
                  onRemoveItem={removeItem}
                />
                <TagInput
                  label="Music Genres"
                  items={musicGenres}
                  setItems={setMusicGenres}
                  newItem={newGenre}
                  setNewItem={setNewGenre}
                  placeholder="e.g., Pop, Rock, Hip-Hop"
                  icon={Music}
                  onAddItem={addItem}
                  onRemoveItem={removeItem}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lifestyle" className="space-y-4">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Lifestyle & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Relationship Status
                    </Label>
                    <Select value={relationshipStatus} onValueChange={setRelationshipStatus}>
                      <SelectTrigger className="bg-input border-border text-foreground" data-testid="select-relationship-status">
                        <SelectValue placeholder="Select relationship status" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="taken">Taken</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="complicated">It's complicated</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Pet Preferences</Label>
                    <Select value={petPreferences} onValueChange={setPetPreferences}>
                      <SelectTrigger className="bg-input border-border text-foreground" data-testid="select-pet-preferences">
                        <SelectValue placeholder="Select pet preferences" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="dogs">Dogs</SelectItem>
                        <SelectItem value="cats">Cats</SelectItem>
                        <SelectItem value="both">Both Dogs & Cats</SelectItem>
                        <SelectItem value="other">Other Pets</SelectItem>
                        <SelectItem value="none">No Pets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Lifestyle</Label>
                    <Select value={lifestyle} onValueChange={setLifestyle}>
                      <SelectTrigger className="bg-input border-border text-foreground" data-testid="select-lifestyle">
                        <SelectValue placeholder="Select lifestyle" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="relaxed">Relaxed</SelectItem>
                        <SelectItem value="adventurous">Adventurous</SelectItem>
                        <SelectItem value="homebody">Homebody</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="entertainment" className="space-y-4">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Film className="w-5 h-5" />
                  Entertainment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TagInput
                  label="Favorite Movies"
                  items={favoriteMovies}
                  setItems={setFavoriteMovies}
                  newItem={newMovie}
                  setNewItem={setNewMovie}
                  placeholder="e.g., The Matrix, Inception, Avengers"
                  icon={Film}
                  onAddItem={addItem}
                  onRemoveItem={removeItem}
                />
                <TagInput
                  label="Favorite Books"
                  items={favoriteBooks}
                  setItems={setFavoriteBooks}
                  newItem={newBook}
                  setNewItem={setNewBook}
                  placeholder="e.g., Harry Potter, 1984, The Hobbit"
                  icon={BookOpen}
                  onAddItem={addItem}
                  onRemoveItem={removeItem}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-border text-foreground hover:bg-muted"
            data-testid="button-cancel-profile-settings"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            data-testid="button-save-profile-settings"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}