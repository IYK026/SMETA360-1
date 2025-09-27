# 🗄️ СТРУКТУРА БАЗЫ ДАННЫХ - ПРОЕКТ S2

## 📊 ОБЩАЯ ИНФОРМАЦИЯ
- **Всего таблиц:** 11
- **PostgreSQL версия:** 17.6 
- **Провайдер:** Aiven Cloud
- **Размер БД:** 11 MB

## 📋 СПИСОК ВСЕХ ТАБЛИЦ

### 1. 👤 **AUTH_USERS** - Пользователи системы (4 записи)
```
id                        INTEGER         NOT NULL  PK, AUTO_INCREMENT
email                     VARCHAR(255)    NOT NULL  UNIQUE
password_hash             VARCHAR(255)    NOT NULL
firstname                 VARCHAR(255)    NOT NULL
lastname                  VARCHAR(255)    NOT NULL
company                   VARCHAR(255)    NULL
is_active                 BOOLEAN         DEFAULT true
email_verified            BOOLEAN         DEFAULT false
last_login               TIMESTAMP       NULL
created_at               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
updated_at               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
```

### 2. 🧱 **MATERIALS** - Справочник материалов (1,446 записей)
```
id                       TEXT            NOT NULL  PK
name                     TEXT            NOT NULL
image_url                TEXT            NULL
item_url                 TEXT            NULL
unit                     TEXT            NULL      -- единица измерения
unit_price               NUMERIC         NULL      -- цена за единицу
expenditure              NUMERIC         NULL      -- расход
weight                   NUMERIC         NULL      -- вес
created_at               TIMESTAMPTZ     DEFAULT now()
updated_at               TIMESTAMPTZ     DEFAULT now()
```

### 3. 📦 **ORDERS** - Заказы (8 записей)
```
id                       INTEGER         NOT NULL  PK, AUTO_INCREMENT
tracking_no              BIGINT          NOT NULL
product_name             VARCHAR(255)    NOT NULL
quantity                 INTEGER         NOT NULL
status                   INTEGER         DEFAULT 0
amount                   NUMERIC         NOT NULL
user_id                  INTEGER         NULL      FK → auth_users.id
created_at               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
```

### 4. 🏗️ **PHASES** - Фазы работ (540 записей)
```
id                       TEXT            NOT NULL  PK
name                     TEXT            NOT NULL
sort_order               INTEGER         DEFAULT 0
created_at               TIMESTAMPTZ     DEFAULT now()
updated_at               TIMESTAMPTZ     DEFAULT now()
```

### 5. 📋 **STAGES** - Стадии работ (15 записей)
```
id                       TEXT            NOT NULL  PK
name                     TEXT            NOT NULL
phase_id                 TEXT            NULL      FK → phases.id
sort_order               INTEGER         DEFAULT 0
created_at               TIMESTAMPTZ     DEFAULT now()
updated_at               TIMESTAMPTZ     DEFAULT now()
```

### 6. 🔧 **SUBSTAGES** - Подстадии работ (43 записи)
```
id                       TEXT            NOT NULL  PK
name                     TEXT            NOT NULL
stage_id                 TEXT            NULL      FK → stages.id
sort_order               INTEGER         DEFAULT 0
created_at               TIMESTAMPTZ     DEFAULT now()
updated_at               TIMESTAMPTZ     DEFAULT now()
```

### 7. ⚙️ **WORKS_REF** - Справочник работ (540 записей)
```
id                       TEXT            NOT NULL  PK
name                     TEXT            NOT NULL
unit                     TEXT            NULL      -- единица измерения
unit_price               NUMERIC         NULL      -- цена за единицу работы
phase_id                 TEXT            NULL      FK → phases.id
stage_id                 TEXT            NULL      FK → stages.id
substage_id              TEXT            NULL      FK → substages.id
sort_order               INTEGER         DEFAULT 0
created_at               TIMESTAMPTZ     DEFAULT now()
updated_at               TIMESTAMPTZ     DEFAULT now()
```

### 8. 🔗 **WORK_MATERIALS** - Связи работы-материалы (1,425 записей)
```
work_id                  TEXT            NOT NULL  PK, FK → works_ref.id
material_id              TEXT            NOT NULL  PK, FK → materials.id
consumption_per_work_unit NUMERIC        NULL      -- расход материала на единицу работы
waste_coeff              NUMERIC         DEFAULT 1.0 -- коэффициент отходов
created_at               TIMESTAMPTZ     DEFAULT now()
updated_at               TIMESTAMPTZ     DEFAULT now()
-- COMPOSITE PRIMARY KEY: (work_id, material_id)
```

### 9. 📊 **STATISTICS** - Статистика (4 записи)
```
id                       INTEGER         NOT NULL  PK, AUTO_INCREMENT
metric_name              VARCHAR(255)    NOT NULL
metric_value             INTEGER         NOT NULL
percentage               NUMERIC         NULL
extra_value              INTEGER         NULL
is_loss                  BOOLEAN         DEFAULT false
color                    VARCHAR(50)     DEFAULT 'primary'
updated_at               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
```

### 10. 🔐 **USER_SESSIONS** - Сессии пользователей (0 записей)
```
id                       INTEGER         NOT NULL  PK, AUTO_INCREMENT
user_id                  INTEGER         NULL      FK → auth_users.id
token_hash               VARCHAR(255)    NOT NULL
expires_at               TIMESTAMP       NOT NULL
user_agent               TEXT            NULL
ip_address               INET            NULL
created_at               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
```

### 11. 👥 **USERS** - Пользователи (legacy, 3 записи)
```
id                       INTEGER         NOT NULL  PK, AUTO_INCREMENT
name                     VARCHAR(255)    NOT NULL
email                    VARCHAR(255)    NOT NULL  UNIQUE
created_at               TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
```

## 🔗 СХЕМА СВЯЗЕЙ

```
phases (id) ←─── stages (phase_id)
                     ↓
stages (id) ←─── substages (stage_id)
                     ↓
works_ref ←── phases (phase_id)
     ↓     ←── stages (stage_id)  
     ↓     ←── substages (substage_id)
     ↓
work_materials (work_id) ──→ works_ref (id)
work_materials (material_id) ──→ materials (id)

auth_users (id) ←─── orders (user_id)
auth_users (id) ←─── user_sessions (user_id)
```

## 🎯 ОСНОВНАЯ ЛОГИКА СИСТЕМЫ

**Иерархия работ:**
`Фазы → Стадии → Подстадии → Работы`

**Расчет материалов:**
1. Работа связывается с материалами через `work_materials`
2. Каждая связь содержит:
   - `consumption_per_work_unit` - базовый расход
   - `waste_coeff` - коэффициент отходов
3. **Итоговый расход = consumption_per_work_unit × waste_coeff**
4. **Стоимость = итоговый_расход × unit_price_материала**

## ❌ ОТСУТСТВУЮЩИЕ ТАБЛИЦЫ
- **projects** - нет таблицы проектов
- **estimates** - нет таблицы смет  
- **estimate_items** - нет таблицы позиций смет

Система работает как **справочник работ и материалов** без функционала проектов и смет.
