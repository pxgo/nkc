const { doiContentTypes } = require('../../settings/doi');
const doiConfig = require('../../config/doi.json');
const { isDevelopment } = require('../../settings/env');

class DOICreatorService {
  // 构建 DOI号
  generateDOINumber(type, id) {
    switch (type) {
      case doiContentTypes.post: {
        return `${doiConfig.doiPrefix}/${id}`;
      }
      case doiContentTypes.document: {
        return `${doiConfig.doiPrefix}/d${id}`;
      }
      default: {
        throw new Error('Unsupported DOI content type');
      }
    }
  }
  // 构建 DOI链接
  generateDOIUrl(doiNumber) {
    const doiUrl = `${doiConfig.doiUrlBase}/${doiNumber}`;
    return doiUrl;
  }

  // 提交元信息（Crossref要求multipart/form-data + XML）
  postMetadata = async (metadata) => {
    const url = isDevelopment
      ? doiConfig.uploadMetadataUrlDev
      : doiConfig.uploadMetadataUrl;

    const blob = new Blob([metadata], { type: 'application/xml' });

    // 构建FormData，遵循Crossref字段规范
    const formData = new FormData();
    formData.append('operation', 'doMDUpload');
    formData.append('login_id', `${doiConfig.username}/${doiConfig.role}`);
    formData.append(
      'login_passwd',
      isDevelopment ? doiConfig.passwordDev : doiConfig.password,
    );
    formData.append('fname', blob, 'metadata.xml');
    try {
      const res = await fetch(url, {
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
