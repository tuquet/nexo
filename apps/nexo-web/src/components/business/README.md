Rõ rồi 👍. Mình sẽ đi sâu hơn, giống như một **blueprint chi tiết** cho hệ thống quản lý **Prompt Video Maker** trên DexieDB. Kế hoạch này sẽ gồm: **cấu trúc DB**, **seed data mặc định**, **luồng hoạt động (workflow)**, và **gợi ý mở rộng**.

---

# 🗂 Kế hoạch chi tiết DB cho Prompt Video Maker

## 1. Mục tiêu hệ thống

- **Chuẩn hóa modular options** để khi tạo video script prompt, user không phải nhập lại thủ công.
- **Hỗ trợ workflow linh hoạt**: từ chọn loại video → cấu hình độ dài → chủ đề → phong cách → output requirement.
- **Tái sử dụng**: lưu lại template + lịch sử prompt.
- **Mở rộng dễ**: chỉ cần thêm option mới vào bảng, không phải viết lại logic.

---

## 2. Cấu trúc bảng chính trong DexieDB

### `scriptTypes` – Loại kịch bản

| Field       | Type   | Mô tả                                            |
| ----------- | ------ | ------------------------------------------------ |
| id          | string | Khóa chính (`short-form`, `long-form`, `hybrid`) |
| name        | string | Tên hiển thị                                     |
| description | string | Mô tả chi tiết                                   |

---

### `lengthOptions` – Độ dài

| Field      | Type     | Mô tả                          |
| ---------- | -------- | ------------------------------ |
| id         | string   | short, medium, long, very-long |
| label      | string   | “Ngắn”, “Vừa”, …               |
| characters | [number] | range ký tự [min, max]         |
| duration   | [number] | range thời lượng phút          |

---

### `topics` – Chủ đề

| Field | Type | Mô tả |
| --- | --- | --- |
| id | string | entertainment, education, spiritual, business, inspiration, custom |
| name | string | Giải trí, Giáo dục, Phật pháp… |
| category | string | group cha (education, marketing…) |
| isCustom | boolean | User tự thêm hay hệ thống mặc định |

---

### `styles` – Phong cách / Tone

| Field       | Type   | Mô tả                                              |
| ----------- | ------ | -------------------------------------------------- |
| id          | string | funny, expert, storytelling, inspirational, casual |
| name        | string | Hài hước, Chuyên gia…                              |
| description | string | Giải thích thêm (optional)                         |

---

### `formats` – Hình thức trình bày

| Field       | Type   | Mô tả                                      |
| ----------- | ------ | ------------------------------------------ |
| id          | string | monologue, dialogue, narration, mix-visual |
| name        | string | Monologue, Dialogue…                       |
| description | string | Chi tiết cách thể hiện                     |

---

### `outputRequirements` – Yêu cầu đầu ra

| Field | Type     | Mô tả                                                |
| ----- | -------- | ---------------------------------------------------- |
| id    | string   | prose, dialogue-script, scene-based, summary         |
| name  | string   | Văn xuôi liền mạch, thoại, phân cảnh…                |
| rules | string[] | Các rule (vd: “không bullet”, “xuống dòng từng câu”) |

---

### `promptTemplates` – Khung prompt

| Field        | Type     | Mô tả                          |
| ------------ | -------- | ------------------------------ |
| id           | string   | Khóa                           |
| name         | string   | Tên template                   |
| structure    | string   | Prompt khung có placeholder    |
| placeholders | string[] | Danh sách placeholder cần fill |

Ví dụ:

```json
{
  "id": "basic-video-script",
  "name": "Prompt Video Chuẩn",
  "structure": "Tạo kịch bản video dạng {scriptType}, độ dài {length}, chủ đề {topic}, phong cách {style}, dạng {format}. Đảm bảo nội dung {rules}.",
  "placeholders": ["scriptType", "length", "topic", "style", "format", "rules"]
}
```

---

### `userPrompts` – Prompt do user đã tạo

| Field        | Type   | Mô tả                        |
| ------------ | ------ | ---------------------------- |
| id           | string | UUID                         |
| templateId   | string | Tham chiếu `promptTemplates` |
| filledValues | object | Chứa các lựa chọn thực tế    |
| finalPrompt  | string | Prompt đã build              |
| createdAt    | Date   | Thời gian tạo                |

---

## 3. Dexie Schema

```ts
import Dexie from 'dexie';

export const db = new Dexie('VideoPromptDB');

db.version(1).stores({
  scriptTypes: 'id, name',
  lengthOptions: 'id, label',
  topics: 'id, name, category',
  styles: 'id, name',
  formats: 'id, name',
  outputRequirements: 'id, name',
  promptTemplates: 'id, name',
  userPrompts: 'id, templateId, createdAt',
});
```

---

## 4. Seed Data (dữ liệu mặc định)

Ví dụ:

```ts
await db.scriptTypes.bulkAdd([
  {
    id: 'short-form',
    name: 'Short-form',
    description: '30-90 giây (TikTok, Reels, Shorts)',
  },
  {
    id: 'long-form',
    name: 'Long-form',
    description: '3 phút trở lên (YouTube, Podcast)',
  },
  {
    id: 'hybrid',
    name: 'Hybrid',
    description: 'Có thể cắt nhỏ thành nhiều clip',
  },
]);

await db.lengthOptions.bulkAdd([
  {
    id: 'very-short',
    label: 'Siêu ngắn',
    characters: [500, 700],
    duration: [0.5, 0.75],
  },
  { id: 'short', label: 'Ngắn', characters: [1000, 1500], duration: [1, 2] },
  { id: 'medium', label: 'Vừa', characters: [2500, 3500], duration: [3, 5] },
  { id: 'long', label: 'Dài', characters: [5000, 7000], duration: [8, 12] },
  {
    id: 'very-long',
    label: 'Rất dài',
    characters: [10000, 20000],
    duration: [15, 30],
  },
]);
```

Tương tự cho `topics`, `styles`, `formats`, `outputRequirements`.

---

## 5. Workflow sử dụng

1. **Người dùng chọn** loại script, độ dài, chủ đề, phong cách, format, output requirement.
2. **Hệ thống lấy template** từ `promptTemplates`.
3. **Điền giá trị** vào placeholder → tạo `finalPrompt`.
4. **Lưu prompt** vào `userPrompts` (làm lịch sử + tái sử dụng).
5. **Hiển thị preview** cho user, có thể copy, chỉnh sửa, hoặc regenerate.

---

## 6. Gợi ý mở rộng

- **Tagging & Search**: user gắn tag vào prompt để dễ tìm.
- **Versioning**: cho phép clone và chỉnh sửa prompt cũ → lưu thành version mới.
- **Team Collaboration**: share prompt giữa các user.
- **Analytics**: thống kê loại prompt nào được dùng nhiều, độ dài nào phổ biến.

---

👉 Với kế hoạch này, bạn sẽ có một hệ thống **linh hoạt như Lego**: từng bảng là 1 “mảnh ghép”. Khi build prompt chỉ cần ráp lại các option.

Bạn có muốn mình viết luôn **file init DexieDB + seed đầy đủ** để bạn chỉ cần copy vào dự án là chạy được ngay không?
