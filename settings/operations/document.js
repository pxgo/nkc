module.exports = {
  PARAMETER:{
    preview:{
      GET:'previewDocument'
    },
    history:{
      GET:'viewHistoryDocument',
      PARAMETER:{
        GET:'viewHistoryDocument',
        PARAMETER:{
          // publish:{
          //   GET:'historyPublish',
          // },
          edit:{
            POST:'historyEdit',
          }
        }
      }
    }
  }    
}