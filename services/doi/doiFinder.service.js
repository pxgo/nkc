const doiConfig = require('../../config/doi.json');
class DOIFinderService {
  // doi: 完整链接或者 DOI 号
  async findMetadata(doi) {
    if (!doi || typeof doi !== 'string') {
      throw new Error('DOI must be a non-empty string');
    }

    const trimmed = doi.trim();
    const doiNumber = trimmed.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');

    const apiBase = 'https://api.crossref.org';
    const url = `${apiBase}/works/${doiNumber}?mailto=${encodeURIComponent(
      doiConfig.email,
    )}`; // 这里的编码需根据实际情况微调

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          // Crossref 礼貌策略：替换为你的真实邮箱
          'User-Agent': `nkc/1.0 (mailto:${doiConfig.email})`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 404) {
        return null; // 或者返回特定对象，表示未找到
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        throw new Error(`Crossref API error: ${res.status} ${errText}`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        return data.message || data;
      }

      return { raw: await res.text() };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout while fetching metadata');
      }
      throw new Error(`Error finding metadata: ${err.message}`);
    }
  }
}

module.exports = {
  doiFinderService: new DOIFinderService(),
};
