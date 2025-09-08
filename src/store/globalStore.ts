import { create } from "zustand";
import { AppState, FileData, Sentence, Card } from "../types";
import { generateCardForWord, generateCardsForSentence } from "../utils/aiProcessor";
import { extractSentences } from "../utils/textProcessor";

interface AppStore extends AppState {
    // 页面导航
    setCurrentPage: (page: AppState["currentPage"]) => void;

    // API密钥管理
    setApiKey: (apiKey: string) => void;

    // 文件处理
    processFile: (file: File) => Promise<void>;
    clearCurrentFile: () => void;

    // 句子管理
    setSelectedSentence: (sentenceId: string | null) => void;
    retrySentenceProcessing: (sentenceId: string) => Promise<void>;

    // 卡片管理
    addManualCard: (sentenceId: string, word: string) => Promise<void>;
    updateCard: (cardId: string, updates: Partial<Card>) => void;
    confirmCard: (cardId: string) => void;
    unconfirmCard: (cardId: string) => void;
    deleteCard: (cardId: string) => void;

    // 卡片确认模式
    setCardReviewMode: (enabled: boolean) => void;
    goToNextUnconfirmedCard: () => void;

    // 导出功能
    exportConfirmedCards: () => string;

    // 内部方法
    _processSentenceWithAI: (sentenceId: string) => Promise<void>;
    _startProcessingQueue: () => Promise<void>;
    _updateSentenceConfirmedStatus: (sentenceId: string) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
    // 初始状态
    currentPage: "home",
    apiKey: "",
    currentFile: null,
    selectedSentenceId: null,
    isCardReviewMode: false,
    currentCardIndex: 0,

    // 页面导航
    setCurrentPage: (page) => set({ currentPage: page }),

    // API密钥管理
    setApiKey: (apiKey) => set({ apiKey }),

    // 文件处理
    processFile: async (file) => {
        try {
            const content = await file.text();
            const extractedSentences = extractSentences(content);

            const sentences: Sentence[] = extractedSentences.map(
                (text, index) => ({
                    id: `sentence-${index}`,
                    text,
                    processed: false,
                    cards: [],
                    confirmed: false,
                    isProcessing: true,
                })
            );

            const fileData: FileData = {
                filename: file.name,
                filepath: file.name, // 在桌面应用中可能需要完整路径
                sentences,
            };

            set({
                currentFile: fileData,
                currentPage: "card-processor",
                selectedSentenceId: sentences[0]?.id || null,
            });

            // 🚀 启动任务队列（顺序处理，避免并发）
            console.log(`📋 开始顺序处理 ${sentences.length} 个句子...`);
            get()._startProcessingQueue();
        } catch (error) {
            console.error("处理文件时出错:", error);
            throw error;
        }
    },

    clearCurrentFile: () =>
        set({
            currentFile: null,
            selectedSentenceId: null,
            isCardReviewMode: false,
            currentCardIndex: 0,
        }),

    // 句子管理
    setSelectedSentence: (sentenceId) =>
        set({ selectedSentenceId: sentenceId }),

    retrySentenceProcessing: async (sentenceId) => {
        const { currentFile } = get();
        if (!currentFile) return;

        // 重置句子状态
        const updatedSentences = currentFile.sentences.map((sentence) =>
            sentence.id === sentenceId
                ? { ...sentence, isProcessing: true, failed: false }
                : sentence
        );

        set({
            currentFile: {
                ...currentFile,
                sentences: updatedSentences,
            },
        });

        // 重新处理
        await get()._processSentenceWithAI(sentenceId);
    },

    // 卡片管理
    addManualCard: async (sentenceId, word) => {
        const { currentFile, apiKey } = get();
        if (!currentFile || !apiKey) return;

        const sentence = currentFile.sentences.find((s) => s.id === sentenceId);
        if (!sentence) return;

        try {
            // 调用单词制卡API
            const newCard = await generateCardForWord(
                word,
                sentence.text,
                apiKey
            );
            const cardWithMeta: Card = {
                ...newCard,
                id: `manual-card-${Date.now()}`,
                confirmed: false,
                isAIGenerated: false,
            };

            const updatedSentences = currentFile.sentences.map((s) =>
                s.id === sentenceId
                    ? { ...s, cards: [...s.cards, cardWithMeta] }
                    : s
            );

            set({
                currentFile: {
                    ...currentFile,
                    sentences: updatedSentences,
                },
            });

            get()._updateSentenceConfirmedStatus(sentenceId);
        } catch (error) {
            console.error("创建手动卡片时出错:", error);
            throw error;
        }
    },

    updateCard: (cardId, updates) => {
        const { currentFile } = get();
        if (!currentFile) return;

        const updatedSentences = currentFile.sentences.map((sentence) => ({
            ...sentence,
            cards: sentence.cards.map((card) =>
                card.id === cardId ? { ...card, ...updates } : card
            ),
        }));

        set({
            currentFile: {
                ...currentFile,
                sentences: updatedSentences,
            },
        });

        // 更新相关句子的确认状态
        const sentenceWithCard = updatedSentences.find((s) =>
            s.cards.some((c) => c.id === cardId)
        );
        if (sentenceWithCard) {
            get()._updateSentenceConfirmedStatus(sentenceWithCard.id);
        }
    },

    confirmCard: (cardId) => {
        get().updateCard(cardId, { confirmed: true });
    },

    unconfirmCard: (cardId) => {
        get().updateCard(cardId, { confirmed: false });
    },

    deleteCard: (cardId) => {
        const { currentFile } = get();
        if (!currentFile) return;

        const updatedSentences = currentFile.sentences.map((sentence) => ({
            ...sentence,
            cards: sentence.cards.filter((card) => card.id !== cardId),
        }));

        set({
            currentFile: {
                ...currentFile,
                sentences: updatedSentences,
            },
        });

        // 更新相关句子的确认状态
        const sentenceWithCard = updatedSentences.find((s) =>
            s.cards.some((c) => c.id === cardId)
        );
        if (sentenceWithCard) {
            get()._updateSentenceConfirmedStatus(sentenceWithCard.id);
        }
    },

    // 卡片确认模式
    setCardReviewMode: (enabled) => set({ isCardReviewMode: enabled }),

    goToNextUnconfirmedCard: () => {
        const { currentFile, currentCardIndex } = get();
        if (!currentFile) return;

        const allCards = currentFile.sentences.flatMap((s) => s.cards);
        const unconfirmedCards = allCards.filter((card) => !card.confirmed);

        if (unconfirmedCards.length === 0) {
            set({ isCardReviewMode: false });
            return;
        }

        const nextIndex = (currentCardIndex + 1) % unconfirmedCards.length;
        set({ currentCardIndex: nextIndex });
    },

    // 导出功能
    exportConfirmedCards: () => {
        const { currentFile } = get();
        if (!currentFile) return "";

        const confirmedCards = currentFile.sentences
            .flatMap((s) => s.cards)
            .filter((card) => card.confirmed);

        return confirmedCards
            .map((card) => {
                const lines = [card.word];
                lines.push("----"); // 添加四个横杠作为分隔符
                if (card.reading) lines.push(card.reading);
                if (card.meaning) lines.push(card.meaning);
                if (card.sentence) lines.push(card.sentence);
                if (card.explanation) lines.push(card.explanation);
                return lines.join("\n");
            })
            .join("\n\n\n\n\n");
    },

    // 内部方法
    _processSentenceWithAI: async (sentenceId) => {
        let apiKey = "AIzaSyA7f8cWd7uUW4vAO4Uh5ijndFvcQgSCZjw"
        const { currentFile } = get();
        console.log("API密钥:", apiKey ? "已设置" : "未设置");
        console.log("当前文件:", currentFile ? "已加载" : "未加载");
        

        if (!currentFile || !apiKey) {
            console.error("缺少必要数据:", {
                hasFile: !!currentFile,
                hasApiKey: !!apiKey,
            });
            return;
        }

        const sentence = currentFile.sentences.find((s) => s.id === sentenceId);
        if (!sentence) {
            console.error("找不到句子:", sentenceId);
            return;
        }

        try {
            console.log("开始制卡");
            const aiCards = await generateCardsForSentence(sentence.text, apiKey);
            console.log("AI返回的卡片:", aiCards);
            const cardsWithMeta: Card[] = aiCards.map((card, index) => ({
                ...card,
                id: `ai-card-${sentenceId}-${index}`,
                confirmed: false,
                isAIGenerated: true,
            }));

            const updatedSentences = currentFile.sentences.map((s) =>
                s.id === sentenceId
                    ? {
                          ...s,
                          cards: cardsWithMeta,
                          processed: true,
                          isProcessing: false,
                      }
                    : s
            );

            set({
                currentFile: {
                    ...currentFile,
                    sentences: updatedSentences,
                },
            });

            get()._updateSentenceConfirmedStatus(sentenceId);
        } catch (error) {
            console.error(`处理句子 ${sentenceId} 时出错:`, error);

            const updatedSentences = currentFile.sentences.map((s) =>
                s.id === sentenceId
                    ? { ...s, isProcessing: false, failed: true }
                    : s
            );

            set({
                currentFile: {
                    ...currentFile,
                    sentences: updatedSentences,
                },
            });
        }
    },

    _updateSentenceConfirmedStatus: (sentenceId) => {
        const { currentFile } = get();
        if (!currentFile) return;

        const updatedSentences = currentFile.sentences.map((sentence) => {
            if (sentence.id === sentenceId) {
                const allCardsConfirmed =
                    sentence.cards.length > 0 &&
                    sentence.cards.every((card) => card.confirmed);
                return { ...sentence, confirmed: allCardsConfirmed };
            }
            return sentence;
        });

        set({
            currentFile: {
                ...currentFile,
                sentences: updatedSentences,
            },
        });
    },

    // 🚀 任务队列处理方法（顺序处理，避免并发）
    _startProcessingQueue: async () => {
        const { currentFile } = get();
        if (!currentFile  ) {
            console.error("❌ 无法启动任务队列：缺少文件或API密钥");
            return;
        }
        console.log(
            `🚀 启动任务队列，处理 ${currentFile.sentences.length} 个句子`
        );

        // 🔄 逐个处理句子（任务队列，避免并发）
        for (let i = 0; i < currentFile.sentences.length; i++) {
            const sentence = currentFile.sentences[i];
            console.log(
                `📋 队列进度: ${i + 1}/${currentFile.sentences.length}`
            );
            console.log(`🎯 处理句子: "${sentence.text.substring(0, 30)}..."`);

            try {
                await get()._processSentenceWithAI(sentence.id);
                console.log(`✅ 句子 ${i + 1} 处理完成`);

                // 添加延迟避免API限流（除了最后一个句子）
                if (i < currentFile.sentences.length - 1) {
                    console.log("⏱️ 等待2秒避免API限流...");
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            } catch (error) {
                console.error(`❌ 队列处理失败，句子 ${i + 1}:`, error);
                // 即使失败也继续处理下一个句子
                console.log("🔄 继续处理下一个句子...");
            }
        }

        console.log("🎉 任务队列处理完成！");
    },
}));
