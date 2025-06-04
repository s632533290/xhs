// settings.ts
import { NotificationSettings } from '../../utils/types'

Component({
  data: {
    notificationSettings: {
      enabled: true,
      daysBeforeExpiry: 2,
      notificationTime: '08:00'
    } as NotificationSettings,
    foodCount: 0,
    expiredCount: 0,
    warningCount: 0
  },
  lifetimes: {
    attached() {
      this.loadSettings()
      this.loadStatistics()
    }
  },
  pageLifetimes: {
    show() {
      this.loadStatistics()
    }
  },
  methods: {
    // 加载设置
    loadSettings() {
      const settings = wx.getStorageSync('settings')
      if (settings) {
        this.setData({
          notificationSettings: settings.notifications || this.data.notificationSettings
        })
      }
    },
    
    // 加载统计数据
    loadStatistics() {
      const foods = wx.getStorageSync('foods') || []
      
      // 计算过期和即将过期的食物数量
      let expiredCount = 0
      let warningCount = 0
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      foods.forEach((food: any) => {
        const expiryDate = new Date(food.expiryDate)
        const timeDiff = expiryDate.getTime() - today.getTime()
        const daysToExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24))
        
        if (daysToExpiry <= 0) {
          expiredCount++
        } else if (daysToExpiry <= 3) {
          warningCount++
        }
      })
      
      this.setData({
        foodCount: foods.length,
        expiredCount,
        warningCount
      })
    },
    
    // 切换通知开关
    toggleNotifications(e: any) {
      const enabled = e.detail.value
      this.setData({
        'notificationSettings.enabled': enabled
      })
      this.saveSettings()
    },
    
    // 更改通知时间
    changeNotificationTime(e: any) {
      this.setData({
        'notificationSettings.notificationTime': e.detail.value
      })
      this.saveSettings()
    },
    
    // 保存设置
    saveSettings() {
      const settings = wx.getStorageSync('settings') || {}
      settings.notifications = this.data.notificationSettings
      wx.setStorageSync('settings', settings)
    },
    
    // 清空所有数据
    clearAllData() {
      wx.showModal({
        title: '确认清空',
        content: '确定要清空所有食物数据吗？此操作不可恢复。',
        success: (res) => {
          if (res.confirm) {
            wx.removeStorageSync('foods')
            wx.removeStorageSync('reminders')
            
            wx.showToast({
              title: '数据已清空',
              icon: 'success'
            })
            
            this.loadStatistics()
          }
        }
      })
    },
    
    // 关于应用
    showAbout() {
      wx.showModal({
        title: '关于应用',
        content: '冰箱食物保质期 v1.0.0\n\n这是一个帮助您管理冰箱中食物保质期的小程序，避免食物过期浪费。',
        showCancel: false
      })
    },
    
    // 返回主页
    goToHome() {
      wx.switchTab({
        url: '../index/index'
      })
    }
  }
})