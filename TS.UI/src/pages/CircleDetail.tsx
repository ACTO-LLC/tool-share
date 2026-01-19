import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  Paper,
  Divider,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack,
  Groups,
  Person,
  AdminPanelSettings,
  Star,
  MoreVert,
  ContentCopy,
  Share,
  Build,
  ExitToApp,
  PersonRemove,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { circlesApi, CircleDetail as CircleDetailType, CircleMember, CircleTool } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function getRoleIcon(role: 'member' | 'admin' | 'owner') {
  switch (role) {
    case 'owner':
      return <Star fontSize="small" />;
    case 'admin':
      return <AdminPanelSettings fontSize="small" />;
    default:
      return <Person fontSize="small" />;
  }
}

function getRoleColor(role: 'member' | 'admin' | 'owner'): 'warning' | 'primary' | 'default' {
  switch (role) {
    case 'owner':
      return 'warning';
    case 'admin':
      return 'primary';
    default:
      return 'default';
  }
}

export default function CircleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [circle, setCircle] = useState<CircleDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; member: CircleMember } | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<CircleMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  useEffect(() => {
    if (id) {
      loadCircle();
    }
  }, [id]);

  async function loadCircle() {
    try {
      setLoading(true);
      setError(null);
      const data = await circlesApi.get(id!);
      setCircle(data);
    } catch (err) {
      console.error('Failed to load circle:', err);
      setError('Failed to load circle details. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyInviteCode() {
    if (!circle) return;
    try {
      const invite = await circlesApi.getInvite(circle.id);
      await navigator.clipboard.writeText(invite.inviteCode);
      setSnackbar({ open: true, message: 'Invite code copied to clipboard!' });
    } catch (err) {
      console.error('Failed to copy invite code:', err);
      setSnackbar({ open: true, message: 'Failed to copy invite code' });
    }
  }

  async function handleShareInvite() {
    if (!circle) return;
    try {
      const invite = await circlesApi.getInvite(circle.id);
      if (navigator.share) {
        await navigator.share({
          title: `Join ${circle.name}`,
          text: `Join my Tool Share circle "${circle.name}" using this code: ${invite.inviteCode}`,
          url: invite.inviteUrl,
        });
      } else {
        await navigator.clipboard.writeText(invite.inviteUrl);
        setSnackbar({ open: true, message: 'Invite link copied to clipboard!' });
      }
    } catch (err) {
      console.error('Failed to share:', err);
    }
  }

  async function handleLeaveCircle() {
    if (!circle) return;
    try {
      setActionLoading(true);
      await circlesApi.leave(circle.id);
      setLeaveDialogOpen(false);
      navigate('/circles');
    } catch (err) {
      console.error('Failed to leave circle:', err);
      setSnackbar({ open: true, message: 'Failed to leave circle' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveMember() {
    if (!circle || !memberToRemove) return;
    try {
      setActionLoading(true);
      await circlesApi.removeMember(circle.id, memberToRemove.userId);
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
      loadCircle();
      setSnackbar({ open: true, message: 'Member removed successfully' });
    } catch (err) {
      console.error('Failed to remove member:', err);
      setSnackbar({ open: true, message: 'Failed to remove member' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePromoteMember(member: CircleMember) {
    if (!circle) return;
    try {
      setActionLoading(true);
      await circlesApi.updateMemberRole(circle.id, member.userId, 'admin');
      loadCircle();
      setSnackbar({ open: true, message: `${member.user?.displayName} promoted to admin` });
    } catch (err) {
      console.error('Failed to promote member:', err);
      setSnackbar({ open: true, message: 'Failed to update member role' });
    } finally {
      setActionLoading(false);
      setMenuAnchor(null);
    }
  }

  async function handleDemoteMember(member: CircleMember) {
    if (!circle) return;
    try {
      setActionLoading(true);
      await circlesApi.updateMemberRole(circle.id, member.userId, 'member');
      loadCircle();
      setSnackbar({ open: true, message: `${member.user?.displayName} is now a member` });
    } catch (err) {
      console.error('Failed to demote member:', err);
      setSnackbar({ open: true, message: 'Failed to update member role' });
    } finally {
      setActionLoading(false);
      setMenuAnchor(null);
    }
  }

  function openRemoveDialog(member: CircleMember) {
    setMemberToRemove(member);
    setRemoveDialogOpen(true);
    setMenuAnchor(null);
  }

  const isAdmin = circle?.currentUserRole && ['admin', 'owner'].includes(circle.currentUserRole);
  const isOwner = circle?.currentUserRole === 'owner';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !circle) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/circles')} sx={{ mb: 2 }}>
          Back to Circles
        </Button>
        <Alert severity="error">{error || 'Circle not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/circles')} sx={{ mb: 2 }}>
        Back to Circles
      </Button>

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <Groups sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4">{circle.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  size="small"
                  icon={getRoleIcon(circle.currentUserRole || 'member')}
                  label={(circle.currentUserRole || 'member').charAt(0).toUpperCase() + (circle.currentUserRole || 'member').slice(1)}
                  color={getRoleColor(circle.currentUserRole || 'member')}
                />
                <Typography variant="body2" color="text.secondary">
                  {circle.memberCount || 0} {(circle.memberCount || 0) === 1 ? 'member' : 'members'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {isAdmin && (
              <>
                <Tooltip title="Copy invite code">
                  <IconButton onClick={handleCopyInviteCode}>
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share invite">
                  <IconButton onClick={handleShareInvite}>
                    <Share />
                  </IconButton>
                </Tooltip>
              </>
            )}
            {!isOwner && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<ExitToApp />}
                onClick={() => setLeaveDialogOpen(true)}
              >
                Leave
              </Button>
            )}
          </Box>
        </Box>

        {circle.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            {circle.description}
          </Typography>
        )}

        {isAdmin && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Invite Code: <strong>{circle.inviteCode}</strong>
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={`Tools (${circle.tools?.length || 0})`} icon={<Build />} iconPosition="start" />
          <Tab label={`Members (${circle.members?.length || 0})`} icon={<Person />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tools Tab */}
      <TabPanel value={tabValue} index={0}>
        {!circle.tools || circle.tools.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Build sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">
                No tools have been shared with this circle yet.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Members can share their tools with this circle when adding or editing a tool.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {circle.tools.map((tool: CircleTool) => (
              <Grid item xs={12} sm={6} md={4} key={tool.id}>
                <Card>
                  <CardActionArea onClick={() => navigate(`/tools/${tool.id}`)}>
                    {tool.primaryPhotoUrl ? (
                      <CardMedia
                        component="img"
                        height="140"
                        image={tool.primaryPhotoUrl}
                        alt={tool.name}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 140,
                          bgcolor: 'grey.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Build sx={{ fontSize: 48, color: 'grey.400' }} />
                      </Box>
                    )}
                    <CardContent>
                      <Typography variant="h6" noWrap>
                        {tool.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tool.category}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                        {tool.owner && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={tool.owner.avatarUrl} sx={{ width: 24, height: 24 }}>
                              {tool.owner.displayName.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" color="text.secondary">
                              {tool.owner.displayName}
                            </Typography>
                          </Box>
                        )}
                        <Chip
                          size="small"
                          label={tool.status === 'available' ? 'Available' : 'Unavailable'}
                          color={tool.status === 'available' ? 'success' : 'default'}
                        />
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Members Tab */}
      <TabPanel value={tabValue} index={1}>
        <List>
          {circle.members?.map((member: CircleMember, index: number) => (
            <Box key={member.id}>
              {index > 0 && <Divider />}
              <ListItem>
                <ListItemAvatar>
                  <Avatar src={member.user?.avatarUrl}>
                    {member.user?.displayName?.charAt(0) || '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {member.user?.displayName || 'Unknown User'}
                      <Chip
                        size="small"
                        icon={getRoleIcon(member.role)}
                        label={member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        color={getRoleColor(member.role)}
                      />
                    </Box>
                  }
                  secondary={member.user?.email}
                />
                {isAdmin && member.role !== 'owner' && (
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={(e) => setMenuAnchor({ el: e.currentTarget, member })}
                    >
                      <MoreVert />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            </Box>
          ))}
        </List>
      </TabPanel>

      {/* Member Actions Menu */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {menuAnchor && menuAnchor.member.role === 'member' && isOwner && (
          <MenuItem onClick={() => handlePromoteMember(menuAnchor.member)}>
            <KeyboardArrowUp sx={{ mr: 1 }} /> Promote to Admin
          </MenuItem>
        )}
        {menuAnchor && menuAnchor.member.role === 'admin' && isOwner && (
          <MenuItem onClick={() => handleDemoteMember(menuAnchor.member)}>
            <KeyboardArrowDown sx={{ mr: 1 }} /> Demote to Member
          </MenuItem>
        )}
        {menuAnchor && (
          <MenuItem onClick={() => openRemoveDialog(menuAnchor.member)} sx={{ color: 'error.main' }}>
            <PersonRemove sx={{ mr: 1 }} /> Remove from Circle
          </MenuItem>
        )}
      </Menu>

      {/* Leave Circle Dialog */}
      <Dialog open={leaveDialogOpen} onClose={() => setLeaveDialogOpen(false)}>
        <DialogTitle>Leave Circle</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to leave "{circle.name}"? You will no longer have access to tools shared with this circle.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLeaveCircle} color="error" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : 'Leave Circle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={removeDialogOpen} onClose={() => setRemoveDialogOpen(false)}>
        <DialogTitle>Remove Member</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {memberToRemove?.user?.displayName} from "{circle.name}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRemoveMember} color="error" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}
