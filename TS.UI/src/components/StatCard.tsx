import { Card, CardContent, Typography, useTheme, useMediaQuery, SxProps, Theme } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

interface StatCardProps {
  icon: SvgIconComponent;
  value: number;
  label: string;
  iconColor?: string;
  backgroundColor?: string;
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

/**
 * StatCard - A reusable dashboard statistic card
 * Displays an icon, numeric value, and label in a clickable card format
 * Responsive design for mobile and desktop
 */
export default function StatCard({
  icon: Icon,
  value,
  label,
  iconColor = 'primary.main',
  backgroundColor,
  onClick,
  sx,
}: StatCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 4 } : undefined,
        '&:active': onClick ? { transform: 'scale(0.98)' } : undefined,
        minHeight: 48,
        bgcolor: backgroundColor || 'background.paper',
        ...sx,
      }}
      onClick={onClick}
    >
      <CardContent
        sx={{
          textAlign: 'center',
          p: { xs: 1, sm: 2 },
          '&:last-child': { pb: { xs: 1, sm: 2 } },
        }}
      >
        <Icon
          sx={{
            fontSize: { xs: 28, sm: 48 },
            color: iconColor,
            mb: { xs: 0.5, sm: 1 },
          }}
        />
        <Typography variant={isMobile ? 'h5' : 'h3'}>{value}</Typography>
        <Typography
          color="text.secondary"
          variant={isMobile ? 'caption' : 'body1'}
        >
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}
