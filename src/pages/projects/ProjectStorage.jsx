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
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  AvatarGroup,
  LinearProgress,
  IconButton,
  Menu,
  Divider,
  Paper,
  InputAdornment,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import { Stack } from '@mui/material';

// assets
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import FilterOutlined from '@ant-design/icons/FilterOutlined';
import MoreOutlined from '@ant-design/icons/MoreOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import CalendarOutlined from '@ant-design/icons/CalendarOutlined';
import TeamOutlined from '@ant-design/icons/TeamOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import ProjectOutlined from '@ant-design/icons/ProjectOutlined';
import ClockCircleOutlined from '@ant-design/icons/ClockCircleOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import PauseCircleOutlined from '@ant-design/icons/PauseCircleOutlined';
import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';

// demo data
import avatar1 from 'assets/images/users/avatar-1.png';
import avatar2 from 'assets/images/users/avatar-2.png';
import avatar3 from 'assets/images/users/avatar-3.png';
import avatar4 from 'assets/images/users/avatar-4.png';

// ==============================|| PROJECT STORAGE PAGE ||============================== //

// Демо данные проектов
const demoProjects = [
  {
    id: 1,
    name: 'Мобильное приложение для доставки',
    description: 'Разработка iOS/Android приложения с системой заказов и отслеживания доставки',
    status: 'in_progress',
    priority: 'high',
    progress: 65,
    startDate: '2024-08-15',
    endDate: '2024-12-20',
    budget: '500,000 ₽',
    client: 'FoodDelivery Corp',
    tags: ['Mobile', 'React Native', 'Backend'],
    team: [
      { id: 1, name: 'Alice Johnson', avatar: avatar1 },
      { id: 2, name: 'Bob Smith', avatar: avatar2 },
      { id: 3, name: 'Carol Davis', avatar: avatar3 }
    ],
    tasksTotal: 45,
    tasksCompleted: 29,
    lastActivity: '2 часа назад',
    category: 'mobile'
  },
  {
    id: 2,
    name: 'Корпоративный сайт банка',
    description: 'Редизайн и разработка корпоративного веб-сайта с интеграцией банковских сервисов',
    status: 'completed',
    priority: 'medium',
    progress: 100,
    startDate: '2024-06-01',
    endDate: '2024-09-15',
    budget: '800,000 ₽',
    client: 'МегаБанк',
    tags: ['Web', 'React', 'Finance', 'Security'],
    team: [
      { id: 1, name: 'Alice Johnson', avatar: avatar1 },
      { id: 4, name: 'David Wilson', avatar: avatar4 }
    ],
    tasksTotal: 32,
    tasksCompleted: 32,
    lastActivity: '3 дня назад',
    category: 'web'
  },
  {
    id: 3,
    name: 'CRM система для продаж',
    description: 'Система управления взаимоотношениями с клиентами с модулями аналитики и отчетности',
    status: 'planning',
    priority: 'high',
    progress: 15,
    startDate: '2024-10-01',
    endDate: '2025-03-30',
    budget: '1,200,000 ₽',
    client: 'SalesForce Solutions',
    tags: ['CRM', 'Analytics', 'Dashboard', 'API'],
    team: [
      { id: 2, name: 'Bob Smith', avatar: avatar2 },
      { id: 3, name: 'Carol Davis', avatar: avatar3 },
      { id: 4, name: 'David Wilson', avatar: avatar4 }
    ],
    tasksTotal: 67,
    tasksCompleted: 10,
    lastActivity: '1 день назад',
    category: 'web'
  },
  {
    id: 4,
    name: 'Дизайн мобильного банкинга',
    description: 'UX/UI дизайн для мобильного банковского приложения с фокусом на безопасность',
    status: 'on_hold',
    priority: 'medium',
    progress: 40,
    startDate: '2024-07-10',
    endDate: '2024-11-15',
    budget: '300,000 ₽',
    client: 'БанкТех',
    tags: ['Design', 'UX/UI', 'Mobile', 'Fintech'],
    team: [
      { id: 3, name: 'Carol Davis', avatar: avatar3 }
    ],
    tasksTotal: 25,
    tasksCompleted: 10,
    lastActivity: '5 дней назад',
    category: 'design'
  },
  {
    id: 5,
    name: 'E-commerce платформа',
    description: 'Полноценная платформа электронной коммерции с системой платежей и управления товарами',
    status: 'in_progress',
    priority: 'critical',
    progress: 80,
    startDate: '2024-05-01',
    endDate: '2024-10-31',
    budget: '950,000 ₽',
    client: 'ShopMaster',
    tags: ['E-commerce', 'Payment', 'Inventory', 'React'],
    team: [
      { id: 1, name: 'Alice Johnson', avatar: avatar1 },
      { id: 2, name: 'Bob Smith', avatar: avatar2 },
      { id: 4, name: 'David Wilson', avatar: avatar4 }
    ],
    tasksTotal: 89,
    tasksCompleted: 71,
    lastActivity: '30 минут назад',
    category: 'web'
  },
  {
    id: 6,
    name: 'Маркетинговая кампания Q4',
    description: 'Комплексная маркетинговая кампания для запуска нового продукта в четвертом квартале',
    status: 'cancelled',
    priority: 'low',
    progress: 25,
    startDate: '2024-09-01',
    endDate: '2024-12-31',
    budget: '400,000 ₽',
    client: 'MarketPro',
    tags: ['Marketing', 'Campaign', 'Social Media', 'Analytics'],
    team: [
      { id: 3, name: 'Carol Davis', avatar: avatar3 }
    ],
    tasksTotal: 18,
    tasksCompleted: 5,
    lastActivity: '2 недели назад',
    category: 'marketing'
  }
];

const getStatusInfo = (status) => {
  const statusMap = {
    planning: { label: 'Планирование', color: 'info', icon: <ClockCircleOutlined /> },
    in_progress: { label: 'В процессе', color: 'primary', icon: <CheckCircleOutlined /> },
    completed: { label: 'Завершен', color: 'success', icon: <CheckCircleOutlined /> },
    on_hold: { label: 'Приостановлен', color: 'warning', icon: <PauseCircleOutlined /> },
    cancelled: { label: 'Отменен', color: 'error', icon: <CloseCircleOutlined /> }
  };
  return statusMap[status] || statusMap.planning;
};

const getPriorityColor = (priority) => {
  const priorityColors = {
    low: 'default',
    medium: 'primary',
    high: 'warning',
    critical: 'error'
  };
  return priorityColors[priority] || 'default';
};

export default function ProjectStorage() {
  const [projects, setProjects] = useState(demoProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('cards');
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Фильтрация и поиск проектов
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || project.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Сортировка проектов
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'priority':
        const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'recent':
      default:
        return new Date(b.startDate) - new Date(a.startDate);
    }
  });

  // Группировка по статусам для вкладок
  const projectsByStatus = {
    all: sortedProjects.length,
    planning: projects.filter(p => p.status === 'planning').length,
    in_progress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    on_hold: projects.filter(p => p.status === 'on_hold').length,
    cancelled: projects.filter(p => p.status === 'cancelled').length
  };

  const handleMenuClick = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const statusMap = ['all', 'in_progress', 'planning', 'completed', 'on_hold'];
    setFilterStatus(statusMap[newValue] || 'all');
  };

  const handleProjectAction = (action) => {
    switch (action) {
      case 'view':
        alert(`Просмотр проекта: ${selectedProject?.name}`);
        break;
      case 'edit':
        alert(`Редактирование проекта: ${selectedProject?.name}`);
        break;
      case 'delete':
        if (window.confirm(`Удалить проект "${selectedProject?.name}"?`)) {
          setProjects(prev => prev.filter(p => p.id !== selectedProject?.id));
          alert('Проект удален!');
        }
        break;
      default:
        break;
    }
    handleMenuClose();
  };

  const ProjectCard = ({ project }) => {
    const statusInfo = getStatusInfo(project.status);
    
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
              {project.name}
            </Typography>
            <IconButton size="small" onClick={(e) => handleMenuClick(e, project)}>
              <MoreOutlined />
            </IconButton>
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            {project.description}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
            <Chip
              icon={statusInfo.icon}
              label={statusInfo.label}
              color={statusInfo.color}
              size="small"
            />
            <Chip
              label={project.priority}
              color={getPriorityColor(project.priority)}
              size="small"
              variant="outlined"
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2">Прогресс</Typography>
              <Typography variant="body2">{project.progress}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={project.progress}
              color={project.progress === 100 ? 'success' : 'primary'}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {project.tags.slice(0, 3).map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
            {project.tags.length > 3 && (
              <Chip label={`+${project.tags.length - 3}`} size="small" variant="outlined" />
            )}
          </Stack>

          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarOutlined style={{ fontSize: 14, color: '#666' }} />
                <Typography variant="caption" color="text.secondary">
                  {project.endDate}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <DollarOutlined style={{ fontSize: 14, color: '#666' }} />
                <Typography variant="caption" color="text.secondary">
                  {project.budget}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28 } }}>
              {project.team.map((member) => (
                <Avatar key={member.id} src={member.avatar} alt={member.name} />
              ))}
            </AvatarGroup>
            <Typography variant="caption" color="text.secondary">
              {project.tasksCompleted}/{project.tasksTotal} задач
            </Typography>
          </Box>
        </CardContent>

        <CardActions>
          <Button size="small" startIcon={<EyeOutlined />}>
            Открыть
          </Button>
          <Button size="small" startIcon={<EditOutlined />}>
            Редактировать
          </Button>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Заголовок */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <ProjectOutlined style={{ fontSize: 24, color: '#1976d2' }} />
          <Typography variant="h4">Хранилище проектов</Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Управляйте всеми проектами в одном месте. Всего проектов: {projects.length}
        </Typography>
      </Paper>

      {/* Фильтры и поиск */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Поиск проектов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Категория</InputLabel>
              <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <MenuItem value="all">Все категории</MenuItem>
                <MenuItem value="web">Веб-разработка</MenuItem>
                <MenuItem value="mobile">Мобильная разработка</MenuItem>
                <MenuItem value="design">Дизайн</MenuItem>
                <MenuItem value="marketing">Маркетинг</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Сортировка</InputLabel>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <MenuItem value="recent">По дате</MenuItem>
                <MenuItem value="name">По названию</MenuItem>
                <MenuItem value="status">По статусу</MenuItem>
                <MenuItem value="priority">По приоритету</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<FilterOutlined />}>
                Фильтры
              </Button>
              <Button variant="contained" href="/projects/create">
                Новый проект
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Вкладки по статусам */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label={
            <Badge badgeContent={projectsByStatus.all} color="primary" showZero>
              Все проекты
            </Badge>
          } />
          <Tab label={
            <Badge badgeContent={projectsByStatus.in_progress} color="primary">
              В работе
            </Badge>
          } />
          <Tab label={
            <Badge badgeContent={projectsByStatus.planning} color="info">
              Планирование
            </Badge>
          } />
          <Tab label={
            <Badge badgeContent={projectsByStatus.completed} color="success">
              Завершенные
            </Badge>
          } />
          <Tab label={
            <Badge badgeContent={projectsByStatus.on_hold} color="warning">
              Приостановленные
            </Badge>
          } />
        </Tabs>
      </Paper>

      {/* Список проектов */}
      {sortedProjects.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ProjectOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Проекты не найдены
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Измените параметры поиска или создайте новый проект
          </Typography>
          <Button variant="contained" href="/projects/create">
            Создать проект
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {sortedProjects.map((project) => (
            <Grid item xs={12} sm={6} lg={4} key={project.id}>
              <ProjectCard project={project} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Контекстное меню */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleProjectAction('view')}>
          <EyeOutlined style={{ marginRight: 8 }} />
          Просмотреть
        </MenuItem>
        <MenuItem onClick={() => handleProjectAction('edit')}>
          <EditOutlined style={{ marginRight: 8 }} />
          Редактировать
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleProjectAction('delete')} sx={{ color: 'error.main' }}>
          <DeleteOutlined style={{ marginRight: 8 }} />
          Удалить
        </MenuItem>
      </Menu>
    </Box>
  );
}
