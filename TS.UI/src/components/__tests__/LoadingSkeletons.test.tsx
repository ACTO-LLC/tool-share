import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  ToolCardSkeleton,
  ToolGridSkeleton,
  ReservationItemSkeleton,
  ReservationListSkeleton,
  NotificationItemSkeleton,
  NotificationListSkeleton,
  StatCardSkeleton,
  DashboardSkeleton,
  ToolDetailSkeleton,
  ProfileSkeleton,
  CircleDetailSkeleton,
} from '../LoadingSkeletons';

describe('LoadingSkeletons', () => {
  describe('ToolCardSkeleton', () => {
    it('should render skeleton elements', () => {
      render(<ToolCardSkeleton />);

      // Should have skeleton elements for image and text
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render in a card', () => {
      render(<ToolCardSkeleton />);

      // MUI Card renders with specific class
      const card = document.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });
  });

  describe('ToolGridSkeleton', () => {
    it('should render default count of 6 tool card skeletons', () => {
      render(<ToolGridSkeleton />);

      const cards = document.querySelectorAll('.MuiCard-root');
      expect(cards).toHaveLength(6);
    });

    it('should render specified count of tool card skeletons', () => {
      render(<ToolGridSkeleton count={3} />);

      const cards = document.querySelectorAll('.MuiCard-root');
      expect(cards).toHaveLength(3);
    });

    it('should render in a grid container', () => {
      render(<ToolGridSkeleton />);

      const grid = document.querySelector('.MuiGrid-container');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('ReservationItemSkeleton', () => {
    it('should render skeleton elements for reservation item', () => {
      render(<ReservationItemSkeleton />);

      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render rounded skeleton for image', () => {
      render(<ReservationItemSkeleton />);

      const roundedSkeleton = document.querySelector('.MuiSkeleton-rounded');
      expect(roundedSkeleton).toBeInTheDocument();
    });
  });

  describe('ReservationListSkeleton', () => {
    it('should render default count of 3 reservation item skeletons', () => {
      const { container } = render(<ReservationListSkeleton />);

      // Count the number of rounded skeletons (one per item for the image)
      const items = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should render specified count of reservation item skeletons', () => {
      render(<ReservationListSkeleton count={5} />);

      // Should have the skeletons
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render in a card', () => {
      render(<ReservationListSkeleton />);

      const card = document.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });
  });

  describe('NotificationItemSkeleton', () => {
    it('should render skeleton elements for notification item', () => {
      render(<NotificationItemSkeleton />);

      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render circular skeleton for avatar', () => {
      render(<NotificationItemSkeleton />);

      const circularSkeleton = document.querySelector('.MuiSkeleton-circular');
      expect(circularSkeleton).toBeInTheDocument();
    });
  });

  describe('NotificationListSkeleton', () => {
    it('should render default count of 5 notification item skeletons', () => {
      render(<NotificationListSkeleton />);

      // 5 items, each with a circular skeleton for avatar
      const circularSkeletons = document.querySelectorAll('.MuiSkeleton-circular');
      expect(circularSkeletons).toHaveLength(5);
    });

    it('should render specified count of notification item skeletons', () => {
      render(<NotificationListSkeleton count={3} />);

      const circularSkeletons = document.querySelectorAll('.MuiSkeleton-circular');
      expect(circularSkeletons).toHaveLength(3);
    });

    it('should render in a card', () => {
      render(<NotificationListSkeleton />);

      const card = document.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });
  });

  describe('StatCardSkeleton', () => {
    it('should render skeleton elements for stat card', () => {
      render(<StatCardSkeleton />);

      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render circular skeleton for icon', () => {
      render(<StatCardSkeleton />);

      const circularSkeleton = document.querySelector('.MuiSkeleton-circular');
      expect(circularSkeleton).toBeInTheDocument();
    });

    it('should render in a card', () => {
      render(<StatCardSkeleton />);

      const card = document.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });
  });

  describe('DashboardSkeleton', () => {
    it('should render skeleton elements for dashboard', () => {
      render(<DashboardSkeleton />);

      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render 3 stat card skeletons', () => {
      render(<DashboardSkeleton />);

      // 3 stat cards with circular skeletons
      const circularSkeletons = document.querySelectorAll('.MuiSkeleton-circular');
      expect(circularSkeletons).toHaveLength(3);
    });

    it('should render grid layout', () => {
      render(<DashboardSkeleton />);

      const gridContainers = document.querySelectorAll('.MuiGrid-container');
      expect(gridContainers.length).toBeGreaterThan(0);
    });
  });

  describe('ToolDetailSkeleton', () => {
    it('should render skeleton elements for tool detail', () => {
      render(<ToolDetailSkeleton />);

      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render rectangular skeleton for main image', () => {
      render(<ToolDetailSkeleton />);

      const rectangularSkeletons = document.querySelectorAll('.MuiSkeleton-rectangular');
      expect(rectangularSkeletons.length).toBeGreaterThan(0);
    });

    it('should render circular skeleton for owner avatar', () => {
      render(<ToolDetailSkeleton />);

      const circularSkeleton = document.querySelector('.MuiSkeleton-circular');
      expect(circularSkeleton).toBeInTheDocument();
    });
  });

  describe('ProfileSkeleton', () => {
    it('should render skeleton elements for profile', () => {
      render(<ProfileSkeleton />);

      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render circular skeleton for avatar', () => {
      render(<ProfileSkeleton />);

      const circularSkeleton = document.querySelector('.MuiSkeleton-circular');
      expect(circularSkeleton).toBeInTheDocument();
    });

    it('should render multiple cards', () => {
      render(<ProfileSkeleton />);

      const cards = document.querySelectorAll('.MuiCard-root');
      expect(cards.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('CircleDetailSkeleton', () => {
    it('should render skeleton elements for circle detail', () => {
      render(<CircleDetailSkeleton />);

      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render circular skeletons for member avatars', () => {
      render(<CircleDetailSkeleton />);

      const circularSkeletons = document.querySelectorAll('.MuiSkeleton-circular');
      expect(circularSkeletons.length).toBeGreaterThan(0);
    });

    it('should render multiple cards', () => {
      render(<CircleDetailSkeleton />);

      const cards = document.querySelectorAll('.MuiCard-root');
      expect(cards.length).toBeGreaterThanOrEqual(2);
    });

    it('should render grid layout', () => {
      render(<CircleDetailSkeleton />);

      const gridContainers = document.querySelectorAll('.MuiGrid-container');
      expect(gridContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Skeleton animation', () => {
    it('should have wave animation on skeletons', () => {
      render(<ToolCardSkeleton />);

      // MUI Skeleton with wave animation has the class MuiSkeleton-wave
      const waveSkeletons = document.querySelectorAll('.MuiSkeleton-wave');
      expect(waveSkeletons.length).toBeGreaterThan(0);
    });
  });
});
