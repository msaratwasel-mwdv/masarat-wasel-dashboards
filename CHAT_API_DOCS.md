# 📱 توثيق الـ API الخاص بنظام المحادثات (Chat System)

هذا التوثيق موجه لفريق الموبايل (Flutter / React Native).
تم بناء نظام الـ Chat بطريقة احترافية تعتمد على الـ `Conversation` لجمع الأطراف (سائق،، ولي أمر، مشرفة)، وتوفر حماية بحيث لا يرى أي طرف إلا جهات الاتصال المسموح له بها.

جميع مسارات الـ API تحتاج إلى إرسال مصادقة (Bearer Token) ضمن الـ Headers:

```http
Authorization: Bearer {YOUR_SANCTUM_TOKEN}
Accept: application/json
```

---

## 1. جلب جهات الاتصال (Contacts)

يقوم هذا المسار بإرجاع المستخدِمين المسموح للطرف الحالي بالدردشة معهم بناءً على دوره (Role):

- **ولي الأمر**: يظهر له سائق ومشرفة الحافلة التابعة لابنه.
- **السائق**: يظهر له أولياء أمور الطلاب في الحافلة التابعة له (لا تظهر المشرفة).
- **المشرفة**: يظهر لها أولياء أمور الطلاب في الحافلة التابعة لها (لا يظهر السائق).

**الطلب:**
`GET /api/chat/contacts`

**الرد الناجح (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 24,
      "name": "الكابتن محمد (سائق تجريبي)",
      "role": "driver",
      "phone": "0500000002",
      "chat_description": "سائق مسار - الطالب: أحمد أبو أحمد"
    },
    {
      "id": 25,
      "name": "أ. فاطمة (مشرفة تجريبية)",
      "role": "supervisor",
      "phone": "0500000003",
      "chat_description": "مشرفة مسار - الطالب: أحمد أبو أحمد"
    }
  ]
}
```

---

## 2. بدء محادثة جديدة أو جلبها (Start / Get Conversation)

استخدم هذا المسار عندما يضغط المستخدم على "جهة اتصال" ليفتح محادثة معها.
إذا كانت هناك محادثة سابقة سيُرجعها كاملة، وإذا لم تكن، سيُنشئ واحدة جديدة ويُرجع بياناتها.

**الطلب:**
`POST /api/chat/conversations`

```json
{
  "receiver_id": 24
}
```

**الرد الناجح (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "private",
    "updated_at": "2026-02-24T02:00:00Z",
    "other_participants": [
      {
        "id": 24,
        "name": "الكابتن محمد (سائق تجريبي)",
        "role": "driver",
        "avatar": null
      }
    ],
    "last_message": {
      "id": 2,
      "body": "أهلاً وسهلاً بك",
      "sender_id": 24
      // ...
    },
    "unread_count": 0
  }
}
```

---

## 3. جلب تاريخ الرسائل المسبقة لمحادثة (Get Messages)

لجلب كل الرسائل السابقة الخاصة بالمحادثة عند الدخول للشات (مع دعم الـ Pagination).

**الطلب:**
`GET /api/chat/conversations/{conversation_id}/messages?page=1`

**الرد الناجح (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 4,
      "body": "ابني مريض اليوم ولن يحضر",
      "type": "text",
      "attachment_url": null,
      "sender_id": 23,
      "sender_name": "أبو أحمد",
      "created_at": "2026-02-24T02:00:00.000000Z",
      "deleted_at": null
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 50,
    "total": 1
  }
}
```

---

## 4. قائمة المحادثات النشطة (Inbox)

يُظهر هذا المسار قائمة بجميع المحادثات التي توجد فيها رسائل مع المستخدم، مرتبة حسب الأحدث. (تُستخدم لواجهة INBOX الأساسية لديه).

**الطلب:**
`GET /api/chat/conversations?page=1`

**الرد الناجح (200 OK):**

- الرد شبيه بالرد الخاص بمسار رقم 2، ولكنه يضم `data` عبارة عن مصفوفة (Array) لكل محادثاته.

---

## 5. إرسال رسالة جديدة (Send Message)

**الطلب:**
`POST /api/chat/conversations/{conversation_id}/messages`

```json
{
  "body": "السلام عليكم كابتن محمد!",
  "type": "text",
  "attachment_url": null
}
```

**الرد الناجح (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": 5,
    "body": "السلام عليكم كابتن محمد!",
    "type": "text",
    "attachment_url": null,
    "sender_id": 23,
    "sender_name": "أبو أحمد",
    "created_at": "2026-02-24T02:30:00.000000Z",
    "deleted_at": null
  }
}
```

_(ملاحظة لمطوري التطبيق: عند الإرسال بنجاح، يقوم الخادم ببث حدث `MessageSent` عبر `Laravel Reverb` للطرف الآخر ليصله الإشعار بالوقت الفعلي Socket)._

---

## 6. تحديد الرسائل كمقروءة (Mark as Read)

يجب استدعاؤه متى ما قام المستخدم بفتح شاشة المحادثة لإبلاغ الـ Backend أنه قرأ كل القديم.

**الطلب:**
`POST /api/chat/conversations/{conversation_id}/read`

**الرد الناجح (200 OK):**

```json
{
  "success": true,
  "message": "تم تحديث القراءة."
}
```
