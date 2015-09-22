module.exports = {
  _id: '_design/encyclo',
  updates: {
    create: function (doc,req) { 
      var body = JSON.parse(req.body);
      if (!doc) { 
        var doc = {
          _id: body.id,
          title: body.title,
          content: body.content,
          abstract: body.abstract,
          lastChange: body.lastChange,
          lastAuthor: body.lastAuthor,
          author: body.author,
          localization: body.localization,
          category: body.category,
        };
        return[doc,toJSON(doc)];
      }
    },
    update: function (doc, req) {
      var body = JSON.parse(req.body);
        doc.content = body.content;
        return[doc, toJSON(doc)];
    }
  },
  views: {
    all: {
      map: function(doc) {
        emit(doc.title, {content:doc.content, 
                         abstract:doc.abstract,
                         localization: doc.localization,
                         category: doc.category, });
      },
    },
  },
};