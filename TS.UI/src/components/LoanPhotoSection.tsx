import { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Tooltip,
} from '@mui/material';
import {
  PhotoCamera,
  CloudUpload,
  ZoomIn,
  Close,
  CompareArrows,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { LoanPhoto, reservationApi, ApiError } from '../services/api';

// Check if we should use real API
const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

interface LoanPhotoSectionProps {
  reservationId: string;
  reservationStatus: string;
  isBorrower: boolean;
  isOwner: boolean;
  beforePhotos: LoanPhoto[];
  afterPhotos: LoanPhoto[];
  onPhotosUpdated: () => void;
}

export default function LoanPhotoSection({
  reservationId,
  reservationStatus,
  isBorrower,
  isOwner,
  beforePhotos,
  afterPhotos,
  onPhotosUpdated,
}: LoanPhotoSectionProps) {
  const [uploading, setUploading] = useState<'before' | 'after' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'before' | 'after'>('before');
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine what can be uploaded based on status
  const canUploadBefore =
    (isBorrower || isOwner) &&
    ['confirmed', 'active'].includes(reservationStatus);
  const canUploadAfter =
    (isBorrower || isOwner) && reservationStatus === 'active';

  const handleOpenUploadDialog = (type: 'before' | 'after') => {
    setUploadType(type);
    setUploadNotes('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setUploadDialogOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File is too large. Maximum size is 5MB.');
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploading(uploadType);
    setError(null);

    try {
      if (USE_REAL_API) {
        await reservationApi.uploadPhoto(
          reservationId,
          selectedFile,
          uploadType,
          uploadNotes || undefined
        );
      } else {
        // Mock upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Mock upload:', { reservationId, type: uploadType, notes: uploadNotes });
      }

      setUploadDialogOpen(false);
      onPhotosUpdated();
    } catch (err) {
      console.error('Upload failed:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to upload photo. Please try again.');
      }
    } finally {
      setUploading(null);
    }
  }, [selectedFile, uploadType, uploadNotes, reservationId, onPhotosUpdated]);

  const handleCloseUploadDialog = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const PhotoGrid = ({ photos, type, canUpload }: { photos: LoanPhoto[]; type: 'before' | 'after'; canUpload: boolean }) => (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {type === 'before' ? 'Before (Pickup)' : 'After (Return)'}
        </Typography>
        {canUpload && (
          <Button
            size="small"
            startIcon={<CloudUpload />}
            onClick={() => handleOpenUploadDialog(type)}
            disabled={uploading !== null}
          >
            Upload
          </Button>
        )}
      </Box>

      {photos.length === 0 ? (
        <Box
          sx={{
            height: 150,
            bgcolor: 'grey.100',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
          }}
        >
          <PhotoCamera sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No photos uploaded
          </Typography>
          {canUpload && (
            <Button
              size="small"
              onClick={() => handleOpenUploadDialog(type)}
              sx={{ mt: 1 }}
            >
              Add Photo
            </Button>
          )}
        </Box>
      ) : (
        <ImageList cols={photos.length === 1 ? 1 : 2} gap={8}>
          {photos.map((photo) => (
            <ImageListItem
              key={photo.id}
              sx={{
                cursor: 'pointer',
                borderRadius: 1,
                overflow: 'hidden',
                '&:hover': { opacity: 0.9 },
              }}
              onClick={() => setViewImageUrl(photo.url)}
            >
              <img
                src={photo.url}
                alt={`${type} photo`}
                loading="lazy"
                style={{ height: 120, objectFit: 'cover' }}
              />
              <ImageListItemBar
                subtitle={format(parseISO(photo.uploadedAt), 'MMM d, h:mm a')}
                actionIcon={
                  <Tooltip title="View full size">
                    <IconButton sx={{ color: 'white' }} size="small">
                      <ZoomIn />
                    </IconButton>
                  </Tooltip>
                }
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Paper>
  );

  // Show different views based on reservation status
  const showPhotosSection =
    ['confirmed', 'active', 'completed'].includes(reservationStatus);

  if (!showPhotosSection) {
    return null;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhotoCamera /> Condition Photos
        </Typography>
        {beforePhotos.length > 0 && afterPhotos.length > 0 && (
          <Button
            size="small"
            startIcon={<CompareArrows />}
            onClick={() => setCompareMode(true)}
          >
            Compare
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <PhotoGrid
            photos={beforePhotos}
            type="before"
            canUpload={canUploadBefore}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <PhotoGrid
            photos={afterPhotos}
            type="after"
            canUpload={canUploadAfter}
          />
        </Grid>
      </Grid>

      {/* Required photo hints */}
      {isBorrower && reservationStatus === 'confirmed' && beforePhotos.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Please upload at least one "before" photo before confirming pickup.
        </Alert>
      )}
      {isBorrower && reservationStatus === 'active' && afterPhotos.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Please upload at least one "after" photo before confirming return.
        </Alert>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Upload {uploadType === 'before' ? 'Before' : 'After'} Photo
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {uploadType === 'before'
              ? 'Upload a photo showing the condition of the tool at pickup.'
              : 'Upload a photo showing the condition of the tool at return.'}
          </Typography>

          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {previewUrl ? (
            <Box sx={{ position: 'relative', textAlign: 'center', mb: 2 }}>
              <img
                src={previewUrl}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
              />
              <IconButton
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'background.paper',
                }}
                onClick={() => {
                  setSelectedFile(null);
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }}
              >
                <Close />
              </IconButton>
            </Box>
          ) : (
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                mb: 2,
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography>Click to select a photo</Typography>
              <Typography variant="caption" color="text.secondary">
                JPEG, PNG, GIF, or WebP (max 5MB)
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label="Notes (optional)"
            placeholder="Add any notes about the tool condition..."
            multiline
            rows={2}
            value={uploadNotes}
            onChange={(e) => setUploadNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={uploading !== null}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploading !== null}
            startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Image Dialog */}
      <Dialog
        open={!!viewImageUrl}
        onClose={() => setViewImageUrl(null)}
        maxWidth="lg"
      >
        <DialogContent sx={{ p: 0 }}>
          {viewImageUrl && (
            <img
              src={viewImageUrl}
              alt="Full size"
              style={{ maxWidth: '100%', display: 'block' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewImageUrl(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Compare Mode Dialog */}
      <Dialog
        open={compareMode}
        onClose={() => setCompareMode(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareArrows />
            Side-by-Side Comparison
          </Box>
          <IconButton onClick={() => setCompareMode(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Before (Pickup)
              </Typography>
              {beforePhotos.length > 0 ? (
                <img
                  src={beforePhotos[0].url}
                  alt="Before"
                  style={{ width: '100%', borderRadius: 8 }}
                />
              ) : (
                <Box sx={{ height: 200, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No photo</Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                After (Return)
              </Typography>
              {afterPhotos.length > 0 ? (
                <img
                  src={afterPhotos[0].url}
                  alt="After"
                  style={{ width: '100%', borderRadius: 8 }}
                />
              ) : (
                <Box sx={{ height: 200, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No photo</Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
