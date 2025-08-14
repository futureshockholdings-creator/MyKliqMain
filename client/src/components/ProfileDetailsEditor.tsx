import { useState } from "react";
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
import { User, Heart, MapPin, Utensils, Music, Users, BookOpen, Film, Gamepad2, X, Plus, Settings } from "lucide-react";

interface ProfileDetailsEditorProps {
  user: any;
}

export function ProfileDetailsEditor({ user }: ProfileDetailsEditorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // State for all profile details
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [favoriteLocations, setFavoriteLocations] = useState<string[]>(user?.favoriteLocations || []);
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>(user?.favoriteFoods || []);
  const [musicGenres, setMusicGenres] = useState<string[]>(user?.musicGenres || []);
  const [hobbies, setHobbies] = useState<string[]>(user?.hobbies || []);
  const [favoriteMovies, setFavoriteMovies] = useState<string[]>(user?.favoriteMovies || []);
  const [favoriteBooks, setFavoriteBooks] = useState<string[]>(user?.favoriteBooks || []);
  const [relationshipStatus, setRelationshipStatus] = useState(user?.relationshipStatus || "");
  const [petPreferences, setPetPreferences] = useState(user?.petPreferences || "");
  const [lifestyle, setLifestyle] = useState(user?.lifestyle || "");

  // Temporary input states for adding new items
  const [newInterest, setNewInterest] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newFood, setNewFood] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [newHobby, setNewHobby] = useState("");
  const [newMovie, setNewMovie] = useState("");
  const [newBook, setNewBook] = useState("");

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return await apiRequest("PUT", "/api/user/profile-details", profileData);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile details have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile details",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate({
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
      <Label className="text-foreground flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </Label>
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          className="bg-input border-border text-foreground flex-1"
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
          className="border-primary text-primary hover:bg-primary/20"
          data-testid="button-edit-profile-details"
        >
          <Settings className="w-4 h-4 mr-2" />
          Edit Profile Details
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Profile Details</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add your interests, preferences, and personal details to help your kliq get to know you better
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="interests" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="interests" className="data-[state=active]:bg-primary/20">Interests</TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-primary/20">Favorites</TabsTrigger>
            <TabsTrigger value="lifestyle" className="data-[state=active]:bg-primary/20">Lifestyle</TabsTrigger>
            <TabsTrigger value="entertainment" className="data-[state=active]:bg-primary/20">Entertainment</TabsTrigger>
          </TabsList>

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
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Lifestyle & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-border text-foreground hover:bg-muted"
            data-testid="button-cancel-profile-details"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            data-testid="button-save-profile-details"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}