import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  CircularProgress,
  Alert,
  Pagination,
  Button,
  Drawer,
  IconButton,
  Divider,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  ViewModule,
  ViewList,
  Handyman,
  LocationOn,
  FilterList,
  Close,
  Clear,
  Sort,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isValid } from 'date-fns';
import { toolsApi, Tool as ApiTool, circlesApi, Circle } from '../services/api';
import { TOOL_CATEGORIES } from '../types';

// Use mock data as fallback when API is unavailable
import { getAvailableTools, mockCurrentUser } from '../data/mockData';
import { Tool as MockTool } from '../types';

// Flag to enable/disable mock data fallback
const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// Debounce delay in milliseconds
const SEARCH_DEBOUNCE_DELAY = 300;

// Sort options
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'dateAdded', label: 'Date Added' },
  { value: 'nameAsc', label: 'Name A-Z' },
  { value: 'nameDesc', label: 'Name Z-A' },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]['value'];

interface FilterState {
  q: string;
  category: string;
  circleId: string;
  ownerId: string;
  sortBy: SortOption;
  availableFrom: Date | null;
  availableTo: Date | null;
}

export default function BrowseTools() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter drawer state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Initialize filter state from URL params
  const getInitialFilters = useCallback((): FilterState => {
    const fromDate = searchParams.get('availableFrom');
    const toDate = searchParams.get('availableTo');
    return {
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      circleId: searchParams.get('circleId') || '',
      ownerId: searchParams.get('ownerId') || '',
      sortBy: (searchParams.get('sortBy') as SortOption) || 'relevance',
      availableFrom: fromDate ? parseISO(fromDate) : null,
      availableTo: toDate ? parseISO(toDate) : null,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<FilterState>(getInitialFilters);
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);

  // Debounced search: separate state for input value and debounced filter value
  const [searchInputValue, setSearchInputValue] = useState(filters.q);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update debounced search filter when input changes
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer to update the actual filter
    debounceTimerRef.current = setTimeout(() => {
      if (searchInputValue !== filters.q) {
        setFilters(prev => ({ ...prev, q: searchInputValue }));
        setPage(1);
      }
    }, SEARCH_DEBOUNCE_DELAY);

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchInputValue, filters.q]);

  // Sync URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.category) params.set('category', filters.category);
    if (filters.circleId) params.set('circleId', filters.circleId);
    if (filters.ownerId) params.set('ownerId', filters.ownerId);
    if (filters.sortBy && filters.sortBy !== 'relevance') params.set('sortBy', filters.sortBy);
    if (filters.availableFrom && isValid(filters.availableFrom)) {
      params.set('availableFrom', format(filters.availableFrom, 'yyyy-MM-dd'));
    }
    if (filters.availableTo && isValid(filters.availableTo)) {
      params.set('availableTo', format(filters.availableTo, 'yyyy-MM-dd'));
    }
    if (page > 1) params.set('page', page.toString());

    setSearchParams(params, { replace: true });
  }, [filters, page, setSearchParams]);

  // Fetch circles for filter dropdown
  const { data: circles } = useQuery({
    queryKey: ['circles'],
    queryFn: circlesApi.list,
    staleTime: 300000, // 5 minutes
  });

  // Fetch tools from API
  const {
    data: apiResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['tools', 'browse', filters, page],
    queryFn: async () => {
      const params = {
        q: filters.q || undefined,
        category: filters.category || undefined,
        circleId: filters.circleId || undefined,
        ownerId: filters.ownerId || undefined,
        sortBy: filters.sortBy,
        availableFrom: filters.availableFrom && isValid(filters.availableFrom)
          ? format(filters.availableFrom, 'yyyy-MM-dd')
          : undefined,
        availableTo: filters.availableTo && isValid(filters.availableTo)
          ? format(filters.availableTo, 'yyyy-MM-dd')
          : undefined,
        page,
        pageSize,
      };

      // If search query is provided, use search endpoint
      if (filters.q) {
        return toolsApi.search(params);
      }
      // Otherwise use browse endpoint
      return toolsApi.browse(params);
    },
    staleTime: 30000, // 30 seconds
    retry: USE_MOCK_FALLBACK ? 1 : 3,
  });

  // Handle mock data fallback
  const mockTools = useMemo(() => {
    if (!USE_MOCK_FALLBACK) return [];
    return getAvailableTools().filter((tool: MockTool) => {
      // Don't show user's own tools
      if (tool.ownerId === mockCurrentUser.id) return false;
      return true;
    });
  }, []);

  // Determine which data to use
  const shouldUseMock = USE_MOCK_FALLBACK && (isError || !apiResponse);

  // Normalize tools to common format
  const tools: ApiTool[] = useMemo(() => {
    if (shouldUseMock) {
      // Convert mock tools to API format and apply filters
      let filtered = mockTools as unknown as ApiTool[];

      // Apply search filter
      if (filters.q) {
        const query = filters.q.toLowerCase();
        filtered = filtered.filter(tool =>
          tool.name.toLowerCase().includes(query) ||
          tool.description?.toLowerCase().includes(query) ||
          tool.brand?.toLowerCase().includes(query) ||
          tool.model?.toLowerCase().includes(query)
        );
      }

      // Apply category filter
      if (filters.category) {
        filtered = filtered.filter(tool => tool.category === filters.category);
      }

      // Apply sorting
      if (filters.sortBy === 'nameAsc') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      } else if (filters.sortBy === 'nameDesc') {
        filtered.sort((a, b) => b.name.localeCompare(a.name));
      } else if (filters.sortBy === 'dateAdded') {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      return filtered;
    }
    return apiResponse?.tools || [];
  }, [shouldUseMock, mockTools, apiResponse, filters]);

  const total = shouldUseMock ? tools.length : (apiResponse?.total || 0);
  const totalPages = Math.ceil(total / pageSize);

  // Count active filters for badge (excludes category since it has its own chip row)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    // Note: category is excluded since it's visible in the dedicated category chips row
    if (filters.circleId) count++;
    if (filters.ownerId) count++;
    if (filters.availableFrom) count++;
    if (filters.availableTo) count++;
    if (filters.sortBy !== 'relevance') count++;
    return count;
  }, [filters]);

  const handleViewChange = (
    _: React.MouseEvent<HTMLElement>,
    newView: 'grid' | 'list' | null
  ) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Update input value immediately (for responsive UI)
    setSearchInputValue(e.target.value);
    // The actual filter update is debounced via useEffect
  };

  const handleSortChange = (sortBy: SortOption) => {
    setFilters(prev => ({ ...prev, sortBy }));
    setPage(1);
  };

  const openFilterDrawer = () => {
    setTempFilters(filters);
    setFilterDrawerOpen(true);
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setPage(1);
    setFilterDrawerOpen(false);
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      q: filters.q, // Keep search query
      category: '',
      circleId: '',
      ownerId: '',
      sortBy: 'relevance',
      availableFrom: null,
      availableTo: null,
    };
    setTempFilters(clearedFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      q: '',
      category: '',
      circleId: '',
      ownerId: '',
      sortBy: 'relevance',
      availableFrom: null,
      availableTo: null,
    };
    setSearchInputValue('');
    setFilters(clearedFilters);
    setPage(1);
  };

  const removeFilter = (filterKey: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: filterKey === 'sortBy' ? 'relevance' : (filterKey === 'availableFrom' || filterKey === 'availableTo') ? null : '',
    }));
    setPage(1);
  };

  // Filter chips for active filters (excluding category which has its own chip row)
  const renderFilterChips = () => {
    const chips: JSX.Element[] = [];

    // Category is now shown in dedicated chip row above, so we skip it here

    if (filters.circleId && circles) {
      const circle = circles.find(c => c.id === filters.circleId);
      chips.push(
        <Chip
          key="circle"
          label={`Circle: ${circle?.name || 'Unknown'}`}
          onDelete={() => removeFilter('circleId')}
          size="small"
          sx={{ minHeight: { xs: 32, sm: 24 } }}
        />
      );
    }

    if (filters.ownerId) {
      // Get owner name from tools if available
      const ownerName = tools.length > 0 && tools[0].owner?.displayName
        ? tools[0].owner.displayName
        : 'Owner';
      chips.push(
        <Chip
          key="owner"
          label={`Owner: ${ownerName}`}
          onDelete={() => removeFilter('ownerId')}
          size="small"
          sx={{ minHeight: { xs: 32, sm: 24 } }}
        />
      );
    }

    if (filters.availableFrom) {
      chips.push(
        <Chip
          key="availableFrom"
          label={`From: ${format(filters.availableFrom, 'MMM d, yyyy')}`}
          onDelete={() => removeFilter('availableFrom')}
          size="small"
          sx={{ minHeight: { xs: 32, sm: 24 } }}
        />
      );
    }

    if (filters.availableTo) {
      chips.push(
        <Chip
          key="availableTo"
          label={`To: ${format(filters.availableTo, 'MMM d, yyyy')}`}
          onDelete={() => removeFilter('availableTo')}
          size="small"
          sx={{ minHeight: { xs: 32, sm: 24 } }}
        />
      );
    }

    if (filters.sortBy !== 'relevance') {
      const sortLabel = SORT_OPTIONS.find(s => s.value === filters.sortBy)?.label;
      chips.push(
        <Chip
          key="sortBy"
          label={`Sort: ${sortLabel}`}
          onDelete={() => removeFilter('sortBy')}
          size="small"
          sx={{ minHeight: { xs: 32, sm: 24 } }}
        />
      );
    }

    return chips;
  };

  // Filter drawer content
  const filterDrawerContent = (
    <Box sx={{ width: { xs: '100vw', sm: 320 }, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <IconButton onClick={() => setFilterDrawerOpen(false)} sx={{ minWidth: 48, minHeight: 48 }}>
          <Close />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Stack spacing={3}>
          {/* Category Filter */}
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={tempFilters.category}
              label="Category"
              onChange={(e) => setTempFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <MenuItem value="">All Categories</MenuItem>
              {TOOL_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Circle Filter */}
          <FormControl fullWidth>
            <InputLabel>Circle</InputLabel>
            <Select
              value={tempFilters.circleId}
              label="Circle"
              onChange={(e) => setTempFilters(prev => ({ ...prev, circleId: e.target.value }))}
            >
              <MenuItem value="">All Circles</MenuItem>
              {circles?.map((circle: Circle) => (
                <MenuItem key={circle.id} value={circle.id}>
                  {circle.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Range Filters */}
          <Typography variant="subtitle2" color="text.secondary">
            Availability Date Range
          </Typography>
          <DatePicker
            label="Available From"
            value={tempFilters.availableFrom}
            onChange={(date) => setTempFilters(prev => ({ ...prev, availableFrom: date }))}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'medium',
              },
            }}
          />
          <DatePicker
            label="Available To"
            value={tempFilters.availableTo}
            onChange={(date) => setTempFilters(prev => ({ ...prev, availableTo: date }))}
            minDate={tempFilters.availableFrom || undefined}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'medium',
              },
            }}
          />

          {/* Sort Options */}
          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={tempFilters.sortBy}
              label="Sort By"
              onChange={(e) => setTempFilters(prev => ({ ...prev, sortBy: e.target.value as SortOption }))}
            >
              {SORT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </LocalizationProvider>

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          onClick={clearFilters}
          startIcon={<Clear />}
          fullWidth
          sx={{ minHeight: 48 }}
        >
          Clear
        </Button>
        <Button
          variant="contained"
          onClick={applyFilters}
          fullWidth
          sx={{ minHeight: 48 }}
        >
          Apply Filters
        </Button>
      </Stack>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
        Browse Tools
      </Typography>

      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search Field */}
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              fullWidth
              placeholder="Search tools..."
              value={searchInputValue}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchInputValue ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchInputValue('');
                        setFilters(prev => ({ ...prev, q: '' }));
                        setPage(1);
                      }}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: { minHeight: { xs: 48, sm: 40 } },
              }}
            />
          </Grid>

          {/* Category Select - Hidden on mobile, shown in drawer */}
          {!isMobile && (
            <Grid item sm={4} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, category: e.target.value }));
                    setPage(1);
                  }}
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
          )}

          {/* Sort Select - Desktop only */}
          {!isTablet && (
            <Grid item md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Sort"
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  startAdornment={
                    <InputAdornment position="start">
                      <Sort fontSize="small" />
                    </InputAdornment>
                  }
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Filter Button and View Toggle */}
          <Grid item xs={12} sm={2} md={2}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={openFilterDrawer}
                sx={{
                  minWidth: { xs: 'auto', sm: 100 },
                  minHeight: 48,
                  flex: { xs: 1, sm: 'none' },
                }}
              >
                {isMobile ? '' : 'Filters'}
                {activeFilterCount > 0 && (
                  <Chip
                    label={activeFilterCount}
                    size="small"
                    color="primary"
                    sx={{ ml: 1, minWidth: 24, height: 24 }}
                  />
                )}
              </Button>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewChange}
                size="small"
              >
                <ToggleButton value="grid" sx={{ minWidth: 48, minHeight: 48 }}>
                  <ViewModule />
                </ToggleButton>
                <ToggleButton value="list" sx={{ minWidth: 48, minHeight: 48 }}>
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Category Chips for quick filtering */}
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 2 },
        }}
      >
        <Chip
          label="All"
          onClick={() => {
            setFilters(prev => ({ ...prev, category: '' }));
            setPage(1);
          }}
          color={!filters.category ? 'primary' : 'default'}
          variant={!filters.category ? 'filled' : 'outlined'}
          sx={{ minHeight: { xs: 32, sm: 32 } }}
        />
        {TOOL_CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            onClick={() => {
              setFilters(prev => ({ ...prev, category: cat }));
              setPage(1);
            }}
            color={filters.category === cat ? 'primary' : 'default'}
            variant={filters.category === cat ? 'filled' : 'outlined'}
            sx={{ minHeight: { xs: 32, sm: 32 } }}
          />
        ))}
      </Box>

      {/* Active Filter Chips */}
      {(activeFilterCount > 0 || filters.q) && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          {filters.q && (
            <Chip
              label={`Search: "${filters.q}"`}
              onDelete={() => {
                setSearchInputValue('');
                setFilters(prev => ({ ...prev, q: '' }));
                setPage(1);
              }}
              size="small"
              color="primary"
              sx={{ minHeight: { xs: 32, sm: 24 } }}
            />
          )}
          {renderFilterChips()}
          {(activeFilterCount > 0 || filters.q) && (
            <Button
              size="small"
              onClick={clearAllFilters}
              startIcon={<Clear />}
              sx={{ minHeight: { xs: 32, sm: 24 } }}
            >
              Clear All
            </Button>
          )}
        </Box>
      )}

      {/* Filter Drawer */}
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: isMobile ? 16 : 0,
            borderTopRightRadius: isMobile ? 16 : 0,
            maxHeight: isMobile ? '90vh' : '100vh',
          },
        }}
      >
        {filterDrawerContent}
      </Drawer>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {isError && !shouldUseMock && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load tools. Please try again later.
        </Alert>
      )}

      {/* Mock Data Warning */}
      {shouldUseMock && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing sample data. Connect to the API for live data.
        </Alert>
      )}

      {/* Results count */}
      {!isLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {total} tool{total !== 1 ? 's' : ''} available
        </Typography>
      )}

      {/* Tools Grid/List */}
      {!isLoading && tools.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Handyman sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No tools found
          </Typography>
          <Typography color="text.secondary">
            Try adjusting your search or filters
          </Typography>
          {(activeFilterCount > 0 || filters.q) && (
            <Button
              variant="outlined"
              onClick={clearAllFilters}
              sx={{ mt: 2, minHeight: 48 }}
            >
              Clear All Filters
            </Button>
          )}
        </Box>
      ) : !isLoading && viewMode === 'grid' ? (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {tools.map((tool) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={tool.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                  '&:active': { transform: 'scale(0.98)' },
                  transition: 'transform 0.1s',
                }}
                onClick={() => navigate(`/tools/${tool.id}`)}
              >
                <CardMedia
                  sx={{
                    height: { xs: 160, sm: 180 },
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
                <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="h6" gutterBottom noWrap sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
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
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ flex: 1 }}>
                      {tool.owner?.displayName}
                    </Typography>
                    {tool.owner?.reputationScore && (
                      <Rating
                        value={tool.owner.reputationScore}
                        size="small"
                        precision={0.1}
                        readOnly
                        sx={{ display: { xs: 'none', sm: 'flex' } }}
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
      ) : !isLoading ? (
        // List View
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tools.map((tool) => (
            <Card
              key={tool.id}
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
              onClick={() => navigate(`/tools/${tool.id}`)}
            >
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                <CardMedia
                  sx={{
                    width: { xs: '100%', sm: 150 },
                    height: { xs: 160, sm: 120 },
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
                <CardContent sx={{ flex: 1, p: { xs: 1.5, sm: 2 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'flex-start' },
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        {tool.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                        <Chip label={tool.category} size="small" />
                        {tool.brand && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="span"
                            sx={{ alignSelf: 'center' }}
                          >
                            {tool.brand} {tool.model}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, mt: { xs: 1, sm: 0 } }}>
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
                      flexWrap: 'wrap',
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
      ) : null}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
            siblingCount={isMobile ? 0 : 1}
          />
        </Box>
      )}
    </Box>
  );
}
