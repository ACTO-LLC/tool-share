import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Handyman,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toolsApi, Tool as ApiTool } from '../services/api';

// Mock data for fallback
import { getToolsByOwner, mockCurrentUser } from '../data/mockData';

// Flag to enable/disable mock data fallback
const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export default function MyTools() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTool, setSelectedTool] = useState<ApiTool | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch tools from API
  const {
    data: apiTools,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['tools', 'my'],
    queryFn: toolsApi.getMyTools,
    retry: USE_MOCK_FALLBACK ? 1 : 3,
  });

  // Delete (archive) mutation
  const deleteMutation = useMutation({
    mutationFn: toolsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      setDeleteDialogOpen(false);
      handleMenuClose();
    },
  });

  // Update status mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'available' | 'unavailable' }) =>
      toolsApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      handleMenuClose();
    },
  });

  // Handle mock data fallback
  const mockTools = useMemo(() => {
    if (!USE_MOCK_FALLBACK) return [];
    return getToolsByOwner(mockCurrentUser.id);
  }, []);

  // Determine which data to use
  const shouldUseMock = USE_MOCK_FALLBACK && (isError || !apiTools);
  const myTools: ApiTool[] = shouldUseMock
    ? (mockTools as unknown as ApiTool[])
    : (apiTools || []);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    tool: ApiTool
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedTool(tool);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTool(null);
  };

  const handleToggleAvailability = () => {
    if (!selectedTool) return;

    if (shouldUseMock) {
      console.log('Toggle availability for:', selectedTool.id);
      handleMenuClose();
      return;
    }

    const newStatus = selectedTool.status === 'available' ? 'unavailable' : 'available';
    updateMutation.mutate({ id: selectedTool.id, status: newStatus });
  };

  const handleDelete = () => {
    if (!selectedTool) return;

    if (shouldUseMock) {
      console.log('Delete tool:', selectedTool.id);
      setDeleteDialogOpen(false);
      handleMenuClose();
      return;
    }

    deleteMutation.mutate(selectedTool.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'unavailable':
        return 'warning';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4">My Tools</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/my-tools/add')}
        >
          Add Tool
        </Button>
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {isError && !shouldUseMock && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load your tools. Please try again later.
        </Alert>
      )}

      {/* Mock Data Warning */}
      {shouldUseMock && !isLoading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing sample data. Connect to the API for live data.
        </Alert>
      )}

      {!isLoading && myTools.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Handyman sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              You haven't listed any tools yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Share your tools with friends and neighbors
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/my-tools/add')}
            >
              Add Your First Tool
            </Button>
          </CardContent>
        </Card>
      ) : !isLoading ? (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            You have {myTools.length} tool{myTools.length !== 1 ? 's' : ''} listed.
            Click on a tool to view details or use the menu to manage it.
          </Alert>
          <Grid container spacing={3}>
            {myTools.map((tool) => (
              <Grid item xs={12} sm={6} md={4} key={tool.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': { boxShadow: 4 },
                  }}
                  onClick={() => navigate(`/tools/${tool.id}`)}
                >
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'grey.100' },
                    }}
                    onClick={(e) => handleMenuOpen(e, tool)}
                  >
                    <MoreVert />
                  </IconButton>
                  <CardMedia
                    sx={{
                      height: 180,
                      bgcolor: 'grey.200',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    image={tool.photos?.[0]?.url}
                  >
                    {!tool.photos?.[0]?.url && (
                      <Handyman sx={{ fontSize: 64, color: 'grey.400' }} />
                    )}
                  </CardMedia>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" noWrap sx={{ flex: 1 }}>
                        {tool.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      <Chip
                        label={tool.status}
                        size="small"
                        color={getStatusColor(tool.status)}
                      />
                      <Chip label={tool.category} size="small" variant="outlined" />
                    </Box>
                    {tool.brand && (
                      <Typography variant="body2" color="text.secondary">
                        {tool.brand} {tool.model}
                      </Typography>
                    )}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {tool.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ) : null}

      {/* Tool Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem
          onClick={() => {
            navigate(`/tools/${selectedTool?.id}`);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate(`/my-tools/edit/${selectedTool?.id}`);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={handleToggleAvailability}
          disabled={updateMutation.isPending}
        >
          <ListItemIcon>
            {selectedTool?.status === 'available' ? (
              <VisibilityOff fontSize="small" />
            ) : (
              <Visibility fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedTool?.status === 'available'
              ? 'Mark Unavailable'
              : 'Mark Available'}
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Tool?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedTool?.name}"? This will archive
            the tool and it will no longer appear in search results.
          </Typography>
          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Failed to delete tool. Please try again.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
