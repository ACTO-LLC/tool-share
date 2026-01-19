import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { useCurrentUser } from '../hooks/useUser';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  SwipeableDrawer,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Build as BuildIcon,
  CalendarMonth as CalendarIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  MoreHoriz as MoreIcon,
} from '@mui/icons-material';
import NotificationBell from './NotificationBell';

const drawerWidth = 240;

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Browse Tools', icon: <SearchIcon />, path: '/browse' },
  { text: 'My Tools', icon: <BuildIcon />, path: '/my-tools' },
  { text: 'Reservations', icon: <CalendarIcon />, path: '/reservations' },
  { text: 'Circles', icon: <GroupIcon />, path: '/circles' },
];

// Bottom nav items (4 main + more)
const bottomNavItems = [
  { text: 'Home', icon: <DashboardIcon />, path: '/' },
  { text: 'Browse', icon: <SearchIcon />, path: '/browse' },
  { text: 'My Tools', icon: <BuildIcon />, path: '/my-tools' },
  { text: 'Bookings', icon: <CalendarIcon />, path: '/reservations' },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, isAuthenticated } = useAuth();

  // Fetch/create user profile when authenticated
  // This ensures the user exists in the database on first login
  const { error: userError } = useCurrentUser({ enabled: isAuthenticated });

  // Log user sync errors (but don't block the UI)
  useEffect(() => {
    if (userError) {
      console.error('[Layout] Failed to sync user profile:', userError);
    }
  }, [userError]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
  };

  const handleBottomNavChange = (
    _event: React.SyntheticEvent,
    newValue: string
  ) => {
    if (newValue === 'more') {
      setMoreDrawerOpen(true);
    } else {
      navigate(newValue);
    }
  };

  const getBottomNavValue = () => {
    const currentPath = location.pathname;
    const bottomNavPath = bottomNavItems.find(
      (item) => item.path === currentPath
    )?.path;
    if (bottomNavPath) return bottomNavPath;
    // Check if it's a more menu item
    if (currentPath === '/circles' || currentPath === '/profile') return 'more';
    return '/';
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Tool Share
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isTablet) setMobileOpen(false);
              }}
              sx={{ minHeight: 48 }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const moreDrawer = (
    <Box sx={{ width: '100%', pt: 2, pb: 4 }}>
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ px: 2, pb: 1 }}
      >
        More Options
      </Typography>
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              navigate('/circles');
              setMoreDrawerOpen(false);
            }}
            sx={{ minHeight: 48 }}
          >
            <ListItemIcon>
              <GroupIcon />
            </ListItemIcon>
            <ListItemText primary="Circles" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              navigate('/profile');
              setMoreDrawerOpen(false);
            }}
            sx={{ minHeight: 48 }}
          >
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemButton>
        </ListItem>
        <Divider sx={{ my: 1 }} />
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              handleLogout();
              setMoreDrawerOpen(false);
            }}
            sx={{ minHeight: 48 }}
          >
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {/* Hamburger menu for tablet only (mobile uses bottom nav) */}
          {isTablet && !isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant={isMobile ? 'subtitle1' : 'h6'}
            noWrap
            component="div"
            sx={{ flexGrow: 1 }}
          >
            {navItems.find((item) => item.path === location.pathname)?.text ||
              'Tool Share'}
          </Typography>
          <NotificationBell />
          {/* Profile avatar - visible on tablet/desktop, hidden on mobile (in more menu) */}
          {!isMobile && (
            <>
              <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0, ml: 1 }}>
                <Avatar
                  alt={user?.name || 'User'}
                  sx={{ width: 36, height: 36 }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem
                  onClick={() => {
                    navigate('/profile');
                    handleProfileMenuClose();
                  }}
                  sx={{ minHeight: 48 }}
                >
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ minHeight: 48 }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Side drawer - tablet and desktop */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isTablet ? 'temporary' : 'permanent'}
          open={isTablet ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '56px', sm: '64px' },
          mb: { xs: '56px', sm: 0 },
          minHeight: {
            xs: 'calc(100vh - 56px - 56px)',
            sm: 'calc(100vh - 64px)',
          },
          overflow: 'auto',
        }}
      >
        <Outlet />
      </Box>

      {/* Bottom Navigation - Mobile only */}
      {isMobile && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
          }}
          elevation={3}
        >
          <BottomNavigation
            value={getBottomNavValue()}
            onChange={handleBottomNavChange}
            sx={{
              height: 56,
              '& .MuiBottomNavigationAction-root': {
                minWidth: 'auto',
                padding: '6px 0',
                '&.Mui-selected': {
                  paddingTop: '6px',
                },
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.625rem',
                '&.Mui-selected': {
                  fontSize: '0.625rem',
                },
              },
            }}
          >
            {bottomNavItems.map((item) => (
              <BottomNavigationAction
                key={item.path}
                value={item.path}
                label={item.text}
                icon={item.icon}
              />
            ))}
            <BottomNavigationAction
              value="more"
              label="More"
              icon={<MoreIcon />}
            />
          </BottomNavigation>
        </Paper>
      )}

      {/* More Drawer - Mobile bottom sheet */}
      <SwipeableDrawer
        anchor="bottom"
        open={moreDrawerOpen}
        onClose={() => setMoreDrawerOpen(false)}
        onOpen={() => setMoreDrawerOpen(true)}
        disableSwipeToOpen
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        }}
      >
        {moreDrawer}
      </SwipeableDrawer>
    </Box>
  );
}
