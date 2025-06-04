// app.ts
import { formatTime } from './utils/util'
import { FoodItem, NotificationSettings } from './utils/types'

App<IAppOption>({
  globalData: {
    checkingExpiry: false
  },
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化默认设置
    this.initSettings()
    
    // 检查过期食物
    this.checkExpiryFoods()
  },
  
  onShow() {
    // 每次打开应用时检查过期食物
    this.checkExpiryFoods()
  },
  
  // 初始化设置
  initSettings() {
    const settings = wx.getStorageSync('settings')
    if (!settings) {
      // 设置默认值
      const defaultSettings = {
        notifications: {
          enabled: true,
          daysBeforeExpiry: 2,
          notificationTime: '08:00'
        } as NotificationSettings
      }
      wx.setStorageSync('settings', defaultSettings)
    }
  },
  
  // 检查过期食物
  checkExpiryFoods() {
    // 避免重复检查
    if (this.globalData.checkingExpiry) return
    this.globalData.checkingExpiry = true
    
    const foods = wx.getStorageSync('foods') || []
    const settings = wx.getStorageSync('settings') || {}
    const reminders = wx.getStorageSync('reminders') || {}
    
    // 如果没有启用通知，则不检查
    if (!settings.notifications?.enabled) {
      this.globalData.checkingExpiry = false
      return
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 收集需要提醒的食物
    const expiringFoods: FoodItem[] = []
    const expiredFoods: FoodItem[] = []
    
    foods.forEach((food: FoodItem) => {
      const expiryDate = new Date(food.expiryDate)
      const timeDiff = expiryDate.getTime() - today.getTime()
      const daysToExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      // 检查是否有针对该食物的特定提醒设置
      const foodReminder = reminders[food.id]
      const daysBeforeExpiry = foodReminder ? foodReminder.daysBeforeExpiry : settings.notifications.daysBeforeExpiry
      
      if (daysToExpiry <= 0) {
        // 已过期
        expiredFoods.push(food)
      } else if (daysToExpiry <= daysBeforeExpiry) {
        // 即将过期
        expiringFoods.push({
          ...food,
          daysToExpiry
        })
      }
    })
    
    // 显示通知
    if (expiringFoods.length > 0 || expiredFoods.length > 0) {
      let message = ''
      
      if (expiringFoods.length > 0) {
        message += `有${expiringFoods.length}个食物即将过期，`
      }
      
      if (expiredFoods.length > 0) {
        message += `有${expiredFoods.length}个食物已经过期，`
      }
      
      message += '请及时处理！'
      
      wx.showModal({
        title: '食物保质期提醒',
        content: message,
        confirmText: '查看详情',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/index/index'
            })
          }
        },
        complete: () => {
          this.globalData.checkingExpiry = false
        }
      })
    } else {
      this.globalData.checkingExpiry = false
    }
  }
})