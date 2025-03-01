// src/i18n/locales/zh.ts
export const zh = {
  // 通用 UI 元素
  common: {
    appName: "心灵树洞",
    loading: "加载中...",
    error: "发生错误",
    retry: "重试",
    save: "保存",
    cancel: "取消",
    delete: "删除",
    edit: "编辑",
    search: "搜索",
    submit: "提交",
    close: "关闭",
    back: "返回",
    next: "下一步",
    finish: "完成",
    view: "查看",
    show: "显示",
    hide: "隐藏",
  },

  // 导航
  nav: {
    home: "首页",
    treehole: "树洞空间",
    memories: "我的记忆",
    achievements: "成就系统",
    settings: "设置",
    profile: "个人资料",
    login: "登录",
    logout: "退出登录",
    signup: "注册",
    diaries: "心灵日记",
  },

  // 首页
  hero: {
    title: "数字时代的心灵港湾",
    subtitle: "在这里，每一个故事都将被温柔对待，每一份情感都值得被倾听。让AI守护你的心事，让记忆在数字森林中生长。",
    cta: {
      start: "开始体验",
      enter: "进入树洞",
      learnMore: "了解更多"
    }
  },
  features: {
    title: "为什么选择数字树洞？",
    subtitle: "我们用科技创造温度，用智能传递理解",
    cards: {
      emotional: {
        title: "情感智能分析",
        description: "AI深度理解你的情绪变化，提供个性化的心理支持和建议"
      },
      privacy: {
        title: "隐私至上",
        description: "端到端加密保护，确保你的每一个故事都安全保存"
      },
      growth: {
        title: "成长轨迹",
        description: "可视化你的情感变化，见证每一步心灵的成长"
      }
    }
  },
  process: {
    title: "简单三步，开启心灵对话",
    steps: {
      record: {
        title: "记录当下",
        description: "通过语音或文字，记录此刻的心情"
      },
      ai: {
        title: "AI陪伴",
        description: "获得及时的情感分析和温暖回应"
      },
      grow: {
        title: "成长蜕变",
        description: "在数字森林中，见证自己的蜕变历程"
      }
    }
  },
  callToAction: {
    title: "开始你的心灵之旅",
    subtitle: "每一次树洞倾诉，都是一次心灵的释放与成长。现在就开始体验吧！",
    button: "立即开始"
  },

  // 树洞页面
  treehole: {
    title: "记忆之树",
    subtitle: "点击发光的果实查看记忆",
    recording: "正在录音...",
    recordButton: "录制语音",
    stopButton: "停止录音",
    processing: "处理中...",
    memoryDetail: {
      title: "记忆果实",
      aiResponse: "树洞回应",
      closeButton: "关闭记忆之窗"
    }
  },

  // 记忆页面
  memories: {
    title: "我的记忆",
    subtitle: "在这里回顾每一次倾诉的时刻",
    empty: "还没有记忆被记录下来...",
    emptyAction: "去树洞倾诉一下吧",
    tabs: {
      memories: "记忆回顾",
      stats: "心路历程"
    },
    stats: {
      overview: "总体概况",
      confessions: "倾诉次数",
      words: "分享文字",
      emotions: "平均情绪值",
      achievements: "成长足迹"
    }
  },
  
  // 成就和积分系统
  achievements: {
    title: "成就系统",
    subtitle: "记录成长足迹，收集特殊徽章",
    progress: "成就进度",
    unlocked: "解锁成就",
    completion: "完成度",
    points: {
      title: "我的积分",
      current: "当前积分",
      description: "解锁成就和每日签到可以获得积分",
      future: "未来可用于兑换特殊主题和功能"
    },
    checkIn: {
      title: "每日签到",
      streak: "连续签到",
      button: "立即签到",
      done: "今日已签到",
      tomorrow: "明天再来签到获取更多积分吧!",
      consecutive: "连续签到可获得更多积分奖励!",
      alreadyDone: "你今天已经签到过了",
      failed: "签到失败，请稍后再试",
      error: "出错了，请稍后再试"
    },
    categories: {
      interaction: "互动成就",
      emotion: "情绪成就",
      streak: "连续成就",
      special: "特殊成就"
    }
  },

  // 页脚
  footer: {
    rights: "版权所有",
    tagline: "一个安全、私密的心灵空间",
    sections: {
      explore: "探索",
      about: "关于"
    },
    links: {
      privacy: "隐私政策",
      terms: "使用条款"
    }
  },

  // 错误页面
  error: {
    notFound: "页面未找到",
    notFoundMessage: "您查找的页面不存在或已被移动。",
    goHome: "返回首页",
    serverError: "服务器错误",
    serverErrorMessage: "我们这边出了些问题，请稍后再试。"
  },
  
  // 心灵日记
  diaries: {
    title: "心灵日记",
    subtitle: "记录每一刻的心情和感悟",
    new: "写新日记",
    calendar: "日历视图",
    list: "列表视图",
    noEntries: "还没有日记记录",
    createFirst: "写下你的第一篇日记",
    selectDate: "请从日历选择一天",
    entryCount: "{count} 篇日记",
    totalEntries: "共有 {count} 篇日记，继续加油！",
    edit: "编辑",
    delete: "删除",
    cancel: "取消",
    save: "保存",
    saveChanges: "保存更改",
    deleteConfirm: "确认删除",
    deleteWarning: "确定要删除这篇日记吗？此操作无法撤销。",
    confirmDelete: "确认删除",
    saveSuccess: "日记保存成功",
    deleteSuccess: "日记删除成功",
    
    form: {
      title: "标题",
      titlePlaceholder: "今天的标题",
      content: "内容",
      contentPlaceholder: "写下你的想法...",
      mood: "今天的心情",
      tags: "添加标签",
      customTag: "自定义标签",
      addTag: "添加",
      selectedTags: "已选标签",
      location: "位置",
      locationPlaceholder: "你的位置",
      weather: "天气",
      weatherPlaceholder: "今天的天气"
    },
    
    moods: {
      veryLow: "非常低落",
      low: "有点低落",
      neutral: "平静",
      happy: "开心",
      veryHappy: "非常开心"
    }
  }
};