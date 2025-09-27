import { useState } from 'react';

// material-ui
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  LinearProgress,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material';
import { Stack } from '@mui/material';
// DatePicker временно отключен - используем простой TextField
// import { DatePicker } from '@mui/x-date-pickers';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { ru } from 'date-fns/locale';

// assets
import ProjectOutlined from '@ant-design/icons/ProjectOutlined';
import TeamOutlined from '@ant-design/icons/TeamOutlined';
import CalendarOutlined from '@ant-design/icons/CalendarOutlined';
import SettingOutlined from '@ant-design/icons/SettingOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';

// demo data
import avatar1 from 'assets/images/users/avatar-1.png';
import avatar2 from 'assets/images/users/avatar-2.png';
import avatar3 from 'assets/images/users/avatar-3.png';
import avatar4 from 'assets/images/users/avatar-4.png';

// ==============================|| CREATE PROJECT PAGE ||============================== //

const steps = ['Основная информация', 'Команда и ресурсы', 'Настройки и подтверждение'];

const projectTemplates = [
  { id: 'web-app', name: 'Веб-приложение', description: 'Стандартный шаблон для веб-проектов' },
  { id: 'mobile-app', name: 'Мобильное приложение', description: 'Шаблон для iOS/Android разработки' },
  { id: 'design', name: 'Дизайн-проект', description: 'Для UI/UX дизайн проектов' },
  { id: 'marketing', name: 'Маркетинг', description: 'Маркетинговые кампании и промо' },
  { id: 'custom', name: 'Пользовательский', description: 'Создать с нуля' }
];

const teamMembers = [
  { id: 1, name: 'Alice Johnson', role: 'Project Manager', avatar: avatar1, skills: ['Management', 'Agile', 'Scrum'] },
  { id: 2, name: 'Bob Smith', role: 'Frontend Developer', avatar: avatar2, skills: ['React', 'TypeScript', 'CSS'] },
  { id: 3, name: 'Carol Davis', role: 'UX Designer', avatar: avatar3, skills: ['Figma', 'Prototyping', 'User Research'] },
  { id: 4, name: 'David Wilson', role: 'Backend Developer', avatar: avatar4, skills: ['Node.js', 'PostgreSQL', 'API'] }
];

export default function CreateProject() {
  const [activeStep, setActiveStep] = useState(0);
  const [project, setProject] = useState({
    name: '',
    description: '',
    template: '',
    priority: 'medium',
    status: 'planning',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
    budget: '',
    client: '',
    tags: [],
    isPublic: false,
    notifications: true,
    selectedTeam: [],
    resources: []
  });

  const [currentTag, setCurrentTag] = useState('');
  const [projectProgress, setProjectProgress] = useState(25);

  const handleChange = (field) => (event) => {
    if (field === 'isPublic' || field === 'notifications') {
      setProject(prev => ({ ...prev, [field]: event.target.checked }));
    } else {
      setProject(prev => ({ ...prev, [field]: event.target.value }));
    }
  };

  const handleAddTag = () => {
    if (currentTag && !project.tags.includes(currentTag)) {
      setProject(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setProject(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTeamSelection = (member) => {
    const isSelected = project.selectedTeam.some(m => m.id === member.id);
    if (isSelected) {
      setProject(prev => ({
        ...prev,
        selectedTeam: prev.selectedTeam.filter(m => m.id !== member.id)
      }));
    } else {
      setProject(prev => ({
        ...prev,
        selectedTeam: [...prev.selectedTeam, member]
      }));
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setProjectProgress(prev => Math.min(prev + 25, 100));
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setProjectProgress(prev => Math.max(prev - 25, 0));
  };

  const handleCreateProject = () => {
    // Здесь будет логика создания проекта (пока только демо)
    alert(`Проект "${project.name}" успешно создан!\n\nКоманда: ${project.selectedTeam.length} участников\nШаблон: ${projectTemplates.find(t => t.id === project.template)?.name || 'Не выбран'}\nСтатус: ${project.status}`);
    
    // Сброс формы
    setProject({
      name: '',
      description: '',
      template: '',
      priority: 'medium',
      status: 'planning',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      budget: '',
      client: '',
      tags: [],
      isPublic: false,
      notifications: true,
      selectedTeam: [],
      resources: []
    });
    setActiveStep(0);
    setProjectProgress(25);
  };

  // Компонент для отображения шага 1
  const BasicInfoStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Заполните основную информацию о проекте. Все поля можно изменить позже.
          </Typography>
        </Alert>
      </Grid>

      <Grid item xs={12} md={8}>
        <TextField
          fullWidth
          label="Название проекта *"
          value={project.name}
          onChange={handleChange('name')}
          variant="outlined"
          placeholder="Например: Мобильное приложение для доставки"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Приоритет</InputLabel>
          <Select value={project.priority} onChange={handleChange('priority')}>
            <MenuItem value="low">Низкий</MenuItem>
            <MenuItem value="medium">Средний</MenuItem>
            <MenuItem value="high">Высокий</MenuItem>
            <MenuItem value="critical">Критический</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Описание проекта"
          value={project.description}
          onChange={handleChange('description')}
          variant="outlined"
          multiline
          rows={4}
          placeholder="Опишите цели и задачи проекта..."
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Клиент/Заказчик"
          value={project.client}
          onChange={handleChange('client')}
          variant="outlined"
          placeholder="Название компании или имя клиента"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Бюджет"
          value={project.budget}
          onChange={handleChange('budget')}
          variant="outlined"
          placeholder="100 000 ₽"
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Выберите шаблон проекта</Typography>
        <Grid container spacing={2}>
          {projectTemplates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: project.template === template.id ? 2 : 1,
                  borderColor: project.template === template.id ? 'primary.main' : 'divider',
                  '&:hover': { borderColor: 'primary.main' }
                }}
                onClick={() => setProject(prev => ({ ...prev, template: template.id }))}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>{template.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {template.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );

  // Компонент для отображения шага 2
  const TeamResourcesStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          <TeamOutlined style={{ marginRight: 8 }} />
          Выбор команды проекта
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Выберите участников команды для этого проекта
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Grid container spacing={2}>
          {teamMembers.map((member) => {
            const isSelected = project.selectedTeam.some(m => m.id === member.id);
            return (
              <Grid item xs={12} sm={6} md={4} key={member.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: isSelected ? 2 : 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'primary.lighter' : 'background.paper',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => handleTeamSelection(member)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar src={member.avatar} />
                      <Box>
                        <Typography variant="h6">{member.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {member.role}
                        </Typography>
                      </Box>
                      {isSelected && <CheckCircleOutlined style={{ color: 'green', marginLeft: 'auto' }} />}
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {member.skills.map((skill) => (
                        <Chip key={skill} label={skill} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle1" gutterBottom>
            Выбранная команда ({project.selectedTeam.length} участников):
          </Typography>
          {project.selectedTeam.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Участники не выбраны
            </Typography>
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {project.selectedTeam.map((member) => (
                <Chip
                  key={member.id}
                  label={member.name}
                  avatar={<Avatar src={member.avatar} />}
                  onDelete={() => handleTeamSelection(member)}
                  color="primary"
                />
              ))}
            </Stack>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Дата начала"
          type="date"
          value={project.startDate}
          onChange={handleInputChange('startDate')}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          label="Дата завершения"
          type="date"
          value={project.endDate}
          onChange={handleInputChange('endDate')}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    </Grid>
  );

  // Компонент для отображения шага 3
  const SettingsStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          <SettingOutlined style={{ marginRight: 8 }} />
          Настройки проекта
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Статус проекта</InputLabel>
          <Select value={project.status} onChange={handleChange('status')}>
            <MenuItem value="planning">Планирование</MenuItem>
            <MenuItem value="in_progress">В процессе</MenuItem>
            <MenuItem value="on_hold">Приостановлен</MenuItem>
            <MenuItem value="completed">Завершен</MenuItem>
            <MenuItem value="cancelled">Отменен</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={<Switch checked={project.isPublic} onChange={handleChange('isPublic')} />}
            label="Публичный проект"
          />
          <FormControlLabel
            control={<Switch checked={project.notifications} onChange={handleChange('notifications')} />}
            label="Уведомления о проекте"
          />
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>Теги проекта</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          <TextField
            size="small"
            label="Добавить тег"
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <Button variant="outlined" onClick={handleAddTag}>Добавить</Button>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {project.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onDelete={() => handleRemoveTag(tag)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>Сводка проекта</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Основное</Typography>
              <Typography variant="body1"><strong>Название:</strong> {project.name || 'Не указано'}</Typography>
              <Typography variant="body1"><strong>Клиент:</strong> {project.client || 'Не указан'}</Typography>
              <Typography variant="body1"><strong>Приоритет:</strong> {project.priority}</Typography>
              <Typography variant="body1"><strong>Статус:</strong> {project.status}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Команда и ресурсы</Typography>
              <Typography variant="body1"><strong>Участников:</strong> {project.selectedTeam.length}</Typography>
              <Typography variant="body1"><strong>Бюджет:</strong> {project.budget || 'Не указан'}</Typography>
              <Typography variant="body1"><strong>Теги:</strong> {project.tags.length}</Typography>
              <Typography variant="body1"><strong>Шаблон:</strong> {projectTemplates.find(t => t.id === project.template)?.name || 'Не выбран'}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ width: '100%' }}>
        {/* Заголовок и прогресс */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <ProjectOutlined style={{ fontSize: 24, color: '#1976d2' }} />
            <Typography variant="h4">Создание нового проекта</Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Прогресс создания: {projectProgress}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={projectProgress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Содержимое шагов */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {activeStep === 0 && <BasicInfoStep />}
            {activeStep === 1 && <TeamResourcesStep />}
            {activeStep === 2 && <SettingsStep />}
          </CardContent>
        </Card>

        {/* Навигация */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Назад
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateProject}
                disabled={!project.name}
              >
                Создать проект
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={activeStep === 0 && !project.name}
              >
                Далее
              </Button>
            )}
          </Box>
        </Box>
      </Box>
  );
}
