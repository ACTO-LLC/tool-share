import { useState, useCallback } from 'react';
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
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { ArrowBack, Search, CloudUpload, Delete, Star, StarBorder } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toolsApi } from '../services/api';
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

interface PhotoPreview {
  file: File;
  preview: string;
  isPrimary: boolean;
  uploading?: boolean;
  uploaded?: boolean;
  id?: string;
  url?: string;
  error?: string;
}

export default function AddTool() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEditMode = !!editId;

  const [upcLoading, setUpcLoading] = useState(false);
  const [upcError, setUpcError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Fetch existing tool data if editing
  const { data: existingTool, isLoading: isLoadingTool } = useQuery({
    queryKey: ['tool', editId],
    queryFn: () => toolsApi.get(editId!),
    enabled: isEditMode,
  });

  // Create tool mutation
  const createToolMutation = useMutation({
    mutationFn: toolsApi.create,
    onSuccess: async (tool) => {
      // Upload photos after tool is created
      if (photos.length > 0) {
        setUploadingPhotos(true);
        for (const photo of photos) {
          if (photo.file && !photo.uploaded) {
            try {
              await toolsApi.uploadPhoto(tool.id, photo.file, photo.isPrimary);
            } catch (error) {
              console.error('Failed to upload photo:', error);
            }
          }
        }
        setUploadingPhotos(false);
      }
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      navigate('/my-tools');
    },
  });

  // Update tool mutation
  const updateToolMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof toolsApi.update>[1] }) =>
      toolsApi.update(id, data),
    onSuccess: async (tool) => {
      // Upload any new photos
      const newPhotos = photos.filter(p => p.file && !p.uploaded);
      if (newPhotos.length > 0) {
        setUploadingPhotos(true);
        for (const photo of newPhotos) {
          try {
            await toolsApi.uploadPhoto(tool.id, photo.file!, photo.isPrimary);
          } catch (error) {
            console.error('Failed to upload photo:', error);
          }
        }
        setUploadingPhotos(false);
      }
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      queryClient.invalidateQueries({ queryKey: ['tool', editId] });
      navigate('/my-tools');
    },
  });

  // Initialize form with existing data or defaults
  const formik = useFormik({
    initialValues: {
      name: existingTool?.name || '',
      description: existingTool?.description || '',
      category: existingTool?.category || '',
      brand: existingTool?.brand || '',
      model: existingTool?.model || '',
      upc: existingTool?.upc || '',
      maxLoanDays: existingTool?.maxLoanDays || 7,
      advanceNoticeDays: existingTool?.advanceNoticeDays || 1,
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      if (isEditMode && editId) {
        updateToolMutation.mutate({
          id: editId,
          data: {
            name: values.name,
            description: values.description || undefined,
            category: values.category,
            brand: values.brand || undefined,
            model: values.model || undefined,
            maxLoanDays: values.maxLoanDays,
            advanceNoticeDays: values.advanceNoticeDays,
          },
        });
      } else {
        createToolMutation.mutate({
          name: values.name,
          description: values.description || undefined,
          category: values.category,
          brand: values.brand || undefined,
          model: values.model || undefined,
          upc: values.upc || undefined,
          maxLoanDays: values.maxLoanDays,
          advanceNoticeDays: values.advanceNoticeDays,
        });
      }
    },
  });

  // Initialize photos from existing tool
  useState(() => {
    if (existingTool?.photos) {
      setPhotos(
        existingTool.photos.map((p) => ({
          file: null as unknown as File,
          preview: p.url,
          isPrimary: p.isPrimary,
          uploaded: true,
          id: p.id,
          url: p.url,
        }))
      );
    }
  });

  const handleUpcLookup = async () => {
    if (!formik.values.upc) return;

    setUpcLoading(true);
    setUpcError(null);

    try {
      const result = await toolsApi.lookupUpc(formik.values.upc);

      if (result.found) {
        formik.setValues({
          ...formik.values,
          name: result.name || formik.values.name,
          brand: result.brand || formik.values.brand,
          model: result.model || formik.values.model,
          description: result.description || formik.values.description,
          category: result.category || formik.values.category,
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

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPhotos: PhotoPreview[] = [];
    const maxPhotos = 5;
    const currentCount = photos.length;
    const availableSlots = maxPhotos - currentCount;

    for (let i = 0; i < Math.min(files.length, availableSlots); i++) {
      const file = files[i];

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        continue;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        continue;
      }

      const preview = URL.createObjectURL(file);
      newPhotos.push({
        file,
        preview,
        isPrimary: currentCount === 0 && i === 0, // First photo is primary
      });
    }

    setPhotos((prev) => [...prev, ...newPhotos]);

    // Reset input
    event.target.value = '';
  }, [photos.length]);

  const handleRemovePhoto = useCallback(async (index: number) => {
    const photo = photos[index];

    // If it's an existing photo (has id), delete from server
    if (photo.id && editId) {
      try {
        await toolsApi.deletePhoto(editId, photo.id);
      } catch (error) {
        console.error('Failed to delete photo:', error);
      }
    }

    // Revoke preview URL if it's a local file
    if (photo.file) {
      URL.revokeObjectURL(photo.preview);
    }

    setPhotos((prev) => {
      const newPhotos = prev.filter((_, i) => i !== index);
      // If we removed the primary photo, make the first one primary
      if (photo.isPrimary && newPhotos.length > 0) {
        newPhotos[0].isPrimary = true;
      }
      return newPhotos;
    });
  }, [photos, editId]);

  const handleSetPrimary = useCallback(async (index: number) => {
    const photo = photos[index];

    // If it's an existing photo, update on server
    if (photo.id && editId) {
      try {
        await toolsApi.setPhotoPrimary(editId, photo.id);
      } catch (error) {
        console.error('Failed to set primary photo:', error);
      }
    }

    setPhotos((prev) =>
      prev.map((p, i) => ({
        ...p,
        isPrimary: i === index,
      }))
    );
  }, [photos, editId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files) return;

    // Create a fake event to reuse the file select handler
    const fakeEvent = {
      target: { files, value: '' },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    handleFileSelect(fakeEvent);
  };

  const isSubmitting = createToolMutation.isPending || updateToolMutation.isPending || uploadingPhotos;
  const isSuccess = createToolMutation.isSuccess || updateToolMutation.isSuccess;

  if (isEditMode && isLoadingTool) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <IconButton onClick={() => navigate('/my-tools')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">{isEditMode ? 'Edit Tool' : 'Add New Tool'}</Typography>
      </Box>

      {isSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Tool {isEditMode ? 'updated' : 'added'} successfully! Redirecting...
        </Alert>
      )}

      {(createToolMutation.isError || updateToolMutation.isError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to {isEditMode ? 'update' : 'add'} tool. Please try again.
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              {/* UPC Lookup - only show for new tools */}
              {!isEditMode && (
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
              )}

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
                  disabled={isSubmitting}
                />
              </Grid>

              {/* Category */}
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  required
                  error={formik.touched.category && Boolean(formik.errors.category)}
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </Grid>

              {/* Photos */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Photos ({photos.length}/5)
                </Typography>

                {/* Photo previews */}
                {photos.length > 0 && (
                  <ImageList sx={{ mb: 2 }} cols={5} rowHeight={120}>
                    {photos.map((photo, index) => (
                      <ImageListItem key={index} sx={{ position: 'relative' }}>
                        <img
                          src={photo.preview}
                          alt={`Photo ${index + 1}`}
                          loading="lazy"
                          style={{ objectFit: 'cover', height: '100%', borderRadius: 4 }}
                        />
                        <ImageListItemBar
                          sx={{ background: 'transparent' }}
                          position="top"
                          actionIcon={
                            <Box sx={{ display: 'flex', gap: 0.5, p: 0.5 }}>
                              <IconButton
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.8)',
                                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                                }}
                                onClick={() => handleSetPrimary(index)}
                                title={photo.isPrimary ? 'Primary photo' : 'Set as primary'}
                              >
                                {photo.isPrimary ? (
                                  <Star sx={{ color: 'warning.main', fontSize: 18 }} />
                                ) : (
                                  <StarBorder sx={{ fontSize: 18 }} />
                                )}
                              </IconButton>
                              <IconButton
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.8)',
                                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                                }}
                                onClick={() => handleRemovePhoto(index)}
                                disabled={isSubmitting}
                              >
                                <Delete sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                          }
                        />
                        {photo.uploading && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'rgba(0,0,0,0.5)',
                            }}
                          >
                            <CircularProgress size={24} sx={{ color: 'white' }} />
                          </Box>
                        )}
                      </ImageListItem>
                    ))}
                  </ImageList>
                )}

                {/* Upload area */}
                {photos.length < 5 && (
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
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                      disabled={isSubmitting}
                    />
                    <CloudUpload
                      sx={{ fontSize: 48, color: 'grey.400', mb: 1 }}
                    />
                    <Typography color="text.secondary">
                      Drag and drop photos here, or click to select
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Upload up to {5 - photos.length} more photo{5 - photos.length !== 1 ? 's' : ''} (max 5MB each)
                    </Typography>
                  </Box>
                )}
              </Grid>

              {/* Circles */}
              <Grid item xs={12}>
                <Alert severity="info">
                  After {isEditMode ? 'saving' : 'adding'} your tool, you can share it with specific circles
                  from the tool details page.
                </Alert>
              </Grid>

              {/* Actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    onClick={() => navigate('/my-tools')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting || isSuccess}
                  >
                    {isSubmitting ? (
                      uploadingPhotos ? 'Uploading photos...' : 'Saving...'
                    ) : isEditMode ? (
                      'Save Changes'
                    ) : (
                      'Add Tool'
                    )}
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
