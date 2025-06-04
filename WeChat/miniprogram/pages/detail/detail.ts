// detail.ts
import { formatTime } from '../../utils/util'
import { FoodItem } from '../../utils/types'

Component({
  properties: {
    id: {
      type: String,
      value: ''
    }
  },
  data: {
    food: {} as FoodItem,
    reminderEnabled: false,
    reminderDays: [1, 2, 3, 5, 7],
    reminderDayIndex: 1,  // 默认提前2天提醒
    isEditing: false,
    tempAddedDate: '',
    tempExpiryDate: '',
    tempCategory: ''
  },
  lifetimes: {
    attached() {
      // 获取页面参数中的食物ID
      if (this.properties.id) {
        this.loadFoodData()
      } else {
        // 尝试从页面参数获取ID
        const pages = getCurrentPages()
        const currentPage = pages[pages.length - 1]
        const options = currentPage && currentPage.options ? currentPage.options : {}
        
        if (options && options.id) {
          this.setData({
            id: options.id
          })
          this.loadFoodData()
        } else {
          wx.showToast({
            title: '参数错误',
            icon: 'error'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      }
    }
  },
  methods: {
    // 加载食物数据
    loadFoodData() {
      // 优先使用properties中的id，如果没有则使用data中的id
      const id = this.properties.id || this.data.id
      const foods = wx.getStorageSync('foods') || []
      
      const food = foods.find((item: FoodItem) => item.id === id)
      
      if (food) {
        // 计算到期天数和状态
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // 确保日期格式正确
        let addedDate = new Date(food.addedDate)
        let expiryDate = new Date(food.expiryDate)
        
        // 检查日期是否有效，如果无效则使用当前日期
        if (isNaN(addedDate.getTime())) {
          addedDate = new Date()
        }
        
        if (isNaN(expiryDate.getTime())) {
          expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + 7) // 默认7天后过期
        }
        
        // 计算到期还剩多少天
        const timeDiff = expiryDate.getTime() - today.getTime()
        const daysToExpiry = Math.floor(timeDiff / (1000 * 3600 * 24))  // 改为向下取整
        
        // 计算已放入天数
        const storedTimeDiff = today.getTime() - addedDate.getTime()
        const daysStored = Math.ceil(storedTimeDiff / (1000 * 3600 * 24))  // 向下取整
        
        // 设置过期状态
        let expiryStatus = 'normal'
        if (daysToExpiry <= 0) {
          expiryStatus = 'expired'
        } else if (daysToExpiry <= 3) {
          expiryStatus = 'warning'
        }
        
        // 加载提醒设置
        const reminders = wx.getStorageSync('reminders') || {}
        const foodReminder = reminders[id]
        
        this.setData({
          food: {
            ...food,
            daysToExpiry,
            daysStored,
            expiryStatus,
            addedDateFormatted: formatTime(addedDate).split(' ')[0],
            expiryDateFormatted: formatTime(expiryDate).split(' ')[0]
          },
          reminderEnabled: foodReminder ? true : false,
          reminderDayIndex: foodReminder ? this.data.reminderDays.indexOf(foodReminder.daysBeforeExpiry) : 1
        })
      } else {
        wx.showToast({
          title: '未找到该食物',
          icon: 'error'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    },
    
    // 切换到编辑模式
    toggleEditMode() {
      this.setData({
        isEditing: !this.data.isEditing,
        // 初始化临时日期值和分类
        tempAddedDate: this.data.food.addedDateFormatted,
        tempExpiryDate: this.data.food.expiryDateFormatted,
        tempCategory: ''
      })
    },
    
    // 处理分类变更
    onCategoryChange(e: any) {
      const categories = ['蔬菜水果', '肉类', '海鲜', '乳制品', '熟食', '冷冻食品', '其他']
      const selectedIndex = e.detail.value
      this.setData({
        tempCategory: categories[selectedIndex]
      })
    },
    
    // 处理放入日期变更
    onAddedDateChange(e: any) {
      this.setData({
        tempAddedDate: e.detail.value
      })
    },
    
    // 处理到期日期变更
    onExpiryDateChange(e: any) {
      this.setData({
        tempExpiryDate: e.detail.value
      })
    },
    
    // 保存编辑
    saveEdit(e: any) {
      const { name, notes } = e.detail.value
      // 优先使用properties中的id，如果没有则使用data中的id
      const id = this.properties.id || this.data.id
      const { food, tempCategory } = this.data
      
      if (!name) {
        wx.showToast({
          title: '食物名称不能为空',
          icon: 'none'
        })
        return
      }
      
      // 获取修改后的日期
      const addedDate = this.data.tempAddedDate || food.addedDateFormatted
      const expiryDate = this.data.tempExpiryDate || food.expiryDateFormatted
      
      // 更新食物数据
      const foods = wx.getStorageSync('foods') || []
      const index = foods.findIndex((item: FoodItem) => item.id === id)
      
      if (index !== -1) {
        // 将日期字符串转换为Date对象
        const addedDateObj = new Date(addedDate)
        const expiryDateObj = new Date(expiryDate)
        
        foods[index] = {
          ...foods[index],
          name,
          category: tempCategory || food.category, // 使用临时分类或保持原有分类
          notes,
          addedDate: addedDateObj,
          expiryDate: expiryDateObj
        }
        
        wx.setStorageSync('foods', foods)
        
        // 重新计算到期天数和状态
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const timeDiff = expiryDateObj.getTime() - today.getTime()
        const daysToExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24))
        
        // 设置过期状态
        let expiryStatus = 'normal'
        if (daysToExpiry <= 0) {
          expiryStatus = 'expired'
        } else if (daysToExpiry <= 3) {
          expiryStatus = 'warning'
        }
        
        // 更新当前页面数据
        this.setData({
          'food.name': name,
          'food.category': tempCategory || food.category,
          'food.notes': notes,
          'food.addedDateFormatted': addedDate,
          'food.expiryDateFormatted': expiryDate,
          'food.daysToExpiry': daysToExpiry,
          'food.expiryStatus': expiryStatus,
          isEditing: false
        })
        
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
      }
    },
    
    // 删除食物
    deleteFood() {
      // 优先使用properties中的id，如果没有则使用data中的id
      const id = this.properties.id || this.data.id
      
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这个食物吗？',
        success: (res) => {
          if (res.confirm) {
            // 删除食物数据
            const foods = wx.getStorageSync('foods') || []
            const newFoods = foods.filter((item: FoodItem) => item.id !== id)
            wx.setStorageSync('foods', newFoods)
            
            // 删除提醒设置
            const reminders = wx.getStorageSync('reminders') || {}
            delete reminders[id]
            wx.setStorageSync('reminders', reminders)
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            
            setTimeout(() => {
              wx.navigateBack()
            }, 1000)
          }
        }
      })
    },
    
    // 设置提醒
    setReminder(e: any) {
      // 优先使用properties中的id，如果没有则使用data中的id
      const id = this.properties.id || this.data.id
      const reminderEnabled = e.detail.value
      
      this.setData({
        reminderEnabled
      })
      
      const reminders = wx.getStorageSync('reminders') || {}
      
      if (reminderEnabled) {
        // 启用提醒
        const daysBeforeExpiry = this.data.reminderDays[this.data.reminderDayIndex]
        reminders[id] = {
          daysBeforeExpiry,
          enabled: true,
          notificationTime: '08:00'
        }
      } else {
        // 禁用提醒
        delete reminders[id]
      }
      
      wx.setStorageSync('reminders', reminders)
    },
    
    // 更改提醒天数
    changeReminderDays(e: any) {
      // 优先使用properties中的id，如果没有则使用data中的id
      const id = this.properties.id || this.data.id
      const reminderDayIndex = e.detail.value
      const daysBeforeExpiry = this.data.reminderDays[reminderDayIndex]
      
      this.setData({
        reminderDayIndex
      })
      
      // 更新提醒设置
      if (this.data.reminderEnabled) {
        const reminders = wx.getStorageSync('reminders') || {}
        reminders[id] = {
          ...reminders[id],
          daysBeforeExpiry
        }
        wx.setStorageSync('reminders', reminders)
      }
    },
    
    // 返回上一页
    goBack() {
      wx.navigateBack()
    }
  }
})