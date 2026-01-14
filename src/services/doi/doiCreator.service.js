const { doiContentTypes } = require('../../settings/doi');
// todo: 修复路径 1
const doiConfigs = require('@/settings/env').configs.doi;

class DOICreatorService {
  // 构建 DOI号
  generateDOINumber(type, id) {
    switch (type) {
      case doiContentTypes.post: {
        return `${doiConfigs.doiPrefix}/${id}`;
      }
      case doiContentTypes.document: {
        return `${doiConfigs.doiPrefix}/d${id}`;
      }
      default: {
        throw new Error('Unsupported DOI content type');
      }
    }
  }
  // 构建 DOI链接
  generateDOIUrl(doiNumber) {
    const doiUrl = `https://doi.org/${doiNumber}`;
    return doiUrl;
  }

  // 提交元信息（Crossref要求multipart/form-data + XML）
  postMetadata = async (metadata) => {
    const blob = new Blob([metadata], { type: 'application/xml' });

    // 构建FormData，遵循Crossref字段规范
    const formData = new FormData();
    formData.append('operation', 'doMDUpload');
    formData.append('login_id', `${doiConfigs.username}/${doiConfigs.role}`);
    formData.append('login_passwd', doiConfigs.password);
    formData.append('fname', blob, 'metadata.xml');
    try {
      const res = await fetch(doiConfigs.postUrl, {
        method: 'POST',
        // 不手动设置Content-Type，让fetch自动添加boundary
        body: formData,
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await res.json();
      }
      const text = await res.text();
      if (res.ok) {
        return { raw: text };
      }
      throw new Error(`Failed to post metadata: ${res.status} ${text}`);
    } catch (err) {
      throw new Error(`Error posting metadata: ${err.message}`);
    }
  };
}

module.exports = {
  doiCreatorService: new DOICreatorService(),
};
