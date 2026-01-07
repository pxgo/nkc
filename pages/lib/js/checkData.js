export const checkString = window.NKC.methods.checkData.checkString;
export const checkNumber = window.NKC.methods.checkData.checkNumber;
export const getLength = window.NKC.methods.checkData.getLength;
export const getMomentPlainJsonContentLength =
  window.NKC.methods.checkData.getMomentPlainJsonContentLength;
export const getRichJsonContentLength =
  window.NKC.methods.checkData.getRichJsonContentLength;

export const checkEmail = (email) => {
  const reg =
    /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
  if (!reg.test(email || '')) {
    throw new Error('邮箱格式不正确');
  }
  return true;
};

export const checkPostalCode = (code) => {
  const reg = /^[A-Za-z0-9][A-Za-z0-9\s-]{0,10}[A-Za-z0-9]$/;
  if (!reg.test(code || '')) {
    throw new Error('邮政编码格式不正确');
  }
  return true;
};

export const checkAgencyDOINumber = (doi) => {
  const reg = /^10\.\d{4,9}\/\S+$/;
  if (!reg.test(doi || '')) {
    throw new Error('机构 DOI 格式不正确');
  }
  return true;
};

export const checkUserORCIDNumber = (orcid) => {
  const reg = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/;
  if (!reg.test(orcid || '')) {
    throw new Error('ORCID 格式不正确');
  }
  return true;
};

export const checkKCID = (kcid) => {
  const reg = /^-?\d+$/;
  if (!reg.test(kcid || '')) {
    throw new Error('KCID 格式不正确');
  }
  return true;
};

export const checkTel = (tel) => {
  const reg = /^\+?[1-9]\d{5,14}$/;
  const formattedTel = String(tel || '').replace(/[\s-]/g, '');
  if (!reg.test(formattedTel)) {
    throw new Error('电话格式不正确');
  }
  return true;
};
