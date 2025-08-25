import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Heart, MapPin, Utensils, Music, Users, BookOpen, Film, Gamepad2, X, Plus, Calendar, Phone, Mail } from "lucide-react";

export default function Signup() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Get invite code from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('inviteCode');
    if (code) {
      setInviteCode(code);
    }
  }, []);

  // Basic profile fields - required for signup
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [kliqName, setKliqName] = useState("My Kliq");
  const [birthdate, setBirthdate] = useState("");

  // Extended profile details - optional
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

  // Input states for adding new items
  const [newInterest, setNewInterest] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newFood, setNewFood] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [newHobby, setNewHobby] = useState("");
  const [newMovie, setNewMovie] = useState("");
  const [newBook, setNewBook] = useState("");

  const addItem = (items: string[], setItems: (items: string[]) => void, newItem: string, setNewItem: (item: string) => void) => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      setItems([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (items: string[], setItems: (items: string[]) => void, itemToRemove: string) => {
    setItems(items.filter(item => item !== itemToRemove));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phoneNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (name, email, phone number)",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/auth/signup", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        bio: bio.trim(),
        kliqName: kliqName.trim(),
        birthdate: birthdate || null,
        interests,
        favoriteLocations,
        favoriteFoods,
        musicGenres,
        hobbies,
        favoriteMovies,
        favoriteBooks,
        relationshipStatus: relationshipStatus || null,
        petPreferences: petPreferences || null,
        lifestyle: lifestyle || null,
        inviteCode: inviteCode || undefined
      });

      toast({
        title: "Welcome to MyKliq!",
        description: "Your profile has been created successfully.",
      });

      // Redirect to home page
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addItem(items, setItems, newItem, setNewItem)}
          className="border-primary text-primary hover:bg-primary/20"
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
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Welcome to MyKliq!</h1>
          <p className="text-muted-foreground">Create your profile to join your exclusive social circle</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <User className="w-5 h-5" />
              Create Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="extended">About You</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      First Name *
                    </Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Your first name"
                      className="bg-input border-border text-foreground"
                      data-testid="input-first-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Last Name *
                    </Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Your last name"
                      className="bg-input border-border text-foreground"
                      data-testid="input-last-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email *
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="bg-input border-border text-foreground"
                      data-testid="input-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number *
                    </Label>
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="bg-input border-border text-foreground"
                      data-testid="input-phone"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Birthday
                    </Label>
                    <Input
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className="bg-input border-border text-foreground"
                      data-testid="input-birthdate"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-foreground">Kliq Name</Label>
                    <Input
                      value={kliqName}
                      onChange={(e) => setKliqName(e.target.value)}
                      placeholder="My Kliq"
                      className="bg-input border-border text-foreground"
                      data-testid="input-kliq-name"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-foreground">Bio</Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="bg-input border-border text-foreground resize-none"
                      rows={3}
                      data-testid="input-bio"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="extended" className="space-y-6">
                <div className="grid gap-6">
                  <TagInput
                    label="Interests & Hobbies"
                    items={interests}
                    setItems={setInterests}
                    newItem={newInterest}
                    setNewItem={setNewInterest}
                    placeholder="Add an interest"
                    icon={Heart}
                  />

                  <TagInput
                    label="Hobbies"
                    items={hobbies}
                    setItems={setHobbies}
                    newItem={newHobby}
                    setNewItem={setNewHobby}
                    placeholder="Add a hobby"
                    icon={Gamepad2}
                  />

                  <TagInput
                    label="Favorite Locations"
                    items={favoriteLocations}
                    setItems={setFavoriteLocations}
                    newItem={newLocation}
                    setNewItem={setNewLocation}
                    placeholder="Add a place"
                    icon={MapPin}
                  />

                  <TagInput
                    label="Favorite Foods"
                    items={favoriteFoods}
                    setItems={setFavoriteFoods}
                    newItem={newFood}
                    setNewItem={setNewFood}
                    placeholder="Add a food"
                    icon={Utensils}
                  />

                  <TagInput
                    label="Music Genres"
                    items={musicGenres}
                    setItems={setMusicGenres}
                    newItem={newGenre}
                    setNewItem={setNewGenre}
                    placeholder="Add a genre"
                    icon={Music}
                  />

                  <TagInput
                    label="Favorite Movies"
                    items={favoriteMovies}
                    setItems={setFavoriteMovies}
                    newItem={newMovie}
                    setNewItem={setNewMovie}
                    placeholder="Add a movie"
                    icon={Film}
                  />

                  <TagInput
                    label="Favorite Books"
                    items={favoriteBooks}
                    setItems={setFavoriteBooks}
                    newItem={newBook}
                    setNewItem={setNewBook}
                    placeholder="Add a book"
                    icon={BookOpen}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Relationship Status</Label>
                      <Select value={relationshipStatus} onValueChange={setRelationshipStatus}>
                        <SelectTrigger className="bg-input border-border text-foreground">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="taken">In a relationship</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="complicated">It's complicated</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Pet Preferences</Label>
                      <Select value={petPreferences} onValueChange={setPetPreferences}>
                        <SelectTrigger className="bg-input border-border text-foreground">
                          <SelectValue placeholder="Select preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dogs">Dogs</SelectItem>
                          <SelectItem value="cats">Cats</SelectItem>
                          <SelectItem value="both">Both dogs and cats</SelectItem>
                          <SelectItem value="other">Other pets</SelectItem>
                          <SelectItem value="none">No pets</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Lifestyle</Label>
                      <Select value={lifestyle} onValueChange={setLifestyle}>
                        <SelectTrigger className="bg-input border-border text-foreground">
                          <SelectValue placeholder="Select lifestyle" />
                        </SelectTrigger>
                        <SelectContent>
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
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-4 mt-8">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.location.href = "/"}
                data-testid="button-back-to-landing"
              >
                Back to Landing
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80"
                data-testid="button-create-profile"
              >
                {isSubmitting ? "Creating Profile..." : "Create Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}