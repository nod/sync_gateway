var dbStateSingletons = {};
window.SyncStateForDatabase = function(db) {
  var state = dbStateSingletons[db]
  if (!state) {
    state = new SyncState(db)
    dbStateSingletons[db] = state
  }
  return state
}

function SyncState(db, syncFun) {
  this.db = db;
  // initially populated by view queries
  this.deployedChannels = {
    /*
    "name" : {
      changes : [{id: docid, seq:num}],
      access : {
        "docid" : [userid, userid, roleid, ...]
      }
    }
    */
  };
  // only populated by changes processed by the syncFun locally
  this.previewChannels = {};
  this.deployedDocs = {};
  this.deployedUsers = {};
  this.setSyncFunction(syncFun);
}

SyncState.prototype.setSyncFunction = function(syncFun) {
  // if there are preview docs, run them
};


function runSyncFunction(code, doc, oldDoc, userCtx) {
  return doc;
}

var docAccessMap = {};
function getDocAccessMap(db, done) {
  sg.get([db, "_view", "access"], function(err, data) {
    data.rows.forEach(function(r) {
      for (var ch in r.value) {
        docAccessMap[ch] = docAccessMap[ch] || {}
        docAccessMap[ch][r.id] = r.value[ch];
      }
    })
    done(err, docAccessMap)
  })
}


window.channelWatcher = function(db) {
  var state = {
    channels : {}
  }
  var watchers = {};
  function didChange(change) {
    for (var w in watchers) {
      if (watchers.hasOwnProperty(w)) {
        watchers[w](change)
      }
    }
  }

  // subscribeToDbChanges(db, function(change){})
  queryAllChannels(db, function(err, chs) {
    console.log("queryAllChannels done", err, chs)
    if (err) return;

    getDocAccessMap(db, function(err, accessMap) {
      state.access = accessMap;
      state.channels = chs;
      didChange()
    })

  })

  function channelsList(forChannels) {
    return forChannels.map(function(ch){
      return {name : ch, docs : state.channels[ch], access : state.access[ch]}
    })
  }

  return {
    setChannels : function(newChannels) {
      console.log("setChannels", newChannels)
    },
    onChange : function(name, handler) {
      watchers[name] = handler
    },
    channelNames : function() {
      return Object.keys(state.channels)
    },
    channels : function(forChannels){
      var channels = channelsList(forChannels);
      var chLists = [];

      channels.forEach(function(ch){
        var changes = [];

        var revs ={}, docs = ch.docs;
        for (var id in docs)
          revs[docs[id]] = id
        var rs = Object.keys(revs).sort(function(a, b){
          return parseInt(a) - parseInt(b);
        })
        // for (var i = 0; i <= rs.length; i++) {
        for (var i = rs.length - 1; i >= 0; i--) {
          var docid = revs[rs[i]];
          changes.push([docid, rs[i]])
        }
        ch.changes = changes;
        chLists.push(ch)
      })
      return chLists
    }
  };
}

function queryAllChannels(db, done) {
  sg.get([db, "_view", "channels"], function(err, data) {
    if (err) return done(err);
    console.log("queryAllChannels", data)
    var ch, max = 0, keys = {}, rows = data.rows;
    for (var i = 0; i < rows.length; i++) {
      ch = rows[i].key[0];
      keys[ch] = keys[ch] || {};
      keys[ch][rows[i].id] = rows[i].key[1];
      if (rows[i].key[1] > max) max = rows[i].key[1];
    }
    done(err, keys)
  });
}


// function(max) {
//     // Object.keys(this.state.channels);
//     if (this.changes) {
//       console.log("already watching")
//       return;
//     }
//     // console.log(max)
//     var opts = {};

//     opts.filter = "sync_gateway/bychannel";
//     opts.channels = this.props.watch.join(',')
//     opts.since = "*:"+(max-1)
//     var w = this;

// var oldSeq = {};
// function parseSeq(seq) {
//   var chs = seq.split(',');
//   var seqObj = {};
//   for (var i = chs.length - 1; i >= 0; i--) {
//     var ps = chs[i].split(":"),
//       name = ps[0],
//       num = parseInt(ps[1])
//     seqObj[name] = num;
//   };
//   var output = {};
//   for (var k in oldSeq) {
//     if (!seqObj[k]) {
//       output[k] = seqObj[k];
//     } else if (seqObj[k] && seqObj[k] !== oldSeq[k]) {
//       output[k] = seqObj[k];
//     }
//   }
//   oldSeq = seqObj;
//   return output;
// }
// console.log("change opts", opts)
//     this.changes = coax([location.origin, this.props.db]).changes(opts, function(err, change) {
//       console.log("change", err, change)
//       var channels = w.state.channels;
//       var seq = parseSeq(change.seq)
//       var changed = false
//       console.log("before change", seq, change)
// // detect which channel got a new num in the seq feed...
//       for (var ch in seq) {
//         if (!channels[ch]) {
//           console.log("ignore", change)
//           continue;
//           // channels[ch] = {}
//         }
//         channels[ch][change.id] = seq[ch]
//         changed = true
//         console.log("changed", ch, change.id, seq[ch])
//       }
//       // console.log("after change", JSON.stringify(channels))
//       if (changed) w.setState({channels:channels})
//     })

//   }
