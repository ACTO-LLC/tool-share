import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import Notifications from '../Notifications';
import { renderWithProviders } from '../../test/utils';

// The Notifications component uses mock data when VITE_USE_REAL_API is not 'true'
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

describe('Notifications Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Page title', () => {
    it('should render page title', async () => {
      renderWithProviders(<Notifications />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /notifications/i })).toBeInTheDocument();
      });
    });
  });

  describe('Notification list', () => {
    it('should display mock notifications after loading', async () => {
      renderWithProviders(<Notifications />);

      // Wait for the mock notifications from the component's mockNotifications array
      await waitFor(() => {
        expect(screen.getByText('New Reservation Request')).toBeInTheDocument();
        expect(screen.getByText('Reservation Approved')).toBeInTheDocument();
      });
    });

    it('should display unread count chip', async () => {
      renderWithProviders(<Notifications />);

      // The mock data has 3 unread notifications
      await waitFor(() => {
        expect(screen.getByText('3 unread')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should have filter tabs', async () => {
      renderWithProviders(<Notifications />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /requests/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /approvals/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /reminders/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /reviews/i })).toBeInTheDocument();
      });
    });

    it('should filter notifications when tab is clicked', async () => {
      renderWithProviders(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('New Reservation Request')).toBeInTheDocument();
      });

      // Click on Reviews tab
      fireEvent.click(screen.getByRole('tab', { name: /reviews/i }));

      // Should only show review notifications
      await waitFor(() => {
        expect(screen.getByText('New Review Received')).toBeInTheDocument();
        expect(screen.queryByText('New Reservation Request')).not.toBeInTheDocument();
      });
    });
  });

  describe('Mark all as read', () => {
    it('should show mark all as read button when there are unread notifications', async () => {
      renderWithProviders(<Notifications />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument();
      });
    });

    it('should update button state when clicked', async () => {
      renderWithProviders(<Notifications />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /mark all as read/i }));

      // After marking all as read, button should disappear (no more unread)
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /mark all as read/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Notification click', () => {
    it('should navigate to reservation when notification is clicked', async () => {
      renderWithProviders(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('New Reservation Request')).toBeInTheDocument();
      });

      // Click on notification text - the ListItem is the clickable element
      const notificationText = screen.getByText('New Reservation Request');
      // Navigate up to find the clickable ListItem
      const listItem = notificationText.closest('li');
      if (listItem) {
        fireEvent.click(listItem);
      }

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/reservations/mock-reservation-1');
      });
    });
  });

  describe('Refresh button', () => {
    it('should have refresh button', async () => {
      renderWithProviders(<Notifications />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });
    });
  });

  describe('Notification count', () => {
    it('should display showing count summary', async () => {
      renderWithProviders(<Notifications />);

      await waitFor(() => {
        // The mock data has 8 notifications
        expect(screen.getByText(/showing 8 of 8 notifications/i)).toBeInTheDocument();
      });
    });
  });
});
