import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Profile from '../Profile';
import { renderWithProviders, createTestQueryClient } from '../../test/utils';
import { userApi, UserProfile } from '../../services/api';

// Mock the API module
vi.mock('../../services/api', () => ({
  userApi: {
    getCurrentUser: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

// Mock useMsal
vi.mock('@azure/msal-react', async () => {
  const actual = await vi.importActual('@azure/msal-react');
  return {
    ...actual,
    useMsal: () => ({
      instance: {},
      accounts: [
        {
          name: 'Test User',
          username: 'test@example.com',
        },
      ],
    }),
  };
});

describe('Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUserProfile: UserProfile = {
    id: 'user-1',
    externalId: 'ext-1',
    displayName: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
    avatarUrl: 'https://example.com/avatar.jpg',
    bio: 'Tool enthusiast',
    streetAddress: '123 Main St',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98101',
    reputationScore: 4.5,
    notifyEmail: true,
    subscriptionStatus: 'active',
    createdAt: '2024-01-01T00:00:00Z',
  };

  describe('Loading state', () => {
    it('should show loading skeleton initially', () => {
      vi.mocked(userApi.getCurrentUser).mockReturnValue(new Promise(() => {}));

      renderWithProviders(<Profile />);

      expect(screen.getByText('Profile')).toBeInTheDocument();

      // Should show skeleton loading elements
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error state', () => {
    it('should show error message when loading fails', async () => {
      vi.mocked(userApi.getCurrentUser).mockRejectedValue(new Error('Network error'));

      renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load profile. Please try refreshing the page.')).toBeInTheDocument();
      });
    });
  });

  describe('Profile display', () => {
    it('should display user profile after loading', async () => {
      vi.mocked(userApi.getCurrentUser).mockResolvedValue(mockUserProfile);

      renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });
    });

    it('should display reputation score', async () => {
      vi.mocked(userApi.getCurrentUser).mockResolvedValue(mockUserProfile);

      renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Reputation: 4.5 / 5.0')).toBeInTheDocument();
      });
    });

    it('should not display reputation if score is 0', async () => {
      vi.mocked(userApi.getCurrentUser).mockResolvedValue({
        ...mockUserProfile,
        reputationScore: 0,
      });

      renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.queryByText(/reputation/i)).not.toBeInTheDocument();
    });

    it('should display avatar with first letter when no avatar URL', async () => {
      vi.mocked(userApi.getCurrentUser).mockResolvedValue({
        ...mockUserProfile,
        avatarUrl: undefined,
      });

      renderWithProviders(<Profile />);

      await waitFor(() => {
        // Avatar should show first letter of display name
        const avatar = screen.getByText('J');
        expect(avatar).toBeInTheDocument();
      });
    });
  });

  describe('Form fields', () => {
    it('should populate form fields with user data', async () => {
      vi.mocked(userApi.getCurrentUser).mockResolvedValue(mockUserProfile);

      renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(screen.getByLabelText(/display name/i)).toHaveValue('John Doe');
        expect(screen.getByLabelText(/phone/i)).toHaveValue('555-1234');
        expect(screen.getByLabelText(/street address/i)).toHaveValue('123 Main St');
        expect(screen.getByLabelText(/city/i)).toHaveValue('Seattle');
        expect(screen.getByLabelText(/state/i)).toHaveValue('WA');
        expect(screen.getByLabelText(/zip code/i)).toHaveValue('98101');
        expect(screen.getByLabelText(/bio/i)).toHaveValue('Tool enthusiast');
      });
    });

    it('should show character count for bio field', async () => {
      vi.mocked(userApi.getCurrentUser).mockResolvedValue(mockUserProfile);

      renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('16/500 characters')).toBeInTheDocument();
      });
    });
  });

  describe('Form submission', () => {
    it('should have disabled save button when form is not dirty', async () => {
      vi.mocked(userApi.getCurrentUser).mockResolvedValue(mockUserProfile);

      renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when form is modified', async () => {
      vi.mocked(userApi.getCurrentUser).mockResolvedValue(mockUserProfile);
      const user = userEvent.setup();

      renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      });

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Jane Doe');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('should submit form and show success message', async () => {
      vi.mocked(userApi.getCurrentUser).mockResolvedValue(mockUserProfile);
      vi.mocked(userApi.updateProfile).mockResolvedValue({
        ...mockUserProfile,
        displayName: 'Jane Doe',
      });
      const user = userEvent.setup();

      renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      });

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Jane Doe');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
      });

      expect(userApi.updateProfile).toHaveBeenCalledWith({
        displayName: 'Jane Doe',
        phone: '555-1234',
        streetAddress: '123 Main St',
        city: 'Seattle',
        state: 'WA',
        zipCode: '98101',
        bio: 'Tool enthusiast',
      });
    });

    it('should show error message on submit failure', async () => {
      vi.mocked(userApi.getCurrentUser).mockResolvedValue(mockUserProfile);
      vi.mocked(userApi.updateProfile).mockRejectedValue(new Error('Update failed'));
      const user = userEvent.setup();

      renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      });

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Jane Doe');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      vi.mocked(userApi.getCurrentUser).mockResolvedValue(mockUserProfile);
      vi.mocked(userApi.updateProfile).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockUserProfile), 1000))
      );
      const user = userEvent.setup();

      renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      });

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Jane Doe');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Should show saving state
      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('should show error for empty display name', async () => {
      vi.mocked(userApi.getCurrentUser).mockResolvedValue(mockUserProfile);
      const user = userEvent.setup();

      renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      });

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.clear(displayNameInput);
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText('Display name is required')).toBeInTheDocument();
      });
    });

    it('should show error for bio exceeding 500 characters', async () => {
      vi.mocked(userApi.getCurrentUser).mockResolvedValue({
        ...mockUserProfile,
        bio: '',
      });
      const user = userEvent.setup();

      renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
      });

      const bioInput = screen.getByLabelText(/bio/i);
      const longBio = 'a'.repeat(501);
      await user.type(bioInput, longBio);
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText('Bio must be 500 characters or less')).toBeInTheDocument();
      });
    });
  });

  describe('Snackbar', () => {
    it('should auto-hide snackbar after success', async () => {
      vi.useFakeTimers();
      vi.mocked(userApi.getCurrentUser).mockResolvedValue(mockUserProfile);
      vi.mocked(userApi.updateProfile).mockResolvedValue(mockUserProfile);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      renderWithProviders(<Profile />);

      await waitFor(() => {
        expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      });

      const displayNameInput = screen.getByLabelText(/display name/i);
      await user.clear(displayNameInput);
      await user.type(displayNameInput, 'Jane Doe');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });
});
