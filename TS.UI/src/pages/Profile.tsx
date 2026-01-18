import { Box, Typography, Card, CardContent, TextField, Button, Grid, Avatar } from '@mui/material';
import { useMsal } from '@azure/msal-react';
import { useFormik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
  displayName: yup.string().required('Display name is required'),
  email: yup.string().email('Invalid email'),
  phone: yup.string(),
  streetAddress: yup.string(),
  city: yup.string(),
  state: yup.string(),
  zipCode: yup.string(),
  bio: yup.string().max(500, 'Bio must be 500 characters or less'),
});

export default function Profile() {
  const { accounts } = useMsal();
  const account = accounts[0];

  // TODO: Fetch user profile from API
  const formik = useFormik({
    initialValues: {
      displayName: account?.name || '',
      email: account?.username || '',
      phone: '',
      streetAddress: '',
      city: '',
      state: 'CA',
      zipCode: '',
      bio: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      // TODO: Submit to API
      console.log('Updating profile:', values);
    },
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar sx={{ width: 80, height: 80, mr: 3 }}>
              {account?.name?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h6">{account?.name || 'User'}</Typography>
              <Typography color="text.secondary">{account?.username}</Typography>
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
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  name="city"
                  label="City"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  name="state"
                  label="State"
                  value={formik.values.state}
                  onChange={formik.handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  name="zipCode"
                  label="ZIP Code"
                  value={formik.values.zipCode}
                  onChange={formik.handleChange}
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
                  error={formik.touched.bio && Boolean(formik.errors.bio)}
                  helperText={formik.touched.bio && formik.errors.bio}
                />
              </Grid>

              <Grid item xs={12}>
                <Button type="submit" variant="contained">
                  Save Changes
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
