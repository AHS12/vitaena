import { useResumeStore } from '@/stores/resume-store';
import { PersonalInfo } from '@/types/resume';
import {
  CalendarToday,
  Email,
  Language,
  LinkedIn,
  LocationOn,
  Person,
  Phone,
  PhotoCamera,
  Public,
  Home,
  FamilyRestroom,
  DirectionsCar,
  Badge,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
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

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string | boolean | number) => {
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
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Card>
        <CardHeader
          title="Personal Information"
          sx={{ pb: { xs: 1, sm: 2 } }}
        />
        <Box sx={{ px: { xs: 2, sm: 2 }, pb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Add your basic contact information and professional details.
          </Typography>
        </Box>
        <CardContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Photo Upload */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Profile Photo
              </Typography>
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'center', sm: 'center' },
                gap: 2,
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <Avatar
                  src={personalInfo.photo || undefined}
                  sx={{ width: personalInfo.photoSize || 80, height: personalInfo.photoSize || 80 }}
                >
                  <Person />
                </Avatar>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'flex-start' } }}>
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
                      size="small"
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
              <Box sx={{ mt: 2, width: { xs: '100%', sm: 320 } }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Photo Size</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <Slider
                    value={personalInfo.photoSize || 80}
                    min={40}
                    max={140}
                    step={2}
                    onChange={(_, val) => updatePersonalInfo('photoSize', Array.isArray(val) ? val[0] : val)}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="px"
                    type="number"
                    value={personalInfo.photoSize || 80}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      updatePersonalInfo('photoSize', isNaN(v) ? 80 : Math.min(140, Math.max(40, v)));
                    }}
                    size="small"
                    sx={{ width: 90 }}
                  />
                </Stack>
              </Box>
            </Box>

            {/* Basic Information */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <TextField
                fullWidth
                label="Full Name"
                required
                value={personalInfo.name}
                onChange={(e) => updatePersonalInfo('name', e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              <TextField
                fullWidth
                label="Professional Title"
                value={personalInfo.title}
                onChange={(e) => updatePersonalInfo('title', e.target.value)}
                placeholder="e.g., Software Engineer, Marketing Manager"
                size="small"
              />
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={personalInfo.showTitle !== false}
                  onChange={(e) => updatePersonalInfo('showTitle', e.target.checked)}
                />
              }
              label="Show title on resume"
              sx={{ mt: 1 }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={personalInfo.email}
                  size="small"
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
                  size="small"
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
                size="small"
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

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="LinkedIn"
                  value={personalInfo.linkedIn || ''}
                  onChange={(e) => updatePersonalInfo('linkedIn', e.target.value)}
                  placeholder="linkedin.com/in/username"
                  size="small"
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
                  size="small"
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

            {/* Personal Details */}
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Personal Details
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Day</InputLabel>
                    <Select
                      label="Day"
                      value={(personalInfo.dateOfBirth?.split(/[\/\-]/)[0]) || ''}
                      onChange={(e) => {
                        const parts = (personalInfo.dateOfBirth || '').split(/[\/\-]/);
                        const day = e.target.value as string;
                        const month = parts[1] || '';
                        const year = parts[2] || '';
                        const value = day && month && year ? `${day}/${month}/${year}` : `${day}/${month}/${year}`.replace(/\/?$/, '');
                        updatePersonalInfo('dateOfBirth', value);
                      }}
                    >
                      {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((d) => (
                        <MenuItem key={d} value={d}>{d}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Month</InputLabel>
                    <Select
                      label="Month"
                      value={(personalInfo.dateOfBirth?.split(/[\/\-]/)[1]) || ''}
                      onChange={(e) => {
                        const parts = (personalInfo.dateOfBirth || '').split(/[\/\-]/);
                        const day = parts[0] || '';
                        const month = e.target.value as string;
                        const year = parts[2] || '';
                        const value = day && month && year ? `${day}/${month}/${year}` : `${day}/${month}/${year}`.replace(/\/?$/, '');
                        updatePersonalInfo('dateOfBirth', value);
                      }}
                    >
                      {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((m) => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Year</InputLabel>
                    <Select
                      label="Year"
                      value={(personalInfo.dateOfBirth?.split(/[\/\-]/)[2]) || ''}
                      onChange={(e) => {
                        const parts = (personalInfo.dateOfBirth || '').split(/[\/\-]/);
                        const day = parts[0] || '';
                        const month = parts[1] || '';
                        const year = e.target.value as string;
                        const value = day && month && year ? `${day}/${month}/${year}` : `${day}/${month}/${year}`.replace(/\/?$/, '');
                        updatePersonalInfo('dateOfBirth', value);
                      }}
                    >
                      {Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString()).map((y) => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
                <FormControlLabel
                  control={
                    <Switch
                      checked={personalInfo.showDateOfBirth !== false}
                      onChange={(e) => updatePersonalInfo('showDateOfBirth', e.target.checked)}
                    />
                  }
                  label="Show date of birth on resume"
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Nationality"
                  value={personalInfo.nationality || ''}
                  onChange={(e) => updatePersonalInfo('nationality', e.target.value)}
                  placeholder="Your nationality"
                  size="small"
                  InputProps={{
                    startAdornment: <Public sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={personalInfo.showNationality !== false}
                      onChange={(e) => updatePersonalInfo('showNationality', e.target.checked)}
                    />
                  }
                  label="Show nationality on resume"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Permanent Address"
                  value={personalInfo.permanentAddress || ''}
                  onChange={(e) => updatePersonalInfo('permanentAddress', e.target.value)}
                  placeholder="Your permanent address"
                  size="small"
                  InputProps={{
                    startAdornment: <Home sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={personalInfo.showPermanentAddress !== false}
                      onChange={(e) => updatePersonalInfo('showPermanentAddress', e.target.checked)}
                    />
                  }
                  label="Show permanent address on resume"
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Marital Status"
                  value={personalInfo.maritalStatus || ''}
                  onChange={(e) => updatePersonalInfo('maritalStatus', e.target.value)}
                  placeholder="Single/Married/etc."
                  size="small"
                  InputProps={{
                    startAdornment: <FamilyRestroom sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={personalInfo.showMaritalStatus !== false}
                      onChange={(e) => updatePersonalInfo('showMaritalStatus', e.target.checked)}
                    />
                  }
                  label="Show marital status on resume"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Stack>

            <Box>
              <TextField
                fullWidth
                label="Driving License"
                value={personalInfo.drivingLicense || ''}
                onChange={(e) => updatePersonalInfo('drivingLicense', e.target.value)}
                placeholder="License number or type"
                size="small"
                InputProps={{
                  startAdornment: <DirectionsCar sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={personalInfo.showDrivingLicense !== false}
                    onChange={(e) => updatePersonalInfo('showDrivingLicense', e.target.checked)}
                  />
                }
                label="Show driving license on resume"
                sx={{ mt: 1 }}
              />
            </Box>

            {/* Identity Document */}
            <Box>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Identity Document
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                <TextField
                  fullWidth
                  label="ID Label"
                  value={personalInfo.idLabel || ''}
                  onChange={(e) => updatePersonalInfo('idLabel', e.target.value)}
                  placeholder="e.g., National ID, Passport"
                  size="small"
                  InputProps={{
                    startAdornment: <Badge sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  label="ID Value"
                  value={personalInfo.idValue || ''}
                  onChange={(e) => updatePersonalInfo('idValue', e.target.value)}
                  placeholder="e.g., 1234-5678-9012"
                  size="small"
                />
              </Stack>
              <FormControlLabel
                control={
                  <Switch
                    checked={personalInfo.showId !== false}
                    onChange={(e) => updatePersonalInfo('showId', e.target.checked)}
                  />
                }
                label="Show identity document on resume"
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
