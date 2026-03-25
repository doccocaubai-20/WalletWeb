# Bản học React cho người mới (từ 0 đến làm được trang thực tế)

Tài liệu này được thiết kế cho người chưa biết gì về React.
Mục tiêu: sau khi học xong, bạn có thể đọc, sửa và tự xây dựng được các trang như Profile, Transactions, TopUp.

## 1. React là gì (hiểu đúng trong 5 phút)

React là thư viện JavaScript để xây dựng giao diện.
Bạn chia màn hình thành nhiều component nhỏ. Mỗi component:
1. Nhận dữ liệu (`props`).
2. Có trạng thái riêng (`state`).
3. Render UI theo `state` hiện tại.

Khi `state` đổi, React tự động render lại phần cần thiết.
Ý tưởng cốt lõi:
UI = f(state)

## 2. Lộ trình học dễ vào (4 giai đoạn)

### Giai đoạn 1: Nền tảng JavaScript (2–4 ngày)
Bạn cần chắc các phần sau:
1. `let`/`const`, function, arrow function.
2. Object/array, destructuring, spread (`...`).
3. `map`/`filter`/`find`/`reduce`.
4. `async`/`await`, `try`/`catch`.
5. `import`/`export` module.

Nếu chưa chắc JS, học React sẽ rất khó.

### Giai đoạn 2: React căn bản (4–7 ngày)
Học theo thứ tự:
1. Tạo component function.
2. JSX (viết giao diện trong JS).
3. Props (truyền dữ liệu từ cha xuống con).
4. `useState` (giữ trạng thái).
5. Event (`onClick`, `onChange`, `onSubmit`).
6. Conditional rendering (`if`, `&&`, ternary).
7. Render list + `key`.

### Giai đoạn 3: React thực chiến (7–10 ngày)
1. `useEffect`: gọi API, gắn listener, cleanup.
2. Form controlled: `input value` + `onChange`.
3. Loading, error, success state.
4. Routing với `react-router-dom`.
5. Tách utility và custom hook.

### Giai đoạn 4: Làm như dự án thật (7–14 ngày)
1. Auth flow (401/403, redirect).
2. Axios instance + interceptor.
3. Tối ưu rendering (`useMemo`, `useCallback` khi cần).
4. Tổ chức folder và conventions.
5. Viết feature hoàn chỉnh theo use case.

## 3. Từ điển React cho người mới

1. Component: một khối UI có thể tái sử dụng.
2. Props: dữ liệu truyền vào component.
3. State: dữ liệu nội bộ component.
4. Re-render: React vẽ lại UI khi state/props thay đổi.
5. Hook: hàm đặc biệt của React (`useState`, `useEffect`, ...).
6. Controlled input: input đọc/ghi qua state.
7. Side effect: việc ngoài render (gọi API, timer, listener...).

## 4. 10 quy tắc vàng để tránh lỗi

1. Không sửa trực tiếp state object/array. Luôn tạo bản sao mới.
2. Không gọi API trực tiếp trong thân component ngoài `useEffect`/handler.
3. Mỗi list map phải có `key` ổn định.
4. Form submit nhớ `event.preventDefault()`.
5. Luôn có `loading` và `error` state.
6. Xử lý 401/403 thống nhất ở một chỗ.
7. Validate dữ liệu trước khi gọi API.
8. Tách hàm utility nếu logic lặp lại.
9. Tên biến rõ nghĩa: `isLoading`, `profileErrorMsg`, `formProfile`...
10. Làm xong thì test lại theo luồng người dùng thật.

## 5. Cách đọc một file React bất kỳ

Khi mở một file, đọc theo thứ tự:
1. Import: file đang phụ thuộc gì?
2. State: trang này quản lý dữ liệu nào?
3. `useEffect`: trang tự động làm gì khi mount/update?
4. Handler: người dùng bấm nút thì chạy gì?
5. JSX: UI hiển gì từ state?
6. API: endpoint nào được gọi, khi nào?
7. Error/loading: xử lý đầy đủ chưa?

## 6. Học React trực tiếp trên dự án E-Wallet

### Bài 1: State + Event
File gợi ý: `frontend/src/pages/Profile.jsx`
Mục tiêu:
1. Thêm trường `nickname` vào `formProfile`.
2. Hiện `nickname` dưới tên.
3. Chưa cần gọi backend.

### Bài 2: Controlled Form
File: `frontend/src/pages/Profile.jsx`
Mục tiêu:
1. Thêm input cho `nickname`.
2. Tạo validate nhỏ: min 2 ký tự.
3. Hiện thông báo lỗi dưới input.

### Bài 3: useEffect + API
File: `frontend/src/pages/Profile.jsx`
Mục tiêu:
1. Gọi một API mock hoặc endpoint có sẵn.
2. Hiện `loading` trong lúc chờ.
3. Hiện alert khi lỗi.

### Bài 4: Render list
File: `frontend/src/pages/Transactions.jsx`
Mục tiêu:
1. Thêm bộ lọc theo `status`.
2. Thêm tổng số bản ghi đang hiển thị.
3. Đảm bảo `key` hợp lệ cho từng item.

### Bài 5: Routing
File: `frontend/src/App.jsx`
Mục tiêu:
1. Tạo một page mới tên `About`.
2. Thêm route.
3. Thêm link từ topbar.

### Bài 6: Component reuse
File: `frontend/src/components/`
Mục tiêu:
1. Tách một card thông tin thành component riêng.
2. Truyền data qua `props`.
3. Dùng lại cho 2 trang khác nhau.

## 7. Mẫu code căn bản người mới nên thuộc

### `useState`
```jsx
const [count, setCount] = useState(0);
```

### `onClick`
```jsx
<button onClick={() => setCount((prev) => prev + 1)}>Tăng</button>
```

### controlled input
```jsx
const [name, setName] = useState('');
<input value={name} onChange={(e) => setName(e.target.value)} />
```

### `useEffect` gọi API
```jsx
useEffect(() => {
  let isMounted = true;

  const run = async () => {
    try {
      const res = await api.get('/api/example');
      if (isMounted) {
        // setState từ data
      }
    } catch (e) {
      if (isMounted) {
        // setError
      }
    }
  };

  run();

  return () => {
    isMounted = false;
  };
}, []);
```

## 8. Biết đủ một file React đã viết tốt chưa

Checklist nhanh:
1. Có `loading` state.
2. Có `error` state.
3. Có validate input.
4. Tên state/hàm rõ ràng.
5. Không lặp logic quá nhiều (đã tách util).
6. Handler ngắn gọn, dễ đọc.
7. UI disable button khi đang submit.
8. Có thông báo success/fail cho người dùng.

## 9. Lộ trình 14 ngày để bắt đầu từ số 0

Ngày 1-2:
1. Ôn JS căn bản.
2. Tạo 3 component nhỏ.

Ngày 3-4:
1. Props + state.
2. Form controlled có validate đơn giản.

Ngày 5-6:
1. `useEffect`.
2. Gọi API GET và hiện loading/error.

Ngày 7-8:
1. Routing.
2. Chuyển trang có bảo vệ auth đơn giản.

Ngày 9-10:
1. Làm 1 trang CRUD mini.
2. Tách component tái sử dụng.

Ngày 11-12:
1. Làm bài tương tự Profile (update form + avatar mock).
2. Xử lý modal + `Escape` + click backdrop.

Ngày 13-14:
1. Tổng hợp: làm 1 feature trọn vẹn.
2. Tự review theo checklist mục 8.

## 10. Tài nguyên học nhanh (để tự học tiếp)

1. React docs chính thức:
https://react.dev/learn
2. JavaScript căn bản:
https://developer.mozilla.org/en-US/docs/Web/JavaScript
3. React Router:
https://reactrouter.com/en/main/start/tutorial

## 11. Bản đồ học file `Profile.jsx` (rất quan trọng)

Nếu bạn đang học từ file `Profile.jsx`, hãy nhớ:
1. State chia thành 3 nhóm: dữ liệu, trạng thái tải/lưu, thông báo lỗi.
2. `useEffect` mount để gọi `loadProfileData`.
3. Mỗi submit đều theo khuôn:
   - validate
   - set loading
   - try API
   - catch lỗi
   - finally tắt loading
4. JSX render theo state hiện tại, không thao tác DOM trực tiếp.

## 12. Mục tiêu cuối cùng

Sau tài liệu này, bạn cần đạt được:
1. Tự đọc hiểu được file React 300–500 dòng.
2. Tự thêm được 1 field mới vào form + gọi API.
3. Tự debug được lỗi loading/error/validation thông dụng.

Nếu bạn muốn, bước tiếp theo mình có thể tạo thêm:
1. Bản học React 7 ngày chỉ với bài tập trên chính dự án này.
2. Bộ bài tập có đáp án từng ngày (để bạn tự làm rồi đối chiếu).
