import { useState } from 'react';

// material-ui
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Avatar,
  Card,
  CardContent,
  Chip,
  LinearProgress
} from '@mui/material';
import { Stack } from '@mui/material';

// assets
import avatar1 from 'assets/images/users/avatar-1.png';

// ==============================|| PROFILE TAB - EDIT PROFILE ||============================== //

export default function EditProfileTab() {
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    position: 'UI/UX Designer',
    company: 'Tech Solutions Inc.',
    bio: 'Passionate designer with 5+ years of experience creating user-centered digital experiences.',
    location: 'New York, USA'
  });

  const [profileCompletion] = useState(85);

  const handleChange = (field) => (event) => {
    setProfile(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const skills = ['UI/UX Design', 'React', 'Figma', 'Adobe XD', 'JavaScript', 'TypeScript'];

  return (
    <Box sx={{ p: 2 }}>
      {/* Profile Completion Card */}
      <Card sx={{ mb: 3, bgcolor: 'primary.lighter' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Завершенность профиля
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={profileCompletion} 
              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="text.secondary">
              {profileCompletion}%
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Добавьте еще информации, чтобы завершить профиль на 100%
          </Typography>
        </CardContent>
      </Card>

      {/* Avatar Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar src={avatar1} sx={{ width: 80, height: 80 }} />
        <Box>
          <Button variant="outlined" size="small" sx={{ mb: 1, mr: 1 }}>
            Изменить фото
          </Button>
          <Button variant="text" size="small" color="error">
            Удалить
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Рекомендуется изображение 400x400 px
          </Typography>
        </Box>
      </Box>

      {/* Form Fields */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Имя"
            value={profile.firstName}
            onChange={handleChange('firstName')}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Фамилия"
            value={profile.lastName}
            onChange={handleChange('lastName')}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            value={profile.email}
            onChange={handleChange('email')}
            variant="outlined"
            type="email"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Телефон"
            value={profile.phone}
            onChange={handleChange('phone')}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Должность"
            value={profile.position}
            onChange={handleChange('position')}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Компания"
            value={profile.company}
            onChange={handleChange('company')}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Местоположение"
            value={profile.location}
            onChange={handleChange('location')}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="О себе"
            value={profile.bio}
            onChange={handleChange('bio')}
            variant="outlined"
            multiline
            rows={4}
          />
        </Grid>

        {/* Skills Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Навыки
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {skills.map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                variant="outlined"
                color="primary"
                onDelete={() => {}}
                sx={{ mb: 1 }}
              />
            ))}
            <Button variant="text" size="small" sx={{ ml: 1 }}>
              + Добавить навык
            </Button>
          </Stack>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" color="primary">
              Сохранить изменения
            </Button>
            <Button variant="outlined">
              Отмена
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
