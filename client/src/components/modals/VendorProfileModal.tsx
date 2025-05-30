import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, User, Mail, Phone, MapPin, Building, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface VendorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VendorProfileModal({ isOpen, onClose }: VendorProfileModalProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [profileData, setProfileData] = useState({
    brand_name: '',
    business_name: '',
    bio: '',
    phone_number: '',
    business_address: '',
    contact_email: ''
  });

  // Get current vendor profile
  const { data: vendorProfile, isLoading } = useQuery({
    queryKey: [`/api/vendor/profile`],
    enabled: !!currentUser && isOpen,
  });

  // Update form when profile data loads
  useEffect(() => {
    if (vendorProfile && typeof vendorProfile === 'object') {
      setProfileData({
        brand_name: (vendorProfile as any).brand_name || '',
        business_name: (vendorProfile as any).business_name || '',
        bio: (vendorProfile as any).bio || '',
        phone_number: (vendorProfile as any).phone_number || '',
        business_address: (vendorProfile as any).business_address || '',
        contact_email: (vendorProfile as any).contact_email || ''
      });
    }
  }, [vendorProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      return apiRequest('PUT', '/api/vendor/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/profile'] });
      toast({
        title: 'Profile updated',
        description: 'Your vendor profile has been updated successfully.',
      });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleInputChange = (field: keyof typeof profileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-400/20">
        <DialogTitle className="sr-only">Edit Vendor Profile</DialogTitle>
        <DialogDescription className="sr-only">Update your vendor business information</DialogDescription>
        
        <div className="relative p-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Edit Vendor Profile</h2>
            <p className="text-gray-600 dark:text-gray-400">Update your business information</p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="brand_name" className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Brand Name *</span>
                  </Label>
                  <Input
                    id="brand_name"
                    value={profileData.brand_name}
                    onChange={(e) => handleInputChange('brand_name', e.target.value)}
                    placeholder="Your brand name"
                    className="bg-white dark:bg-gray-800"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_name" className="flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Business Name</span>
                  </Label>
                  <Input
                    id="business_name"
                    value={profileData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    placeholder="Your business name"
                    className="bg-white dark:bg-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email" className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Business Email</span>
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={profileData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="business@company.com"
                    className="bg-white dark:bg-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Contact Phone</span>
                  </Label>
                  <Input
                    id="phone_number"
                    value={profileData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="bg-white dark:bg-gray-800"
                  />
                </div>


              </div>

              <div className="space-y-2">
                <Label htmlFor="business_address" className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Business Address</span>
                </Label>
                <Input
                  id="business_address"
                  value={profileData.business_address}
                  onChange={(e) => handleInputChange('business_address', e.target.value)}
                  placeholder="123 Business St, City, State 12345"
                  className="bg-white dark:bg-gray-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Business Description</span>
                </Label>
                <textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell customers about your business..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}