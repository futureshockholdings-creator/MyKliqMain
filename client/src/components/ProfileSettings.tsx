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

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Basic profile fields
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [kliqName, setKliqName] = useState("");
  const [birthdate, setBirthdate] = useState("");

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
    updateProfileMutation.mutate({
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
    });
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

  const TagInput = ({ 
    label, 
    items, 
    setItems, 
    newItem, 
    setNewItem, 
    placeholder,
    icon: Icon 
  }: {
    label: string;
    items: string[];
    setItems: (items: string[]) => void;
    newItem: string;
    setNewItem: (item: string) => void;
    placeholder: string;
    icon: any;
  }) => (
    <div className="space-y-2">
      <Label className="text-gray-300 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </Label>
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          className="bg-gray-700 border-gray-600 text-white flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem(items, setItems, newItem, setNewItem);
            }
          }}
          data-testid={`input-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addItem(items, setItems, newItem, setNewItem)}
          className="border-pink-500 text-pink-400 hover:bg-pink-500/20"
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
            className="bg-gray-600 text-gray-200 hover:bg-gray-500"
          >
            {item}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-auto p-0 text-gray-400 hover:text-white"
              onClick={() => removeItem(items, setItems, item)}
              data-testid={`button-remove-${label.toLowerCase().replace(/\s+/g, '-')}-${index}`}
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-pink-500 text-pink-400 hover:bg-pink-500/20"
          data-testid="button-edit-profile-settings"
        >
          <Settings className="w-4 h-4 mr-2" />
          Profile Settings
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-gray-800 border-gray-700 max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-pink-400">Profile Settings</DialogTitle>
          <DialogDescription className="text-gray-400">
            Manage your basic information, interests, and personal details
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-gray-700">
            <TabsTrigger value="basic" className="data-[state=active]:bg-pink-500/20">Basic Info</TabsTrigger>
            <TabsTrigger value="interests" className="data-[state=active]:bg-pink-500/20">Interests</TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-pink-500/20">Favorites</TabsTrigger>
            <TabsTrigger value="lifestyle" className="data-[state=active]:bg-pink-500/20">Lifestyle</TabsTrigger>
            <TabsTrigger value="entertainment" className="data-[state=active]:bg-pink-500/20">Entertainment</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-pink-400 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Bio
                    </Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell your kliq about yourself..."
                      className="bg-gray-700 border-gray-600 text-white"
                      rows={3}
                      data-testid="textarea-bio"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-phone-number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Kliq Name
                    </Label>
                    <Input
                      value={kliqName}
                      onChange={(e) => setKliqName(e.target.value)}
                      placeholder="My Kliq"
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-kliq-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Birthdate
                    </Label>
                    <Input
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-birthdate"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interests" className="space-y-4">
            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-pink-400 flex items-center gap-2">
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
                />
                <TagInput
                  label="Hobbies"
                  items={hobbies}
                  setItems={setHobbies}
                  newItem={newHobby}
                  setNewItem={setNewHobby}
                  placeholder="e.g., Reading, Gaming, Cooking"
                  icon={Gamepad2}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-pink-400 flex items-center gap-2">
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
                />
                <TagInput
                  label="Favorite Foods"
                  items={favoriteFoods}
                  setItems={setFavoriteFoods}
                  newItem={newFood}
                  setNewItem={setNewFood}
                  placeholder="e.g., Pizza, Sushi, Tacos"
                  icon={Utensils}
                />
                <TagInput
                  label="Music Genres"
                  items={musicGenres}
                  setItems={setMusicGenres}
                  newItem={newGenre}
                  setNewItem={setNewGenre}
                  placeholder="e.g., Pop, Rock, Hip-Hop"
                  icon={Music}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lifestyle" className="space-y-4">
            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-pink-400 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Lifestyle & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Relationship Status
                    </Label>
                    <Select value={relationshipStatus} onValueChange={setRelationshipStatus}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-relationship-status">
                        <SelectValue placeholder="Select relationship status" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="taken">Taken</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="complicated">It's complicated</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Pet Preferences</Label>
                    <Select value={petPreferences} onValueChange={setPetPreferences}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-pet-preferences">
                        <SelectValue placeholder="Select pet preferences" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="dogs">Dogs</SelectItem>
                        <SelectItem value="cats">Cats</SelectItem>
                        <SelectItem value="both">Both Dogs & Cats</SelectItem>
                        <SelectItem value="other">Other Pets</SelectItem>
                        <SelectItem value="none">No Pets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Lifestyle</Label>
                    <Select value={lifestyle} onValueChange={setLifestyle}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-lifestyle">
                        <SelectValue placeholder="Select lifestyle" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
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
            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-pink-400 flex items-center gap-2">
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
                />
                <TagInput
                  label="Favorite Books"
                  items={favoriteBooks}
                  setItems={setFavoriteBooks}
                  newItem={newBook}
                  setNewItem={setNewBook}
                  placeholder="e.g., Harry Potter, 1984, The Hobbit"
                  icon={BookOpen}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-600">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            data-testid="button-cancel-profile-settings"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
            className="bg-pink-500 hover:bg-pink-600 text-white"
            data-testid="button-save-profile-settings"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}