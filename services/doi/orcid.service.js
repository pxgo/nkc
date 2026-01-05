class ORCIDService {
  token = '';

  async #getCore(url, timeout = 10 * 1000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.orcid+json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        if (res.status === 404) {
          throw new Error('ORCID record not found');
        }
        throw new Error(`ORCID API error: ${res.status} ${errText}`);
      }

      return res.json();
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout while calling ORCID');
      }
      throw new Error(`Error fetching ORCID record: ${err.message}`);
    }
  }
  // 查询orcid信息
  async findORCIDInfo(orcid) {
    if (!orcid || typeof orcid !== 'string') {
      throw new Error('ORCID must be a non-empty string');
    }

    const trimmed = orcid.trim();
    // 移除可能的 ORCID URL 前缀，提取纯 ORCID 号
    const orcidNumber = trimmed.replace(/^https?:\/\/orcid\.org\//i, '');

    // 验证 ORCID 格式 (例如: 0000-0001-2345-6789)
    const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/;
    if (!orcidPattern.test(orcidNumber)) {
      throw new Error(
        'Invalid ORCID format. Expected format: 0000-0001-2345-6789',
      );
    }

    const apiBase = 'https://pub.orcid.org/v3.0';
    const url = `${apiBase}/${orcidNumber}/record`;

    return this.#getCore(url);
  }
}

module.exports = {
  orcidService: new ORCIDService(),
};
