# SunFood — Offer & Approval System
**Handoff Document**
Last updated: May 2026

---

## Overview

ระบบนี้มีสองส่วนทำงานต่อกัน:

1. **Offer Form** — ทีมขายกรอก inquiry ของลูกค้า → บันทึกลง Google Sheets
2. **Approve Dashboard** — หัวหน้า/ผู้อนุมัติดูและ approve/reject offer → บันทึกลง Google Sheets อีกไฟล์

---

## 1. Offer Form (ทีมขาย)

**URL:** https://nichasenapeng.github.io/Offer_price/

**วิธีใช้:**
1. เลือกชื่อผู้ใช้ (NICHA / NET / KAN / EMMA)
2. Step 1 — กรอก Customer: Company Name, Destination Port, Incoterm, Payment Term, Order Type
3. Step 2 — กรอก Inquiry: สินค้า, Qty, Idea Price, Shipment ที่จะเสนอ, ราคาเสนอ (%Margin), ข้อมูลประกอบ
4. Step 3 — ตรวจสอบสรุป → กด "ส่งคำขอใบเสนอราคา"
5. ระบบสร้าง REF เช่น `SFD-2026-XXXX` และแสดงหน้า Success

**เพิ่มสินค้าหลายรายการ:** กดปุ่ม "เพิ่มสินค้า" ใน Step 3 — ระบบจะบันทึกชุดเดิมไว้และ reset form ให้กรอกสินค้าใหม่

**Google Sheet (ข้อมูล Offer):**
https://docs.google.com/spreadsheets/d/15fxIAqk32f898h4nN-CG1HstFe3GPSy-33ALiJlJHwU/edit#gid=954990774

คอลัมน์หลัก:
| คอลัมน์ | คำอธิบาย |
|---|---|
| Timestamp | วันเวลาที่กรอก |
| REF | รหัสอ้างอิง เช่น SFD-2026-7508 |
| Status | ชื่อ Sales User ที่กรอก |
| Company | ชื่อบริษัทลูกค้า |
| Destination Port | ท่าเรือปลายทาง |
| Product | ประเภทสินค้า |
| Quantity Request | ปริมาณที่ลูกค้าขอ |
| Shipment Request | เดือนที่ขอส่ง |
| Idea Price | ราคาที่ลูกค้าอยากได้ |
| %Margin (Idea) | Margin ตาม Idea Price |
| Shipment ที่จะเสนอ | เดือนที่เราจะเสนอ |
| ราคาเสนอ (USD/MT) | ราคาที่เราจะเสนอ |
| %Margin (Offer) | Margin ตามราคาที่เสนอ |
| Quantity per Month (MT) | ปริมาณต่อเดือน |

**Apps Script (POST endpoint):**
`https://script.google.com/macros/s/AKfycbyAfBG-BNJfw7y7MnbC6t4zC4Vckewu-VGQBBgSnEhAXqHEYRyFxjmKuvoLZxpM-Lw/exec`

---

## 2. Approve Dashboard (หัวหน้า)

**URL:** https://nichasenapeng.github.io/Approve_price/

**วิธีใช้:**
1. ใส่รหัสผ่าน: `362254`
2. ดู offer cards ที่แสดงข้อมูลจาก Google Sheets
3. กรอง: รออนุมัติ / Approve 1 แล้ว / อนุมัติครบ / ปฏิเสธ
4. กด **Approve** หรือ **Reject** ใน slot A1 หรือ A2
5. ใส่หมายเหตุ (ถ้ามี) → ระบบบันทึกกลับ Sheet อัตโนมัติ

**Status Logic:**
| เงื่อนไข | Status |
|---|---|
| ยังไม่มีการ vote | Pending |
| Vote แล้ว 1 คน (A1 หรือ A2) | Partial |
| A1 และ A2 = approved | Approved |
| A1 หรือ A2 = rejected | Rejected |

**Google Sheet (ข้อมูล Approval):**
https://docs.google.com/spreadsheets/d/1ZKrNVK1Mgffl1UqTGw8QxMld3hpTnlfZgpcgrwoNyHU/edit#gid=0

คอลัมน์หลัก: REF, Company, A1, A2, Status, Remark

**Apps Script (GET + POST endpoint):**
`https://script.google.com/macros/s/AKfycbwbnv-rKPWsoCMh0YNzRuoN_Y0iXYcqJDaXaw9uwS0z7CEd36MVGB2ZHjeUvwWCA3yw/exec`

- **GET** — โหลด offer ทั้งหมดจาก Sheet 1 ส่งกลับเป็น JSON
- **POST (no-cors)** — รับ approval decision บันทึกลง Sheet 2

---

## 3. Flow สรุป

```
┌─────────────────────────────────────────────────────────────────┐
│  ฝั่งทีมขาย                                                      │
│                                                                  │
│  ทีมขาย  ──กรอก form──▶  Offer Form  ──POST──▶  Apps Script 1  │
│                           (GitHub)                    │          │
│                                                       │ write    │
│                                                       ▼          │
│                                              Sheet 1 (Offer)     │
└─────────────────────────────────────────────────────────────────┘
                                                       │
                                                       │ GET (โหลดทุกครั้งที่เปิด/รีเฟรช)
                                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  ฝั่งหัวหน้า                                                      │
│                                                                  │
│  Apps Script 2  ──JSON──▶  Approve Dashboard  ──ดู/กด──▶  หัวหน้า│
│       ▲                        (GitHub)                          │
│       │ POST (approve/reject)                                    │
│       └────────────────────────────────────────────────────────  │
│                                                                  │
│  Apps Script 2  ──write──▶  Sheet 2 (Approval)                  │
└─────────────────────────────────────────────────────────────────┘
```

**จุดสำคัญ — Apps Script มี 2 ตัวแยกกัน:**

| Script | อยู่ที่ | หน้าที่ |
|---|---|---|
| Apps Script 1 | Offer Sheet | รับ POST จาก Offer Form → บันทึกลง Sheet 1 |
| Apps Script 2 | Approve Sheet | GET: ส่งข้อมูล Sheet 1 ให้ Dashboard / POST: บันทึก approval ลง Sheet 2 |

Apps Script 2 ทำ **สองหน้าที่ในไฟล์เดียว** — ถ้าจะแก้ logic การ approve ต้องแก้ที่นี่เท่านั้น

---

## 4. Files & Repositories

| ไฟล์ | คำอธิบาย | Repo |
|---|---|---|
| `index.html` (Offer) | Inquiry form สำหรับทีมขาย | github.com/nichasenapeng/Offer_price |
| `index.html` (Approve) | Approval dashboard สำหรับหัวหน้า | github.com/nichasenapeng/Approve_price |

ทั้งสองไฟล์เป็น Single-page HTML ไม่มี dependencies ภายนอกนอกจาก Google Fonts และ Apps Script

---

## 5. สิ่งที่ต้องดูแล

- **รหัสผ่าน Approve** (`362254`) ฝังอยู่ใน HTML ตรงๆ — ควรอัปเดตหากต้องการเพิ่มความปลอดภัย
- **Apps Script POST** ใช้ `mode: 'no-cors'` — ไม่สามารถรับ response กลับได้ แต่ข้อมูลบันทึกถึง Sheet
- **Approval state** เก็บใน browser memory (`approvals` object) — หากรีเฟรชหน้า ระบบจะโหลดใหม่จาก Sheet ผ่าน `_sheetA1` / `_sheetA2`
- **REF number** สร้างแบบ random (`Math.random`) — โอกาสซ้ำต่ำมาก แต่ไม่เป็น 0

---

## 6. ผู้ใช้งาน

| บทบาท | ผู้ใช้ | ระบบ |
|---|---|---|
| ทีมขาย | NICHA, NET, KAN, EMMA | Offer Form |
| ผู้อนุมัติ | Approver 1, Approver 2 | Approve Dashboard |
