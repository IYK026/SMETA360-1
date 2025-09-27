# Material-UI Grid v2 Migration Guide

## 🚨 Проблема
MUI Grid v2 удалил некоторые пропы, которые использовались в предыдущих версиях.

## ⚠️ Предупреждения, которые могут появляться:

### 1. "The `lg` prop has been removed"
```jsx
// ❌ Устарело
<Grid item xs={12} lg={8}>

// ✅ Правильно
<Grid item xs={12} md={8}>
```

### 2. "The `xl` prop has been removed"  
```jsx
// ❌ Устарело
<Grid item xs={12} xl={6}>

// ✅ Правильно
<Grid item xs={12} md={6}>
```

## 🔧 Карта миграции размеров:

| Старый | Новый | Описание |
|--------|-------|----------|
| `xs` | `xs` | ✅ Без изменений (≥0px) |
| `sm` | `sm` | ✅ Без изменений (≥600px) |
| `md` | `md` | ✅ Без изменений (≥900px) |
| `lg` | `md` | ❌ Удален (≥1200px → используйте md) |
| `xl` | `md` | ❌ Удален (≥1536px → используйте md) |

## 🛠️ Быстрые исправления:

### Замена lg на md:
```bash
# Найти все использования lg в JSX файлах
grep -r "lg=" src/ --include="*.jsx" --include="*.js"

# Заменить lg на md
sed -i 's/lg=/md=/g' src/**/*.jsx
```

### PowerShell команды:
```powershell
# Найти файлы с lg пропом
Select-String -Path "src\**\*.jsx" -Pattern "lg=" -AllMatches

# Заменить в файле (пример)
(Get-Content "src\components\MyComponent.jsx") -replace "lg=", "md=" | Set-Content "src\components\MyComponent.jsx"
```

## 🎯 Стратегия адаптивности:

### Для двухколоночной структуры:
```jsx
// ✅ Современный подход
<Grid container spacing={3}>
  {/* Основной контент */}
  <Grid item xs={12} md={8}>
    <MainContent />
  </Grid>
  
  {/* Боковая панель */}
  <Grid item xs={12} md={4}>
    <Sidebar />
  </Grid>
</Grid>
```

### Для трехколоночной структуры:
```jsx
// ✅ Современный подход
<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={4}>
    <Card1 />
  </Grid>
  <Grid item xs={12} sm={6} md={4}>
    <Card2 />
  </Grid>
  <Grid item xs={12} sm={12} md={4}>
    <Card3 />
  </Grid>
</Grid>
```

## 📱 Рекомендации по breakpoints:

1. **xs (0-599px):** Мобильные телефоны
2. **sm (600-899px):** Планшеты
3. **md (900px+):** Десктопы и большие планшеты

## 🔍 Альтернативы для больших экранов:

Если нужно различать поведение для больших экранов, используйте:

### 1. CSS медиа-запросы:
```jsx
const useStyles = makeStyles((theme) => ({
  container: {
    [theme.breakpoints.up('lg')]: {
      maxWidth: '1200px'
    }
  }
}));
```

### 2. useMediaQuery хук:
```jsx
import { useMediaQuery } from '@mui/material';

function MyComponent() {
  const isLargeScreen = useMediaQuery('(min-width: 1200px)');
  
  return (
    <Grid item xs={12} md={isLargeScreen ? 6 : 8}>
      {/* content */}
    </Grid>
  );
}
```

## ✅ Результат исправления:
После внесения изменений предупреждения должны исчезнуть и Grid будет работать корректно на всех размерах экранов.
