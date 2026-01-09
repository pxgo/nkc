const AttachmentModel = require('../../dataModels/AttachmentModel');
const FILE = require('../../nkcModules/file');
class AuthorPhotoService {
  saveAuthorPhoto = async (file) => {
    const ext = await FILE.getFileExtension(file, ['jpg', 'jpeg', 'png']);
    const aid = await AttachmentModel.getNewId();
    const time = new Date();
    const attachment = await AttachmentModel.createAttachmentAndPushFile({
      aid,
      file,
      ext,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type: 'authorPhoto',
      images: [
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height: 300,
          width: 600,
          quality: 90,
        },
      ],
    });
    return attachment.aid;
  };
}

module.exports = {
  authorPhotoService: new AuthorPhotoService(),
};
