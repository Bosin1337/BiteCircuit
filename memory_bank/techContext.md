# Tech Context: BiteCircuit

## Технологический стек

### Пакетный менеджер
- **bun** - согласно требованиям AGENTS.md

### Frontend
- **Next.js** - React фреймворк с SSR/SSG
- **TypeScript (TSX)** - типизированный JavaScript
- **Tailwind CSS** - utility-first CSS фреймворк
- **shadcn/ui** - компонентная библиотека
- **PWA** - для мобильного опыта
- **Telegram Mini App SDK** - для интеграции с Telegram

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL база данных
  - Realtime subscriptions
  - Storage для файлов
  - Edge Functions
  - Row Level Security (RLS)

### Аутентификация
- **NextAuth.js** - аутентификация для Next.js
  - Интеграция с Supabase
  - OAuth провайдеры
  - Session management

### Хостинг и деплой
- **Vercel** - хостинг для Next.js приложения
  - Автоматический деплой из GitHub
  - Edge Functions
  - Analytics

### Инструменты разработки
- **Biome** - для линтинга и форматирования кода (согласно AGENTS.md)
- **Git** - контроль версий
- **GitHub** - репозиторий и CI/CD

## Ограничения
- Использование bun как пакетного менеджера (обязательно)
- Проверка кода через Biome (кроме .md файлов)
- Сервер разработки управляется пользователем

## Окружение
- **Development**: локальная среда с Supabase local development
- **Preview**: Vercel preview deployments
- **Production**: Vercel production + Supabase production

## CI/CD
- GitHub Actions для автоматизации
- Vercel автоматический деплой при push в main
- Biome проверки в pre-commit hooks
