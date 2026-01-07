const { formCheckerService } = require('../checker/formChecker.service.js');
const UserModel = require('../../dataModels/UserModel');
class AuthorCheckerService {
  checkAuthorInfo = async (authorInfo) => {
    const {
      familyName,
      givenName,
      kcid,
      ocrid,
      agencyName,
      agencyAddress,
      agencyDOI,
      contact,
      email,
      tel,
      address,
      postalCode,
    } = authorInfo;
    formCheckerService.checkString(familyName, {
      name: '姓氏',
      minLength: 1,
      maxLength: 100,
    });
    formCheckerService.checkString(givenName, {
      name: '名字',
      minLength: 1,
      maxLength: 100,
    });
    if (kcid) {
      const count = await UserModel.countDocuments({ uid: kcid });
      if (count === 0) {
        throw new Error('KCID不存在');
      }
    }
    if (ocrid) {
      formCheckerService.checkORCIDNumberFormat(ocrid);
    }
    if (agencyDOI) {
      formCheckerService.checkDOINumberFormat(agencyDOI);
    }
    formCheckerService.checkString(agencyName, {
      name: '机构名称',
      minLength: 0,
      maxLength: 200,
    });
    formCheckerService.checkString(agencyAddress, {
      name: '机构地址',
      minLength: 0,
      maxLength: 300,
    });
    if (contact) {
      formCheckerService.checkString(email, {
        name: '电子邮箱',
        minLength: 1,
        maxLength: 100,
      });
      formCheckerService.checkEmailFormat(email);
      if (tel) {
        formCheckerService.checkTelephoneNumberFormat(tel);
      }
      if (address) {
        formCheckerService.checkString(address, {
          name: '地址',
          minLength: 0,
          maxLength: 300,
        });
      }
      if (postalCode) {
        formCheckerService.checkPostalCodeFormat(postalCode);
      }
    }
  };
}

module.exports = {
  authorCheckerService: new AuthorCheckerService(),
};
