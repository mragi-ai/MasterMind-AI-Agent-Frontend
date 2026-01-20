import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Bell,
  Lock,
  Settings,
  Save,
  ArrowLeft,
  Shield,
  Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUserProfile, changePassword, updateUserProfile } from "@/lib/api/endpoints/auth";

// Static user data
const STATIC_USER_DATA = {
  id: "user_12345",
  firstName: "Sarah",
  lastName: "Johnson",
  email: "sarah.johnson@company.com",
  phone: "+1 (555) 123-4567",
  role: "Sales Representative",
  department: "Sales & Marketing",
  location: "New York, NY",
  joinDate: "January 15, 2024",
  bio: "Experienced sales professional with a passion for building client relationships and driving business growth.",
  avatarUrl: "", // Will use fallback
  settings: {
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    trainingReminders: true,
    language: "en",
    timezone: "America/New_York"
  }
};

const UserProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State for profile data
  const [profileData, setProfileData] = useState(STATIC_USER_DATA);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch user profile data on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const response = await getUserProfile();


        setProfileData(prev => ({
          ...prev,
          firstName: response.first_name || prev.firstName,
          lastName: response.last_name || prev.lastName,
          email: response.email || prev.email,
          phone: response.phone_number || prev.phone,
        }));
      } catch (error: any) {
        console.error("Error fetching user profile:", error);
        toast({
          title: "Error",
          description: error?.response?.data?.message || "Failed to load user profile",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [toast]);

  // Hide browser scrollbar on this screen
  useEffect(() => {
    // Add no-scrollbar class to body
    document.body.classList.add('no-scrollbar');

    return () => {
      // Remove no-scrollbar class when component unmounts
      document.body.classList.remove('no-scrollbar');
    };
  }, []);

  // Handle input changes
  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      await updateUserProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone_number: profileData.phone,
        email: profileData.email,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      setIsEditing(false);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    // Validation - Check each field individually
    if (!passwordData.oldPassword || passwordData.oldPassword.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Please enter your current password.",
        variant: "destructive",
      });
      return;
    }

    if (!passwordData.newPassword || passwordData.newPassword.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }

    if (!passwordData.confirmPassword || passwordData.confirmPassword.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Please confirm your new password.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      toast({
        title: "Validation Error",
        description: "New password must be different from your current password.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword({
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword,
      });

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });

      // Reset password fields
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle save settings
  const handleSaveSettings = () => {
    console.log("Saving settings:", profileData.settings);

    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated.",
    });
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!profileData.firstName || !profileData.lastName) return "U";
    return `${profileData.firstName[0]}${profileData.lastName[0]}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background no-scrollbar" style={{ overflowY: 'auto' }}>
        <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Skeleton className="h-8 w-64" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background no-scrollbar" style={{ overflowY: 'auto' }}>
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your account information and preferences
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - User Info Card */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4 ring-4 ring-primary/10">
                    <AvatarImage src={profileData.avatarUrl} alt={profileData.firstName} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>

                  <h2 className="text-2xl font-bold mb-1">
                    {profileData.firstName} {profileData.lastName}
                  </h2>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {profileData.role}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-6">
                    {profileData.bio}
                  </p>

                  <Separator className="mb-4" />

                  <div className="w-full space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">
                        {profileData.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {profileData.phone}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {profileData.department}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {profileData.location}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Joined {profileData.joinDate}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                          Update your personal details and contact information
                        </CardDescription>
                      </div>
                      {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} variant="outline">
                          Edit Profile
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button onClick={() => setIsEditing(false)} variant="outline">
                            Cancel
                          </Button>
                          <Button onClick={handleSaveProfile} disabled={isSaving}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={profileData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        disabled={!isEditing}
                        rows={4}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Manage how you receive notifications and updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="emailNotifications" className="text-base">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={profileData.settings.emailNotifications}
                        onCheckedChange={(checked) =>
                          handleInputChange('settings.emailNotifications', checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="pushNotifications" className="text-base">
                          Push Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications on your device
                        </p>
                      </div>
                      <Switch
                        id="pushNotifications"
                        checked={profileData.settings.pushNotifications}
                        onCheckedChange={(checked) =>
                          handleInputChange('settings.pushNotifications', checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="weeklyReports" className="text-base">
                          Weekly Reports
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Get weekly progress summaries
                        </p>
                      </div>
                      <Switch
                        id="weeklyReports"
                        checked={profileData.settings.weeklyReports}
                        onCheckedChange={(checked) =>
                          handleInputChange('settings.weeklyReports', checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="trainingReminders" className="text-base">
                          Training Reminders
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Reminders for scheduled training sessions
                        </p>
                      </div>
                      <Switch
                        id="trainingReminders"
                        checked={profileData.settings.trainingReminders}
                        onCheckedChange={(checked) =>
                          handleInputChange('settings.trainingReminders', checked)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Regional Settings</CardTitle>
                    <CardDescription>
                      Configure your language and timezone preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={profileData.settings.language}
                        onValueChange={(value) => handleInputChange('settings.language', value)}
                      >
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={profileData.settings.timezone}
                        onValueChange={(value) => handleInputChange('settings.timezone', value)}
                      >
                        <SelectTrigger id="timezone">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4">
                      <Button onClick={handleSaveSettings} className="w-full">
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Enter current password"
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                        disabled={isChangingPassword}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        disabled={isChangingPassword}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        disabled={isChangingPassword}
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Security</CardTitle>
                    <CardDescription>
                      Additional security options for your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div className="space-y-0.5">
                        <Label className="text-base">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security
                        </p>
                      </div>
                      <Button variant="outline">Enable</Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-3">
                      <div className="space-y-0.5">
                        <Label className="text-base">Active Sessions</Label>
                        <p className="text-sm text-muted-foreground">
                          Manage your active login sessions
                        </p>
                      </div>
                      <Button variant="outline">View</Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-3">
                      <div className="space-y-0.5">
                        <Label className="text-base text-destructive">Delete Account</Label>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and data
                        </p>
                      </div>
                      <Button variant="destructive">Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

