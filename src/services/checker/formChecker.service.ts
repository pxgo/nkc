import checkData from '@/nkcModules/checkData';
import { ThrowCommonError } from '@/nkcModules/error';
import validator from 'validator';

class FormCheckerService {
  checkString = checkData.checkString;
  checkNumber = checkData.checkNumber;

  getLength(str: string) {
    return checkData.getLength(str);
  }

  isLengthInRange(str: string, minLength?: number, maxLength?: number) {
    const length = this.getLength(str || '');
    if (minLength !== undefined && length < minLength) {
      return false;
    }
    if (maxLength !== undefined && length > maxLength) {
      return false;
    }
    return true;
  }

  // email
  isValidEmail(email: string) {
    return validator.isEmail(email || '');
  }
  checkEmailFormat(email: string) {
    console.log('Checking email format for:', email);
    if (!this.isValidEmail(email)) {
      ThrowCommonError(400, '邮箱格式不正确');
    }
  }

  // DOI & ORCID
  isValidDOINumber(doi: string) {
    const reg = /^10\.\d{4,9}\/\S+$/;
    return reg.test(doi || '');
  }
  checkDOINumberFormat(doi: string) {
    if (!this.isValidDOINumber(doi)) {
      ThrowCommonError(400, 'DOI 格式不正确');
    }
  }
  // alias for compatibility with existing calls
  checkDOIFormat(doi: string) {
    return this.checkDOINumberFormat(doi);
  }
  isValidORCIDNumber(orcid: string) {
    const reg = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/;
    return reg.test(orcid || '');
  }
  checkORCIDNumberFormat(orcid: string) {
    if (!this.isValidORCIDNumber(orcid)) {
      ThrowCommonError(400, 'ORCID 格式不正确');
    }
  }

  // Postal code
  isValidPostalCode(postalCode: string) {
    const value = String(postalCode || '').trim();
    const reg = /^[A-Za-z0-9][A-Za-z0-9\s-]{0,10}[A-Za-z0-9]$/;
    return reg.test(value);
  }
  checkPostalCodeFormat(postalCode: string) {
    if (!this.isValidPostalCode(postalCode)) {
      ThrowCommonError(400, '邮政编码格式不正确');
    }
  }

  // Telephone
  isValidTelephoneNumber(tel: string) {
    const reg = /^\+?[1-9]\d{5,14}$/;
    const formattedTel = String(tel || '').replace(/[\s-]/g, '');
    return reg.test(formattedTel);
  }
  checkTelephoneNumberFormat(tel: string) {
    if (!this.isValidTelephoneNumber(tel)) {
      ThrowCommonError(400, '电话格式不正确');
    }
  }
}

export const formCheckerService = new FormCheckerService();
