import { GoogleGenAI } from "@google/genai";
import  { type Card, AIOutputSchema } from "../types";
import { v4 as uuidv4 } from "uuid";


// 这里应该从环境变量或配置文件中获取API密钥
// 在实际应用中，应该使用安全的方式存储和获取API密钥
let API_KEY = "AIzaSyA7f8cWd7uUW4vAO4Uh5ijndFvcQgSCZjw";

/**
 * 设置API密钥
 * @param apiKey Gemini API密钥
 */
export function setApiKey(apiKey: string) {
    API_KEY = apiKey;
}

/**
 * 生成卡片的系统提示
 */
const SYSTEM_PROMPT = `
你是一名拥有丰富视觉小说游戏经验的日语老师，你只会说中文和日文。
请根据提供的日语句子，生成Anki卡片内容。

对于每个句子，请提取重要的单词或短语，并为每个单词/短语创建一个卡片，包含以下信息：
1. 单词/短语（原形）
2. 假名读音
3. 中文意思（简洁准确的翻译）
4. 原句（作为例句）
5. 可选：额外解释（如用法说明、语法点等）

请跳过以下内容：
- 助词（如 は、が、に、を 等）
- 语气词、感叹词（如 ね、よ、はぁ）
- 常见的简单连接词（如 そして、それで）
- 极其简单的代词或助动词（如 これ、それ、する 等）除非对句意至关重要

请以JSON格式返回结果。
`;

/**
 * 使用Gemini API生成卡片
 * @param sentence 日语句子
 * @returns 生成的卡片数组
 */
export async function generateCards(sentence: string): Promise<Card[]> {
    if (!API_KEY) {
        // 如果没有设置 API 密钥，使用模拟数据（仅用于开发测试）
        return mockGenerateCards(sentence);
    }

    try {
        // const genAI = new GoogleGenerativeAI(API_KEY);
        const genAI = new GoogleGenAI({ apiKey: API_KEY });
        // const model = genAI.getGenerativeModel({ model: "gemini-pro2.5" });

        const userPrompt = `请根据以下日语句子生成Anki卡片：\n${sentence}`;

        console.log("⏳ 正在调用 Gemini API 生成卡片，请稍候...");

        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                // { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT + "\n\n" + userPrompt }],
                },
            ],
            config: {
                temperature: 0.2,
                topK: 32,
                topP: 0.95,
                maxOutputTokens: 8192,
                responseMimeType:"application/json",
                responseSchema:AIOutputSchema
            },
        });
        console.log("✅ API 调用完成，原始结果：", result);

        if (!result.text) {
            throw new Error("result.text is empty!");
        }
        const text: string = result.text;
        console.log("📩 生成的文本内容：", text);

        // 解析 JSON 响应
        try {
            const parsedData = JSON.parse(text);
            if (!Array.isArray(parsedData)) return [];

            return parsedData.map((item) => ({
                id: uuidv4(),
                word: item.word || "",
                reading: item.reading || "",
                meaning: item.meaning || "",
                sentence,
                explanation: item.explanation || "",
            }));
        } catch (err) {
            console.error("解析 AI 响应失败:", err);
            throw new Error("解析 AI 响应失败");
        }
    } catch (err) {
        console.error("调用 AI API 失败:", err);
        throw new Error("调用 AI API 失败");
    }
}

/**
 * 模拟生成卡片（用于开发测试）
 * @param sentence 日语句子
 * @returns 模拟生成的卡片数组
 */
function mockGenerateCards(sentence: string): Card[] {
    // 从句子中提取一些单词作为模拟数据
    const words = sentence
        .split(/\s+/)
        .filter((word) => word.length > 1 && !/[\.,!?]/.test(word));

    return words.slice(0, 3).map((word, index) => ({
        id: uuidv4(),
        word: word,
        reading: "假名读音示例",
        meaning: `单词${index + 1}的中文意思`,
        sentence: sentence,
        explanation: index % 2 === 0 ? "额外解释示例" : undefined,
    }));
}
