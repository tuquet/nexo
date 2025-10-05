# Khởi tạo Ứng dụng (Bootstrap)

Thư mục `bootstrap` chứa toàn bộ logic cốt lõi để khởi tạo và quản lý vòng đời của tiến trình **Main** trong Electron. Nó chịu trách nhiệm thiết lập môi trường, tạo cửa sổ, xử lý các sự kiện cấp ứng dụng và cấu hình các dịch vụ nền.

## Luồng Khởi tạo (Initialization Flow)

Khi ứng dụng khởi động, file `main.ts` (ở thư mục `src/main`) sẽ điều phối một chuỗi các tác vụ thiết lập theo thứ tự sau:

1.  **`setupLogger()`**: Cấu hình `electron-log` để ghi lại các hoạt động của tiến trình Main vào file, đồng thời thiết lập trình xử lý cho các lỗi nghiêm trọng (fatal errors).
2.  **`setupAppEvents()`**: Đăng ký tất cả các trình xử lý sự kiện vòng đời của Electron (`app.on(...)`), chẳng hạn như `whenReady`, `activate`, `window-all-closed`, và xử lý các trường hợp mở ứng dụng lần thứ hai.
3.  **`setupProtocol()`**: Đăng ký custom protocol của ứng dụng (ví dụ: `nexo://`) để cho phép mở ứng dụng từ các liên kết bên ngoài (deep linking).
4.  **`setupIpcHandlers()`**: Khởi tạo và đăng ký tất cả các IPC handler từ thư mục `ipc`, sẵn sàng cho việc giao tiếp với tiến trình Renderer.
5.  **`setupMainWindow()`**: Sau khi ứng dụng đã sẵn sàng (`app.whenReady`), hàm này sẽ được gọi để tạo và hiển thị cửa sổ chính của ứng dụng.
6.  **`startMockServer()`** (chỉ trong môi trường dev): Khởi động một server giả lập để cung cấp dữ liệu cho việc phát triển.

## Mô tả các file

- **`event.ts`**: "Nhạc trưởng" của các sự kiện ứng dụng. Đây là nơi quản lý cách ứng dụng phản ứng với các sự kiện vòng đời do Electron phát ra.

- **`window.ts`**: Chịu trách nhiệm tạo, quản lý và cung cấp quyền truy cập vào cửa sổ chính (`BrowserWindow`) của ứng dụng.

- **`logger.ts`**: Cấu hình `electron-log` cho tiến trình Main, bao gồm vị trí lưu file log và cách xử lý các lỗi nghiêm trọng (uncaught exceptions, unhandled rejections) để đảm bảo ứng dụng tắt một cách an toàn.

- **`config.ts`**: Nơi tập trung các cấu hình của ứng dụng, chẳng hạn như thông tin repo GitHub, các khóa API, hoặc các cờ tính năng (feature flags).

- **`protocol.ts`**: Quản lý việc đăng ký và xử lý custom URL scheme (ví dụ: `nexo://`), cho phép ứng dụng phản hồi các yêu cầu từ trình duyệt hoặc hệ điều hành.

- **`path.ts`**: Một module tập trung, định nghĩa và xuất ra các đường dẫn thư mục quan trọng mà ứng dụng sử dụng, chẳng hạn như thư mục dữ liệu người dùng (`userData`).

- **`constant.ts`**: Nơi lưu trữ các hằng số không thay đổi trên toàn ứng dụng, ví dụ như tên ứng dụng, URL của server phát triển.

- **`api.ts`**: Chứa các hàm để tương tác với các API bên ngoài, ví dụ như lấy danh sách các phiên bản đã phát hành từ GitHub.

- **`mock-server.ts`**: Quản lý việc khởi động và dừng một server giả lập (mock server) trong môi trường phát triển, giúp frontend có thể hoạt động mà không cần backend thật.
