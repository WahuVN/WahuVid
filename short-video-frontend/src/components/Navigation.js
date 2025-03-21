import React, { useContext } from 'react';
import { List, ListItem, ListItemIcon, ListItemText, Paper, useTheme } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { Home, Explore, People, Group, AccountCircle, Chat, Person, Upload } from '@mui/icons-material';
import UserContext from '../contexts/userContext';

const Navigation = () => {
  const theme = useTheme();
  const {user} = useContext(UserContext);

  const navItems = [
    { text: 'Dành Cho Bạn', icon: <Home />, path: '/' },
    { text: 'Khám Phá', icon: <Explore />, path: '/explore' },
    { text: 'Đang Theo Dõi', icon: <Person />, path: '/following' },
    { text: 'Bạn Bè', icon: <Group />, path: '/friends' },
    { text: 'Messenger', icon: <Chat />, path: '/messages' },
    { text: 'Trang Cá Nhân', icon: <AccountCircle />, path: `/${user?.username}` },
    { text: 'Chia Sẻ Video', icon: <Upload />, path: '/upload' },
  ];

  return (
    <Paper elevation={0} sx={{ height: '100%', backgroundColor: 'background.default', mt: 2 }}>
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={NavLink}
            to={item.path}
            sx={{
              '&.active': {
                color: theme.palette.primary.main,
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
              },
              fontWeight: 700, // Normal font weight for inactive items
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontWeight: 'inherit', // Inherit font weight from ListItem
              }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default Navigation;
