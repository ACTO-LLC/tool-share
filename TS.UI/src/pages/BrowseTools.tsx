import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Rating,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ViewModule,
  ViewList,
  Handyman,
  LocationOn,
} from '@mui/icons-material';
import { getAvailableTools, mockCurrentUser } from '../data/mockData';
import { TOOL_CATEGORIES } from '../types';

export default function BrowseTools() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const availableTools = getAvailableTools();

  // Filter tools based on search and category
  const filteredTools = useMemo(() => {
    return availableTools.filter((tool) => {
      // Don't show user's own tools
      if (tool.ownerId === mockCurrentUser.id) return false;

      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.model?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        categoryFilter === '' || tool.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [availableTools, searchQuery, categoryFilter]);

  const handleViewChange = (
    _: React.MouseEvent<HTMLElement>,
    newView: 'grid' | 'list' | null
  ) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Browse Tools
      </Typography>

      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {TOOL_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2} md={1}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewChange}
              size="small"
            >
              <ToggleButton value="grid">
                <ViewModule />
              </ToggleButton>
              <ToggleButton value="list">
                <ViewList />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Box>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}{' '}
        available
      </Typography>

      {/* Tools Grid/List */}
      {filteredTools.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Handyman sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No tools found
          </Typography>
          <Typography color="text.secondary">
            Try adjusting your search or filters
          </Typography>
        </Box>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {filteredTools.map((tool) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={tool.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                }}
                onClick={() => navigate(`/tools/${tool.id}`)}
              >
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
                  <Typography variant="h6" gutterBottom noWrap>
                    {tool.name}
                  </Typography>
                  <Chip label={tool.category} size="small" sx={{ mb: 1 }} />
                  {tool.brand && (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {tool.brand} {tool.model}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mt: 2,
                      gap: 1,
                    }}
                  >
                    <Avatar
                      sx={{ width: 24, height: 24, fontSize: 12 }}
                      src={tool.owner?.avatarUrl}
                    >
                      {tool.owner?.displayName?.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {tool.owner?.displayName}
                    </Typography>
                    {tool.owner?.reputationScore && (
                      <Rating
                        value={tool.owner.reputationScore}
                        size="small"
                        precision={0.1}
                        readOnly
                        sx={{ ml: 'auto' }}
                      />
                    )}
                  </Box>
                  {tool.owner?.city && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mt: 1,
                        color: 'text.secondary',
                      }}
                    >
                      <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="body2">
                        {tool.owner.city}, {tool.owner.state}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        // List View
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredTools.map((tool) => (
            <Card
              key={tool.id}
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
              onClick={() => navigate(`/tools/${tool.id}`)}
            >
              <Box sx={{ display: 'flex' }}>
                <CardMedia
                  sx={{
                    width: 150,
                    height: 120,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  image={tool.photos?.[0]?.url}
                >
                  {!tool.photos?.[0]?.url && (
                    <Handyman sx={{ fontSize: 48, color: 'grey.400' }} />
                  )}
                </CardMedia>
                <CardContent sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box>
                      <Typography variant="h6">{tool.name}</Typography>
                      <Chip label={tool.category} size="small" sx={{ mr: 1 }} />
                      {tool.brand && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          component="span"
                        >
                          {tool.brand} {tool.model}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {tool.owner?.displayName}
                        </Typography>
                        <Avatar
                          sx={{ width: 24, height: 24, fontSize: 12 }}
                          src={tool.owner?.avatarUrl}
                        >
                          {tool.owner?.displayName?.charAt(0)}
                        </Avatar>
                      </Box>
                      {tool.owner?.reputationScore && (
                        <Rating
                          value={tool.owner.reputationScore}
                          size="small"
                          precision={0.1}
                          readOnly
                        />
                      )}
                    </Box>
                  </Box>
                  {tool.description && (
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
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mt: 1,
                      gap: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Max {tool.maxLoanDays} days
                    </Typography>
                    {tool.owner?.city && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {tool.owner.city}, {tool.owner.state}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
