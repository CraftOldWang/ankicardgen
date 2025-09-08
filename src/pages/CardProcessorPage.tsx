import { FC, useState, useEffect, useRef } from "react";
import {
    FiArrowLeft,
    FiPlus,
    FiRefreshCw,
    FiCheck,
    FiClock,
    FiX,
    FiChevronRight,
    FiChevronDown,
} from "react-icons/fi";
import { useAppStore } from "../store/globalStore";

const CardProcessorPage: FC = () => {
    const {
        currentFile,
        selectedSentenceId,
        setCurrentPage,
        setSelectedSentence,
        retrySentenceProcessing,
        addManualCard,
        confirmCard,
        unconfirmCard,
        updateCard,
        setCardReviewMode,
    } = useAppStore();

    const [expandedSentences, setExpandedSentences] = useState<Set<string>>(
        new Set()
    );
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [newCardWord, setNewCardWord] = useState("");
    const [selectedText, setSelectedText] = useState("");
    const [selectionModalOpen, setSelectionModalOpen] = useState(false);
    // 添加状态用于跟踪鼠标位置，以便弹出框显示在选中文本附近
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    // 添加引用用于追踪弹出框元素
    const popupRef = useRef<HTMLDivElement>(null);

    // 侧边栏宽度调整相关状态
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        // 从本地存储获取上次保存的宽度，如果没有则使用默认值25%
        const savedWidth = localStorage.getItem("sidebarWidth");
        return savedWidth ? parseFloat(savedWidth) : 25;
    });
    const [isDragging, setIsDragging] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // 处理拖拽开始
    const handleDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        document.addEventListener("mousemove", handleDragMove);
        document.addEventListener("mouseup", handleDragEnd);
    };

    // 处理拖拽移动
    const handleDragMove = (e: MouseEvent) => {
        if (isDragging && sidebarRef.current) {
            const containerWidth =
                sidebarRef.current.parentElement?.clientWidth || 1000;
            const newWidth = (e.clientX / containerWidth) * 100;
            // 限制最小和最大宽度
            const clampedWidth = Math.max(15, Math.min(50, newWidth));
            setSidebarWidth(clampedWidth);
        }
    };

    // 处理拖拽结束
    const handleDragEnd = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleDragMove);
        document.removeEventListener("mouseup", handleDragEnd);
        // 保存当前宽度到本地存储
        localStorage.setItem("sidebarWidth", sidebarWidth.toString());
    };

    // 组件卸载时清理事件监听器
    useEffect(() => {
        // 阻止拖拽过程中的默认行为
        const preventDefaultDrag = (e: Event) => {
            if (isDragging) {
                e.preventDefault();
            }
        };

        if (isDragging) {
            document.addEventListener("selectstart", preventDefaultDrag);
            document.addEventListener("dragstart", preventDefaultDrag);
        }

        return () => {
            document.removeEventListener("mousemove", handleDragMove);
            document.removeEventListener("mouseup", handleDragEnd);
            document.removeEventListener("selectstart", preventDefaultDrag);
            document.removeEventListener("dragstart", preventDefaultDrag);
        };
    }, [isDragging]);

    if (!currentFile) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">没有文件数据</p>
            </div>
        );
    }

    const selectedSentence = currentFile.sentences.find(
        (s) => s.id === selectedSentenceId
    );

    const handleBackToHome = () => {
        setCurrentPage("home");
    };

    const toggleSentenceExpansion = (sentenceId: string) => {
        const newExpanded = new Set(expandedSentences);
        if (newExpanded.has(sentenceId)) {
            newExpanded.delete(sentenceId);
        } else {
            newExpanded.add(sentenceId);
        }
        setExpandedSentences(newExpanded);
    };

    const handleTextSelection = (e: React.MouseEvent) => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            setSelectedText(selection.toString().trim());

            // 获取选中文本的位置，将弹出框定位在附近
            const selectionRange = selection.getRangeAt(0);
            const selectionRect = selectionRange.getBoundingClientRect();

            // 计算弹出框位置，确保不会超出屏幕边界
            const popupWidth = 320; // 弹出框宽度
            const popupHeight = 200; // 弹出框估计高度
            const margin = 10; // 边距

            // 优先尝试在选中文本的右侧显示
            let x = selectionRect.right + margin;
            let y = selectionRect.top;

            // 如果右侧空间不足，尝试左侧
            if (x + popupWidth > window.innerWidth) {
                x = Math.max(margin, selectionRect.left - popupWidth - margin);
            }

            // 如果底部空间不足，向上调整
            if (y + popupHeight > window.innerHeight) {
                y = Math.max(margin, window.innerHeight - popupHeight - margin);
            }

            setPopupPosition({ x, y });
            setSelectionModalOpen(true);

            // 设置点击外部关闭弹出框
            setTimeout(() => {
                document.addEventListener("mousedown", handleClickOutside);
            }, 0);
        }
    };

    // 处理点击弹出框外部
    const handleClickOutside = (e: MouseEvent) => {
        if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
            setSelectionModalOpen(false);
            document.removeEventListener("mousedown", handleClickOutside);
        }
    };

    // 处理鼠标移动，超出一定距离后自动关闭弹出框
    const handleMouseMove = (e: MouseEvent) => {
        if (popupRef.current && selectionModalOpen) {
            const popupRect = popupRef.current.getBoundingClientRect();
            const popupCenterX = popupRect.left + popupRect.width / 2;
            const popupCenterY = popupRect.top + popupRect.height / 2;

            // 计算鼠标与弹出框中心点的距离
            const distance = Math.sqrt(
                Math.pow(e.clientX - popupCenterX, 2) +
                    Math.pow(e.clientY - popupCenterY, 2)
            );

            // 如果距离超过300像素，自动关闭弹出框
            const closeThreshold = 300;
            if (distance > closeThreshold) {
                setSelectionModalOpen(false);
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mousedown", handleClickOutside);
            }
        }
    };

    // 当弹出框打开时，添加鼠标移动监听
    useEffect(() => {
        if (selectionModalOpen) {
            document.addEventListener("mousemove", handleMouseMove);
        } else {
            document.removeEventListener("mousemove", handleMouseMove);
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
        };
    }, [selectionModalOpen]);

    // 组件卸载时移除事件监听器
    useEffect(() => {
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    const handleCreateCardForSelection = async () => {
        if (!selectedSentenceId || !selectedText) return;

        try {
            await addManualCard(selectedSentenceId, selectedText);
            setSelectionModalOpen(false);
            setSelectedText("");
            // 移除点击外部的事件监听器
            document.removeEventListener("mousedown", handleClickOutside);
        } catch (error) {
            console.error("创建卡片失败:", error);
        }
    };

    const handleAddManualCard = async () => {
        if (!selectedSentenceId || !newCardWord.trim()) return;

        try {
            await addManualCard(selectedSentenceId, newCardWord.trim());
            setNewCardWord("");
            setIsAddingCard(false);
        } catch (error) {
            console.error("创建卡片失败:", error);
        }
    };

    // 批量确认当前句子下的所有卡片
    const confirmAllCardsInSentence = () => {
        if (!selectedSentenceId || !selectedSentence || !currentFile) return;
        
        // 获取当前句子下所有未确认的卡片
        const unconfirmedCards = selectedSentence.cards.filter(card => !card.confirmed);
        
        // 确认所有卡片
        unconfirmedCards.forEach(card => {
            confirmCard(card.id);
        });

        // 找到当前句子的索引
        const currentSentenceIndex = currentFile.sentences.findIndex(
            s => s.id === selectedSentenceId
        );
        
        // 如果不是最后一个句子，跳转到下一个句子
        if (currentSentenceIndex < currentFile.sentences.length - 1) {
            const nextSentence = currentFile.sentences[currentSentenceIndex + 1];
            setSelectedSentence(nextSentence.id);
        }
    };

    const getSentenceStatusIcon = (sentence: any) => {
        if (sentence.failed) {
            return <FiX className="text-red-500" size={16} />;
        }
        if (sentence.isProcessing) {
            return (
                <FiClock className="text-yellow-500 animate-spin" size={16} />
            );
        }
        if (sentence.confirmed) {
            return <FiCheck className="text-green-500" size={16} />;
        }
        return <FiClock className="text-gray-400" size={16} />;
    };

    const getCardStatusIcon = (card: any) => {
        if (card.confirmed) {
            return <FiCheck className="text-green-500" size={14} />;
        }
        return <FiClock className="text-gray-400" size={14} />;
    };

    const truncateText = (text: string, maxLength: number = 40) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    return (
        <div
            className={`h-screen flex bg-gray-50 dark:bg-gray-900 ${
                isDragging ? "select-none" : ""
            }`}
        >
            {/* <div className="flex flex-1"> */}

            {/* 左侧树状列表 */}
            <div
                ref={sidebarRef}
                className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${
                    isDragging ? "pointer-events-none" : ""
                }`}
                style={{ width: `${sidebarWidth}%` }}
            >
                {/* 头部 */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleBackToHome}
                        className="flex items-center text-blue-500 hover:text-blue-600 mb-3"
                    >
                        <FiArrowLeft className="mr-2" />
                        返回主页
                    </button>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                        {currentFile.filename}
                    </h2>
                </div>

                {/* 树状列表 */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-2">
                        {currentFile.sentences.map((sentence) => (
                            <div key={sentence.id} className="mb-2">
                                {/* 句子节点 */}
                                <div
                                    className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                                        selectedSentenceId === sentence.id
                                            ? "bg-blue-100 dark:bg-blue-900"
                                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                    onClick={() =>
                                        setSelectedSentence(sentence.id)
                                    }
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSentenceExpansion(
                                                sentence.id
                                            );
                                        }}
                                        className="mr-2 p-1"
                                    >
                                        {expandedSentences.has(sentence.id) ? (
                                            <FiChevronDown size={14} />
                                        ) : (
                                            <FiChevronRight size={14} />
                                        )}
                                    </button>

                                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                                        {truncateText(sentence.text)}
                                    </span>

                                    <div className="ml-2 flex items-center space-x-1">
                                        {getSentenceStatusIcon(sentence)}
                                        {sentence.failed && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    retrySentenceProcessing(
                                                        sentence.id
                                                    );
                                                }}
                                                className="p-1 text-blue-500 hover:text-blue-600"
                                                title="重试处理"
                                            >
                                                <FiRefreshCw size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* 卡片节点 */}
                                {expandedSentences.has(sentence.id) && (
                                    <div className="ml-6 mt-1 space-y-1">
                                        {sentence.cards.map((card) => (
                                            <div
                                                key={card.id}
                                                className="flex items-center p-2 text-xs bg-gray-50 dark:bg-gray-700 rounded"
                                            >
                                                <span className="flex-1 text-gray-600 dark:text-gray-400">
                                                    {truncateText(
                                                        card.word,
                                                        20
                                                    )}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        card.confirmed
                                                            ? unconfirmCard(
                                                                  card.id
                                                              )
                                                            : confirmCard(
                                                                  card.id
                                                              )
                                                    }
                                                    className="ml-2"
                                                >
                                                    {getCardStatusIcon(card)}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 底部操作 */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setCardReviewMode(true)}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                    >
                        进入卡片确认模式
                    </button>
                </div>
            </div>

            {/* 拖拽调整手柄 */}
            <div
                className={`w-1 hover:w-2 transition-all duration-200 cursor-col-resize relative z-10 flex items-center justify-center ${
                    isDragging
                        ? "bg-blue-500 dark:bg-blue-700 w-2"
                        : "bg-gray-300 dark:bg-gray-600 hover:bg-blue-400 dark:hover:bg-blue-600"
                }`}
                onMouseDown={handleDragStart}
            >
                {/* 拖拽指示符 */}
                <div className="absolute w-1 h-8 rounded-full bg-gray-400 dark:bg-gray-500 opacity-0 group-hover:opacity-100"></div>

                {/* 拖拽过程中的覆盖层，防止选中其他元素 */}
                {isDragging && (
                    <div className="fixed inset-0 z-50 cursor-col-resize" />
                )}
            </div>

            {/* 右侧详情区 */}
            <div className="flex-1 flex flex-col overflow-hidden p-6">
                {selectedSentence ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* 句子显示区 */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                当前句子
                            </h3>
                            <p
                                className="text-gray-700 dark:text-gray-300 leading-relaxed cursor-text select-text"
                                onMouseUp={(e) => handleTextSelection(e)}
                            >
                                {selectedSentence.text}
                            </p>
                        </div>

                        {/* 卡片列表 */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex-1 flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    卡片列表 ({selectedSentence.cards.length})
                                </h3>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={confirmAllCardsInSentence}
                                        className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                        title="确认所有卡片"
                                    >
                                        <FiCheck className="mr-1" size={14} />
                                        全部确认
                                    </button>
                                    <button
                                        onClick={() => setIsAddingCard(true)}
                                        className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                    >
                                        <FiPlus className="mr-1" size={14} />
                                        添加卡片
                                    </button>
                                </div>
                            </div>

                            {/* 手动添加卡片表单 */}
                            {isAddingCard && (
                                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                                    <input
                                        type="text"
                                        value={newCardWord}
                                        onChange={(e) =>
                                            setNewCardWord(e.target.value)
                                        }
                                        placeholder="输入要制卡的单词或短语"
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                        onKeyPress={(e) =>
                                            e.key === "Enter" &&
                                            handleAddManualCard()
                                        }
                                    />
                                    <div className="mt-2 flex space-x-2">
                                        <button
                                            onClick={handleAddManualCard}
                                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            创建
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsAddingCard(false);
                                                setNewCardWord("");
                                            }}
                                            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                        >
                                            取消
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 卡片网格 */}
                            <div className="overflow-y-auto flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedSentence.cards.map((card) => (
                                        <div
                                            key={card.id}
                                            className={`p-4 border-2 rounded-lg transition-colors ${
                                                card.confirmed
                                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                    : "border-gray-200 dark:border-gray-600"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-semibold text-gray-800 dark:text-white">
                                                    {card.word}
                                                </h4>
                                                <button
                                                    onClick={() =>
                                                        card.confirmed
                                                            ? unconfirmCard(card.id)
                                                            : confirmCard(card.id)
                                                    }
                                                    className={`p-1 rounded ${
                                                        card.confirmed
                                                            ? "text-green-500 hover:text-green-600"
                                                            : "text-gray-400 hover:text-gray-600"
                                                    }`}
                                                    title={
                                                        card.confirmed
                                                            ? "取消确认"
                                                            : "确认卡片"
                                                    }
                                                >
                                                    <FiCheck size={18} />
                                                </button>
                                            </div>

                                            {card.reading && (
                                                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                                                    {card.reading}
                                                </p>
                                            )}

                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                {card.meaning}
                                            </p>

                                            {card.explanation && (
                                                <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                                                    {card.explanation}
                                                </p>
                                            )}

                                            <div className="mt-2 text-xs text-gray-400">
                                                {card.isAIGenerated
                                                    ? "AI生成"
                                                    : "手动创建"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedSentence.cards.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    {selectedSentence.isProcessing ? (
                                        <div className="flex items-center justify-center">
                                            <FiClock className="animate-spin mr-2" />
                                            AI正在生成卡片中...
                                        </div>
                                    ) : selectedSentence.failed ? (
                                        <div>
                                            <p className="mb-2">AI处理失败</p>
                                            <button
                                                onClick={() =>
                                                    retrySentenceProcessing(
                                                        selectedSentence.id
                                                    )
                                                }
                                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                重试
                                            </button>
                                        </div>
                                    ) : (
                                        "暂无卡片"
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">请选择一个句子</p>
                    </div>
                )}
            </div>

            {/* 划词制卡模态框 */}
            {selectionModalOpen && (
                <div
                    ref={popupRef}
                    className="fixed z-50"
                    style={{
                        left: `${popupPosition.x}px`,
                        top: `${popupPosition.y}px`,
                        maxWidth: "320px",
                    }}
                >
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="text-md font-semibold mb-2">
                            为选中词汇制卡
                        </h3>
                        <div className="mb-3">
                            <label className="block text-xs font-medium mb-1">
                                选中的词汇:
                            </label>
                            <input
                                type="text"
                                value={selectedText}
                                onChange={(e) =>
                                    setSelectedText(e.target.value)
                                }
                                className="w-full p-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="编辑要制卡的词汇"
                                aria-label="要制卡的词汇"
                                autoFocus
                            />
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleCreateCardForSelection}
                                className="flex-1 bg-blue-500 text-white py-1.5 px-3 text-sm rounded hover:bg-blue-600"
                            >
                                创建卡片
                            </button>
                            <button
                                onClick={() => {
                                    setSelectionModalOpen(false);
                                    document.removeEventListener(
                                        "mousedown",
                                        handleClickOutside
                                    );
                                }}
                                className="flex-1 bg-gray-500 text-white py-1.5 px-3 text-sm rounded hover:bg-gray-600"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CardProcessorPage;
