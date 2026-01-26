import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Footer from '../Footer';

// Create theme with different breakpoints for testing
const desktopTheme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

// Mock useMediaQuery to control mobile/desktop behavior
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: vi.fn(),
  };
});

import { useMediaQuery } from '@mui/material';

describe('Footer', () => {
  const renderFooter = () => {
    return render(
      <ThemeProvider theme={desktopTheme}>
        <Footer />
      </ThemeProvider>
    );
  };

  describe('on desktop', () => {
    beforeEach(() => {
      vi.mocked(useMediaQuery).mockReturnValue(false); // Not mobile
    });

    it('should render footer content', () => {
      renderFooter();
      expect(screen.getByText(/Tool Share. All rights reserved./)).toBeInTheDocument();
    });

    it('should display current year', () => {
      const currentYear = new Date().getFullYear();
      renderFooter();
      expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
    });

    it('should have Terms of Service link', () => {
      renderFooter();
      const link = screen.getByRole('link', { name: /Terms of Service/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/terms');
    });

    it('should have Privacy Policy link', () => {
      renderFooter();
      const link = screen.getByRole('link', { name: /Privacy Policy/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/privacy');
    });

    it('should have Contact link', () => {
      renderFooter();
      const link = screen.getByRole('link', { name: /Contact/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'mailto:support@toolshare.com');
    });

    it('should have footer element', () => {
      const { container } = renderFooter();
      expect(container.querySelector('footer')).toBeInTheDocument();
    });
  });

  describe('on mobile', () => {
    beforeEach(() => {
      vi.mocked(useMediaQuery).mockReturnValue(true); // Is mobile
    });

    it('should not render footer on mobile', () => {
      const { container } = renderFooter();
      expect(container.querySelector('footer')).not.toBeInTheDocument();
    });

    it('should return null on mobile', () => {
      renderFooter();
      expect(screen.queryByText(/Tool Share. All rights reserved./)).not.toBeInTheDocument();
    });
  });
});
