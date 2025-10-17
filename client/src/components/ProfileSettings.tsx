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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Heart, MapPin, Utensils, Music, Users, BookOpen, Film, Gamepad2, X, Plus, Settings, Calendar, Phone, Mail, Shield, Eye, EyeOff, AlertTriangle } from "lucide-react";

interface ProfileSettingsProps {
  user: any;
}

interface SecurityStatus {
  hasLegacyData: {
    pin: boolean;
    answer1: boolean;
    answer2: boolean;
    answer3: boolean;
  };
  needsUpdate: boolean;
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

  // Query to check if user has legacy security data
  const { data: securityStatus } = useQuery<SecurityStatus>({
    queryKey: ['/api/user/security-status'],
    enabled: isOpen, // Only query when dialog is open
  });

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

  // Password setup states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinForField, setPinForField] = useState<'password' | 'confirmPassword'>('password');
  const [savedPassword, setSavedPassword] = useState("");

  // Temporary input states for adding new items
  const [newInterest, setNewInterest] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newFood, setNewFood] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [newHobby, setNewHobby] = useState("");
  const [newMovie, setNewMovie] = useState("");
  const [newBook, setNewBook] = useState("");

  // Password setup form schema
  const passwordSchema = z.object({
    password: z.string()
      .min(10, "Password must be at least 10 characters long")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

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
      
      // Load saved password if exists
      if (user.password) {
        setSavedPassword(user.password);
        passwordForm.setValue('password', user.password);
        passwordForm.setValue('confirmPassword', user.password);
      } else {
        // Clear password fields if no password exists
        setSavedPassword("");
        passwordForm.setValue('password', '');
        passwordForm.setValue('confirmPassword', '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Password setup mutation
  const setupPassword = useMutation({
    mutationFn: async (data: { password: string }) => {
      return await apiRequest("POST", "/api/auth/setup-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Password Set Successfully",
        description: "Your password has been set up and will be used for future logins.",
      });
      // Refresh user data to load the new password
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error Setting Password",
        description: "Failed to set up password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onPasswordSubmit = (values: z.infer<typeof passwordSchema>) => {
    setupPassword.mutate({ password: values.password });
  };

  // PIN verification mutation
  const verifyPin = useMutation({
    mutationFn: async (pin: string) => {
      return await apiRequest("POST", "/api/user/verify-pin", { pin });
    },
    onSuccess: () => {
      if (pinForField === 'password') {
        setShowPassword(true);
      } else {
        setShowConfirmPassword(true);
      }
      setShowPinDialog(false);
      setPinInput("");
      toast({
        title: "PIN Verified",
        description: "Password is now visible.",
      });
    },
    onError: () => {
      toast({
        title: "Invalid PIN",
        description: "The PIN you entered is incorrect.",
        variant: "destructive",
      });
    },
  });

  const handleEyeClick = (field: 'password' | 'confirmPassword') => {
    const isCurrentlyShowing = field === 'password' ? showPassword : showConfirmPassword;
    
    if (isCurrentlyShowing) {
      // Hide the password
      if (field === 'password') {
        setShowPassword(false);
      } else {
        setShowConfirmPassword(false);
      }
    } else {
      // Show PIN dialog to verify before revealing password
      setPinForField(field);
      setShowPinDialog(true);
    }
  };

  const handlePinSubmit = () => {
    if (pinInput.length === 4) {
      verifyPin.mutate(pinInput);
    } else {
      toast({
        title: "Invalid PIN",
        description: "PIN must be 4 digits.",
        variant: "destructive",
      });
    }
  };

  // Function to mask password with X's while preserving length
  const maskPassword = (value: string) => {
    return 'X'.repeat(value.length);
  };

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
          <TabsList className="grid w-full grid-cols-6 bg-muted">
            <TabsTrigger value="basic" className="data-[state=active]:bg-primary/20">Basic Info</TabsTrigger>
            <TabsTrigger value="interests" className="data-[state=active]:bg-primary/20">Interests</TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-primary/20">Favorites</TabsTrigger>
            <TabsTrigger value="lifestyle" className="data-[state=active]:bg-primary/20">Lifestyle</TabsTrigger>
            <TabsTrigger value="entertainment" className="data-[state=active]:bg-primary/20">Entertainment</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-primary/20">Security</TabsTrigger>
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

            {/* Legacy Security Data Warning */}
            {securityStatus?.needsUpdate && (
              <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <strong>Security Update Required:</strong> Some of your security information uses an old format that can't be viewed by customer service. Please re-enter your {
                    [
                      securityStatus.hasLegacyData.pin && 'security PIN',
                      securityStatus.hasLegacyData.answer1 && 'first security answer',
                      securityStatus.hasLegacyData.answer2 && 'second security answer', 
                      securityStatus.hasLegacyData.answer3 && 'third security answer'
                    ].filter(Boolean).join(', ')
                  } below to enable customer service support.
                </AlertDescription>
              </Alert>
            )}

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
                      This PIN adds an extra layer of security for password recovery, DO NOT SHARE THIS PIN WITH ANYONE
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

          <TabsContent value="security" className="space-y-4">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Password Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type="text"
                                value={showPassword ? field.value : maskPassword(field.value)}
                                onChange={(e) => {
                                  if (showPassword) {
                                    // Allow normal editing when password is visible
                                    field.onChange(e);
                                  } else {
                                    // Handle masked input
                                    const newValue = e.target.value;
                                    const oldValue = field.value;
                                    
                                    if (newValue.length > oldValue.length) {
                                      // Adding characters - replace X's with actual input
                                      const addedChar = newValue[newValue.length - 1];
                                      if (addedChar !== 'X') {
                                        field.onChange(oldValue + addedChar);
                                      }
                                    } else if (newValue.length < oldValue.length) {
                                      // Removing characters
                                      field.onChange(oldValue.slice(0, newValue.length));
                                    }
                                  }
                                }}
                                placeholder="Enter your password"
                                className="bg-input border-border text-foreground pr-10"
                                data-testid="input-password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => handleEyeClick('password')}
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-muted-foreground text-sm">
                            Must be at least 10 characters with letters, numbers, and special characters
                          </FormDescription>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type="text"
                                value={showConfirmPassword ? field.value : maskPassword(field.value)}
                                onChange={(e) => {
                                  if (showConfirmPassword) {
                                    // Allow normal editing when password is visible
                                    field.onChange(e);
                                  } else {
                                    // Handle masked input
                                    const newValue = e.target.value;
                                    const oldValue = field.value;
                                    
                                    if (newValue.length > oldValue.length) {
                                      // Adding characters - replace X's with actual input
                                      const addedChar = newValue[newValue.length - 1];
                                      if (addedChar !== 'X') {
                                        field.onChange(oldValue + addedChar);
                                      }
                                    } else if (newValue.length < oldValue.length) {
                                      // Removing characters
                                      field.onChange(oldValue.slice(0, newValue.length));
                                    }
                                  }
                                }}
                                placeholder="Confirm your password"
                                className="bg-input border-border text-foreground pr-10"
                                data-testid="input-confirm-password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => handleEyeClick('confirmPassword')}
                                data-testid="button-toggle-confirm-password"
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={setupPassword.isPending}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      data-testid="button-setup-password"
                    >
                      {setupPassword.isPending ? "Setting up..." : "Set Password"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* PIN Verification Dialog */}
        <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-primary">Verify Your PIN</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Enter your 4-digit PIN to view the password
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">PIN</Label>
                <Input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPinInput(value);
                  }}
                  placeholder="Enter 4-digit PIN"
                  className="bg-input border-border text-foreground text-center text-lg tracking-widest"
                  maxLength={4}
                  data-testid="input-pin-verify"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPinDialog(false);
                    setPinInput("");
                  }}
                  className="flex-1"
                  data-testid="button-cancel-pin"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePinSubmit}
                  disabled={pinInput.length !== 4 || verifyPin.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-testid="button-verify-pin"
                >
                  {verifyPin.isPending ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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