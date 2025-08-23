import { Type } from "@google/genai";
// 卡片类型定义
export interface Card {
    id: string;
    word: string; // 日语单词/短语
    reading: string; // 假名读音
    meaning: string; // 中文意思
    sentence: string; // 原句
    explanation?: string; // 可选的额外解释
}

// 句子类型定义
export interface Sentence {
    id: string;
    text: string; // 句子文本
    processed: boolean; // 是否已处理
    keywords?: string[]; // 可选的关键词列表
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
