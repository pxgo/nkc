const { OpenAI } = require('openai');
// todo: 修复路径 1
const llmConfigs = require('@/settings/env').configs.llm;
const { isDevelopment } = require('../../settings/env');
const openai = new OpenAI({
  apiKey: llmConfigs.apiKey,
  baseURL: llmConfigs.baseURL,
});

class LLMService {
  #core = async (prompt) => {
    const response = await openai.chat.completions.create({
      model: llmConfigs.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });
    if (isDevelopment) {
      console.debug(response.choices[0].message);
    }
    return response.choices[0].message.content;
  };

  translate = async (contents, targetLanguage) => {
    const prompt = `
你是一个极简翻译插件。
任务：逐行翻译输入的文本，翻译成${targetLanguage}。
规则：
1. 格式控制：严禁输出任何引言、解释、序号或 Markdown 符号。
2. 数量匹配：输出行数必须与输入行数完全一致。
3. 换行符分割：每行仅包含对应的译文。

待翻译文本如下：
${contents.join('\n')}
    `;
    const response = await this.#core(prompt);
    return response
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, contents.length);
  };
}

module.exports = {
  llmService: new LLMService(),
};
