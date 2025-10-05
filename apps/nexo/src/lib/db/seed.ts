import type { Table } from 'dexie';

import type { QuickNav, Todo, Trend } from './base-schema';
import type { NexoStudioDexie } from './index';
import type { Group, Project } from './project-schema';
import type {
  Format,
  LengthOption,
  OutputRequirement,
  PromptHub,
  PromptTemplate,
  ScriptType,
  Style,
  Topic,
} from './prompt-schema';

import { nanoid } from 'nanoid';

const groupsData: Group[] = [
  { id: nanoid(), name: 'Ẩm thực & Nấu ăn', color: '#FFB300' },
  { id: nanoid(), name: 'Mẹo vặt cuộc sống', color: '#00BFAE' },
  { id: nanoid(), name: 'Kể chuyện', color: '#FF7043' },
  { id: nanoid(), name: 'Du lịch', color: '#42A5F5' },
  { id: nanoid(), name: 'Hài hước', color: '#AB47BC' },
  { id: nanoid(), name: 'Tự làm & Thủ công', color: '#8D6E63' },
];

function getGroupId(name: string): string {
  return groupsData.find((g) => g.name === name)?.id || '';
}

const projectItemsData: Omit<Project, 'id'>[] = [
  // Changed type to Omit<Project, 'id'>[]
  {
    color: '#FF0000',
    content:
      'Một video ngắn, hấp dẫn vạch trần những lầm tưởng phổ biến về mì Ý và chỉ ra cách nấu chuẩn Ý.',
    date: '2024-08-01',
    groupId: getGroupId('Ẩm thực & Nấu ăn'),
    group: '',
    icon: 'ion:logo-youtube',
    title: 'Bạn đã nấu mì Ý SAI cách cả đời rồi!',
    status: 'completed',
    url: 'https://youtube.com',
  },
  {
    color: '#00f2ea',
    content:
      'Video chuyển cảnh nhanh cho thấy một mẹo học tập 5 giây thực sự hiệu quả.',
    date: '2024-07-30',
    groupId: getGroupId('Mẹo vặt cuộc sống'),
    group: '',
    icon: 'ic:baseline-tiktok',
    title: 'Mẹo học tập 5 giây này sẽ thay đổi cách bạn học',
    status: 'in-progress',
    url: 'https://tiktok.com',
  },
  {
    color: '#1877F2',
    content:
      'Một câu chuyện cảm động về một người hùng địa phương, hoàn hảo cho Facebook Watch.',
    date: '2024-07-28',
    groupId: getGroupId('Kể chuyện'),
    group: '',
    icon: 'ion:logo-facebook',
    title: 'Người đàn ông trồng cả một khu rừng ở sân sau nhà',
    status: 'in-progress',
    url: 'https://facebook.com',
  },
  {
    color: '#FF0000',
    content:
      'Một vlog du lịch giới thiệu 3 viên ngọc ẩn ở Bali, tránh xa đám đông khách du lịch.',
    date: '2024-07-25',
    groupId: getGroupId('Du lịch'),
    group: '',
    icon: 'ion:logo-youtube',
    title: '3 địa điểm ở Bali bạn CHƯA BAO GIỜ nghe tới',
    status: 'planning',
    url: 'https://youtube.com',
  },
  {
    color: '#00f2ea',
    content:
      'Một video theo phong cách "chuẩn bị cùng tôi" với một cái kết bất ngờ và hài hước.',
    date: '2024-07-22',
    groupId: getGroupId('Hài hước'),
    group: '',
    icon: 'ic:baseline-tiktok',
    title: 'Thói quen buổi sáng của tôi... nhưng tôi đã ngủ quên',
    status: 'on-hold',
    url: 'https://tiktok.com',
  },
  {
    color: '#1877F2',
    content: 'Hướng dẫn cách làm một kệ sách DIY đơn giản từ vật liệu tái chế.',
    date: '2024-07-20',
    groupId: getGroupId('Tự làm & Thủ công'),
    group: '',
    icon: 'ion:logo-facebook',
    title: 'Làm kệ sách này với giá dưới 500k',
    status: 'completed',
    url: 'https://facebook.com',
  },
];

const quickNavItemsData: Omit<QuickNav, 'id'>[] = [
  {
    color: '#1fdaca',
    icon: 'ion:home-outline',
    title: 'Trang chủ',
    url: '/',
  },
  {
    color: '#bf0c2c',
    icon: 'ion:grid-outline',
    title: 'Bảng điều khiển',
    url: '/dashboard',
  },
  {
    color: '#e18525',
    icon: 'ion:layers-outline',
    title: 'Thành phần',
    url: '/demos/features/icons',
  },
  {
    color: '#3fb27f',
    icon: 'ion:settings-outline',
    title: 'Hệ thống',
    url: '/demos/features/login-expired',
  },
  {
    color: '#4daf1bc9',
    icon: 'ion:key-outline',
    title: 'Phân quyền',
    url: '/demos/access/page-control',
  },
  {
    color: '#00d8ff',
    icon: 'ion:bar-chart-outline',
    title: 'Biểu đồ',
    url: '/analytics',
  },
];

const todoItemsData: Omit<Todo, 'id'>[] = [
  {
    completed: false,
    content: `Xem lại các commit code frontend gần đây trên kho Git để đảm bảo chất lượng và tiêu chuẩn.`,
    date: '2024-07-30 11:00:00',
    title: 'Xem lại code frontend',
  },
  {
    completed: true,
    content: `Kiểm tra và tối ưu hóa hiệu suất hệ thống, giảm mức sử dụng CPU.`,
    date: '2024-07-30 11:00:00',
    title: 'Tối ưu hóa hiệu suất',
  },
  {
    completed: false,
    content: `Thực hiện kiểm tra bảo mật hệ thống để đảm bảo không có lỗ hổng hoặc truy cập trái phép.`,
    date: '2024-07-30 11:00:00',
    title: 'Kiểm tra bảo mật',
  },
  {
    completed: false,
    content: `Cập nhật tất cả các gói phụ thuộc npm trong dự án để đảm bảo sử dụng phiên bản mới nhất.`,
    date: '2024-07-30 11:00:00',
    title: 'Cập nhật các gói phụ thuộc',
  },
  {
    completed: false,
    content: `Sửa các vấn đề hiển thị UI do người dùng báo cáo, đảm bảo hiển thị nhất quán trên các trình duyệt.`,
    date: '2024-07-30 11:00:00',
    title: 'Sửa lỗi hiển thị UI',
  },
];

const trendItemsData: Omit<Trend, 'id'>[] = [
  {
    avatar: 'svg:avatar-1',
    content: `đã tạo dự án <a>Video Mới</a> trong <a>Nhóm Sáng Tạo</a>`,
    date: 'Vừa xong',
    title: 'An',
  },
  {
    avatar: 'svg:avatar-2',
    content: `đã theo dõi <a>An</a> `,
    date: '1 giờ trước',
    title: 'Bình',
  },
  {
    avatar: 'svg:avatar-3',
    content: `đã đăng một <a>cập nhật cá nhân</a> `,
    date: '1 ngày trước',
    title: 'Cường',
  },
  {
    avatar: 'svg:avatar-4',
    content: `đã xuất bản bài viết <a>Cách để có video triệu view</a> `,
    date: '2 ngày trước',
    title: 'Vben',
  },
  {
    avatar: 'svg:avatar-1',
    content: `đã trả lời câu hỏi của <a>Dũng</a> <a>Làm sao để tối ưu kịch bản?</a>`,
    date: '3 ngày trước',
    title: 'Giang',
  },
  {
    avatar: 'svg:avatar-2',
    content: `đã đóng vấn đề <a>Lỗi khi xuất video</a> `,
    date: '1 tuần trước',
    title: 'Dũng',
  },
  {
    avatar: 'svg:avatar-3',
    content: `đã đăng một <a>cập nhật cá nhân</a> `,
    date: '1 tuần trước',
    title: 'An',
  },
  {
    avatar: 'svg:avatar-4',
    content: `đã đẩy kịch bản lên <a>Kho lưu trữ</a>`,
    date: '2021-04-01 20:00',
    title: 'An',
  },
  {
    avatar: 'svg:avatar-4',
    content: `đã xuất bản bài viết <a>Hướng dẫn sử dụng Catalyst</a> `,
    date: '2021-03-01 20:00',
    title: 'Vben',
  },
];

// --- Dữ liệu cho Prompt Video Maker ---

const scriptTypesData: ScriptType[] = [
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
];

const lengthOptionsData: LengthOption[] = [
  {
    id: 'very-short',
    label: 'Siêu ngắn (~30s)',
    characters: [500, 700],
    duration: [0.5, 0.75],
  },
  {
    id: 'short',
    label: 'Ngắn (1-2 phút)',
    characters: [1000, 1500],
    duration: [1, 2],
  },
  {
    id: 'medium',
    label: 'Vừa (3-5 phút)',
    characters: [2500, 3500],
    duration: [3, 5],
  },
  {
    id: 'long',
    label: 'Dài (8-12 phút)',
    characters: [5000, 7000],
    duration: [8, 12],
  },
  {
    id: 'very-long',
    label: 'Rất dài (15-30 phút)',
    characters: [10_000, 20_000],
    duration: [15, 30],
  },
];

const topicsData: Topic[] = [
  { id: 'entertainment', name: 'Giải trí', category: 'general' },
  { id: 'education', name: 'Giáo dục', category: 'general' },
  { id: 'spiritual', name: 'Phật pháp', category: 'lifestyle' },
  { id: 'business', name: 'Kinh doanh', category: 'professional' },
  { id: 'inspiration', name: 'Truyền cảm hứng', category: 'lifestyle' },
];

const stylesData: Style[] = [
  { id: 'funny', name: 'Hài hước', description: 'Vui vẻ, dí dỏm, gây cười' },
  {
    id: 'expert',
    name: 'Chuyên gia',
    description: 'Cung cấp thông tin sâu, đáng tin cậy',
  },
  {
    id: 'storytelling',
    name: 'Kể chuyện',
    description: 'Dẫn dắt bằng một câu chuyện lôi cuốn',
  },
  {
    id: 'inspirational',
    name: 'Truyền cảm hứng',
    description: 'Tạo động lực, khơi dậy cảm xúc tích cực',
  },
  {
    id: 'casual',
    name: 'Thân mật',
    description: 'Gần gũi, như đang trò chuyện với bạn bè',
  },
];

const formatsData: Format[] = [
  {
    id: 'monologue',
    name: 'Độc thoại (Monologue)',
    description: 'Một người nói trực tiếp',
  },
  {
    id: 'dialogue',
    name: 'Đối thoại (Dialogue)',
    description: 'Hai hoặc nhiều người trò chuyện',
  },
  {
    id: 'narration',
    name: 'Tường thuật (Narration)',
    description: 'Giọng đọc dẫn chuyện trên nền hình ảnh',
  },
  {
    id: 'mix-visual',
    name: 'Hỗn hợp (Mix-visual)',
    description: 'Kết hợp nhiều hình thức, chú trọng gợi ý hình ảnh',
  },
];

const outputRequirementsData: OutputRequirement[] = [
  {
    id: 'prose',
    name: 'Văn xuôi liền mạch',
    rules: ['Viết dưới dạng văn xuôi, không gạch đầu dòng.'],
  },
  {
    id: 'dialogue-script',
    name: 'Kịch bản thoại',
    rules: ['Trình bày rõ ràng tên nhân vật và lời thoại.'],
  },
  {
    id: 'scene-based',
    name: 'Phân cảnh chi tiết',
    rules: [
      'Chia kịch bản thành các cảnh (SCENE), mô tả bối cảnh (INT./EXT.), hành động và thoại.',
    ],
  },
  {
    id: 'summary',
    name: 'Chỉ tóm tắt ý chính',
    rules: ['Chỉ liệt kê các ý chính, không cần viết chi tiết.'],
  },
];

const promptTemplatesData: PromptTemplate[] = [
  {
    id: 'basic-video-script',
    name: 'Prompt Video Chuẩn',
    structure:
      'Tạo kịch bản video dạng {scriptType}, độ dài {length}, chủ đề {topic}, phong cách {style}, hình thức {format}. Yêu cầu đầu ra: {outputRequirement}.',
    placeholders: [
      'scriptType',
      'length',
      'topic',
      'style',
      'format',
      'outputRequirement',
    ],
  },
];

const promptHubsData: (Omit<PromptHub, 'id'> & { tags: string[] })[] = [
  {
    title: 'Ảnh chân dung chuyên nghiệp',
    description: 'Prompt để tạo ảnh chân dung cho ảnh đại diện mạng xã hội.',
    prompt:
      'professional headshot, corporate portrait, clean background, sharp focus, high-resolution, 8k, detailed skin texture, natural lighting, looking at the camera, confident expression --ar 1:1',
    date: '2024-08-01',
    isFavorite: true,
    tags: ['image', 'midjourney', 'portrait', 'professional'],
  },
  {
    title: 'Video giới thiệu sản phẩm công nghệ',
    description: 'Kịch bản mẫu cho video quảng cáo sản phẩm công nghệ mới.',
    prompt:
      'Create a 60-second video script for a new smartphone. Start with a hook showing a common problem. Introduce the phone as the solution. Highlight 3 key features: long battery life, amazing camera, and sleek design. End with a strong call to action to "Upgrade your world". The style should be energetic and modern.',
    date: '2024-07-30',
    tags: ['video', 'script', 'product', 'tech'],
  },
  {
    title: 'Nhân vật Cyberpunk',
    description: 'Prompt tạo nhân vật nghệ thuật theo phong cách Cyberpunk.',
    prompt:
      'cyberpunk character, neon-lit alley, rain-slicked streets, trench coat, glowing cybernetic eye, futuristic city, cinematic lighting, highly detailed, concept art, by Syd Mead and Katsuhiro Otomo --ar 2:3',
    date: '2024-07-28',
    isFavorite: false,
    tags: ['image', 'character-design', 'cyberpunk'],
  },
];

/**
 * Hàm trợ giúp để seed dữ liệu cho một bảng nếu bảng đó trống.
 * @param table - Đối tượng bảng Dexie.
 * @param data - Mảng dữ liệu cần seed.
 */
async function seedTableIfEmpty<T>(table: Table<T>, data: T[]) {
  const count = await table.count();
  if (count === 0) {
    await table.bulkAdd(data as any[]);
  }
}

/**
 * Tìm hoặc tạo các tag và trả về mảng các ID của chúng.
 * @param db - Instance của NexoStudioDexie.
 * @param tagNames - Mảng các tên tag.
 * @returns Promise chứa mảng các ID của tag.
 */
async function findOrCreateTags(
  db: NexoStudioDexie,
  tagNames: string[],
): Promise<number[]> {
  const tagIds = await Promise.all(
    tagNames.map(async (name) => {
      const existingTag = await db.tags
        .where('name')
        .equalsIgnoreCase(name)
        .first();
      return existingTag?.id ?? (await db.tags.add({ name }));
    }),
  );
  return tagIds.map((id) => id as number);
}

/**
 * Seed một prompt đơn lẻ cùng với các tag của nó.
 * @param db - Instance của NexoStudioDexie.
 * @param promptWithTags - Dữ liệu prompt bao gồm cả mảng tên tag.
 */
async function seedSinglePromptWithTags(
  db: NexoStudioDexie,
  promptWithTags: Omit<PromptHub, 'id'> & { tags: string[] },
) {
  const { tags, ...promptItem } = promptWithTags;
  const promptId = await db.promptHubs.add(promptItem);

  const tagIds = await findOrCreateTags(db, tags);
  const links = tagIds.map((tagId) => ({ promptId, tagId }));
  await db.promptTags.bulkAdd(links);
}

/**
 * Hàm trợ giúp để seed dữ liệu cho Prompt Hub, bao gồm cả việc tạo và liên kết các tag.
 * @param db - Instance của NexoStudioDexie.
 */
async function seedPromptHubData(db: NexoStudioDexie) {
  if ((await db.promptHubs.count()) > 0) {
    return;
  }

  for (const promptWithTags of promptHubsData) {
    await seedSinglePromptWithTags(db, promptWithTags);
  }
}

/**
 * Kiểm tra và chèn dữ liệu mẫu nếu DB trống.
 * @param db - The Dexie database instance.
 * @param options - Tùy chọn cho việc seed.
 * @param options.forceReset - Nếu là true, sẽ xóa tất cả dữ liệu cũ trước khi seed.
 */
export async function seedInitialData(
  db: NexoStudioDexie,
  options?: { forceReset?: boolean },
) {
  if (options?.forceReset) {
    await Promise.all([
      db.groups.clear(),
      db.projects.clear(),
      db.quickNavs.clear(),
      db.todos.clear(),
      db.trends.clear(),
      db.scriptTypes.clear(),
      db.lengthOptions.clear(),
      db.topics.clear(),
      db.styles.clear(),
      db.formats.clear(),
      db.outputRequirements.clear(),
      db.promptTemplates.clear(),
      db.promptHubs.clear(),
      db.tags.clear(),
      db.promptTags.clear(),
    ]);
  }

  // Sử dụng hàm trợ giúp để seed các bảng
  await seedTableIfEmpty(db.groups, groupsData);
  await seedTableIfEmpty(db.projects, projectItemsData);
  await seedTableIfEmpty(db.quickNavs, quickNavItemsData);
  await seedTableIfEmpty(db.todos, todoItemsData);
  await seedTableIfEmpty(db.trends, trendItemsData);
  await seedTableIfEmpty(db.scriptTypes, scriptTypesData);
  await seedTableIfEmpty(db.lengthOptions, lengthOptionsData);
  await seedTableIfEmpty(db.topics, topicsData);
  await seedTableIfEmpty(db.styles, stylesData);
  await seedTableIfEmpty(db.formats, formatsData);
  await seedTableIfEmpty(db.outputRequirements, outputRequirementsData);
  await seedTableIfEmpty(db.promptTemplates, promptTemplatesData);
  await seedPromptHubData(db);
}
