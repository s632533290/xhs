// add.ts
import { formatTime } from '../../utils/util'
import { FoodItem } from '../../utils/types'

Component({
  data: {
    name: '',
    category: '蔬菜水果',
    categories: ['蔬菜水果', '肉类', '海鲜', '乳制品', '熟食', '冷冻食品', '其他'],
    categoryIndex: 0,
    addedDate: formatTime(new Date()).split(' ')[0],
    expiryDate: '',
    imageUrl: '',
    notes: '',
    showCamera: false,
    reminderEnabled: true,
    reminderDays: [1, 2, 3, 5, 7],
    reminderDayIndex: 1  // 默认提前2天提醒
  },
  lifetimes: {
    attached() {
      // 设置默认到期日期为7天后
      const date = new Date()
      date.setDate(date.getDate() + 7)
      this.setData({
        expiryDate: formatTime(date).split(' ')[0]
      })
    }
  },
  methods: {
    // 输入食物名称
    onNameInput(e: any) {
      this.setData({
        name: e.detail.value
      })
    },
    
    // 选择食物分类
    onCategoryChange(e: any) {
      const index = e.detail.value
      this.setData({
        categoryIndex: index,
        category: this.data.categories[index]
      })
    },
    
    // 选择放入日期
    onAddedDateChange(e: any) {
      this.setData({
        addedDate: e.detail.value
      })
    },
    
    // 选择到期日期
    onExpiryDateChange(e: any) {
      this.setData({
        expiryDate: e.detail.value
      })
    },
    
    // 输入备注
    onNotesInput(e: any) {
      this.setData({
        notes: e.detail.value
      })
    },
    
    // 打开相机
    openCamera() {
      this.setData({
        showCamera: true
      })
    },
    
    // 拍照
    takePhoto() {
      const ctx = wx.createCameraContext()
      ctx.takePhoto({
        quality: 'high',
        success: (res) => {
          this.setData({
            imageUrl: res.tempImagePath,
            showCamera: false
          })
        },
        fail: () => {
          wx.showToast({
            title: '拍照失败',
            icon: 'none'
          })
          this.setData({
            showCamera: false
          })
        }
      })
    },
    
    // 从相册选择
    chooseFromAlbum() {
      wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album'],
        success: (res) => {
          this.setData({
            imageUrl: res.tempFilePaths[0]
          })
        }
      })
    },
    
    // 取消拍照
    cancelCamera() {
      this.setData({
        showCamera: false
      })
    },
    
    // 设置提醒
    setReminder(e: any) {
      this.setData({
        reminderEnabled: e.detail.value
      })
    },
    
    // 更改提醒天数
    changeReminderDays(e: any) {
      this.setData({
        reminderDayIndex: e.detail.value
      })
    },
    
    // 保存食物
    saveFood() {
      const { name, category, addedDate, expiryDate, imageUrl, notes, reminderEnabled, reminderDays, reminderDayIndex } = this.data
      
      if (!name) {
        wx.showToast({
          title: '请输入食物名称',
          icon: 'none'
        })
        return
      }
      
      if (!expiryDate) {
        wx.showToast({
          title: '请选择到期日期',
          icon: 'none'
        })
        return
      }
      
      // 生成唯一ID
      const id = Date.now().toString()
      
      // 创建食物对象
      const food: FoodItem = {
        id,
        name,
        category,
        addedDate,
        expiryDate,
        notes,
        imageUrl
      }
      
      // 保存到本地存储
      const foods = wx.getStorageSync('foods') || []
      foods.push(food)
      wx.setStorageSync('foods', foods)
      
      // 保存提醒设置
      if (reminderEnabled) {
        const reminders = wx.getStorageSync('reminders') || {}
        reminders[id] = {
          daysBeforeExpiry: reminderDays[reminderDayIndex],
          enabled: true,
          notificationTime: '08:00'
        }
        wx.setStorageSync('reminders', reminders)
      }
      
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1000)
    },
    
    // 返回上一页
    goBack() {
      wx.navigateBack()
    }
  }
})