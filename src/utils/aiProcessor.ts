import { GoogleGenAI } from "@google/genai";
import { type Card, AIOutputSchema } from "../types";
import { v4 as uuidv4 } from "uuid";

// 这里应该从环境变量或配置文件中获取API密钥
// 在实际应用中，应该使用安全的方式存储和获取API密钥
let API_KEY = "AIzaSyA7f8cWd7uUW4vAO4Uh5ijndFvcQgSCZjw";
let MODELNAME = "gemini-2.5-flash-lite"
// 候选的
// gemini-2.5-flash-lite
// gemini-2.5-flash
// gemini-2.5-pro


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
1. 单词/短语（如果原句中的单词并非原形，你应该还原成原型并在额外解释中，除了你想补充的，额外说明这点）
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
 * 为单个句子生成卡片
 * @param sentence 日语句子
 * @param apiKey API密钥
 * @returns 生成的卡片数组
 */
export async function generateCardsForSentence(
    sentence: string,
    apiKey?: string
): Promise<Card[]> {
    const currentApiKey = apiKey || API_KEY;
    console.log(`🎯 开始处理句子: "${sentence.substring(0, 30)}..."`);
    console.log(`🔑 使用API密钥: ${currentApiKey ? "已设置" : "未设置"}`);

    if (!currentApiKey) {
        console.log("🎭 使用模拟数据; 并非，未填写apikey");
        return [];
    }

    try {
        const genAI = new GoogleGenAI({ apiKey: currentApiKey });

        const userPrompt = `请根据以下日语句子生成Anki卡片：\n${sentence}`;

        console.log("⏳ 正在调用 Gemini API 生成卡片，请稍候...");

        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
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
                responseMimeType: "application/json",
                responseSchema: AIOutputSchema,
            },
        });
        console.log("✅ API 调用完成，原始结果：", result);

        if (!result.text) {
            throw new Error("API返回空结果");
        }
        const text: string = result.text;
        console.log("📩 生成的文本内容：", text);

        // 解析 JSON 响应
        try {
            const parsedData = JSON.parse(text);
            if (!Array.isArray(parsedData)) {
                console.warn("AI返回的不是数组，转换为数组");
                return [];
            }

            const cards = parsedData.map((item) => ({
                id: uuidv4(),
                word: item.word || "",
                reading: item.reading || "",
                meaning: item.meaning || "",
                sentence,
                explanation: item.explanation || "",
                confirmed: false,
                isAIGenerated: true,
            }));

            console.log(`✨ 成功生成 ${cards.length} 张卡片`);
            return cards;
        } catch (err) {
            console.error("❌ JSON解析失败:", err);
            console.error("原始内容:", text);
            throw new Error("解析AI响应失败");
        }
    } catch (err) {
        console.error(
            `❌ 处理句子失败: "${sentence.substring(0, 30)}..."`,
            err
        );
        throw err;
    }
}

/**
 * 为特定单词生成卡片
 * @param word 要制卡的单词
 * @param context 单词出现的上下文句子
 * @param apiKey API密钥
 * @returns 生成的单个卡片
 */
export async function generateCardForWord(
    word: string,
    context: string,
    apiKey?: string
): Promise<Card> {
    const currentApiKey = apiKey || API_KEY;
    if (!currentApiKey) {
        console.log("给单词生成卡片，没有apikey");
        throw "no apikey";
    }

    try {
        const genAI = new GoogleGenAI({ apiKey: currentApiKey });

        const wordPrompt = `
请为这个日语单词/短语生成一个Anki卡片：
单词：${word}
上下文句子：${context}

请生成包含以下信息的卡片：
1. 单词/短语（如果原句中的单词并非原形，你应该还原成原型并在额外解释中，除了你想补充的，额外说明这点）
2. 假名读音
3. 中文意思
4. 原句作为例句
5. 可选：额外解释（如用法说明、语法点等）

请以JSON格式返回单个卡片对象。
        `;

        console.log("⏳ 正在为单词生成卡片，请稍候...");

        const result = await genAI.models.generateContent({
            model: MODELNAME,
            contents: [
                {
                    role: "user",
                    parts: [{ text: wordPrompt }],
                },
            ],
            config: {
                temperature: 0.2,
                topK: 32,
                topP: 0.95,
                maxOutputTokens: 4096,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        word: { type: "string" },
                        reading: { type: "string" },
                        meaning: { type: "string" },
                        sentence: { type: "string" },
                        explanation: { type: "string" },
                    },
                },
            },
        });

        if (!result.text) {
            throw new Error("result.text is empty!");
        }

        const parsedData = JSON.parse(result.text);
        return {
            id: uuidv4(),
            word: parsedData.word || word,
            reading: parsedData.reading || "",
            meaning: parsedData.meaning || "",
            sentence: parsedData.sentence || context,
            explanation: parsedData.explanation || "",
            confirmed: false,
            isAIGenerated: false, // 手动创建的卡片
        };
    } catch (err) {
        console.error("调用 AI API 失败:", err);
        throw new Error("调用 AI API 失败");
    }
}
