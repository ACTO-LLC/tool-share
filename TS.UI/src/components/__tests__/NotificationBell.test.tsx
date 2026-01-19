import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import NotificationBell from '../NotificationBell';
import { renderWithProviders } from '../../test/utils';

// The NotificationBell component uses mock data when VITE_USE_REAL_API is not 'true'
// So we don't need to mock the API - it will use the built-in mock notifications

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    it('should render notification bell button', async () => {
      renderWithProviders(<NotificationBell />);

      // Wait for the component to render and load mock notifications
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
      });
    });

    it('should render with badge showing unread count from mock data', async () => {
      renderWithProviders(<NotificationBell />);

      // The mock data has 2 unread notifications
      await waitFor(() => {
        // Badge should show the count (2 from mock data)
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });

  describe('Dropdown behavior', () => {
    it('should open menu when bell button is clicked', async () => {
      renderWithProviders(<NotificationBell />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
      });

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('should display mock notification items when menu is open', async () => {
      renderWithProviders(<NotificationBell />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
      });

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      fireEvent.click(bellButton);

      // Wait for mock notification titles from the component's mockNotifications
      await waitFor(() => {
        expect(screen.getByText('New Reservation Request')).toBeInTheDocument();
        expect(screen.getByText('Reservation Approved')).toBeInTheDocument();
      });
    });

    it('should show view all notifications button', async () => {
      renderWithProviders(<NotificationBell />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
      });

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view all notifications/i })).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to notifications page when view all is clicked', async () => {
      renderWithProviders(<NotificationBell />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
      });

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view all notifications/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /view all notifications/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/notifications');
    });
  });
});
