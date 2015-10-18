var sumReduce = function (keys, values, rereduce) {
  return sum(values);
};

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
          localization: body.localization.toLowerCase(),
          category: body.category.toLowerCase(),
        };
        return[doc,toJSON(doc)];
      }
    },
    update: function (doc, req) {
      var body = JSON.parse(req.body);
        doc.lastAuthor = body.lastAuthor || doc.lastAuthor;// should done with revs (-> see fetch )
        doc.lastChange = new Date().toString();
        doc.abstract = body.abstract || doc.abstract;
        doc.localization = body.localization.toLowerCase() || doc.localization;
        doc.category = body.category.toLowerCase() || doc.category;
        doc.content = body.content || doc.content;
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
    byLetter: {
      map: function(doc ) {
        emit(doc._id[0], 1);
      },
      reduce: sumReduce,
    },
    byCategory: {
      map: function(doc ) {
        if( doc.category ) {
        emit(doc.category, 1);
      }
      },
      reduce: sumReduce,
    },
    byLocalization: {
      map: function(doc) {
        if( doc.localization ) {
          emit(doc.localization, 1);
        }
      },
      reduce: sumReduce,
    },
  },
};
