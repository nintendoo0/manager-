# Документация по пагинации

## Обзор

В системе управления дефектами реализована пагинация для списков проектов и дефектов. Это улучшает производительность и удобство работы с большими объемами данных.

## Backend API

### Endpoints с пагинацией

#### 1. GET /api/projects
Получение списка проектов с пагинацией.

**Query параметры:**
- `page` (number, optional) - номер страницы (по умолчанию: 1)
- `limit` (number, optional) - количество элементов на странице (по умолчанию: 10)

**Пример запроса:**
```
GET /api/projects?page=2&limit=20
```

**Формат ответа:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Проект 1",
      "description": "Описание",
      "status": "active",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "created_at": "2025-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 2,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

#### 2. GET /api/defects
Получение списка дефектов с пагинацией и фильтрацией.

**Query параметры:**
- `page` (number, optional) - номер страницы (по умолчанию: 1)
- `limit` (number, optional) - количество элементов на странице (по умолчанию: 10)
- `project_id` (number, optional) - фильтр по проекту
- `status` (string, optional) - фильтр по статусу
- `priority` (string, optional) - фильтр по приоритету
- `assigned_to` (number, optional) - фильтр по исполнителю

**Пример запроса:**
```
GET /api/defects?page=1&limit=10&status=new&priority=high
```

**Формат ответа:** (аналогичен проектам)

## Frontend компоненты

### Компонент Pagination

Переиспользуемый компонент для отображения элементов управления пагинацией.

**Расположение:** `frontend/src/components/UI/Pagination.js`

**Props:**
- `currentPage` (number) - текущая страница
- `totalPages` (number) - общее количество страниц
- `totalItems` (number) - общее количество элементов
- `itemsPerPage` (number) - элементов на странице
- `onPageChange` (function) - callback для смены страницы
  - Параметры: `(page, newItemsPerPage?)`

**Пример использования:**
```jsx
<Pagination
  currentPage={currentPage}
  totalPages={pagination.totalPages}
  totalItems={pagination.totalItems}
  itemsPerPage={itemsPerPage}
  onPageChange={handlePageChange}
/>
```

### Интеграция в списки

#### ProjectList.js
```javascript
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
const [pagination, setPagination] = useState({...});

const fetchProjects = async () => {
  const res = await api.get(`/projects?page=${currentPage}&limit=${itemsPerPage}`);
  setProjects(res.data.data);
  setPagination(res.data.pagination);
};

const handlePageChange = (page, newItemsPerPage) => {
  if (newItemsPerPage && newItemsPerPage !== itemsPerPage) {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  } else {
    setCurrentPage(page);
  }
};
```

#### DefectList.js
Аналогичная реализация с учетом фильтров.

## Возможности пагинации

### 1. Навигация по страницам
- Кнопки "Назад" и "Вперед"
- Прямой переход на конкретную страницу
- Умная нумерация страниц с многоточием

### 2. Настройка количества элементов
Пользователь может выбрать:
- 5 элементов на странице
- 10 элементов (по умолчанию)
- 20 элементов
- 50 элементов

### 3. Информация о данных
Отображается: "Показано 1-10 из 50"

### 4. Адаптивный дизайн
- На десктопе: горизонтальная раскладка
- На мобильных: вертикальная раскладка

## Логика работы

### Умная нумерация страниц

Компонент автоматически адаптирует отображение номеров страниц:

**Мало страниц (≤5):**
```
[1] [2] [3] [4] [5]
```

**Текущая страница в начале:**
```
[1] [2] [3] [4] ... [20]
```

**Текущая страница в середине:**
```
[1] ... [9] [10] [11] ... [20]
```

**Текущая страница в конце:**
```
[1] ... [17] [18] [19] [20]
```

### Сброс на первую страницу

Пагинация автоматически сбрасывается на страницу 1 при:
- Изменении фильтров
- Изменении количества элементов на странице

## Стилизация

**Файл:** `frontend/src/components/UI/Pagination.css`

**Основные классы:**
- `.pagination-container` - главный контейнер
- `.pagination-controls` - кнопки управления
- `.pagination-page` - кнопка страницы
- `.pagination-page.active` - активная страница
- `.pagination-info` - информация о данных
- `.pagination-page-select` - выбор количества элементов

**Цветовая схема:**
- Неактивные элементы: `#ddd`, `#666`
- Активная страница: `#007bff` (синий)
- Hover эффекты: плавные переходы

## Производительность

### Оптимизации backend:
1. **LIMIT/OFFSET запросы** - загружается только нужная страница
2. **COUNT запрос** - отдельный эффективный подсчет
3. **Индексы БД** - на полях сортировки и фильтрации

### Оптимизации frontend:
1. **Единый запрос** - данные и метаданные в одном ответе
2. **Кэширование** - React state сохраняет текущую страницу
3. **Условный рендеринг** - пагинация не отображается при < 2 страниц

## Тестирование

### Тестовые сценарии:

1. **Навигация:**
   - Переход на следующую страницу
   - Переход на предыдущую страницу
   - Переход на конкретную страницу
   - Блокировка кнопок на граничных страницах

2. **Изменение количества:**
   - Смена на 5/10/20/50 элементов
   - Проверка сброса на страницу 1

3. **Совместимость с фильтрами:**
   - Фильтрация + пагинация
   - Сброс на страницу 1 при смене фильтра

4. **Адаптивность:**
   - Отображение на десктопе
   - Отображение на планшете
   - Отображение на мобильном

## Обратная совместимость

Backend поддерживает старые запросы без пагинации:
```javascript
// Старый формат (без page/limit)
GET /api/projects

// Автоматически использует page=1, limit=10
// Возвращает новый формат с { data, pagination }
```

Frontend обрабатывает оба формата ответа:
```javascript
if (res.data && res.data.data) {
  // Новый формат с пагинацией
  setProjects(res.data.data);
  setPagination(res.data.pagination);
} else if (Array.isArray(res.data)) {
  // Старый формат (массив)
  setProjects(res.data);
}
```

## Будущие улучшения

1. **Infinite scroll** - бесконечная прокрутка как альтернатива
2. **Lazy loading** - ленивая загрузка при скролле
3. **Кэширование страниц** - сохранение загруженных страниц
4. **Prefetching** - предзагрузка соседних страниц
5. **URL параметры** - сохранение состояния пагинации в URL

## Примеры использования

### Базовое использование
```javascript
import Pagination from '../UI/Pagination';

function MyList() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({});
  
  return (
    <>
      {/* Ваш контент */}
      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        itemsPerPage={limit}
        onPageChange={(p, l) => {
          if (l) setLimit(l);
          setPage(p);
        }}
      />
    </>
  );
}
```

### С фильтрами
```javascript
const handleFilterChange = (e) => {
  setFilters({...filters, [e.target.name]: e.target.value});
  setCurrentPage(1); // Сброс на первую страницу!
};
```

## Заключение

Пагинация полностью интегрирована в систему и готова к использованию. Она улучшает производительность, UX и масштабируемость приложения.
