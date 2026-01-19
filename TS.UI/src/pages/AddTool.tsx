import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Slider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { ArrowBack, Search, CloudUpload } from '@mui/icons-material';
import { TOOL_CATEGORIES } from '../types';

const validationSchema = yup.object({
  name: yup.string().required('Tool name is required').max(100),
  description: yup.string().max(1000),
  category: yup.string().required('Category is required'),
  brand: yup.string().max(100),
  model: yup.string().max(100),
  maxLoanDays: yup.number().min(1).max(30).required(),
  advanceNoticeDays: yup.number().min(0).max(14).required(),
});

export default function AddTool() {
  const navigate = useNavigate();
  const [upcLoading, setUpcLoading] = useState(false);
  const [upcError, setUpcError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      category: '',
      brand: '',
      model: '',
      upc: '',
      maxLoanDays: 7,
      advanceNoticeDays: 1,
    },
    validationSchema,
    onSubmit: async (values) => {
      // In a real app, this would call the API
      console.log('Submitting:', values);
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/my-tools');
      }, 1500);
    },
  });

  const handleUpcLookup = async () => {
    if (!formik.values.upc) return;

    setUpcLoading(true);
    setUpcError(null);

    try {
      // In a real app, this would call the backend API which calls UPCitemdb
      // For now, simulate a lookup
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock response - in real app this comes from UPCitemdb
      if (formik.values.upc === '885909950713') {
        formik.setValues({
          ...formik.values,
          name: 'DeWalt 20V MAX Cordless Drill',
          brand: 'DeWalt',
          model: 'DCD771C2',
          category: 'Power Tools',
        });
      } else {
        setUpcError('Product not found. Please enter details manually.');
      }
    } catch {
      setUpcError('Failed to lookup UPC. Please try again.');
    } finally {
      setUpcLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <IconButton onClick={() => navigate('/my-tools')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Add New Tool</Typography>
      </Box>

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Tool added successfully! Redirecting...
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              {/* UPC Lookup */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Quick Add (Optional)
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    name="upc"
                    label="UPC/Barcode"
                    value={formik.values.upc}
                    onChange={formik.handleChange}
                    placeholder="Scan or enter barcode to auto-fill"
                    disabled={upcLoading}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleUpcLookup}
                    disabled={!formik.values.upc || upcLoading}
                    startIcon={
                      upcLoading ? <CircularProgress size={20} /> : <Search />
                    }
                    sx={{ minWidth: 120 }}
                  >
                    Lookup
                  </Button>
                </Box>
                {upcError && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {upcError}
                  </Typography>
                )}
              </Grid>

              {/* Tool Name */}
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
                  placeholder="e.g., DeWalt Cordless Drill"
                />
              </Grid>

              {/* Category */}
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  required
                  error={formik.touched.category && Boolean(formik.errors.category)}
                >
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formik.values.category}
                    label="Category"
                    onChange={formik.handleChange}
                  >
                    {TOOL_CATEGORIES.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Brand */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="brand"
                  label="Brand"
                  value={formik.values.brand}
                  onChange={formik.handleChange}
                  placeholder="e.g., DeWalt, Makita, Milwaukee"
                />
              </Grid>

              {/* Model */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="model"
                  label="Model"
                  value={formik.values.model}
                  onChange={formik.handleChange}
                  placeholder="e.g., DCD771C2"
                />
              </Grid>

              {/* Max Loan Days */}
              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>
                  Maximum Loan Period: {formik.values.maxLoanDays} days
                </Typography>
                <Slider
                  name="maxLoanDays"
                  value={formik.values.maxLoanDays}
                  onChange={(_, value) =>
                    formik.setFieldValue('maxLoanDays', value)
                  }
                  min={1}
                  max={30}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 7, label: '7' },
                    { value: 14, label: '14' },
                    { value: 30, label: '30' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Grid>

              {/* Advance Notice */}
              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>
                  Advance Notice Required: {formik.values.advanceNoticeDays} day
                  {formik.values.advanceNoticeDays !== 1 ? 's' : ''}
                </Typography>
                <Slider
                  name="advanceNoticeDays"
                  value={formik.values.advanceNoticeDays}
                  onChange={(_, value) =>
                    formik.setFieldValue('advanceNoticeDays', value)
                  }
                  min={0}
                  max={14}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 1, label: '1' },
                    { value: 3, label: '3' },
                    { value: 7, label: '7' },
                    { value: 14, label: '14' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="description"
                  label="Description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  placeholder="Describe the tool, its condition, any accessories included, special instructions..."
                  helperText={`${formik.values.description.length}/1000 characters`}
                />
              </Grid>

              {/* Photos */}
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
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <CloudUpload
                    sx={{ fontSize: 48, color: 'grey.400', mb: 1 }}
                  />
                  <Typography color="text.secondary">
                    Drag and drop photos here, or click to select
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Upload up to 5 photos (max 5MB each)
                  </Typography>
                </Box>
              </Grid>

              {/* Circles */}
              <Grid item xs={12}>
                <Alert severity="info">
                  After adding your tool, you can share it with specific circles
                  from the tool details page.
                </Alert>
              </Grid>

              {/* Actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button onClick={() => navigate('/my-tools')}>Cancel</Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={formik.isSubmitting || submitSuccess}
                  >
                    {formik.isSubmitting ? 'Adding...' : 'Add Tool'}
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
