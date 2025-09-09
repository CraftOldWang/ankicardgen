import { FC, useState, useEffect } from "react";
import {
    FiArrowLeft,
    FiArrowRight,
    FiCheck,
    FiEdit2,
    FiSave,
    FiX,
} from "react-icons/fi";
import { useAppStore } from "../store/globalStore";
import { Card } from "../types";

const CardReviewPage: FC = () => {
    const {
        currentFile,
        setCardReviewMode,
        confirmCard,
        updateCard,
        goToNextUnconfirmedCard,
        currentCardIndex,
        exportConfirmedCards,
    } = useAppStore();

    const [isEditing, setIsEditing] = useState(false);
    const [editingCard, setEditingCard] = useState<Card | null>(null);

    // 获取所有未确认的卡片
    const unconfirmedCards =
        currentFile?.sentences
            .flatMap((s) => s.cards)
            .filter((card) => !card.confirmed) || [];

    const currentCard = unconfirmedCards[currentCardIndex];

    useEffect(() => {
        if (unconfirmedCards.length === 0) {
            // 所有卡片都已确认，退出确认模式
            setCardReviewMode(false);
        }
    }, [unconfirmedCards.length, setCardReviewMode]);

    const handleExitReview = () => {
        setCardReviewMode(false);
    };

    const handleConfirmCard = () => {
        if (!currentCard) return;
        confirmCard(currentCard.id);
        goToNextUnconfirmedCard();
    };

    const handleSkipCard = () => {
        goToNextUnconfirmedCard();
    };

    const handleEditCard = () => {
        if (!currentCard) return;
        setEditingCard({ ...currentCard });
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        if (!editingCard) return;
        updateCard(editingCard.id, editingCard);
        setIsEditing(false);
        setEditingCard(null);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingCard(null);
    };

    const handleExportCards = () => {
        try {
            const markdownContent = exportConfirmedCards();
            if (!markdownContent) {
                alert("没有已确认的卡片可导出");
                return;
            }

            // 创建下载链接
            const blob = new Blob([markdownContent], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download =
                `${currentFile?.filename.replace(".md", "")}_cards.md` ||
                "anki_cards.md";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // alert("卡片已导出！");
        } catch (error) {
            console.error("导出失败:", error);
            alert("导出失败，请重试");
        }
    };

    if (!currentFile) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">没有文件数据</p>
            </div>
        );
    }

    if (unconfirmedCards.length === 0) {
        return (


            // <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">

            <div className="flex-1 flex items-center justify-center">

                <div className="text-center">
                    <div className="mb-6">
                        <FiCheck className="mx-auto text-6xl text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                            所有卡片已确认！
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            您已经确认了所有生成的卡片
                        </p>
                    </div>

                    <div className="space-x-4">
                        <button
                            onClick={handleExitReview}
                            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            返回卡片处理
                        </button>
                        <button
                            onClick={handleExportCards}
                            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                            导出卡片
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        // <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col flex-1">

            {/* 头部导航 */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleExitReview}
                        className="flex items-center text-blue-500 hover:text-blue-600"
                    >
                        <FiArrowLeft className="mr-2" />
                        退出确认模式
                    </button>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        卡片 {currentCardIndex + 1} / {unconfirmedCards.length}
                    </div>

                    <button
                        onClick={handleExportCards}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                        导出已确认卡片
                    </button>
                </div>
            </div>

            {/* 卡片显示区 */}
            <div className="flex-1 flex items-center justify-center p-8">
                {currentCard && (
                    <div className="max-w-2xl w-full">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                            {isEditing && editingCard ? (
                                // 编辑模式
                                <div>
                                    <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
                                        编辑卡片
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                单词/短语
                                            </label>
                                            <input
                                                type="text"
                                                value={editingCard.word}
                                                onChange={(e) =>
                                                    setEditingCard({
                                                        ...editingCard,
                                                        word: e.target.value,
                                                    })
                                                }
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="输入单词或短语"
                                                aria-label="单词或短语"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                读音
                                            </label>
                                            <input
                                                type="text"
                                                value={editingCard.reading}
                                                onChange={(e) =>
                                                    setEditingCard({
                                                        ...editingCard,
                                                        reading: e.target.value,
                                                    })
                                                }
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="输入读音"
                                                aria-label="读音"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                中文意思
                                            </label>
                                            <textarea
                                                value={editingCard.meaning}
                                                onChange={(e) =>
                                                    setEditingCard({
                                                        ...editingCard,
                                                        meaning: e.target.value,
                                                    })
                                                }
                                                rows={3}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="输入中文意思"
                                                aria-label="中文意思"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                例句
                                            </label>
                                            <textarea
                                                value={editingCard.sentence}
                                                onChange={(e) =>
                                                    setEditingCard({
                                                        ...editingCard,
                                                        sentence:
                                                            e.target.value,
                                                    })
                                                }
                                                rows={2}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="输入例句"
                                                aria-label="例句"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                额外解释（可选）
                                            </label>
                                            <textarea
                                                value={
                                                    editingCard.explanation ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setEditingCard({
                                                        ...editingCard,
                                                        explanation:
                                                            e.target.value,
                                                    })
                                                }
                                                rows={3}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="输入额外解释（可选）"
                                                aria-label="额外解释"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex space-x-4 mt-6">
                                        <button
                                            onClick={handleSaveEdit}
                                            className="flex items-center px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                        >
                                            <FiSave className="mr-2" />
                                            保存
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="flex items-center px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                        >
                                            <FiX className="mr-2" />
                                            取消
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // 查看模式
                                <div>
                                    <div className="text-center mb-8">
                                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                                            {currentCard.word}
                                        </h2>
                                        {currentCard.reading && (
                                            <p className="text-xl text-blue-600 dark:text-blue-400 mb-4">
                                                {currentCard.reading}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                中文意思
                                            </h4>
                                            <p className="text-lg text-gray-800 dark:text-white">
                                                {currentCard.meaning}
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                例句
                                            </h4>
                                            <p className="text-gray-700 dark:text-gray-300">
                                                {currentCard.sentence}
                                            </p>
                                        </div>

                                        {currentCard.explanation && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                    额外解释
                                                </h4>
                                                <p className="text-gray-600 dark:text-gray-400 italic">
                                                    {currentCard.explanation}
                                                </p>
                                            </div>
                                        )}

                                        <div className="text-center text-sm text-gray-400">
                                            {currentCard.isAIGenerated
                                                ? "AI生成"
                                                : "手动创建"}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 操作按钮 */}
                        {!isEditing && (
                            <div className="flex justify-center space-x-4 mt-6">
                                <button
                                    onClick={handleEditCard}
                                    className="flex items-center px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                    <FiEdit2 className="mr-2" />
                                    编辑
                                </button>

                                <button
                                    onClick={handleSkipCard}
                                    className="flex items-center px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                                >
                                    <FiArrowRight className="mr-2" />
                                    跳过
                                </button>

                                <button
                                    onClick={handleConfirmCard}
                                    className="flex items-center px-8 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                >
                                    <FiCheck className="mr-2" />
                                    确认
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CardReviewPage;
