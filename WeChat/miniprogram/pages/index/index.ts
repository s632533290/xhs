// index.ts
// 获取应用实例
const app = getApp<IAppOption>()
import { formatTime } from '../../utils/util'

// 食物分类
const FOOD_CATEGORIES = ['蔬菜水果', '肉类', '海鲜', '乳制品', '熟食', '冷冻食品', '其他']

Component({
  data: {
    foods: [] as Array<FoodItem>,
    filteredFoods: [] as Array<FoodItem>,
    searchQuery: '',
    selectedCategory: 'all',
    categories: FOOD_CATEGORIES,
    categoryOptions: ['全部', ...FOOD_CATEGORIES],
    categoryIndex: 0,
  },
  lifetimes: {
    attached() {
      this.loadFoodData()
    },
    show() {
      // 每次页面显示时重新加载数据，确保数据是最新的
      this.loadFoodData()
    }
  },
  pageLifetimes: {
    show() {
      // 页面显示时重新加载数据
      this.loadFoodData()
    }
  },
  methods: {
    // 加载食物数据
    loadFoodData() {
      const foods = wx.getStorageSync('foods') || []
      
      // 计算每个食物的到期天数和状态
      const processedFoods = foods.map((food: FoodItem) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const addedDate = new Date(food.addedDate)
        const expiryDate = new Date(food.expiryDate)
        
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
        
        return {
          ...food,
          daysToExpiry,
          daysStored,
          expiryStatus,
          addedDateFormatted: formatTime(addedDate).split(' ')[0],
          expiryDateFormatted: formatTime(expiryDate).split(' ')[0]
        }
      })
      
      // 按到期日期排序，即将到期的排在前面
      processedFoods.sort((a, b) => a.daysToExpiry - b.daysToExpiry)
      
      this.setData({
        foods: processedFoods,
        filteredFoods: processedFoods
      })
      
      // 应用当前的搜索和筛选条件
      this.applyFilters()
    },
    
    // 搜索功能
    onSearchInput(e: any) {
      this.setData({
        searchQuery: e.detail.value
      })
      this.applyFilters()
    },
    
    // 选择分类（下拉框）
    onCategoryChange(e: any) {
      const index = parseInt(e.detail.value)
      const category = index === 0 ? 'all' : this.data.categoryOptions[index]
      
      this.setData({
        categoryIndex: index,
        selectedCategory: category
      })
      this.applyFilters()
    },
    
    // 应用筛选条件
    applyFilters() {
      const { foods, searchQuery, selectedCategory } = this.data
      
      let filtered = foods
      
      // 应用搜索
      if (searchQuery) {
        filtered = filtered.filter((food: FoodItem) => 
          food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          food.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      // 应用分类筛选
      if (selectedCategory !== 'all') {
        filtered = filtered.filter((food: FoodItem) => 
          food.category === selectedCategory
        )
      }
      
      this.setData({
        filteredFoods: filtered
      })
    },
    
    // 显示筛选选项
    showFilterOptions() {
      wx.showActionSheet({
        itemList: ['按名称排序', '按到期日期排序', '按添加日期排序'],
        success: (res) => {
          const { foods } = this.data
          let sortedFoods = [...foods]
          
          switch(res.tapIndex) {
            case 0: // 按名称排序
              sortedFoods.sort((a, b) => a.name.localeCompare(b.name))
              break
            case 1: // 按到期日期排序
              sortedFoods.sort((a, b) => a.daysToExpiry - b.daysToExpiry)
              break
            case 2: // 按添加日期排序
              sortedFoods.sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
              break
          }
          
          this.setData({
            foods: sortedFoods
          })
          this.applyFilters()
        }
      })
    },
    
    // 跳转到详情页
    goToDetail(e: any) {
      const id = e.currentTarget.dataset.id
      wx.navigateTo({
        url: `../detail/detail?id=${id}`
      })
    },
    
    // 跳转到添加页
    goToAdd() {
      wx.navigateTo({
        url: '../add/add'
      })
    },
    
    // 删除食物
    deleteFood(e: any) {
      const id = e.currentTarget.dataset.id;
      
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这个食物吗？',
        success: (res) => {
          if (res.confirm) {
            // 删除食物数据
            const foods = wx.getStorageSync('foods') || [];
            const newFoods = foods.filter((item: FoodItem) => item.id !== id);
            wx.setStorageSync('foods', newFoods);
            
            // 删除提醒设置
            const reminders = wx.getStorageSync('reminders') || {};
            delete reminders[id];
            wx.setStorageSync('reminders', reminders);
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
            // 重新加载数据
            this.loadFoodData();
          }
        }
      });
    }
  }
})
