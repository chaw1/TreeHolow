// src/i18n/locales/ja.ts
export const ja = {
  // 通用 UI 元素
  common: {
    appName: "心の木のくぼみ",
    loading: "読み込み中...",
    error: "エラーが発生しました",
    retry: "再試行",
    save: "保存",
    cancel: "キャンセル",
    delete: "削除",
    edit: "編集",
    search: "検索",
    submit: "送信",
    close: "閉じる",
    back: "戻る",
    next: "次へ",
    finish: "完了",
    view: "表示",
    show: "表示する",
    hide: "隠す",
  },

  // 导航
  nav: {
    home: "ホーム",
    treehole: "木のくぼみ",
    memories: "私の記憶",
    achievements: "達成システム",
    settings: "設定",
    profile: "プロフィール",
    login: "ログイン",
    logout: "ログアウト",
    signup: "登録",
    diaries: "心の日記",
  },

  // 首页
  hero: {
    title: "デジタル時代の心の安らぎ場所",
    subtitle: "ここでは、すべての物語が優しく扱われ、すべての感情に耳を傾けます。AIがあなたの想いを守り、デジタルの森で記憶を育てます。",
    cta: {
      start: "体験を始める",
      enter: "サンクチュアリへ",
      learnMore: "詳しく見る"
    }
  },
  features: {
    title: "なぜデジタルサンクチュアリを選ぶのか？",
    subtitle: "テクノロジーで温もりを、知能で理解を創造します",
    cards: {
      emotional: {
        title: "感情知能分析",
        description: "AIがあなたの感情の変化を深く理解し、パーソナライズされた心理的サポートを提供します"
      },
      privacy: {
        title: "プライバシー重視",
        description: "エンドツーエンドの暗号化で、あなたの物語を安全に保管します"
      },
      growth: {
        title: "成長の軌跡",
        description: "感情の変化を可視化し、心の成長の一歩一歩を見守ります"
      }
    }
  },
  process: {
    title: "シンプルな3ステップで心の対話を始めましょう",
    steps: {
      record: {
        title: "今を記録",
        description: "音声やテキストで、今の気持ちを記録します"
      },
      ai: {
        title: "AIの伴走",
        description: "タイムリーな感情分析と温かい応答を受け取ります"
      },
      grow: {
        title: "成長と変化",
        description: "デジタルの森で、自身の変容を見守ります"
      }
    }
  },
  callToAction: {
    title: "心の旅を始めましょう",
    subtitle: "木のくぼみでの共有は、心の解放と成長につながります。今すぐ体験してみましょう！",
    button: "今すぐ始める"
  },

  // 树洞页面
  treehole: {
    title: "記憶の木",
    subtitle: "光る果実をクリックして記憶を見る",
    recording: "録音中...",
    recordButton: "音声を録音",
    stopButton: "録音停止",
    processing: "処理中...",
    memoryDetail: {
      title: "記憶の果実",
      aiResponse: "木のくぼみの応答",
      closeButton: "記憶ウィンドウを閉じる"
    }
  },

  // 记忆页面
  memories: {
    title: "私の記憶",
    subtitle: "ここで共有のすべての瞬間を振り返ります",
    empty: "まだ記録された記憶はありません...",
    emptyAction: "木のくぼみで何かを共有しましょう",
    tabs: {
      memories: "記憶の振り返り",
      stats: "心の旅"
    },
    stats: {
      overview: "概要",
      confessions: "告白回数",
      words: "共有された言葉",
      emotions: "平均感情",
      achievements: "成長の足跡"
    }
  },
  
  // 成就和积分系统
  achievements: {
    title: "達成システム",
    subtitle: "成長の足跡を記録し、特別なバッジを集めます",
    progress: "達成進捗",
    unlocked: "解除した達成",
    completion: "完了度",
    points: {
      title: "私のポイント",
      current: "現在のポイント",
      description: "達成解除と毎日のチェックインでポイントを獲得できます",
      future: "将来、特別なテーマや機能と交換可能になります"
    },
    checkIn: {
      title: "毎日のチェックイン",
      streak: "連続日数",
      button: "今すぐチェックイン",
      done: "今日はすでにチェックイン済み",
      tomorrow: "明日また来てより多くのポイントを獲得しましょう！",
      consecutive: "連続チェックインでより多くのボーナスポイントを獲得！",
      alreadyDone: "今日はすでにチェックイン済みです",
      failed: "チェックインに失敗しました。後でもう一度お試しください",
      error: "エラーが発生しました。後でもう一度お試しください"
    },
    categories: {
      interaction: "交流達成",
      emotion: "感情達成",
      streak: "連続達成",
      special: "特別達成"
    }
  },

  // 页脚
  footer: {
    rights: "全著作権所有",
    tagline: "心のための安全でプライベートな空間",
    sections: {
      explore: "探索",
      about: "について"
    },
    links: {
      privacy: "プライバシーポリシー",
      terms: "利用規約"
    }
  },

  // 错误页面
  error: {
    notFound: "ページが見つかりません",
    notFoundMessage: "お探しのページは存在しないか、移動されました。",
    goHome: "ホームに戻る",
    serverError: "サーバーエラー",
    serverErrorMessage: "サーバー側で問題が発生しました。後でもう一度お試しください。"
  },
  
  // 心灵日记
  diaries: {
    title: "心の日記",
    subtitle: "感情と洞察を記録する",
    new: "新しい日記",
    calendar: "カレンダー表示",
    list: "リスト表示",
    noEntries: "まだ日記はありません",
    createFirst: "最初の日記を書きましょう",
    selectDate: "カレンダーから日付を選択してください",
    entryCount: "{count}件のエントリー",
    totalEntries: "合計{count}件の日記があります。頑張りましょう！",
    edit: "編集",
    delete: "削除",
    cancel: "キャンセル",
    save: "保存",
    saveChanges: "変更を保存",
    deleteConfirm: "削除の確認",
    deleteWarning: "この日記を削除してもよろしいですか？この操作は元に戻せません。",
    confirmDelete: "削除を確認",
    saveSuccess: "日記が正常に保存されました",
    deleteSuccess: "日記が正常に削除されました",
    
    form: {
      title: "タイトル",
      titlePlaceholder: "今日のタイトル",
      content: "内容",
      contentPlaceholder: "あなたの考えを書き留めてください...",
      mood: "今日の気分",
      tags: "タグを追加",
      customTag: "カスタムタグ",
      addTag: "追加",
      selectedTags: "選択したタグ",
      location: "場所",
      locationPlaceholder: "あなたの場所",
      weather: "天気",
      weatherPlaceholder: "今日の天気"
    },
    
    moods: {
      veryLow: "とても落ち込んでいる",
      low: "少し落ち込んでいる",
      neutral: "普通",
      happy: "幸せ",
      veryHappy: "とても幸せ"
    }
  }
};

