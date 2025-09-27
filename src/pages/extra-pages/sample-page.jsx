// material-ui
import Typography from '@mui/material/Typography';

// project imports
import MainCard from 'components/MainCard';

// ==============================|| SAMPLE PAGE ||============================== //

export default function SamplePage() {
  return (
    <MainCard title="Пример карточки">
      <Typography variant="body2">
        Это пример страницы в приложении Mantis. Здесь вы можете размещать различный контент. Этот шаблон предоставляет множество
        возможностей для создания современных веб-приложений с использованием React и Material-UI. Вы можете настроить эту страницу под ваши
        нужды, добавив формы, таблицы, графики и другие компоненты интерфейса.
      </Typography>
    </MainCard>
  );
}
