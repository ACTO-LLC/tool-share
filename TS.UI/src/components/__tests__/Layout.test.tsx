import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '../Layout';

// Mock the auth module
vi.mock('../../auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { name: 'Test User' },
    logout: vi.fn(),
  }),
}));

// Mock the useCurrentUser hook
vi.mock('../../hooks/useUser', () => ({
  useCurrentUser: () => ({
    data: { displayName: 'Test User' },
    error: null,
    isLoading: false,
  }),
}));

// Mock NotificationBell to simplify tests
vi.mock('../NotificationBell', () => ({
  default: () => <div data-testid="notification-bell">Notifications</div>,
}));

// Mock Footer to simplify tests
vi.mock('../Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

const theme = createTheme();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderLayout = (initialRoute = '/') => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<div>Dashboard Content</div>} />
              <Route path="browse" element={<div>Browse Content</div>} />
              <Route path="my-tools" element={<div>My Tools Content</div>} />
              <Route path="reservations" element={<div>Reservations Content</div>} />
              <Route path="circles" element={<div>Circles Content</div>} />
              <Route path="profile" element={<div>Profile Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Layout', () => {
  beforeEach(() => {
    // Mock window.matchMedia for responsive tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false, // Desktop by default
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('core structure', () => {
    it('should render app bar', () => {
      renderLayout();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should render main content area', () => {
      renderLayout();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should render Tool Share title', () => {
      renderLayout();
      expect(screen.getByText('Tool Share')).toBeInTheDocument();
    });

    it('should render notification bell', () => {
      renderLayout();
      expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    });

    it('should render footer', () => {
      renderLayout();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('navigation items', () => {
    it('should render all navigation items in drawer', () => {
      renderLayout();
      // Check that all navigation items exist (some may appear multiple times due to AppBar title)
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Browse Tools')).toBeInTheDocument();
      expect(screen.getByText('My Tools')).toBeInTheDocument();
      expect(screen.getByText('Reservations')).toBeInTheDocument();
      expect(screen.getAllByText('Circles').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('routing', () => {
    it('should render dashboard content at root route', () => {
      renderLayout('/');
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    it('should render browse content at /browse route', () => {
      renderLayout('/browse');
      expect(screen.getByText('Browse Content')).toBeInTheDocument();
    });

    it('should navigate to browse when clicking navigation item', async () => {
      renderLayout('/');

      const browseLink = screen.getByText('Browse Tools');
      fireEvent.click(browseLink);

      await waitFor(() => {
        expect(screen.getByText('Browse Content')).toBeInTheDocument();
      });
    });

    it('should highlight active navigation item', () => {
      renderLayout('/');
      // Find the Dashboard button in the navigation (with Mui-selected class)
      const selectedButtons = document.querySelectorAll('[role="button"].Mui-selected');
      expect(selectedButtons.length).toBeGreaterThan(0);
    });
  });

  describe('user menu', () => {
    it('should render user avatar with initial', () => {
      renderLayout();
      // The avatar should show user's initial "T" for "Test User"
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('should open user menu when avatar is clicked', async () => {
      renderLayout();

      // Find and click the avatar button
      const avatarButton = screen.getByText('T').closest('button');
      expect(avatarButton).toBeInTheDocument();

      if (avatarButton) {
        fireEvent.click(avatarButton);
      }

      await waitFor(() => {
        // Menu items should appear - look for Profile menuitem
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems.length).toBeGreaterThan(0);
      });
    });
  });
});
