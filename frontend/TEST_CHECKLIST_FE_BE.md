# Frontend FE-BE Smoke Test Checklist

Muc tieu: test nhanh toan bo luong chinh sau khi backend da chay.

## 1) Dieu kien truoc khi test

- Backend dang chay o `http://localhost:8080`.
- Frontend chay bang Vite (`npm run dev`) o `http://localhost:5173`.
- Vite proxy da route `/api` va `/uploads` ve backend (xem `vite.config.js`).
- Co san du lieu test:
  - 1 tai khoan `CUSTOMER`.
  - 1 tai khoan `ADMIN`.
  - It nhat 2 vi customer de test chuyen tien.

## 2) Chay frontend

```bash
cd frontend
npm install
npm run dev
```

## 3) Test checklist theo luong nguoi dung

### A. Auth va Route Guard

- [ ] Mo `/login`, dang nhap sai mat khau -> hien thong bao loi ro rang.
- [ ] Dang nhap customer thanh cong -> dieu huong den `/dashboard/customer`.
- [ ] Dang nhap admin thanh cong -> dieu huong den `/dashboard/admin`.
- [ ] Dang xuat thanh cong -> quay ve `/login`, token bi xoa.
- [ ] Truy cap truc tiep `/dashboard/admin` bang customer -> chuyen `/unauthorized`.
- [ ] Truy cap route protected khi chua login -> chuyen `/login`.

API lien quan:
- `POST /api/users/login`
- `POST /api/users/logout`
- `GET /api/users/my-profile`
- `POST /api/users/refresh-token`

### B. Dang ky

- [ ] Dang ky voi du lieu hop le -> thanh cong, dieu huong `/login`.
- [ ] Dang ky voi username/email da ton tai -> hien loi dung.
- [ ] Mat khau va xac nhan khong khop -> chan submit tren UI.

API lien quan:
- `POST /api/users/register`

### C. Customer Dashboard

- [ ] Tai trang dashboard customer khong bi crash khi 1 API fail.
- [ ] Hien dung thong tin profile (ten, role) va so du vi.
- [ ] Hien danh sach giao dich gan day.
- [ ] Hien tong quan giao dich thang (summary monthly).
- [ ] Hien va cap nhat khu vuc savings neu co.

API lien quan:
- `GET /api/users/my-profile`
- `GET /api/accounts/my-account`
- `GET /api/accounts/my-accounts`
- `GET /api/transactions/history/{accountNumber}?page=&size=`
- `GET /api/transactions/summary/{accountNumber}/monthly`
- `GET /api/accounts/savings`
- `POST /api/accounts/savings/open`
- `PUT /api/accounts/savings/goal`

### D. Topup

- [ ] Tai trang topup, hien danh sach ngan hang lien ket.
- [ ] Topup noi bo thanh cong -> so du tang sau refresh.
- [ ] Topup amount <= 0 hoac du lieu khong hop le -> hien thong bao loi.
- [ ] VNPAY flow tra ve URL thanh toan hop le.

API lien quan:
- `GET /api/accounts/my-account`
- `GET /api/banks/linked`
- `POST /api/wallet/topup`
- `GET /api/vnpay/create-payment`

### E. Transfer

- [ ] Nhap STK nguoi nhan hop le -> verify ra dung ten nguoi nhan.
- [ ] Khong cho chuyen den chinh tai khoan minh.
- [ ] So tien > so du -> bi chan tren UI.
- [ ] PIN khong du 6 ky tu -> bi chan.
- [ ] Chuyen tien thanh cong -> thong bao thanh cong, reset form, so du cap nhat.

API lien quan:
- `GET /api/accounts/my-account`
- `GET /api/transaction-types`
- `GET /api/accounts/{accountNumber}/verify`
- `POST /api/transactions/transfer`

### F. Transactions

- [ ] Tai lich su giao dich co du lieu.
- [ ] Filter `all/in/out/pending` cho ket qua dung.
- [ ] Paging `Truoc/Sau` hoat dong dung.
- [ ] Nut `Lam moi` cap nhat du lieu moi.

API lien quan:
- `GET /api/accounts/my-account`
- `GET /api/accounts/my-accounts`
- `GET /api/transactions/history/{accountNumber}?page=&size=`

### G. Profile

- [ ] Tai profile hien dung thong tin user + account.
- [ ] Cap nhat profile thanh cong -> data duoc reload va hien msg thanh cong.
- [ ] Upload avatar file anh hop le (<2MB) thanh cong.
- [ ] Upload file khong phai anh hoac >2MB -> hien loi dung.
- [ ] Doi mat khau thanh cong voi old/new dung.
- [ ] Doi mat khau sai oldPassword -> hien loi backend.

API lien quan:
- `GET /api/users/my-profile`
- `PUT /api/users/my-profile`
- `PUT /api/users/my-profile/avatar`
- `PUT /api/users/change-password`
- `GET /api/accounts/my-account`
- `GET /uploads/**` (avatar static)

### H. Admin Dashboard

- [ ] Danh sach user tai duoc va phan trang/tim kiem (neu co) hoat dong.
- [ ] Tao user thanh cong.
- [ ] Sua user thanh cong.
- [ ] Xoa user thanh cong.
- [ ] Customer khong truy cap duoc admin dashboard.

API lien quan:
- `GET /api/admin/users`
- `POST /api/admin/user`
- `PUT /api/admin/user/{id}`
- `DELETE /api/admin/user/{id}`

## 4) Checklist responsive can test nhanh

- [ ] 360x800 (mobile): topbar, menu, button submit khong vo layout.
- [ ] 768x1024 (tablet): grid va card khong tran man hinh.
- [ ] >=1280 (desktop): spacing va can le on.
- [ ] Cac trang can test ky: `CustomerDashboard`, `TopUp`, `Transfer`, `Transactions`, `Profile`.

## 5) Bao loi nhanh khi test

Khi gap loi, ghi toi thieu:

- Trang + thao tac (`/transfer`, bam `Tiep tuc`).
- Request URL + method + status (tu Network tab).
- Request payload (neu co).
- Response body.
- Screenshot UI.

## 6) Tieu chi pass smoke test

Dat khi:

- Khong co loi blocker o cac luong A->H.
- Khong co route sai quyen.
- Khong co loi 500 phat sinh do payload FE sai.
- Build frontend pass (`npm run build`).
