const MetadataModel = require('../../models/metadataModel');
class MetadataCreatorService {
  // 创建空白元数据
  createMetadata = async (props) => {
    const { source, sid, toc } = props;
    const metadata = new MetadataModel({
      source,
      sid,
      toc,
    });
    await metadata.save();
    return metadata;
  };

  // 指定元数据ID，复制元数据
  copyMetadata = async (id) => {
    const metadata = await MetadataModel.findOne({ _id: id }).lean();
    if (!metadata) {
      throw new Error('Metadata not found');
    }
    delete metadata._id;
    const newMetadata = new MetadataModel(metadata);
    await newMetadata.save();
    return newMetadata;
  };
}

module.exports = {
  metadataCreatorService: new MetadataCreatorService(),
};
