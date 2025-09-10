# Giao tiếp Liên tiến trình (IPC)

Thư mục `ipc` là trung tâm quản lý toàn bộ giao tiếp giữa tiến trình **Main** (backend của Electron) và các tiến trình **Renderer** (giao diện người dùng). Nó hoạt động như một cầu nối, cho phép giao diện người dùng yêu cầu thực thi các tác vụ ở tầng hệ thống, chẳng hạn như truy cập file, thực thi các dòng lệnh, hoặc hiển thị hộp thoại native.

## Kiến trúc

Hệ thống IPC được thiết kế theo dạng module để dễ dàng quản lý và mở rộng.

- **`ipc/index.ts`**: Đây là file "nhạc trưởng", có nhiệm vụ tự động tìm và đăng ký tất cả các handler được định nghĩa trong thư mục `modules`. Điều này giúp việc thêm một handler mới trở nên cực kỳ đơn giản mà không cần sửa đổi logic đăng ký.

- **`ipc/modules/`**: Thư mục này chứa các file riêng lẻ, mỗi file chịu trách nhiệm cho một nhóm chức năng cụ thể. Ví dụ, `youtube.ts` xử lý các tác vụ liên quan đến YouTube, trong khi `dialog.ts` quản lý các hộp thoại hệ thống.

## Làm thế nào để thêm một IPC Handler mới?

Thực hiện theo các bước đơn giản sau:

1.  **Tạo file mới**: Tạo một file mới trong thư mục `ipc/modules/`, ví dụ: `my-feature.ts`.

2.  **Viết Handler**: Bên trong file, tạo một hàm được `export` và nhận `ipcMain` từ Electron làm tham số.
    - Sử dụng `ipc.handle()` cho các tác vụ bất đồng bộ cần trả về kết quả (hoặc lỗi) cho Renderer.
    - Sử dụng `ipc.on()` cho các sự kiện một chiều từ Renderer đến Main.

    ```typescript
    // Ví dụ trong file my-feature.ts
    import { IpcMain } from 'electron'

    export function myFeature(ipc: IpcMain): void {
      ipc.handle('my-feature:do-something', async (_event, arg1, arg2) => {
        // ... thực hiện tác vụ bất đồng bộ
        const result = await doSomething(arg1, arg2)
        return result
      })
    }
    ```

3.  **Export Module**: Mở file `ipc/modules/index.ts` và export module mới của bạn.

    ```typescript
    // trong file ipc/modules/index.ts
    export * from './my-feature'
    // ... các export khác
    ```

Hệ thống sẽ tự động nhận diện và đăng ký handler mới của bạn khi ứng dụng khởi động.

## Các Module Hiện có

Dưới đây là danh sách các handler hiện có và chức năng của chúng:

- `dialog.ts`: Mở hộp thoại native để chọn file hoặc thư mục.
- `logger.ts`: Chuyển tiếp log từ tiến trình Main sang Renderer để hiển thị trên giao diện (Log Viewer).
- `open-external.ts`: Mở một URL trong trình duyệt mặc định của người dùng.
- `ping.ts`: Một handler `ping-pong` đơn giản để kiểm tra kết nối IPC.
- `updater.ts`: Quản lý vòng đời tự động cập nhật ứng dụng (kiểm tra, tải về, cài đặt).
- `video-cutter.ts`: Cung cấp chức năng cắt video sử dụng `ffmpeg`.
- `settings.ts`: Cung cấp giao diện để đọc và ghi cài đặt ứng dụng, tự động mã hóa các dữ liệu nhạy cảm.
- `youtube.ts`: Cung cấp chức năng tải video và lấy thông tin định dạng từ YouTube sử dụng `yt-dlp`.

## Lưu ý quan trọng

- **Bảo mật**: Luôn xác thực và làm sạch (sanitize) dữ liệu nhận được từ tiến trình Renderer để tránh các lỗ hổng bảo mật.
- **Xử lý lỗi**: Đảm bảo xử lý lỗi một cách triệt để ở phía Main và trả về thông tin lỗi rõ ràng cho Renderer để giao diện có thể phản hồi một cách phù hợp.
