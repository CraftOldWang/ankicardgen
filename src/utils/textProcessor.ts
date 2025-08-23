import { Sentence } from '../types';

/**
 * 从文本内容中提取句子
 * @param content 文件内容
 * @returns 提取的句子数组
 */
export function extractSentences(content: string): Sentence[] {
  if (!content) return [];
  
  // 分割文本为行
  const lines = content.split('\n');
  
  const sentences: Sentence[] = [];
  let currentSentence = '';
  let emptyLineCounter = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line !== '') {
      currentSentence += line;
      emptyLineCounter = 0;
    } else {
      emptyLineCounter++;
    }
    
    // 当遇到空行时，将当前句子添加到结果中
    if (emptyLineCounter === 1 && currentSentence.trim() !== '') {
      // 替换日文全角空格为半角空格
      const processedSentence = currentSentence.replace(/\u3000/g, ' ');
      
      sentences.push({
        id: `sentence-${sentences.length}`,
        text: processedSentence,
        processed: false
      });
      
      currentSentence = '';
      emptyLineCounter = 0;
    }
  }
  
  // 处理最后一个句子
  if (currentSentence.trim() !== '') {
    const processedSentence = currentSentence.replace(/\u3000/g, ' ');
    
    sentences.push({
      id: `sentence-${sentences.length}`,
      text: processedSentence,
      processed: false
    });
  }
  
  return sentences;
}

/**
 * 从句子中提取关键词
 * 这个功能将由AI完成，此处仅为占位
 * @param sentence 句子文本
 * @returns 关键词数组
 */
export function extractKeywords(sentence: string): string[] {
  // 实际应用中，这里会调用AI API来提取关键词
  // 此处仅返回一个简单的示例
  return sentence.split(' ').filter(word => word.length > 1);
}

/**
 * 格式化卡片内容为Markdown格式
 * @param cards 卡片数组
 * @returns 格式化后的Markdown文本
 */
export function formatCardsToMarkdown(cards: any[]): string {
  return cards.map(card => {
    return `${card.word}\n----\n${card.reading}\n${card.meaning}\n${card.sentence}\n\n\n`;
  }).join('\n');
}