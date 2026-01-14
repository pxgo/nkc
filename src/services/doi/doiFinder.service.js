// todo: 修复路径 1
const doiConfigs = require('@/settings/env').configs.doi;
class DOIFinderService {
  async #postCore(props) {
    const { url, method, body, timeout = 10 * 1000 } = props;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          // Crossref 礼貌策略：替换为你的真实邮箱
          'User-Agent': `nkc/1.0 (mailto:${doiConfigs.email})`,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        throw new Error(`Crossref API error: ${res.status} ${errText}`);
      }
      const resJSON = await res.json();
      return resJSON && resJSON.message ? resJSON.message : resJSON;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout while posting to Crossref');
      }
      throw new Error(`Error posting to Crossref: ${err.message}`);
    }
  }

  // 指定 doi完整链接或者doi号，查询元信息
  async findMetadata(doi) {
    if (!doi || typeof doi !== 'string') {
      throw new Error('DOI must be a non-empty string');
    }

    const trimmed = doi.trim();
    const doiNumber = trimmed.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');

    const apiBase = 'https://api.crossref.org';
    const url = `${apiBase}/works/${doiNumber}?mailto=${encodeURIComponent(
      doiConfigs.email,
    )}`;

    return this.#postCore({
      url,
      method: 'GET',
    });
  }
  // 指定doi完整链接或者doi号或者doi链接，获取所属发信息
  async findMemberInfo(doi) {
    if (!doi || typeof doi !== 'string') {
      throw new Error('DOI must be a non-empty string');
    }

    const trimmed = doi.trim();
    const doiNumber = trimmed.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');

    const prefix = doiNumber.split('/')[0];
    if (!prefix) {
      throw new Error('Invalid DOI format');
    }

    const apiBase = 'https://api.crossref.org';
    const url = `${apiBase}/prefixes/${prefix}?mailto=${encodeURIComponent(
      doiConfigs.email,
    )}`;

    return this.#postCore({
      url,
      method: 'GET',
    });
  }
  // 指定doi获取赞助机构信息
  async findFunderInfo(doi) {
    if (!doi || typeof doi !== 'string') {
      throw new Error('DOI must be a non-empty string');
    }

    const trimmed = doi.trim();
    const doiNumber = trimmed.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');

    const url = `https://data.crossref.org/fundingdata/funder/${doiNumber}?mailto=${encodeURIComponent(
      doiConfigs.email,
    )}`;

    return this.#postCore({
      url,
      method: 'GET',
    });
  }
}

module.exports = {
  doiFinderService: new DOIFinderService(),
};
