import { useState } from 'react';
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
import { getToolsByOwner, mockCurrentUser } from '../data/mockData';
import { Tool } from '../types';

export default function MyTools() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const myTools = getToolsByOwner(mockCurrentUser.id);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    tool: Tool
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
    // In a real app, this would call the API
    console.log('Toggle availability for:', selectedTool?.id);
    handleMenuClose();
  };

  const handleDelete = () => {
    // In a real app, this would call the API
    console.log('Delete tool:', selectedTool?.id);
    setDeleteDialogOpen(false);
    handleMenuClose();
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

      {myTools.length === 0 ? (
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
      ) : (
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
      )}

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
            // In a real app, navigate to edit page
            console.log('Edit tool:', selectedTool?.id);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleToggleAvailability}>
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
            Are you sure you want to delete "{selectedTool?.name}"? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
