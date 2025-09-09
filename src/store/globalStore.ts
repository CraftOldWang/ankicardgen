import { create } from "zustand";
import { AppState, FileData, Sentence, Card } from "../types";
import {
    generateCardForWord,
    generateCardsForSentence,
} from "../utils/aiProcessor";
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
    updateSentenceText: (sentenceId: string, newText: string) => void;
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

    // 队列控制
    pauseProcessing: () => void;
    resumeProcessing: () => void;
    isProcessingPaused: boolean;
    isCancelled: boolean;
    cancelProcessing: () => void;

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
    isProcessingPaused: false,
    isCancelled: false,

    // 页面导航
    setCurrentPage: (page) => {
        const currentState = get();

        // 如果从card-processor页面切换到其他页面
        if (
            currentState.currentPage === "card-processor" &&
            page !== "card-processor"
        ) {
            console.log(`🔄 从卡片处理页面切换到${page}页面，取消处理队列`);
            get().cancelProcessing();

            // 如果返回主页，立即重置取消状态，避免影响下次进入卡片处理页面
            if (page === "home") {
                console.log("🏠 返回主页，重置所有处理状态");
                setTimeout(() => {
                    set({
                        isCancelled: false,
                        isProcessingPaused: false,
                    });
                }, 500);
            }
        }

        // 如果进入卡片处理页面，确保状态已重置
        if (
            page === "card-processor" &&
            currentState.currentPage !== "card-processor"
        ) {
            console.log("🔄 进入卡片处理页面，重置处理状态");
            set({
                isCancelled: false,
                isProcessingPaused: false,
            });
        }

        set({ currentPage: page });
    },

    setApiKey: (apiKey) => set({ apiKey }),

    cancelProcessing: () => {
        console.log("🛑 取消所有队列处理");

        // 获取当前状态以便调试
        const currentState = get();
        console.log(
            `🔍 取消前状态: isCancelled=${currentState.isCancelled}, isProcessingPaused=${currentState.isProcessingPaused}`
        );

        // 设置取消标志，并同时重置暂停状态，确保暂停的队列也能正确退出
        set({
            isCancelled: true,
            isProcessingPaused: false, // 重置暂停状态，让暂停的队列能够继续执行到取消检查点
        });

        // 延迟重置取消状态，确保所有队列都有机会退出
        // 但如果我们马上要启动新队列，最好在启动前手动重置
        setTimeout(() => {
            console.log("⏱️ 重置取消状态 (3秒超时)");
            set({ isCancelled: false });
        }, 3000);
    },

    // 文件处理
    processFile: async (file) => {
        try {
            // 取消任何可能正在运行的队列
            get().cancelProcessing();

            // 重置暂停状态
            set({ isProcessingPaused: false });

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

            // 立即重置取消状态，确保队列能够启动
            set({ isCancelled: false });

            // 延迟启动队列，确保状态更新已经应用
            setTimeout(() => {
                get()._startProcessingQueue();
            }, 1000); // 增加延迟时间，确保取消状态已重置
        } catch (error) {
            console.error("处理文件时出错:", error);
            throw error;
        }
    },

    clearCurrentFile: () => {
        // 先取消所有正在运行的处理
        get().cancelProcessing();

        // 然后重置状态
        set({
            currentFile: null,
            selectedSentenceId: null,
            isCardReviewMode: false,
            currentCardIndex: 0,
            isProcessingPaused: false,
        });
    },

    // 句子管理
    setSelectedSentence: (sentenceId) =>
        set({ selectedSentenceId: sentenceId }),

    updateSentenceText: (sentenceId, newText) => {
        const { currentFile } = get();
        if (!currentFile) return;

        const updatedSentences = currentFile.sentences.map((sentence) =>
            sentence.id === sentenceId
                ? { ...sentence, text: newText.trim() }
                : sentence
        );

        set({
            currentFile: {
                ...currentFile,
                sentences: updatedSentences,
            },
        });
    },

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
        let apiKey = "AIzaSyA7f8cWd7uUW4vAO4Uh5ijndFvcQgSCZjw";

        const { currentFile } = get();
        if (!currentFile || !apiKey) return;
        console.log("开始手动添加卡片", sentenceId, word);
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

    // 队列控制
    pauseProcessing: () => {
        const currentState = get();
        console.log("🔴 队列处理已暂停 - 当前状态:", {
            isProcessingPaused: currentState.isProcessingPaused,
            willBe: true,
        });
        set({ isProcessingPaused: true });
    },

    resumeProcessing: () => {
        const currentState = get();
        console.log("🟢 队列处理已继续 - 当前状态:", {
            isProcessingPaused: currentState.isProcessingPaused,
            willBe: false,
        });
        set({ isProcessingPaused: false });
    },

    // 内部方法
    _processSentenceWithAI: async (sentenceId) => {
        let apiKey = "AIzaSyA7f8cWd7uUW4vAO4Uh5ijndFvcQgSCZjw";
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
            const aiCards = await generateCardsForSentence(
                sentence.text,
                apiKey
            );
            console.log("AI返回的卡片:", aiCards);
            // ⭐ 重要: API调用后获取最新状态
            const latestFile = get().currentFile;
            if (!latestFile) {
                console.log("文件已被清除，取消更新");
                return;
            }

            // 获取最新的句子状态
            const latestSentence = latestFile.sentences.find(
                (s) => s.id === sentenceId
            );
            if (!latestSentence) {
                console.log("句子已被删除，取消更新");
                return;
            }

            const cardsWithMeta: Card[] = aiCards.map((card, index) => ({
                ...card,
                id: `ai-card-${sentenceId}-${index}`,
                confirmed: false,
                isAIGenerated: true,
            }));

            const updatedSentences = latestFile.sentences.map((s) =>
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
                    ...latestFile,
                    sentences: updatedSentences,
                },
            });

            get()._updateSentenceConfirmedStatus(sentenceId);
        } catch (error) {
            console.error(`处理句子 ${sentenceId} 时出错:`, error);

            // 检查是否是API配额限制错误
            if (error instanceof Error && error.message.includes("429")) {
                console.log("🚫 检测到API配额限制，自动暂停队列处理");
                get().pauseProcessing();
            }

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
        // 确保只有一个队列在运行
        if (get().isCancelled) {
            console.log("❌ 任务已取消，不启动新队列");
            return;
        }

        const queueId = Date.now(); // 为队列生成唯一ID
        console.log(`🚀 启动任务队列 #${queueId}`);

        const { currentFile } = get();
        if (!currentFile) {
            console.error("❌ 无法启动任务队列：缺少文件");
            return;
        }
        console.log(
            `🚀 队列 #${queueId} 开始处理 ${currentFile.sentences.length} 个句子`
        );

        // 寻找第一个未处理且未失败的句子作为起点
        let startIndex = 0;
        for (let i = 0; i < currentFile.sentences.length; i++) {
            const sentence = currentFile.sentences[i];
            if (
                !sentence.processed &&
                !sentence.failed &&
                !sentence.isProcessing
            ) {
                startIndex = i;
                break;
            }
            // 如果所有句子都已处理或失败，仍从头开始
        }

        console.log(
            `🔍 队列 #${queueId} 从第 ${
                startIndex + 1
            } 个句子开始处理（跳过已处理）`
        );

        // 🔄 逐个处理句子（任务队列，避免并发）
        for (let i = startIndex; i < currentFile.sentences.length; i++) {
            // 检查是否被取消
            if (get().isCancelled) {
                console.log(`❌ 队列 #${queueId} 已被取消，退出处理`);
                return;
            }

            // 检查是否暂停
            while (get().isProcessingPaused) {
                // 检查是否被取消
                if (get().isCancelled) {
                    console.log(`❌ 队列 #${queueId} 在暂停时被取消，退出处理`);
                    return;
                }

                console.log(`⏸️ 队列 #${queueId} 处理已暂停，等待继续...`);
                // 减少等待时间，更频繁地检查取消状态
                await new Promise((resolve) => setTimeout(resolve, 500));

                // 重新获取当前状态，防止状态过期
                const currentState = get();
                if (!currentState.currentFile || currentState.isCancelled) {
                    console.log(
                        `❌ 队列 #${queueId} 被取消或文件已被清除，停止队列处理`
                    );
                    return;
                }
            }

            // 检查是否被取消（再次检查，以防在上面的while循环结束后被取消）
            if (get().isCancelled) {
                console.log(`❌ 队列 #${queueId} 已被取消，退出处理`);
                return;
            }

            // 重新获取当前文件状态，因为可能在暂停期间发生变化
            const updatedState = get();
            if (
                !updatedState.currentFile ||
                i >= updatedState.currentFile.sentences.length
            ) {
                console.log(`❌ 队列 #${queueId} 文件状态已变化，停止队列处理`);
                return;
            }

            const sentence = updatedState.currentFile.sentences[i];

            // 跳过已处理或失败的句子
            if (
                sentence.processed ||
                (sentence.failed && !sentence.isProcessing)
            ) {
                console.log(
                    `⏭️ 队列 #${queueId} 跳过已处理或失败的句子 ${
                        i + 1
                    }: "${sentence.text.substring(0, 30)}..."`
                );
                continue;
            }

            console.log(
                `📋 队列 #${queueId} 进度: ${i + 1}/${
                    updatedState.currentFile.sentences.length
                }`
            );
            console.log(
                `🎯 队列 #${queueId} 处理句子: "${sentence.text.substring(
                    0,
                    30
                )}..."`
            );

            try {
                // 检查是否被取消
                if (get().isCancelled) {
                    console.log(`❌ 队列 #${queueId} 已被取消，退出处理`);
                    return;
                }

                await get()._processSentenceWithAI(sentence.id);
                console.log(`✅ 队列 #${queueId} 句子 ${i + 1} 处理完成`);

                // 在延迟期间也检查暂停和取消状态
                if (i < updatedState.currentFile.sentences.length - 1) {
                    console.log(`⏱️ 队列 #${queueId} 等待2秒避免API限流...`);
                    for (let delay = 0; delay < 2000; delay += 500) {
                        if (get().isProcessingPaused) {
                            console.log(
                                `⏸️ 队列 #${queueId} 在延迟期间检测到暂停`
                            );
                            break;
                        }

                        if (get().isCancelled) {
                            console.log(
                                `❌ 队列 #${queueId} 在延迟期间被取消，退出处理`
                            );
                            return;
                        }

                        await new Promise((resolve) =>
                            setTimeout(resolve, 500)
                        );
                    }
                }
            } catch (error) {
                console.error(
                    `❌ 队列 #${queueId} 处理失败，句子 ${i + 1}:`,
                    error
                );

                // 检查是否是API配额限制错误
                if (error instanceof Error && error.message.includes("429")) {
                    console.log(
                        `🚫 队列 #${queueId} 检测到API配额限制，暂停队列处理`
                    );
                    get().pauseProcessing();
                    console.log(
                        "💡 建议：等待24小时后配额重置，或升级到付费计划"
                    );
                    break; // 停止处理更多句子
                }

                // 检查是否被取消
                if (get().isCancelled) {
                    console.log(`❌ 队列 #${queueId} 已被取消，退出处理`);
                    return;
                }

                // 即使失败也继续处理下一个句子（除非是配额限制）
                console.log(`🔄 队列 #${queueId} 继续处理下一个句子...`);
            }
        }

        console.log(`🎉 队列 #${queueId} 处理完成！`);
    },
}));
