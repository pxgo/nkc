import { ICtxFile } from '@/types/ctx';
import DocumentModel from '@/dataModels/DocumentModel';
import BookModel from '@/dataModels/BookModel';
import OAuthAppModel from '@/dataModels/OAuthAppModel';
import ColumnModel from '@/dataModels/ColumnModel';
import ImageLogModel from '@/dataModels/ImageLogModel';
import UserModel from '@/dataModels/UserModel';
import ProblemModel from '@/dataModels/ProblemModel';
import DraftModel from '@/dataModels/DraftModel';
import downloader from '@/tools/downloader';
import ResourceModel from '@/dataModels/ResourceModel';
import PostModel from '@/dataModels/PostModel';
import ForumModel from '@/dataModels/ForumModel';
import SettingModel from '@/dataModels/SettingModel';
import mediaClient from '@/tools/mediaClient';
import socket from '@/nkcModules/socket';
import FILE from '@/nkcModules/file';
import { ThrowCommonError } from '@/nkcModules/error';
import mongoose from 'mongoose';
import AttachmentModel from '@/dataModels/AttachmentModel';
import { getSize } from '@/nkcModules/tools';
import {
  IAttachmentData,
  IAttachmentImage,
  IAttachmentSizeType,
  IAttachmentType,
} from '@/types/attachment';

class AttachmentService {
  getNewId = async () => {
    return new mongoose.Types.ObjectId().toString();
  };

  createAttachmentAndPushFile = async (props: {
    aid: string;
    file: ICtxFile;
    ext: string;
    uid: string;
    sizeLimit: number;
    time: Date;
    type: IAttachmentType;
    images: IAttachmentImage[];
  }) => {
    const {
      aid,
      file,
      ext,
      uid,
      sizeLimit = 0,
      time,
      type,
      images = [],
    } = props;
    if (file.size > sizeLimit) {
      ThrowCommonError(400, `文件不能超过 ${getSize(sizeLimit, 0)}`);
    }
    const attachment = new AttachmentModel({
      _id: aid,
      toc: time,
      size: file.size,
      name: file.name,
      hash: file.hash,
      ext,
      type,
      uid,
      files: {},
    });
    const files = await this.pushToMediaService({
      attachmentId: attachment._id as string,
      attachmentType: attachment.type as IAttachmentType,
      attachmentToc: attachment.toc,
      filePath: file.path,
      images,
    });
    attachment.files = FILE.filterFilesInfo(files);
    await attachment.save();
    return attachment;
  };

  private pushToMediaService = async (props: {
    attachmentId: string;
    attachmentType: IAttachmentType;
    attachmentToc: Date;
    filePath: string;
    images: IAttachmentImage[];
  }) => {
    const { attachmentToc, attachmentType, attachmentId, filePath, images } =
      props;
    const storeServiceUrl = await FILE.getStoreUrl(attachmentToc);
    const mediaServiceUrl = await socket.getMediaServiceUrl();
    const timePath = await FILE.getTimePath(attachmentToc);
    const mediaPath = await FILE.getMediaPath(attachmentType);
    const data = {
      aid: attachmentId,
      timePath,
      mediaPath,
      toc: attachmentToc,
      images,
    };
    const res = await mediaClient(mediaServiceUrl, {
      type: 'attachment',
      filePath,
      storeUrl: storeServiceUrl,
      data,
    });
    return res.files;
  };

  // 保存首页大Logo
  saveHomeBigLogo = async (uid: string, file: ICtxFile) => {
    const time = new Date();
    const aid = await this.getNewId();
    const ext = await FILE.getFileExtension(file, ['jpeg', 'jpg', 'png']);
    const attachment = await this.createAttachmentAndPushFile({
      aid,
      uid,
      file,
      ext,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type: 'homeBigLogo',
      images: [
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height: 107,
          width: 388,
          quality: 95,
        },
      ],
    });
    await SettingModel.updateOne(
      { _id: 'home' },
      {
        $push: {
          'c.homeBigLogo': aid,
        },
      },
    );
    await SettingModel.saveSettingsToRedis('home');
    return attachment;
  };

  // 保存专业Logo
  saveForumImage = async (props: {
    uid: string;
    fid: string;
    type: 'forumLogo' | 'forumBanner';
    file: ICtxFile;
  }) => {
    const { uid, fid, type, file } = props;
    if (!['forumLogo', 'forumBanner'].includes(type)) {
      ThrowCommonError(400, '未知的图片类型');
    }
    const ext = await FILE.getFileExtension(file, ['jpg', 'jpeg', 'png']);
    const time = new Date();
    const aid = await this.getNewId();
    let images: IAttachmentImage[];
    const updateObj: {
      logo?: string;
      banner?: string;
    } = {};
    if (type === 'forumLogo') {
      updateObj.logo = aid;
      images = [
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height: 192,
          width: 192,
          quality: 90,
        },
        {
          type: 'lg',
          name: `${aid}_lg.${ext}`,
          height: 600,
          width: 600,
          quality: 90,
        },
        {
          type: 'sm',
          name: `${aid}_sm.${ext}`,
          height: 48,
          width: 48,
          quality: 90,
        },
      ];
    } else {
      updateObj.banner = aid;
      images = [
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height: 300,
          width: 1200,
          quality: 90,
        },
      ];
    }
    const attachment = await this.createAttachmentAndPushFile({
      aid,
      file,
      uid,
      ext,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type: 'forumLogo',
      images,
    });
    await ForumModel.updateOne(
      { fid },
      {
        $set: updateObj,
      },
    );
    return attachment;
  };

  // 保存积分的图标
  saveScoreIcon = async (uid: string, file: ICtxFile, scoreType: string) => {
    const ext = await FILE.getFileExtension(file, ['png', 'jpg', 'jpeg']);
    const aid = await this.getNewId();
    const time = new Date();
    const attachment = await this.createAttachmentAndPushFile({
      aid,
      file,
      uid,
      ext,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type: 'scoreIcon',
      images: [
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height: 128,
          width: 128,
          quality: 90,
        },
        {
          type: 'sm',
          name: `${aid}_sm.${ext}`,
          height: 48,
          width: 48,
          quality: 90,
        },
      ],
    });
    const scores = await SettingModel.getScores();
    for (const score of scores) {
      if (score.type === scoreType) {
        score.icon = aid;
        break;
      }
    }
    await SettingModel.updateOne(
      { _id: 'score' },
      {
        $set: {
          'c.scores': scores,
        },
      },
    );
    await SettingModel.saveSettingsToRedis('score');
    return attachment;
  };

  // 保存文章封面
  savePostCover = async (pid: string, fileData?: string | ICtxFile) => {
    const post = await PostModel.findOne({ pid });
    if (!post) {
      return;
    }
    let file: ICtxFile;
    try {
      if (typeof fileData === 'string') {
        const resource = await ResourceModel.findOne({ rid: fileData });
        if (!resource) {
          return;
        }
        const { url } = await resource.getRemoteFile();
        file = await downloader(url);
      } else if (typeof fileData === 'undefined') {
        const extArr = ['jpg', 'jpeg', 'png'];
        const resource = await ResourceModel.findOne({
          ext: { $in: extArr },
          references: pid,
        });
        if (!resource) {
          return;
        }
        const { url } = await resource.getRemoteFile();
        file = await downloader(url);
      } else {
        file = fileData;
      }
    } catch (err) {
      return;
    }
    if (!file) {
      return;
    }
    const time = new Date();
    const aid = await this.getNewId();
    const ext = await FILE.getFileExtension(file, ['jpeg', 'jpg', 'png']);
    const attachment = await this.createAttachmentAndPushFile({
      aid,
      file,
      ext,
      uid: post.uid,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type: 'postCover',
      images: [
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height: 400,
          width: 800,
          background: '#ffffff',
          quality: 90,
        },
      ],
    });
    await PostModel.updateOne(
      { pid },
      {
        $set: {
          cover: attachment._id,
        },
      },
    );
  };

  // 保存首页推荐文章封面
  saveRecommendThreadCover = async (
    uid: string,
    file: ICtxFile,
    type: string,
  ) => {
    const time = new Date();
    const aid = await this.getNewId();
    const ext = await FILE.getFileExtension(file, ['jpg', 'jpeg', 'png']);
    let height = 253;
    let width = 400;
    if (type === 'movable') {
      height = 336;
      width = 800;
    }
    const attachment = await this.createAttachmentAndPushFile({
      aid,
      uid,
      file,
      ext,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type: 'recommendThreadCover',
      images: [
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height,
          width,
          quality: 90,
        },
      ],
    });
    return attachment._id;
  };

  // 修改draft的封面图
  saveDraftCover = async (uid: string, did: string, file: ICtxFile) => {
    const draftTypes = await DraftModel.getType();
    const draft = await DraftModel.findOne({ did, type: draftTypes.beta });
    if (!draft) {
      return;
    }
    const ext = await FILE.getFileExtension(file, ['jpg', 'png', 'jpeg']);
    const time = new Date();
    const aid = await this.getNewId();
    const attachment = await this.createAttachmentAndPushFile({
      aid,
      file,
      uid,
      ext,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type: 'postCover',
      images: [
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height: 400,
          width: 800,
          background: '#ffffff',
          quality: 90,
        },
      ],
    });
    await draft.updateOne({ cover: attachment._id });
  };

  /*
   * 保存上报问题中的图片
   * */
  saveProblemImages = async (
    uid: string,
    problemId: string,
    files: ICtxFile[],
  ) => {
    const problem = await ProblemModel.findOne({ _id: problemId });
    if (!problem) {
      ThrowCommonError(500, `图片保存失败`);
    }
    let attachId = [];
    const time = new Date();
    for (const file of files) {
      let ext;
      try {
        ext = await FILE.getFileExtension(file, ['jpg', 'jpeg', 'png']);
      } catch (err) {
        continue;
      }
      const aid = await this.getNewId();
      const attachment = await this.createAttachmentAndPushFile({
        aid,
        uid,
        file,
        ext,
        type: 'problemImage',
        sizeLimit: 50 * 1024 * 1024,
        time,
        images: [
          {
            type: 'def',
            name: `${aid}.${ext}`,
            height: 1080,
            width: 1920,
            quality: 95,
          },
          {
            type: 'sm',
            name: `${aid}_sm.${ext}`,
            height: 200,
            width: 200,
            background: '#ffffff',
            quality: 90,
          },
        ],
      });
      attachId.push(attachment._id);
    }
    if (problem) {
      await problem.updateOne({ attachId });
    }
  };

  /*
   * 保存基金项目的图片
   * */
  saveFundImage = async (
    uid: string,
    file: ICtxFile,
    type: 'fundAvatar' | 'fundBanner',
  ) => {
    if (!['fundAvatar', 'fundBanner'].includes(type)) {
      throw new Error(`fund image type error`);
    }
    const ext = await FILE.getFileExtension(file, ['jpg', 'png', 'jpeg']);
    const aid = await this.getNewId();
    const time = new Date();
    const imageSize = type === 'fundAvatar' ? [600, 300] : [1500, 250];
    const attachment = await this.createAttachmentAndPushFile({
      aid,
      file,
      uid,
      ext,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type,
      images: [
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height: imageSize[1],
          width: imageSize[0],
          quality: 90,
        },
      ],
    });
    return attachment._id;
  };

  /*
   * 更新用户的背景
   * */
  saveUserAvatar = async (uid: string, file: ICtxFile) => {
    const time = new Date();
    const aid = await this.getNewId();
    const ext = await FILE.getFileExtension(file, ['jpg', 'png', 'jpeg']);
    const attachment = await this.createAttachmentAndPushFile({
      aid,
      file,
      uid,
      ext,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type: 'userAvatar',
      images: [
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height: 192,
          width: 192,
          quality: 90,
        },
        {
          type: 'sm',
          name: `${aid}_sm.${ext}`,
          height: 48,
          width: 48,
          quality: 90,
        },
        {
          type: 'lg',
          name: `${aid}_lg.${ext}`,
          height: 600,
          width: 600,
          quality: 90,
        },
      ],
    });
    await UserModel.updateOne(
      { uid },
      {
        $set: {
          avatar: attachment._id,
        },
      },
    );
    return attachment;
  };

  /*
   * 更新用户的背景
   * */
  saveUserBanner = async (uid: string, file: ICtxFile) => {
    const time = new Date();
    const aid = await this.getNewId();
    const ext = await FILE.getFileExtension(file, ['jpeg', 'png', 'jpg']);
    const attachment = await this.createAttachmentAndPushFile({
      aid,
      file,
      ext,
      uid,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type: 'userBanner',
      images: [
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height: 400,
          width: 800,
          quality: 95,
        },
      ],
    });
    await UserModel.updateOne(
      { uid },
      {
        $set: {
          banner: attachment._id,
        },
      },
    );
    return attachment;
  };

  /*
   * 更新用户主页的背景
   * */
  saveUserHomeBanner = async (uid: string, file: ICtxFile) => {
    const time = new Date();
    const aid = await this.getNewId();
    const ext = await FILE.getFileExtension(file, ['jpeg', 'png', 'jpg']);
    const attachment = await this.createAttachmentAndPushFile({
      aid,
      file,
      ext,
      uid,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type: 'userBanner',
      images: [
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height: 180,
          width: 1270,
          quality: 95,
        },
      ],
    });
    await UserModel.updateOne(
      { uid },
      {
        $set: {
          homeBanner: attachment._id,
        },
      },
    );
    return attachment;
  };

  /*
   * 保存专栏头像
   * */
  saveColumnAvatar = async (uid: string, columnId: string, file: ICtxFile) => {
    const column = await ColumnModel.findOne({ _id: columnId });
    if (!column) {
      ThrowCommonError(400, `Column not found. (${columnId})`);
    }
    const time = new Date();
    const aid = await this.getNewId();
    const ext = await FILE.getFileExtension(file, ['jpeg', 'png', 'jpg']);
    const attachment = await this.createAttachmentAndPushFile({
      aid,
      file,
      uid,
      ext,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type: 'columnAvatar',
      images: [
        {
          type: 'sm',
          name: `${aid}_sm.${ext}`,
          height: 100,
          width: 100,
          quality: 90,
        },
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height: 250,
          width: 250,
          quality: 90,
        },
        {
          type: 'lg',
          name: `${aid}_lg.${ext}`,
          height: 500,
          width: 500,
          quality: 90,
        },
      ],
    });
    await ColumnModel.updateOne(
      { _id: columnId },
      {
        $set: {
          avatar: attachment._id,
        },
      },
    );
    const imgTypes = ['columnAvatar', 'columnAvatarSM', 'columnAvatarLG'];
    if (column) {
      for (const imgType of imgTypes) {
        const log = new ImageLogModel({
          uid: column.uid,
          columnId,
          imgType,
          imgId: aid,
          type: 'columnChangeAvatar',
        });
        await log.save();
      }
    }

    return attachment;
  };

  /*
   * 保存专栏背景
   * */
  saveColumnBanner = async (uid: string, columnId: string, file: ICtxFile) => {
    const column = await ColumnModel.findOne({ _id: columnId });
    if (!column) {
      ThrowCommonError(400, `Column not found. (${columnId})`);
    }
    const time = new Date();
    const aid = await this.getNewId();
    const ext = await FILE.getFileExtension(file, ['jpeg', 'png', 'jpg']);
    const attachment = await this.createAttachmentAndPushFile({
      aid,
      file,
      ext,
      uid,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type: 'columnAvatar',
      images: [
        {
          type: 'sm',
          name: `${aid}_sm.${ext}`,
          height: 720,
          width: 1280,
          quality: 90,
        },
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height: 480,
          width: 1920,
          quality: 90,
        },
      ],
    });
    await ColumnModel.updateOne(
      { _id: columnId },
      {
        $set: {
          banner: attachment._id,
        },
      },
    );
    const imgTypes = ['columnBanner', 'columnBannerSM'];
    if (column) {
      for (const imgType of imgTypes) {
        const log = new ImageLogModel({
          uid: column.uid,
          columnId,
          imgType,
          imgId: aid,
          type: 'columnChangeBanner',
        });
        await log.save();
      }
    }
    return attachment;
  };

  // 保存应用图标
  saveOAuthAppIcon = async (
    uid: string,
    OAuthAppId: string,
    file: ICtxFile,
  ) => {
    const ext = await FILE.getFileExtension(file, ['jpg', 'png', 'jpeg']);
    const aid = await this.getNewId();
    const time = new Date();
    const attachment = await this.createAttachmentAndPushFile({
      aid,
      file,
      ext,
      uid,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type: 'OAuthAppIcon',
      images: [
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height: 500,
          width: 500,
          quality: 90,
        },
      ],
    });
    await OAuthAppModel.updateOne(
      { _id: OAuthAppId },
      {
        $set: {
          icon: attachment._id,
        },
      },
    );
  };

  // 保存图书封面
  saveBookCover = async (uid: string, bookId: string, file: ICtxFile) => {
    const ext = await FILE.getFileExtension(file, ['jpg', 'png', 'jpeg']);
    const aid = await this.getNewId();
    const time = new Date();
    const attachment = await this.createAttachmentAndPushFile({
      aid,
      file,
      ext,
      uid,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type: 'bookCover',
      images: [
        {
          type: 'def',
          name: `${aid}.${ext}`,
          height: 300,
          width: 900,
          quality: 90,
        },
      ],
    });
    await BookModel.updateOne(
      { _id: bookId },
      {
        $set: {
          cover: attachment._id,
        },
      },
    );
  };

  // 保存独立内容封面
  saveDocumentCover = async (
    uid: string,
    documentId: number,
    file: ICtxFile,
  ) => {
    const ext = await FILE.getFileExtension(file, ['jpg', 'png', 'jpeg']);
    const aid = await this.getNewId();
    const time = new Date();
    const attachment = await this.createAttachmentAndPushFile({
      aid,
      file,
      ext,
      uid,
      sizeLimit: 20 * 1024 * 1024,
      time,
      type: 'documentCover',
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
    await DocumentModel.updateOne(
      { _id: documentId },
      {
        $set: {
          cover: attachment._id,
        },
      },
    );
  };

  // 保存用户审核
  saveUserAudit = async (uid: string, file: ICtxFile, type: string) => {
    const time = new Date();
    const aid = await this.getNewId();
    const ext = await FILE.getFileExtension(file, ['jpg', 'png', 'jpeg']);
    let attachment: unknown;
    if (type === 'userAvatar') {
      attachment = await this.createAttachmentAndPushFile({
        aid,
        file,
        uid,
        ext,
        sizeLimit: 20 * 1024 * 1024,
        time,
        type: 'userAvatarAudit',
        images: [
          {
            type: 'def',
            name: `${aid}.${ext}`,
            height: 192,
            width: 192,
            quality: 90,
          },
          {
            type: 'sm',
            name: `${aid}_sm.${ext}`,
            height: 48,
            width: 48,
            quality: 90,
          },
          {
            type: 'lg',
            name: `${aid}_lg.${ext}`,
            height: 600,
            width: 600,
            quality: 90,
          },
        ],
      });
    } else if (type === 'userBanner') {
      attachment = await this.createAttachmentAndPushFile({
        aid,
        file,
        ext,
        uid,
        sizeLimit: 20 * 1024 * 1024,
        time,
        type: 'userBannerAudit',
        images: [
          {
            type: 'def',
            name: `${aid}.${ext}`,
            height: 400,
            width: 800,
            quality: 95,
          },
        ],
      });
    } else if (type === 'userHomeBanner') {
      attachment = await this.createAttachmentAndPushFile({
        aid,
        file,
        ext,
        uid,
        sizeLimit: 20 * 1024 * 1024,
        time,
        type: 'userHomeBannerAudit',
        images: [
          {
            type: 'def',
            name: `${aid}.${ext}`,
            height: 180,
            width: 1270,
            quality: 95,
          },
        ],
      });
    }
    return attachment;
  };

  // 屏蔽附件
  disableAttachment = async (aid: string) => {
    if (!aid) {
      return;
    }
    await AttachmentModel.updateOne(
      { _id: aid },
      {
        $set: {
          disabled: true,
        },
      },
    );
  };

  /*
   * 加载从 store service 取文件需要的数据
   * @param {String} size 同一文件的不同类型
   * @return {Object}
   *   @param {String} url store service 链接
   *   @param {String} filename 下载时的文件名称，设置在 response header 中
   *   @param {Object} query
   *     @param {String} path 文件在 store service 上的路径
   *     @param {Number} time 文件的上传时间
   * */
  getRemoteFile = async (
    attachment: IAttachmentData,
    size: IAttachmentSizeType = 'def',
  ) => {
    const { _id, toc, type, name, files = {}, ext } = attachment;
    return await FILE.getRemoteFile({
      id: _id,
      toc,
      ext,
      type,
      name,
      file: files[size] || files['def'],
    });
  };

  updateFilesInfo = async (attachment: IAttachmentData) => {
    const { toc, type, _id, ext } = attachment;
    const files = await FILE.getStoreFilesInfoObj(toc, type, {
      def: `${_id}.${ext}`,
      sm: `${_id}_sm.${ext}`,
      lg: `${_id}_lg.${ext}`,
      md: `${_id}_md.${ext}`,
    });
    await AttachmentModel.updateOne(
      { _id: attachment._id },
      {
        $set: {
          files,
        },
      },
    );
  };
}

export const attachmentService = new AttachmentService();
