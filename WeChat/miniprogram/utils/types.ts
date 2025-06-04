// 食物项目的数据结构
export interface FoodItem {
  id: string;           // 唯一标识符
  name: string;         // 食物名称
  category: string;     // 食物分类
  addedDate: string;    // 添加日期
  expiryDate: string;   // 过期日期
  imageUrl?: string;    // 食物图片URL（可选）
  notes?: string;       // 备注（可选）
  
  // 以下字段在前端计算，不存储
  daysToExpiry?: number;         // 距离过期还有多少天
  expiryStatus?: 'normal' | 'warning' | 'expired';  // 过期状态
  addedDateFormatted?: string;   // 格式化后的添加日期
  expiryDateFormatted?: string;  // 格式化后的过期日期
}

// 通知设置
export interface NotificationSettings {
  enabled: boolean;      // 是否启用通知
  daysBeforeExpiry: number;  // 过期前多少天通知
  notificationTime: string;  // 通知时间
}