import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Avatar,
  Alert,
  Snackbar,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import { useFormik } from 'formik';
import { useAuth } from '../auth';
import * as yup from 'yup';
import { useCurrentUser, useUpdateProfile } from '../hooks/useUser';

const validationSchema = yup.object({
  displayName: yup.string().required('Display name is required').min(1, 'Display name is required'),
  phone: yup.string(),
  streetAddress: yup.string(),
  city: yup.string(),
  state: yup.string(),
  zipCode: yup.string(),
  bio: yup.string().max(500, 'Bio must be 500 characters or less'),
});

export default function Profile() {
  const { user } = useAuth();

  // API hooks
  const { data: userProfile, isLoading, error: fetchError } = useCurrentUser();
  const updateProfile = useUpdateProfile();

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const formik = useFormik({
    initialValues: {
      displayName: '',
      phone: '',
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
      bio: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await updateProfile.mutateAsync({
          displayName: values.displayName,
          phone: values.phone || undefined,
          streetAddress: values.streetAddress || undefined,
          city: values.city || undefined,
          state: values.state || undefined,
          zipCode: values.zipCode || undefined,
          bio: values.bio || undefined,
        });
        setSnackbar({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success',
        });
      } catch {
        setSnackbar({
          open: true,
          message: 'Failed to update profile. Please try again.',
          severity: 'error',
        });
      }
    },
  });

  // Update form values when user profile loads
  useEffect(() => {
    if (userProfile) {
      formik.setValues({
        displayName: userProfile.displayName || user?.name || '',
        phone: userProfile.phone || '',
        streetAddress: userProfile.streetAddress || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        zipCode: userProfile.zipCode || '',
        bio: userProfile.bio || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, user]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Loading state
  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Skeleton variant="circular" width={80} height={80} sx={{ mr: 3 }} />
              <Box>
                <Skeleton variant="text" width={150} height={32} />
                <Skeleton variant="text" width={200} height={24} />
              </Box>
            </Box>
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Skeleton variant="rectangular" height={56} />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load profile. Please try refreshing the page.
        </Alert>
      </Box>
    );
  }

  const displayEmail = userProfile?.email || user?.email || '';

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar
              src={userProfile?.avatarUrl}
              sx={{ width: 80, height: 80, mr: 3 }}
            >
              {(userProfile?.displayName || user?.name)?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {userProfile?.displayName || user?.name || 'User'}
              </Typography>
              <Typography color="text.secondary">{displayEmail}</Typography>
              {userProfile?.reputationScore !== undefined && userProfile.reputationScore > 0 && (
                <Typography variant="body2" color="text.secondary">
                  Reputation: {userProfile.reputationScore.toFixed(1)} / 5.0
                </Typography>
              )}
            </Box>
          </Box>

          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  name="displayName"
                  label="Display Name"
                  value={formik.values.displayName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.displayName && Boolean(formik.errors.displayName)}
                  helperText={formik.touched.displayName && formik.errors.displayName}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="phone"
                  label="Phone (optional)"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Pickup Address (visible only to confirmed borrowers)
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="streetAddress"
                  label="Street Address"
                  value={formik.values.streetAddress}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  name="city"
                  label="City"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  name="state"
                  label="State"
                  value={formik.values.state}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  name="zipCode"
                  label="ZIP Code"
                  value={formik.values.zipCode}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="bio"
                  label="Bio"
                  value={formik.values.bio}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.bio && Boolean(formik.errors.bio)}
                  helperText={
                    (formik.touched.bio && formik.errors.bio) ||
                    `${formik.values.bio.length}/500 characters`
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={updateProfile.isPending || !formik.dirty}
                  startIcon={updateProfile.isPending ? <CircularProgress size={20} /> : undefined}
                >
                  {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
