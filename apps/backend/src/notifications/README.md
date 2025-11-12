# Notifikační systém (Mikroslužba)

Tento modul poskytuje kompletní notifikační systém pro platformu implementovaný jako mikroslužba. Momentálně pouze loguje notifikace do konzole, ale je připraven pro rozšíření o další kanály (email, push notifikace, atd.).

## Funkce

- ✅ Vytváření notifikací různých typů (info, warning, error, success)
- ✅ Ukládání notifikací do databáze
- ✅ Označování jako přečtené/nepřečtené
- ✅ Archivace notifikací
- ✅ GraphQL a REST API endpoints (proxy)
- ✅ Console logging pro development
- ✅ TypeScript support s type safety
- ✅ **Mikroslužbová architektura s TCP komunikací**
- ✅ **Message patterns pro asynchronní komunikaci**
- ✅ **Docker podpora pro deployment**

## Architektura mikroslužby

### Komunikace
Mikroslužba používá NestJS mikroservisy s TCP transportem na portu 3001.

### Message patterns
```typescript
// Získání notifikací uživatele
'notifications.get_user_notifications' -> { userId: string }

// Získání nepřečtených notifikací
'notifications.get_unread_notifications' -> { userId: string }

// Počet notifikací
'notifications.get_notification_count' -> { userId: string }

// Vytvoření notifikace
'notifications.create' -> CreateNotificationInput

// Vytvoření notifikace pro uživatele
'notifications.create_for_user' -> { userId: string, input: Omit<CreateNotificationInput, 'userId'> }

// Označení jako přečtené
'notifications.mark_as_read' -> { notificationId: string, userId: string }

// Aktualizace notifikace
'notifications.update' -> { id: string, input: UpdateNotificationInput }

// Smazání notifikace
'notifications.delete' -> { id: string }

// Pomocné message patterns
'notifications.create_info' -> { userId: string, title: string, message: string, actionUrl?: string }
'notifications.create_success' -> { userId: string, title: string, message: string, actionUrl?: string }
'notifications.create_warning' -> { userId: string, title: string, message: string, actionUrl?: string }
'notifications.create_error' -> { userId: string, title: string, message: string, actionUrl?: string }
```

## Entity

### Notification
```typescript
{
  id: string;
  title: string;
  message: string;
  type: NotificationType; // info, warning, error, success
  status: NotificationStatus; // unread, read, archived
  userId: string;
  actionUrl?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}
```

## API Endpoints (HTTP Proxy)

### REST API
- `GET /notifications` - všechny notifikace
- `GET /notifications/unread` - nepřečtené notifikace
- `GET /notifications/count` - počet notifikací
- `POST /notifications` - vytvoří notifikaci
- `PUT /notifications/:id/read` - označí jako přečtenou
- `PUT /notifications/:id` - aktualizuje notifikaci
- `DELETE /notifications/:id` - smaže notifikaci

### GraphQL
- `getMyNotifications` - získá všechny notifikace aktuálního uživatele
- `getMyUnreadNotifications` - získá nepřečtené notifikace
- `getNotificationCount` - počet notifikací (celkem a nepřečtených)
- `createNotification` - vytvoří novou notifikaci (mutation)
- `markNotificationAsRead` - označí jako přečtenou (mutation)
- `updateNotification` - aktualizuje notifikaci (mutation)
- `deleteNotification` - smaže notifikaci (mutation)

## Použití v kódu

### Přes mikroslužbu (doporučeno)
```typescript
// Injekce klienta
constructor(private notificationsClient: NotificationsClient) {}

// Vytvoření notifikace přes mikroslužbu
await this.notificationsClient.createSuccessNotification(
  userId,
  'Úspěch!',
  'Operace byla dokončena',
  '/dashboard'
);

// Získání notifikací uživatele
const notifications = await this.notificationsClient.getUserNotifications(userId);
```

### Přímé použití služby (pouze v rámci mikroslužby)
```typescript
// Injekce služby
constructor(private notificationsService: NotificationsService) {}

// Vytvoření základní notifikace
await this.notificationsService.createNotification({
  userId: 'user-id',
  title: 'Nová zpráva',
  message: 'Máte novou zprávu ve schránce',
  type: NotificationType.INFO,
  actionUrl: '/messages'
});
```

## Spuštění mikroslužby

### Lokálně
```bash
# Spuštění mikroslužby
npm run start:notifications-microservice

# Nebo přímo
node dist/apps/backend/src/notifications/microservice.main.js
```

### Docker
```bash
# Build image
docker build -f Dockerfile.notifications -t notifications-service .

# Spuštění s Docker Compose
docker-compose -f docker-compose.notifications.yml up
```

### Proměnné prostředí
```bash
NOTIFICATIONS_SERVICE_HOST=localhost
NOTIFICATIONS_SERVICE_PORT=3001
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=core_platform
```

## Console Output

Všechny notifikace jsou automaticky logovány do konzole s emoji pro lepší čitelnost:

```
🔔 Nová notifikace vytvořena: { title: "...", type: "success", ... }
💾 Notifikace uložena do databáze s ID: abc-123
✅ Notifikace abc-123 označena jako přečtená
📊 Statistiky notifikací pro uživatele user-123: celkem 15, nepřečtených 3
🔔 Notifikační mikroservice běží na portu 3001
```

## Databázová migrace

Pro vytvoření tabulky spusťte SQL soubor:
```sql
-- apps/backend/src/notifications/migrations/create-notifications-table.sql
```

## Budoucí rozšíření

Systém je připraven pro jednoduché rozšíření o:
- 📧 Email notifikace
- 📱 Push notifikace
- 💬 SMS notifikace
- 🔔 Real-time WebSocket notifikace
- 📊 Analytics a reporting
- 🎯 Targeting a segmentace uživatelů
- 🔄 Event sourcing
- 📈 Metrics a monitoring
- 🔐 Advanced security features
