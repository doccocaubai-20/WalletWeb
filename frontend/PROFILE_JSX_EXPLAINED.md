# Giai thich Profile.jsx cho nguoi moi React

File goc: frontend/src/pages/Profile.jsx

Tai lieu nay viet lai phan giai thich theo cach de theo doi, tap trung vao:
1. Trang nay lam gi.
2. Moi khoi code dung de lam gi.
3. Luong chay thuc te khi nguoi dung thao tac.

## 1) Tong quan chuc nang cua trang

Profile.jsx la trang ho so nguoi dung, gom 5 nhom chuc nang:
1. Tai thong tin ho so va thong tin vi khi mo trang.
2. Hien thi avatar va thong tin tong hop.
3. Cho phep cap nhat thong tin ca nhan.
4. Cho phep tai len avatar moi.
5. Cho phep doi mat khau qua modal.

## 2) Giai thich theo khoi code (tu tren xuong duoi)

### A. Khoi import
- Import React va cac hook useState, useEffect, useMemo.
- Import Link, useNavigate de dieu huong.
- Import api (axios wrapper) de goi backend.
- Import useAuth de xu ly logout khi het phien.
- Import useToast de hien thong bao.
- Import cac ham utility:
  - avatar: extractAvatarUrl, resolveAvatarSrc, storeAvatar, appendAvatarVersion, getStoredAvatar.
  - loi API: parseApiErrorMessage.
  - validate form: validateProfileForm, validatePasswordForm.
- Import CSS dashboard.

### B. Ham helper toErrorMessage
Muc dich: chuan hoa thong bao loi.
- Neu backend tra ve chuoi loi thi dung truc tiep.
- Neu backend tra ve object co message thi lay message.
- Nguoc lai dung fallbackMessage.

### C. Ham helper formatMemberSince
Muc dich: hien thi ngay tham gia thanh dd/mm/yyyy.
- Neu gia tri trong hoac parse date loi thi tra ve --.

### D. Ham helper normalizeDateInput
Muc dich: dua ngay ve dang yyyy-mm-dd de gan vao input type=date.
- Neu date khong hop le thi tra ve chuoi rong.

### E. Ham helper getInitials
Muc dich: tao chu cai dai dien khi khong co anh avatar.
- Vi du Nguyen Van A -> NA.
- Neu khong co ten -> N.

### F. Ham helper isLikelyImageFile
Muc dich: loc file upload co phai anh.
- Kiem tra mime type image/*.
- Neu mime type khong ro, fallback bang extension file.

### G. Bat dau component Profile
- useNavigate: dieu huong trang.
- useAuth: lay ham logout.
- useToast: hien toast.

#### G1. Cac state giao dien
- isLoading: dang tai du lieu ban dau.
- isSavingProfile: dang luu form profile.
- isSavingAvatar: dang upload avatar.
- isSavingPassword: dang doi mat khau.
- isPasswordModalOpen: modal doi mat khau dang mo.

#### G2. Cac state loi
- profileErrorMsg, avatarErrorMsg, passwordErrorMsg.

#### G3. Cac state du lieu
- accountInfo: accountNumber, balance.
- profileRaw: du lieu user goc tu API.
- avatarUrl: url avatar dang render.
- formProfile: state controlled cho form profile.
- passwordForm: state controlled cho form doi mat khau.

### H. useMemo profileMeta
Muc dich: tao du lieu da xu ly san cho UI.
- Lay username, role, status.
- Lay phoneNumber, idCard.
- format ngay tham gia.
- tinh initials va displayName.
- tach avatarUrl tu du lieu user.

Loi ich useMemo:
- Giam tinh toan lai neu dependency khong doi.

### I. useEffect dong bo avatarUrl
- Moi khi profileMeta.avatarUrl thay doi, setAvatarUrl de UI cap nhat anh.

### J. useEffect bat phim ESC de dong modal
- Chi dang ky listener khi modal dang mo.
- Nhan Escape thi dong modal.
- cleanup listener khi modal dong/unmount.

### K. handleAuthNavigation
Muc dich: xu ly loi xac thuc dung chung.
- 401: logout + ve login.
- 403: den unauthorized.
- Tra true neu da dieu huong, false neu khong.

### L. loadProfileData
Ham tai du lieu ban dau va sau moi lan cap nhat thanh cong.

Trinh tu:
1. Bat isLoading, xoa loi cu.
2. Goi song song 2 API bang Promise.all:
   - /api/users/my-profile
   - /api/accounts/my-account
3. Lay user/people tu response profile.
4. storeAvatar de cap nhat thong tin avatar local.
5. setProfileRaw de giu du lieu goc.
6. setFormProfile de do du lieu len form.
7. setAccountInfo de hien thi so vi va so du.
8. Neu loi:
   - Xu ly auth truoc.
   - Neu khong phai auth, set profileErrorMsg.
9. finally: tat isLoading.

### M. useEffect goi loadProfileData khi mount
- Trang vua mo se tu dong tai du lieu.

### N. handleProfileChange
- Cap nhat 1 field cua formProfile theo immutable pattern.
- Xoa loi profile cu de nguoi dung nhap lai.

### O. handleAvatarFileChange
Ham xu ly upload avatar.

Trinh tu:
1. Lay file tu input.
2. Validate dung dinh dang anh.
3. Validate dung luong <= 2MB.
4. Bat isSavingAvatar.
5. Tao FormData va append key avatar.
6. Goi PUT /api/users/my-profile/avatar.
7. Thanh cong: toast + goi loadProfileData de refresh.
8. That bai: xu ly auth truoc, sau do set loi va toast.
9. finally: tat isSavingAvatar.
10. Reset input file de co the chon lai cung file.

### P. handleSaveProfile
Ham submit form cap nhat thong tin ca nhan.

Trinh tu:
1. event.preventDefault de ngan reload trang.
2. Validate formProfile.
3. Bat isSavingProfile.
4. Tao payload da trim text.
5. Goi PUT /api/users/my-profile.
6. Thanh cong: toast + reload profile data.
7. That bai: xu ly auth truoc, sau do set loi + toast.
8. finally: tat isSavingProfile.

### Q. handlePasswordChange
- Cap nhat 1 field trong passwordForm.
- Xoa passwordErrorMsg cu.

### R. handleChangePassword
Ham submit doi mat khau.

Trinh tu:
1. preventDefault.
2. Validate passwordForm.
3. Bat isSavingPassword.
4. Goi PUT /api/users/change-password.
5. Thanh cong:
   - toast.
   - reset passwordForm.
   - dong modal.
6. That bai: xu ly auth truoc, sau do set loi + toast.
7. finally: tat isSavingPassword.

### S. Nhanh render loading
- Neu isLoading true, render skeleton va return som.

### T. JSX giao dien chinh
- Khung dashboard shell + topbar.
- Header trang ho so va nut quay lai dashboard.
- Alert loi profile neu co.

#### T1. Cot trai (summary)
- Avatar:
  - Neu co avatarUrl: render img.
  - Neu loi load img: onError -> fallback ve avatar chu cai.
- Nut camera + input file hidden de upload.
- Hien displayName, username.
- Badge status va role.
- Danh sach thong tin nhanh: so vi, so du, ngay tham gia, SDT, CCCD.

#### T2. Cot phai card thong tin chi tiet
- Form controlled cho fullName, dateOfBirth, email, gender, address.
- Submit goi handleSaveProfile.
# Giải thích `Profile.jsx` cho người mới React

File gốc: `frontend/src/pages/Profile.jsx`

Tài liệu này viết lại phần giải thích theo cách dễ theo dõi, tập trung vào:
- 1. Trang này làm gì.
- 2. Mỗi khối code dùng để làm gì.
- 3. Luồng chạy thực tế khi người dùng thao tác.

## 1) Tổng quan chức năng của trang

Trang này thực hiện 5 việc chính:
1. Tải thông tin hồ sơ và thông tin ví khi mở trang.
2. Hiển thị thông tin cá nhân và avatar.
3. Cho phép cập nhật hồ sơ cá nhân.
4. Cho phép tải lên avatar.
5. Cho phép đổi mật khẩu qua modal.

---

## 2) Giải thích chi tiết theo từng đoạn

1. [Dòng import](frontend/src/pages/Profile.jsx#L1-L10)
   - Import React và các hook `useEffect`, `useMemo`, `useState`.
   - Import điều hướng từ `react-router-dom`.
   - Import `api` (axios wrapper) để gọi backend.
   - Import `useAuth` để gọi `logout` khi token hết hạn.
   - Import `useToast` để hiển thị thông báo thành công/thất bại.
   - Import các tiện ích xử lý avatar, lỗi HTTP và validate form.
   - Import CSS giao diện dashboard.

2. [Hàm `toErrorMessage`](frontend/src/pages/Profile.jsx#L12-L22)
   - Chuẩn hóa thông báo lỗi nhận được từ API.
   - Nếu backend trả về chuỗi, dùng chuỗi đó; nếu trả object có `message`, dùng `message`; ngược lại dùng `fallbackMessage`.

3. [Hàm `formatMemberSince`](frontend/src/pages/Profile.jsx#L24-L29)
   - Chuyển `createdAt` thành chuỗi ngày theo locale Việt Nam.
   - Nếu giá trị rỗng hoặc không parse được, trả `--`.

4. [Hàm `normalizeDateInput`](frontend/src/pages/Profile.jsx#L31-L36)
   - Chuyển ngày sang định dạng `yyyy-mm-dd` để gán vào `input type="date"`.
   - Nếu không hợp lệ, trả chuỗi rỗng.

5. [Hàm `getInitials`](frontend/src/pages/Profile.jsx#L38-L43)
   - Tạo chữ cái viết tắt từ họ tên để hiển thị khi không có avatar.
   - Ví dụ: "Nguyễn Văn A" → "NA". Nếu không có tên, trả "N".

6. [Hàm `isLikelyImageFile`](frontend/src/pages/Profile.jsx#L45-L57)
   - Kiểm tra file upload có phải ảnh hay không bằng `mime type` hoặc phần mở rộng tệp.

7. [Khai báo component `Profile`](frontend/src/pages/Profile.jsx#L59)
   - Đây là function component chính của trang.

8. [Hook điều hướng, auth, toast](frontend/src/pages/Profile.jsx#L60-L63)
   - `useNavigate` để điều hướng.
   - `useAuth` lấy hàm `logout`.
   - `useToast` để hiển thị toast messages.

9. [State loading/saving/modal](frontend/src/pages/Profile.jsx#L65-L69)
   - `isLoading`: đang tải dữ liệu ban đầu.
   - `isSavingProfile`: đang lưu form hồ sơ.
   - `isSavingAvatar`: đang upload avatar.
   - `isSavingPassword`: đang đổi mật khẩu.
   - `isPasswordModalOpen`: modal đổi mật khẩu đang mở hay đóng.

10. [State lỗi](frontend/src/pages/Profile.jsx#L71-L73)
   - `profileErrorMsg`, `avatarErrorMsg`, `passwordErrorMsg` lưu thông báo lỗi tương ứng.

11. [State `accountInfo`](frontend/src/pages/Profile.jsx#L75)
   - Lưu `accountNumber` và `balance` để hiển thị ở thẻ tóm tắt.

12. [State `profileRaw`, `avatarUrl`, `formProfile`](frontend/src/pages/Profile.jsx#L77-L85)
   - `profileRaw`: dữ liệu user gốc từ API.
   - `avatarUrl`: URL avatar đang hiển thị.
   - `formProfile`: state điều khiển form chỉnh sửa hồ sơ.

13. [State `passwordForm`](frontend/src/pages/Profile.jsx#L87-L91)
   - `oldPassword`, `newPassword`, `confirmPassword`.

14. [useMemo `profileMeta`](frontend/src/pages/Profile.jsx#L93-L107)
   - Tạo object đã chuẩn hóa để UI sử dụng trực tiếp (username, role, status, phoneNumber, idCard, memberSince, initials, displayName, avatarUrl).
   - Dùng `useMemo` để tránh tính lại không cần thiết khi dependencies không thay đổi.

15. [useEffect đồng bộ `avatarUrl`](frontend/src/pages/Profile.jsx#L109-L111)
   - Mỗi khi `profileMeta.avatarUrl` thay đổi thì `setAvatarUrl` tương ứng để UI cập nhật avatar.

16. [useEffect bắt phím ESC đóng modal](frontend/src/pages/Profile.jsx#L113-L128)
   - Khi modal mở, gắn listener `keydown` để bắt phím `Escape` và đóng modal.
   - Cleanup listener khi modal đóng/unmount để tránh rò rỉ bộ lắng nghe.

17. [handleAuthNavigation](frontend/src/pages/Profile.jsx#L130-L145)
   - Hàm xử lý lỗi xác thực chung cho các call API.
   - `401` → gọi `logout()` và điều hướng về `/login`.
   - `403` → điều hướng về `/unauthorized`.

18. [loadProfileData bắt đầu](frontend/src/pages/Profile.jsx#L147-L151)
   - Bật `isLoading` và xóa lỗi cũ trước khi gọi API.

19. [loadProfileData gọi 2 API song song](frontend/src/pages/Profile.jsx#L153-L156)
   - Gọi đồng thời `/api/users/my-profile` và `/api/accounts/my-account` bằng `Promise.all`.

20. [Xử lý dữ liệu từ profile API](frontend/src/pages/Profile.jsx#L158-L162)
   - Lấy `user` và `people` từ response.
   - Gọi `storeAvatar(extractAvatarUrl(user))` để lưu thông tin avatar (dùng cho cache/version).

21. [Set `profileRaw` + `formProfile`](frontend/src/pages/Profile.jsx#L164-L171)
   - Đổ dữ liệu vào state gốc và state form, `dateOfBirth` được normalize để `input date` nhận đúng định dạng.

22. [Set `accountInfo`](frontend/src/pages/Profile.jsx#L173-L176)
   - Gán `accountNumber` và `balance` từ API trả về.

23. [Catch lỗi `loadProfileData`](frontend/src/pages/Profile.jsx#L177-L181)
   - Nếu là lỗi xác thực thì đã xử lý trong `handleAuthNavigation`.
   - Nếu không, hiển thị thông báo lỗi chung.

24. [Finally `loadProfileData`](frontend/src/pages/Profile.jsx#L182-L184)
   - Tắt `isLoading` dù thành công hay thất bại.

25. [useEffect gọi `loadProfileData` khi mount](frontend/src/pages/Profile.jsx#L187-L190)
   - Khi component mount, tự động tải dữ liệu.

26. [handleProfileChange](frontend/src/pages/Profile.jsx#L192-L195)
   - Cập nhật một field trong `formProfile` theo kiểu immutable và xóa lỗi cũ.

27. [handleAvatarFileChange: lấy file](frontend/src/pages/Profile.jsx#L197-L200)
   - Lấy file đầu tiên từ `input[type=file]`, nếu không có thì dừng.

28. [Validate loại file]
   - Nếu không phải ảnh, set lỗi và reset input file.

29. [Validate dung lượng file]
   - Nếu file > 2MB, set lỗi và reset input.

30. [Bắt đầu upload avatar]
   - Bật `isSavingAvatar` và xóa lỗi avatar cũ.

31. [Tạo `FormData` và gọi API upload]
   - Tạo `FormData`, append `avatar`, gọi `PUT /api/users/my-profile/avatar`.

32. [Upload thành công]
   - Hiển thị toast success và gọi lại `loadProfileData()` để làm mới dữ liệu.

33. [Upload thất bại]
   - Xử lý auth trước; nếu không phải auth thì parse lỗi và hiển thị.

34. [Kết thúc upload]
   - Tắt `isSavingAvatar` và reset input file để có thể chọn lại cùng tệp.

35. [handleSaveProfile mở đầu]
   - `event.preventDefault()` để ngăn reload trang.
   - Validate `formProfile` bằng `validateProfileForm`.

36. [Bắt đầu lưu profile]
   - Bật `isSavingProfile` và xóa lỗi cũ.

37. [Tạo payload và gọi API update]
   - Trim các trường text rồi gọi `PUT /api/users/my-profile`.

38. [Lưu profile thành công/thất bại]
   - Thành công: toast success và reload dữ liệu.
   - Thất bại: xử lý auth trước, sau đó set lỗi và toast error.

39. [Finally lưu profile]
   - Tắt `isSavingProfile`.

40. [handlePasswordChange]
   - Cập nhật một field trong `passwordForm` và xóa lỗi cũ.

41. [handleChangePassword mở đầu]
   - `event.preventDefault()` và validate bằng `validatePasswordForm`.

42. [Bắt đầu đổi mật khẩu]
   - Bật `isSavingPassword` và xóa lỗi cũ.

43. [Gọi API đổi mật khẩu]
   - Gọi `PUT /api/users/change-password` với `oldPassword` và `newPassword`.

44. [Đổi mật khẩu thành công]
   - Hiển thị toast, reset form và đóng modal.

45. [Đổi mật khẩu thất bại + finally]
   - Xử lý lỗi và tắt `isSavingPassword`.

46. [Nhánh UI loading]
   - Nếu `isLoading` là `true`, render skeleton và trả về sớm.

47. [Khung layout chính]
   - Layout shell, `WalletTopbar`, `main` và `section` chứa nội dung trang.

48. [Hiển thị lỗi profile chung]
   - Nếu có `profileErrorMsg` thì render `alert`.

49. [Cột trái: avatar + thông tin tóm tắt]
   - Nếu có `avatarUrl`, render `img` với `appendAvatarVersion(resolveAvatarSrc(avatarUrl), getStoredAvatar().avatarVersion)` để tránh cache cũ.
   - Nếu load ảnh lỗi, fallback về chữ cái viết tắt (`initials`).
   - Input file ẩn và nhãn camera để người dùng click đổi avatar.
   - Hiển thị thông tin: tên, username, trạng thái, role, số ví, số dư, ngày tham gia, số điện thoại, CCCD.

50. [Cột phải card 1: form thông tin chi tiết]
   - Form điều khiển cho `fullName`, `dateOfBirth`, `email`, `gender`, `address`.
   - `onChange` từng field gọi `handleProfileChange`.
   - Submit gọi `handleSaveProfile`.

51. [Cột phải card 2: bảo mật]
   - Mô tả khuyến nghị bảo mật và nút mở modal đổi mật khẩu.

52. [Modal đổi mật khẩu]
   - Render khi `isPasswordModalOpen === true`.
   - Click backdrop đóng modal; click trong modal dùng `stopPropagation()` để tránh đóng.
   - Form gồm `oldPassword`, `newPassword`, `confirmPassword`.
   - Submit gọi `handleChangePassword`.

53. [Footer + export component]
   - Footer thông tin chung và `export default Profile` để router import.

---

**3) Luồng chạy thực tế khi người dùng dùng trang**
1. Component mount → `useEffect` gọi `loadProfileData()`.
2. API trả về → state cập nhật → UI render lại với dữ liệu mới.
3. Người dùng sửa form → state `formProfile` thay đổi ngay.
4. Người dùng bấm Lưu → validate → gọi API → nếu thành công thì reload data.
5. Người dùng đổi avatar → validate file → upload → reload data.
6. Người dùng đổi mật khẩu → mở modal → validate → gọi API → đóng modal nếu thành công.

---

**4) Các khái niệm React bạn vừa thấy trong file**
1. `useState`: lưu state cục bộ và làm trigger re-render khi thay đổi.
2. `useEffect`: chạy side-effect (gọi API, thêm/bỏ event listener).
3. `useMemo`: tối ưu hóa tính toán phức tạp hoặc dẫn xuất dữ liệu.
4. Controlled form: input lấy giá trị từ state và cập nhật state qua `onChange`.
5. Conditional rendering: render các phần UI tùy theo điều kiện (ví dụ modal, alert).

Nếu bạn muốn, mình có thể tiếp tục làm bản sơ đồ state→UI và giải thích khi component re-render.
