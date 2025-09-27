import { useState } from 'react';

// material-ui
import {
  Box,
  Typography,
  Grid,
  Avatar,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress
} from '@mui/material';
import { Stack } from '@mui/material';

// assets
import EmailOutlined from '@ant-design/icons/MailOutlined';
import PhoneOutlined from '@ant-design/icons/PhoneOutlined';
import EnvironmentOutlined from '@ant-design/icons/EnvironmentOutlined';
import CalendarOutlined from '@ant-design/icons/CalendarOutlined';
import TeamOutlined from '@ant-design/icons/TeamOutlined';
import TrophyOutlined from '@ant-design/icons/TrophyOutlined';
import avatar1 from 'assets/images/users/avatar-1.png';

// ==============================|| PROFILE TAB - VIEW PROFILE ||============================== //

export default function ViewProfileTab() {
  const profileData = {
    name: 'John Doe',
    position: 'Senior UI/UX Designer',
    company: 'Tech Solutions Inc.',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    location: 'New York, USA',
    joinDate: 'Январь 2022',
    bio: 'Passionate designer with 5+ years of experience creating user-centered digital experiences. Specialized in mobile and web applications with focus on accessibility and performance.',
    projects: 42,
    experience: '5+ лет',
    teamSize: 8
  };

  const skills = [
    { name: 'UI/UX Design', level: 95 },
    { name: 'React', level: 88 },
    { name: 'Figma', level: 92 },
    { name: 'Adobe XD', level: 85 },
    { name: 'JavaScript', level: 78 },
    { name: 'TypeScript', level: 72 }
  ];

  const achievements = [
    'Лучший дизайнер месяца (3 раза)',
    'Сертификация Google UX Design',
    'Adobe Certified Expert',
    'Ментор для 5+ джуниоров'
  ];

  const recentActivity = [
    { action: 'Завершен проект Mobile Banking App', date: '2 дня назад' },
    { action: 'Обновлен дизайн системы компонентов', date: '1 неделя назад' },
    { action: 'Провел воркшоп по UX исследованиям', date: '2 недели назад' }
  ];

  return (
    <Box sx={{ p: 2 }}>
      {/* Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar src={avatar1} sx={{ width: 100, height: 100 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" gutterBottom>
                {profileData.name}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {profileData.position}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {profileData.company}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="h4" color="primary">
                    {profileData.projects}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Проектов
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h4" color="success.main">
                    {profileData.teamSize}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    В команде
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h4" color="warning.main">
                    5.0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Рейтинг
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Контактная информация
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <EmailOutlined />
                  </ListItemIcon>
                  <ListItemText primary={profileData.email} secondary="Email" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhoneOutlined />
                  </ListItemIcon>
                  <ListItemText primary={profileData.phone} secondary="Телефон" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EnvironmentOutlined />
                  </ListItemIcon>
                  <ListItemText primary={profileData.location} secondary="Местоположение" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarOutlined />
                  </ListItemIcon>
                  <ListItemText primary={profileData.joinDate} secondary="Присоединился" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* About */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                О себе
              </Typography>
              <Typography variant="body1" paragraph>
                {profileData.bio}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Опыт работы
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profileData.experience} в области UI/UX дизайна
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Skills */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Навыки и компетенции
              </Typography>
              {skills.map((skill, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{skill.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {skill.level}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={skill.level}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Achievements */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrophyOutlined style={{ marginRight: 8, color: '#faad14' }} />
                Достижения
              </Typography>
              <Stack spacing={1}>
                {achievements.map((achievement, index) => (
                  <Chip
                    key={index}
                    label={achievement}
                    variant="outlined"
                    color="warning"
                    size="small"
                    sx={{ justifyContent: 'flex-start', '& .MuiChip-label': { textAlign: 'left' } }}
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Последняя активность
              </Typography>
              <List>
                {recentActivity.map((activity, index) => (
                  <ListItem key={index} divider={index < recentActivity.length - 1}>
                    <ListItemText
                      primary={activity.action}
                      secondary={activity.date}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
