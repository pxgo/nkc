import FILE from '@/nkcModules/file';
import { ICtxFile } from '@/types/ctx';
import { attachmentService } from '@/services/attachment/attachment.service';

class AuthorPhotoService {
  saveAuthorPhoto = async (uid: string, file: ICtxFile) => {
    const ext = await FILE.getFileExtension(file, ['jpg', 'jpeg', 'png']);
    const aid = await attachmentService.getNewId();
    const time = new Date();
    const attachment = await attachmentService.createAttachmentAndPushFile({
      aid,
      file,
      ext,
      uid,
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
    return attachment._id;
  };
}

module.exports = {
  authorPhotoService: new AuthorPhotoService(),
};
