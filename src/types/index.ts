import { Type } from "@google/genai";
// 卡片类型定义
export interface Card {
    id: string;
    word: string; // 日语单词/短语
    reading: string; // 假名读音
    meaning: string; // 中文意思
    sentence: string; // 原句
    explanation?: string; // 可选的额外解释
    confirmed: boolean; // 是否已确认
    isAIGenerated: boolean; // 是否AI生成
    isProcessing?: boolean; // 是否正在处理中
    failed?: boolean; // 是否处理失败
}

// 句子类型定义
export interface Sentence {
    id: string;
    text: string; // 句子文本
    processed: boolean; // 是否已处理
    keywords?: string[]; // 可选的关键词列表
    cards: Card[]; // 该句子的卡片列表
    confirmed: boolean; // 是否已确认（所有卡片都确认）
    isProcessing: boolean; // 是否正在AI处理中
    failed?: boolean; // 是否处理失败
}

// 文件数据类型定义
export interface FileData {
    filename: string;
    filepath: string;
    sentences: Sentence[];
}

// 应用状态类型
export interface AppState {
    currentPage: "home" | "settings" | "card-processor" | "card-review";
    apiKey: string;
    currentFile: FileData | null;
    selectedSentenceId: string | null;
    isCardReviewMode: boolean;
    currentCardIndex: number;
}

// AI响应类型
export interface AIResponse {
    cards: Card[];
}

// AI json schema output
export const AIOutputSchema: any = {
    // 一个类型。。。这算什么东西啊？
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            word: { type: Type.STRING },
            reading: { type: Type.STRING },
            meaning: { type: Type.STRING },
            sentence: { type: Type.STRING },
            explanation: { type: Type.STRING },
        },
    },
};

// electron API类型定义
export interface ElectronAPI {
    openFile: () => Promise<{ canceled: boolean; filePath?: string }>;
    saveFile: (
        defaultPath: string
    ) => Promise<{ canceled: boolean; filePath?: string }>;
    readFile: (
        filePath: string
    ) => Promise<{ success: boolean; content?: string; error?: string }>;
    writeFile: (
        filePath: string,
        content: string
    ) => Promise<{ success: boolean; error?: string }>;
}

// 声明全局Window类型
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
