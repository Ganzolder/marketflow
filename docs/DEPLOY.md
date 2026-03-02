# Деплой MarketFlow

## Вариант 1: Firebase App Hosting (уже настроен)

Проект привязан к Firebase: **marketflow-ppnsi** (`.firebaserc`, `apphosting.yaml`).

### Шаги

1. Открой [Firebase Console](https://console.firebase.google.com) → проект **marketflow-ppnsi**.
2. **Build** → **App Hosting** → **Get started** (или выбери существующий backend).
3. Подключи репозиторий GitHub: **Ganzolder/marketflow**, ветка **ganzolder02092025-4** (или **02092025-4**).
4. Укажи настройки сборки:
   - **Build command:** `npm run build`
   - **Output directory:** `.next` (или как подсказывает мастер для Next.js)
   - **Install command:** `npm install`
5. Добавь переменные окружения (секреты не коммитить):
   - `ADMIN_USERNAME` = `marketflowadmin`
   - `ADMIN_PASSWORD` = свой пароль (например из `.env.example`)
   - `SESSION_SECRET` = строка не короче 32 символов
   - `GEMINI_API_KEY` = ключ Gemini (если нужны AI-функции)
6. Запусти деплой. После успешной сборки получишь URL вида `https://...web.app`.

---

## Вариант 2: Vercel

1. Зайди на [vercel.com](https://vercel.com) и войди через GitHub.
2. **Add New** → **Project** → импортируй **Ganzolder/marketflow**.
3. Ветка: **ganzolder02092025-4** (или **02092025-4**).
4. Framework Preset: **Next.js** (определится автоматически).
5. **Environment Variables** добавь:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET` (не короче 32 символов)
   - `GEMINI_API_KEY` (по желанию)
6. **Deploy**. Домен будет вида `https://marketflow-xxx.vercel.app`.

---

## После деплоя

- Вход: логин и пароль из переменных `ADMIN_USERNAME` и `ADMIN_PASSWORD`.
- На продакшене обязательно смени `SESSION_SECRET` на свой длинный случайный ключ.
