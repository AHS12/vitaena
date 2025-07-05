import { useResumeStore } from '@/stores/resume-store';
import { PersonalInfo } from '@/types/resume';
import {
  Email,
  Language,
  LinkedIn,
  LocationOn,
  Person,
  Phone,
  PhotoCamera,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';

export const PersonalInfoEditor: React.FC = () => {
  const { currentResume, updateResumeField } = useResumeStore();

  if (!currentResume) return null;

  const personalInfo = currentResume.personalInfo;

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string | boolean) => {
    const updatedPersonalInfo = {
      ...personalInfo,
      [field]: value,
    };
    updateResumeField('personalInfo', updatedPersonalInfo);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updatePersonalInfo('photo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader
          title="Personal Information"
        />
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Add your basic contact information and professional details.
          </Typography>
        </Box>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Photo Upload */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Profile Photo
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={personalInfo.photo || undefined}
                  sx={{ width: 80, height: 80 }}
                >
                  <Person />
                </Avatar>
                <Box>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="photo-upload"
                    type="file"
                    onChange={handlePhotoUpload}
                  />
                  <label htmlFor="photo-upload">
                    <IconButton
                      color="primary"
                      aria-label="upload picture"
                      component="span"
                    >
                      <PhotoCamera />
                    </IconButton>
                  </label>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Upload a professional photo
                  </Typography>
                </Box>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={personalInfo.showPhoto !== false}
                    onChange={(e) => updatePersonalInfo('showPhoto', e.target.checked)}
                  />
                }
                label="Show photo on resume"
                sx={{ mt: 1 }}
              />
            </Box>

            {/* Basic Information */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label="Full Name"
                required
                value={personalInfo.name}
                onChange={(e) => updatePersonalInfo('name', e.target.value)}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              <TextField
                fullWidth
                label="Professional Title"
                required
                value={personalInfo.title}
                onChange={(e) => updatePersonalInfo('title', e.target.value)}
                placeholder="e.g., Software Engineer, Marketing Manager"
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={personalInfo.showEmail !== false}
                      onChange={(e) => updatePersonalInfo('showEmail', e.target.checked)}
                    />
                  }
                  label="Show email on resume"
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={personalInfo.showPhone !== false}
                      onChange={(e) => updatePersonalInfo('showPhone', e.target.checked)}
                    />
                  }
                  label="Show phone on resume"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Stack>

            <Box>
              <TextField
                fullWidth
                label="Location"
                value={personalInfo.location}
                onChange={(e) => updatePersonalInfo('location', e.target.value)}
                placeholder="City, Country"
                InputProps={{
                  startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={personalInfo.showLocation !== false}
                    onChange={(e) => updatePersonalInfo('showLocation', e.target.checked)}
                  />
                }
                label="Show location on resume"
                sx={{ mt: 1 }}
              />
            </Box>

            {/* Optional Fields */}
            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
              Additional Information
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="LinkedIn"
                  value={personalInfo.linkedIn || ''}
                  onChange={(e) => updatePersonalInfo('linkedIn', e.target.value)}
                  placeholder="linkedin.com/in/username"
                  InputProps={{
                    startAdornment: <LinkedIn sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={personalInfo.showLinkedIn !== false}
                      onChange={(e) => updatePersonalInfo('showLinkedIn', e.target.checked)}
                    />
                  }
                  label="Show LinkedIn on resume"
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Website"
                  value={personalInfo.website || ''}
                  onChange={(e) => updatePersonalInfo('website', e.target.value)}
                  placeholder="www.yourwebsite.com"
                  InputProps={{
                    startAdornment: <Language sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={personalInfo.showWebsite !== false}
                      onChange={(e) => updatePersonalInfo('showWebsite', e.target.checked)}
                    />
                  }
                  label="Show website on resume"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
