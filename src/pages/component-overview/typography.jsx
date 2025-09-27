// material-ui
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import MainCard from 'components/MainCard';

// ==============================|| COMPONENTS - TYPOGRAPHY ||============================== //

export default function ComponentTypography() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Stack sx={{ gap: 3 }}>
          <MainCard title="Основное">
            <Stack sx={{ gap: 0.75, mt: -1.5 }}>
              <Typography variant="h1">Inter</Typography>
              <Typography variant="h5">Семейство шрифтов</Typography>
              <Breadcrumbs aria-label="breadcrumb">
                <Typography variant="h6">Обычный</Typography>
                <Typography variant="h6">Средний</Typography>
                <Typography variant="h6">Жирный</Typography>
              </Breadcrumbs>
            </Stack>
          </MainCard>
          <MainCard title="Заголовки">
            <Stack sx={{ gap: 2 }}>
              <Typography variant="h1">Заголовок H1</Typography>
              <Breadcrumbs aria-label="breadcrumb">
                <Typography variant="h6">Размер: 38px</Typography>
                <Typography variant="h6">Вес: Жирный</Typography>
                <Typography variant="h6">Высота строки: 46px</Typography>
              </Breadcrumbs>
              <Divider />

              <Typography variant="h2">Заголовок H2</Typography>
              <Breadcrumbs aria-label="breadcrumb">
                <Typography variant="h6">Размер: 30px</Typography>
                <Typography variant="h6">Вес: Жирный</Typography>
                <Typography variant="h6">Высота строки: 38px</Typography>
              </Breadcrumbs>
              <Divider />

              <Typography variant="h3">Заголовок H3</Typography>
              <Breadcrumbs aria-label="breadcrumb">
                <Typography variant="h6">Размер: 24px</Typography>
                <Typography variant="h6">Вес: Обычный и жирный</Typography>
                <Typography variant="h6">Высота строки: 32px</Typography>
              </Breadcrumbs>
              <Divider />

              <Typography variant="h4">Заголовок H4</Typography>
              <Breadcrumbs aria-label="breadcrumb">
                <Typography variant="h6">Размер: 20px</Typography>
                <Typography variant="h6">Вес: Жирный</Typography>
                <Typography variant="h6">Высота строки: 28px</Typography>
              </Breadcrumbs>
              <Divider />

              <Typography variant="h5">Заголовок H5</Typography>
              <Breadcrumbs aria-label="breadcrumb">
                <Typography variant="h6">Размер: 16px</Typography>
                <Typography variant="h6">Вес: Обычный, средний и жирный</Typography>
                <Typography variant="h6">Высота строки: 24px</Typography>
              </Breadcrumbs>
              <Divider />

              <Typography variant="h6">Заголовок H6 / Подзаголовок</Typography>
              <Breadcrumbs aria-label="breadcrumb">
                <Typography variant="h6">Размер: 14px</Typography>
                <Typography variant="h6">Вес: Обычный</Typography>
                <Typography variant="h6">Высота строки: 22px</Typography>
              </Breadcrumbs>
            </Stack>
          </MainCard>
          <MainCard title="Основной текст 1">
            <Typography variant="body1" gutterBottom>
              Это пример основного текста. Он используется для большинства текстового контента в приложении.
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <Typography variant="h6">Размер: 14px</Typography>
              <Typography variant="h6">Вес: Обычный</Typography>
              <Typography variant="h6">Высота строки: 22px</Typography>
            </Breadcrumbs>
          </MainCard>
          <MainCard title="Основной текст 2">
            <Typography variant="body2" gutterBottom>
              Это пример вторичного основного текста. Используется для менее важной информации.
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <Typography variant="h6">Размер: 12px</Typography>
              <Typography variant="h6">Вес: Обычный</Typography>
              <Typography variant="h6">Высота строки: 20px</Typography>
            </Breadcrumbs>
          </MainCard>
          <MainCard title="Подзаголовок 1">
            <Typography variant="subtitle1" gutterBottom>
              Это пример подзаголовка первого уровня. Используется для выделения важных разделов.
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <Typography variant="h6">Размер: 14px</Typography>
              <Typography variant="h6">Вес: Средний</Typography>
              <Typography variant="h6">Высота строки: 22px</Typography>
            </Breadcrumbs>
          </MainCard>
          <MainCard title="Подзаголовок 2">
            <Typography variant="subtitle2" gutterBottom>
              Это пример подзаголовка второго уровня. Используется для дополнительной информации.
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <Typography variant="h6">Размер: 12px</Typography>
              <Typography variant="h6">Вес: Средний</Typography>
              <Typography variant="h6">Высота строки: 20px</Typography>
            </Breadcrumbs>
          </MainCard>
          <MainCard title="Подпись">
            <Stack sx={{ gap: 1 }}>
              <Typography variant="caption">Это пример текста подписи. Используется для пояснений и дополнительной информации.</Typography>
              <Breadcrumbs aria-label="breadcrumb">
                <Typography variant="h6">Размер: 12px</Typography>
                <Typography variant="h6">Вес: Обычный</Typography>
                <Typography variant="h6">Высота строки: 20px</Typography>
              </Breadcrumbs>
            </Stack>
          </MainCard>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Stack sx={{ gap: 3 }}>
          <MainCard title="Выравнивание">
            <Typography variant="body2" gutterBottom>
              Этот текст выравнен по левому краю. Используется по умолчанию для большинства текстового контента.
            </Typography>
            <Typography variant="body2" textAlign="center" gutterBottom>
              Этот текст выравнен по центру. Используется для заголовков и важных блоков информации.
            </Typography>
            <Typography variant="body2" textAlign="right">
              Этот текст выравнен по правому краю. Используется для числовых данных и специального контента.
            </Typography>
          </MainCard>
          <MainCard title="Gutter Bottom">
            <Typography variant="body1" gutterBottom>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Typography>
            <Typography variant="body2" gutterBottom>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <Typography variant="h6">Size: 12px</Typography>
              <Typography variant="h6">Weight: Regular</Typography>
              <Typography variant="h6">Line Height: 20px</Typography>
            </Breadcrumbs>
          </MainCard>
          <MainCard title="Overline">
            <Stack sx={{ gap: 1.5 }}>
              <Typography variant="overline">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </Typography>
              <Breadcrumbs aria-label="breadcrumb">
                <Typography variant="h6">Size: 12px</Typography>
                <Typography variant="h6">Weight: Regular</Typography>
                <Typography variant="h6">Line Height: 20px</Typography>
              </Breadcrumbs>
            </Stack>
          </MainCard>
          <MainCard title="Link">
            <Stack sx={{ gap: 1.5 }}>
              <Link href="#">mantisdashboard.com</Link>
              <Breadcrumbs aria-label="breadcrumb">
                <Typography variant="h6">Size: 12px</Typography>
                <Typography variant="h6">Weight: Regular</Typography>
                <Typography variant="h6">Line Height: 20px</Typography>
              </Breadcrumbs>
            </Stack>
          </MainCard>
          <MainCard title="Цвета">
            <Typography variant="h6" color="text.primary" gutterBottom>
              Это основной цвет текста.
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Это вторичный цвет текста.
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              Это первичный цвет темы.
            </Typography>
            <Typography variant="h6" color="secondary" gutterBottom>
              Это вторичный цвет темы.
            </Typography>
            <Typography variant="h6" color="success" gutterBottom>
              Это цвет успеха.
            </Typography>
            <Typography variant="h6" sx={{ color: 'warning.main' }} gutterBottom>
              Это цвет предупреждения.
            </Typography>
            <Typography variant="h6" color="error" gutterBottom>
              Это цвет ошибки.
            </Typography>
          </MainCard>
          <MainCard title="Paragraph">
            <Typography variant="body1" gutterBottom>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <Typography variant="h6">Size: 14px</Typography>
              <Typography variant="h6">Weight: Regular</Typography>
              <Typography variant="h6">Line Height: 22px</Typography>
            </Breadcrumbs>
          </MainCard>
          <MainCard title="Font Style">
            <Typography variant="body1" gutterBottom sx={{ fontStyle: 'italic' }}>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Typography>
            <Typography variant="subtitle1" gutterBottom sx={{ fontStyle: 'italic' }}>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Typography>
            <Breadcrumbs aria-label="breadcrumb">
              <Typography variant="h6">Size: 14px</Typography>
              <Typography variant="h6">Weight: Italic Regular & Italic Bold</Typography>
              <Typography variant="h6">Line Height: 22px</Typography>
            </Breadcrumbs>
          </MainCard>
        </Stack>
      </Grid>
    </Grid>
  );
}
