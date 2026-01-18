import { Box, Typography, Card, CardContent, TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';

const categories = [
  'Power Tools',
  'Hand Tools',
  'Garden/Yard',
  'Automotive',
  'Kitchen',
  'Camping/Outdoor',
  'Electronics',
  'Other',
];

const validationSchema = yup.object({
  name: yup.string().required('Name is required'),
  description: yup.string(),
  category: yup.string().required('Category is required'),
  brand: yup.string(),
  model: yup.string(),
});

export default function AddTool() {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      category: '',
      brand: '',
      model: '',
      upc: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      // TODO: Submit to API
      console.log('Submitting:', values);
      navigate('/my-tools');
    },
  });

  const handleUpcLookup = async () => {
    if (!formik.values.upc) return;
    // TODO: Call UPCitemdb API to auto-populate fields
    console.log('Looking up UPC:', formik.values.upc);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Add New Tool
      </Typography>

      <Card>
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    name="upc"
                    label="UPC/Barcode (optional)"
                    value={formik.values.upc}
                    onChange={formik.handleChange}
                    placeholder="Scan or enter barcode to auto-fill"
                  />
                  <Button variant="outlined" onClick={handleUpcLookup}>
                    Lookup
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  name="name"
                  label="Tool Name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formik.values.category}
                    label="Category"
                    onChange={formik.handleChange}
                    error={formik.touched.category && Boolean(formik.errors.category)}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="brand"
                  label="Brand"
                  value={formik.values.brand}
                  onChange={formik.handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="model"
                  label="Model"
                  value={formik.values.model}
                  onChange={formik.handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="description"
                  label="Description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  placeholder="Describe the tool, its condition, any accessories included..."
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Photos
                </Typography>
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: 'grey.300',
                    borderRadius: 1,
                    p: 4,
                    textAlign: 'center',
                  }}
                >
                  <Typography color="text.secondary">
                    Drag and drop photos here, or click to select
                  </Typography>
                  {/* TODO: Add photo upload component */}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button onClick={() => navigate('/my-tools')}>Cancel</Button>
                  <Button type="submit" variant="contained">
                    Add Tool
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
