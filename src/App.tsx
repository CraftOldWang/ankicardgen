import { useState, useEffect } from "react";
import FileSelector from "./components/FileSelector";
import SentenceList from "./components/SentenceList";
import CardEditor from "./components/CardEditor";
import ApiKeyModal from "./components/ApiKeyModal";
import { extractSentences } from "./utils/textProcessor";
import { generateCards, setApiKey } from "./utils/aiProcessor";
import { Card, Sentence } from "./types";
import { FiSettings } from "react-icons/fi";

function App() {
    // 状态管理
    const [filePath, setFilePath] = useState<string>("");
    const [fileContent, setFileContent] = useState<string>("");
    const [sentences, setSentences] = useState<Sentence[]>([]);
    const [selectedSentence, setSelectedSentence] = useState<Sentence | null>(
        null
    );
    const [cards, setCards] = useState<Card[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiKey, setApiKeyState] = useState<string>("");
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

    // 当文件内容变化时，提取句子
    useEffect(() => {
        if (fileContent) {
            try {
                const extractedSentences = extractSentences(fileContent);
                setSentences(extractedSentences);
            } catch (err) {
                setError(
                    `提取句子时出错: ${
                        err instanceof Error ? err.message : String(err)
                    }`
                );
            }
        } else {
            setSentences([]);
        }
    }, [fileContent]);

    // 处理文件选择
    const handleFileSelect = async () => {
        try {
            const result = await window.electronAPI.openFile();
            if (!result.canceled && result.filePath) {
                setFilePath(result.filePath);
                const fileResult = await window.electronAPI.readFile(
                    result.filePath
                );
                if (fileResult.success && fileResult.content) {
                    setFileContent(fileResult.content);
                    setError(null);
                } else {
                    setError(`读取文件失败: ${fileResult.error || "未知错误"}`);
                }
            }
        } catch (err) {
            setError(
                `选择文件时出错: ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        }
    };

    // 处理句子选择
    const handleSentenceSelect = (sentence: Sentence) => {
        setSelectedSentence(sentence);
    };

    // 处理AI生成卡片
    const handleGenerateCards = async () => {
        if (!selectedSentence) return;

        setIsProcessing(true);
        try {
            const generatedCards = await generateCards(selectedSentence.text);
            setCards(generatedCards);
            // 更新句子的处理状态
            setSentences(
                sentences.map((s) =>
                    s.id === selectedSentence.id ? { ...s, processed: true } : s
                )
            );
        } catch (err) {
            setError(
                `生成卡片时出错: ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        } finally {
            setIsProcessing(false);
        }
    };

    // 保存卡片到文件
    const handleSaveCards = async () => {
        if (!filePath || cards.length === 0) return;

        try {
            // 构建卡片内容
            const cardContent = cards
                .map((card) => {
                    return `${card.word}\n----\n${card.reading}\n${card.meaning}\n${card.sentence}\n\n\n`;
                })
                .join("\n");

            // 保存到新文件或追加到原文件
            const saveResult = await window.electronAPI.saveFile(
                filePath.replace(".md", "_cards.md")
            );
            if (!saveResult.canceled && saveResult.filePath) {
                await window.electronAPI.writeFile(
                    saveResult.filePath,
                    cardContent
                );
                setError(null);
            }
        } catch (err) {
            setError(
                `保存卡片时出错: ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        }
    };

    // 更新卡片
    const handleUpdateCard = (index: number, updatedCard: Card) => {
        setCards(cards.map((card, i) => (i === index ? updatedCard : card)));
    };

    // 处理API密钥设置
    const handleSaveApiKey = (newApiKey: string) => {
        setApiKeyState(newApiKey);
        setApiKey(newApiKey); // 设置到AI处理器中
        localStorage.setItem("gemini_api_key", newApiKey); // 保存到本地存储
    };

    // 从本地存储加载API密钥
    useEffect(() => {
        const savedApiKey = localStorage.getItem("gemini_api_key");
        if (savedApiKey) {
            setApiKeyState(savedApiKey);
            setApiKey(savedApiKey);
        }
    }, []);

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
            {/* 顶部导航栏 */}
            <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                        Anki卡片生成器
                    </h1>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsApiKeyModalOpen(true)}
                            className="flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            title="设置API密钥"
                        >
                            <FiSettings className="mr-1" />
                            API设置
                        </button>
                        <FileSelector
                            onFileSelect={handleFileSelect}
                            filePath={filePath}
                        />
                    </div>
                </div>
            </header>

            {/* 主内容区 */}
            <main className="flex-1 container mx-auto p-4 flex gap-4 overflow-hidden">
                {/* 错误提示 */}
                {error && (
                    <div className="absolute top-16 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md">
                        <p>{error}</p>
                        <button
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                            onClick={() => setError(null)}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* 左侧句子列表 */}
                <div className="w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                            句子列表
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        <SentenceList
                            sentences={sentences}
                            selectedSentence={selectedSentence}
                            onSentenceSelect={handleSentenceSelect}
                        />
                    </div>
                </div>

                {/* 右侧卡片编辑区 */}
                <div className="w-2/3 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                            卡片编辑
                        </h2>
                        <div className="flex gap-2">
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleGenerateCards}
                                disabled={!selectedSentence || isProcessing}
                            >
                                {isProcessing ? "处理中..." : "生成卡片"}
                            </button>
                            <button
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleSaveCards}
                                disabled={cards.length === 0}
                            >
                                保存卡片
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <CardEditor
                            sentence={selectedSentence}
                            cards={cards}
                            onUpdateCard={handleUpdateCard}
                        />
                    </div>
                </div>
            </main>

            {/* 底部状态栏 */}
            <footer className="bg-white dark:bg-gray-800 shadow-sm p-2 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>
                    已选择文件: {filePath || "无"} | 句子数量:{" "}
                    {sentences.length} | 已处理:{" "}
                    {sentences.filter((s) => s.processed).length}
                </p>
            </footer>

            {/* API密钥设置模态框 */}
            <ApiKeyModal
                isOpen={isApiKeyModalOpen}
                onClose={() => setIsApiKeyModalOpen(false)}
                onSave={handleSaveApiKey}
                currentApiKey={apiKey}
            />
        </div>
    );
}

export default App;
