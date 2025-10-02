import type { NexoStudioDexie } from './index';
import type { Group, Project, QuickNav, Todo, Trend } from './schema';

import { nanoid } from 'nanoid';

const groupsData: Omit<Group, 'color'>[] = [
  { id: nanoid(), name: 'Ẩm thực & Nấu ăn' },
  { id: nanoid(), name: 'Mẹo vặt cuộc sống' },
  { id: nanoid(), name: 'Kể chuyện' },
  { id: nanoid(), name: 'Du lịch' },
  { id: nanoid(), name: 'Hài hước' },
  { id: nanoid(), name: 'Tự làm & Thủ công' },
];

function getGroupId(name: string): string {
  return groupsData.find((g) => g.name === name)?.id || '';
}

const projectItemsData: Omit<Project, 'id'>[] = [
  {
    color: '#FF0000',
    content:
      'Một video ngắn, hấp dẫn vạch trần những lầm tưởng phổ biến về mì Ý và chỉ ra cách nấu chuẩn Ý.',
    date: '2024-08-01',
    groupId: getGroupId('Ẩm thực & Nấu ăn'),
    group: '',
    icon: 'ion:logo-youtube',
    title: 'Bạn đã nấu mì Ý SAI cách cả đời rồi!',
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
    // Xóa toàn bộ dữ liệu trong các bảng
    await Promise.all([
      db.groups.clear(),
      db.projects.clear(),
      db.quickNavs.clear(),
      db.todos.clear(),
      db.trends.clear(),
    ]);
  }

  // Seed groups trước nếu bảng trống
  const groupsCount = await db.groups.count();
  if (groupsCount === 0) {
    await db.groups.bulkAdd(groupsData);
  }

  // Seed các bảng khác nếu chúng trống
  const projectsCount = await db.projects.count();
  if (projectsCount === 0) {
    await db.projects.bulkAdd(projectItemsData);
  }

  const quickNavsCount = await db.quickNavs.count();
  if (quickNavsCount === 0) await db.quickNavs.bulkAdd(quickNavItemsData);

  const todosCount = await db.todos.count();
  if (todosCount === 0) await db.todos.bulkAdd(todoItemsData);

  const trendsCount = await db.trends.count();
  if (trendsCount === 0) await db.trends.bulkAdd(trendItemsData);
}
