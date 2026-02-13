# บันทึกนักพัฒนา - Server Checksheet

## สรุปการพัฒนาล่าสุด

### 1. การปรับปรุง UI/UX ของ Admin Panel
- **Streamlined Search Interface**:
  - รวมส่วนหัวข้อ "Checksheet Admin", ช่องค้นหา, ตัวกรอง, และปุ่ม "Add New" ให้อยู่ในแถวเดียวกัน เพื่อความสะอาดตาและประหยัดพื้นที่
  - ปรับดีไซน์ให้เป็นธีม "Folder Style" ที่ดูทันสมัยขึ้น
- **Redirection Logic**: แก้ไขปัญหาที่หน้า Admin ไม่สามารถ Redirect ไปยังหน้าแบบฟอร์มที่สร้างเสร็จแล้วได้ถูกต้อง

### 2. การตั้งค่า Server และ Routing
- **Static File Serving**:
  - อัปเดต `as_server.js` ให้ดึงไฟล์หน้าเว็บ Admin Panel จากโฟลเดอร์ Build ใหม่ (`checksheet_admin/dist`) ได้อย่างถูกต้อง
  - เพิ่ม SPA Fallback Logic เพื่อรองรับการทำงานของ Frontend Router ทั้งฝั่ง Admin และฝั่ง Form (Refresh หน้าแล้วไม่ Error 404)
  - กำหนดสิทธิ์การเข้าถึงไฟล์ฟอร์มและรูปภาพ (`/form`, `/images`) ให้ต้องผ่าน `authenticateToken` Middleware
- **Build Path Reconfiguration**: ปรับ Script การ Build ให้ `checksheet_admin` ส่งไฟล์ผลลัพธ์ไปที่ `../server-checksheet/checksheet_admin/dist` โดยตรง ลดขั้นตอนการย้ายไฟล์

### 3. API & Backend Logic
- **Validation**: เพิ่ม Logic การตรวจสอบข้อมูลที่ฝั่ง Server ให้สอดคล้องกับฝั่ง Frontend เพื่อความปลอดภัยของข้อมูล
- **Database Routes**: ตรวจสอบและทดสอบ Route การจัดการฐานข้อมูล (`/routes/dbRoutes`) ให้รองรับฟังก์ชัน "SAVE ALL DATA" จากหน้าบ้านได้สมบูรณ์

### 4. โครงสร้างพื้นฐาน (Infrastructure)
- **Git Initialization**: จัดเตรียมโครงสร้างไฟล์ `.gitignore` และสอบทานความพร้อมสำหรับการนำขึ้น Version Control
- **Environment Setup**: ตรวจสอบการใช้งานไฟล์ `.env` และการตั้งค่า Port (`process.env.SERVER_PORT`) ให้ Server รันได้อย่างไม่มีปัญหา Error Port ชนกัน

### 5. การเสริมความปลอดภัยและแก้ปัญหา Redirect Loop
_2026-01-29_

ปรับปรุงระบบความปลอดภัยของ Server ให้รัดกุมขึ้นเพื่อรองรับการใช้งานผ่านฟรอนต์เอนด์ที่มีระบบ Cache:
- **Strict Token Verification**: อัปเดต `as_server.js` ในส่วนการ Serve Static Forms (`/form/*`) ให้ใช้ `jwt.verify` ตรวจสอบความถูกต้องของ Token ก่อนส่งไฟล์ `index.html` เสมอ เพื่อป้องกันไม่ให้ User ที่ Session หมดอายุเข้าถึงตัวฟอร์มได้
- **Admin API Protection**: นำ `authenticateToken` middleware ไปติดตั้งครอบคลุมที่ `/api/admin` ทั้งหมด ทำให้หน้า Dashboard ของ Admin Panel จะไม่แสดงข้อมูลใดๆ หากผู้ใช้ไม่ได้ Login หรือ Session หมดอายุ
- **Cookie Management**: เพิ่มการสั่ง `res.clearCookie('token')` เมื่อตรวจพบว่า Token ไม่ถูกต้องหรือหมดอายุ เพื่อล้างสถานะตกค้างใน Browser ทันที

### 6. การจัดการสถานะ Checksheet และ API ปลายทาง
_2026-01-30_

ปรับปรุงฝั่ง Server เพื่อรองรับ Logic สถานะใหม่และการแสดงผลใน Admin Panel:

- **Status API**:
  - เพิ่ม Route `PATCH /api/update-status/:id` ใน `dbRoutes.js` เพื่อรองรับการอัปเดตสถานะแยกต่างหาก (แก้ปัญหาปุ่ม Confirm ใช้งานไม่ได้)
- **Filtered Response**:
  - ปรับปรุง Logic ใน `Search.jsx` (ฝั่ง Admin Frontend แต่ code อยู่ Repo นี้) ให้กรองข้อมูลตาม Role ของผู้ใช้ (Worker เห็นเฉพาะงานที่ทำค้างอยู่) เพื่อ UX ที่ดีขึ้น
- **Debugging**:
  - เพิ่ม Console Log ในจุดสำคัญๆ เพื่อช่วย Trace ปัญหาการเชื่อมต่อระหว่าง Admin กับ Form

### 7. UI Overhaul: List View + Preview Panel (Master-Detail Layout)
_2026-02-02_

เปลี่ยนหน้า Search จาก Folder Card Grid เป็น List View + Preview Panel:

- **List View (ซ้าย 60%)**:
  - สร้าง Component ใหม่ `ListItem.jsx` แสดงข้อมูลแบบ Compact ในแถวเดียว
  - คอลัมน์: `Dept | Group | Model | Machine | Title | Form | Status`
  - Fixed width ทุกคอลัมน์เพื่อความสวยงามสม่ำเสมอ
  - Title ดึงจาก `available-forms` API โดยใช้ `meta.json` ของแต่ละ Form

- **Preview Panel (ขวา 40%)**:
  - สร้าง Component ใหม่ `PreviewPanel.jsx`
  - แสดง FolderCard ใหญ่ขึ้นพร้อมปุ่ม Open, Confirm, Delete
  - Empty state เมื่อยังไม่เลือก Item

- **Status Filter**:
  - เพิ่ม Dropdown เลือก Status (Prepare, Work in Progress, Finish, Confirm)
  - อัปเดต `/search` API ใน `dbRoutes.js` ให้รับ `status` parameter

### 8. แก้ไข Title Lookup
_2026-02-02_

- แก้ไข Bug ที่ Title แสดง "-" แทนที่จะแสดงชื่อจริง
- ปัญหา: `meta.json` ถูก spread ตรงเป็น `formConfig.title` ไม่ใช่ `formConfig.meta.title`
- Fallback chain: `title → header → label → checksheet_name → '-'`

### 9. โครงสร้างไฟล์ใหม่
_2026-02-02_

```
checksheet_admin/src/components/
├── ListItem.jsx       (NEW) - แถวข้อมูลแบบ Compact
├── PreviewPanel.jsx   (NEW) - แสดง Preview ด้านขวา
├── FolderCard.jsx     - ใช้ใน Preview
├── Search.jsx         - แก้ไขเป็น Master-Detail Layout
└── ...
```

### 10. การแปลภาษา (Localization)
_2026-02-02_

- แปล Label ใน `ImageUploadBox.jsx`: "(Click to upload)" → "(คลิกเพื่อแนบ)"

### 11. การปรับปรุงระบบ Admin Panel และ Available Models
_2026-02-02_

- **Image Delete Endpoint**: เพิ่ม API สำหรับลบรูปภาพที่ไม่ต้องการออกจาก Server เพื่อประหยัดพื้นที่จัดเก็บ
- **Available Models Support**: ปรับปรุง Logic การดึงข้อมูล Models ให้รองรับ Array ของ Models (`available_models`) เพื่อการแสดงผลและการกรองข้อมูลที่ยืดหยุ่นขึ้นในหน้ารายการ
- **Bug Fixes**: แก้ไขข้อผิดพลาดเล็กน้อยใน Admin Panel เพื่อให้การทำงานลื่นไหล

### 12. การปรับปรุง Utility Functions
_2026-02-03_

- **Enhanced Utilities**: ปรับปรุงฟังก์ชัน Utility ต่างๆ ในฝั่ง Server ให้มีประสิทธิภาพและรองรับกรณี Edge Case ได้ดีขึ้น
- **Code Cleanup**: ลบ Code ที่ไม่ได้ใช้งานและจัดระเบียบโครงสร้างไฟล์

### 13. การปรับปรุง PreviewPanel UI
_2026-02-05_

- **UI Refinement**: ปรับปรุงหน้าตาของ `PreviewPanel.jsx` ให้แสดงรายละเอียดของ Checksheet ได้ชัดเจนและสวยงามยิ่งขึ้น
- **Cleanup**: ทำความสะอาด Code ส่วนเกินที่ไม่จำเป็นออกจาก Component เพื่อให้ Maintenance ง่ายขึ้น
