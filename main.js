var http = require('http');
var url = require('url');
var querystring = require("querystring");
function db() {
  this.handle=db.handle;
  this.exec=db.exec;
}
db.exec = function( sql ) {
  console.log( sql );
  var mysql = require('mysql');
  var conn = mysql.createConnection({ host: 'localhost', user: 'roger', password: '68', 
                                     database:'FOO', port: 3306  });
  conn.connect();
  conn.query( sql, db.handle );
  conn.end();
}
function httpfetch() {
  this.fetch = httpfetch.fetch;
  this.callback = httpfetch.callback;
  this.feedback = httpfetch.feedback;
}
/*httpfetch.callback = function( params ) {
  console.log( 'blank' );
}*/
httpfetch.feedback = function( response, data ) {
    response.writeHead(200, {'Content-Type': 'text/html;charset="UTF-8"'});

    if( data == '' ){
      response.write("");
      console.log('feedback null');
    }else if ( data == 'error' 
             || data == 'n0err'
             || data == 'sqlerr'
             || data == 'dberr'){
      response.write("result='error'");
      console.log('feedback '+data);
    }else {
      response.write("var result='"+JSON.stringify(data)+"'");
      console.log('feedback'+JSON.stringify(data));
    }
    response.end();
}
httpfetch.fetch = function ( request ) {
  var ret;
  if ( request.method == 'GET' ) {
    console.log('GET <<<');
    ret = url.parse(request.url, true).query;
    console.log('>>> '+ret);
    httpfetch.callback( ret );
  } else if (　request.method == 'POST' ) {
    var data = "";
    console.log('POST <<<');
    request.addListener("data", function (chunk) {
      data += chunk;
      console.log("chunck "+chunk);
    });
    request.addListener("end", function () {
      ret = querystring.parse(data);
      console.log('POST'+ret);
      httpfetch.callback( ret );
    });
  }
}
function handler( request,response ) {
  this.sprintf = handler.sprintf;
  this.request = request;
  this.response = response;
  var count = 20;
  this.select = function select() {
    var a = new Array();
    var hf = new httpfetch();
    var args = arguments;
    httpfetch.callback = function ( params ) {
      a.push(args[0]);
      for( var i = 1; i < args.length; i++)
        a.push(params[args[i]]);
      if( params['n'] == undefined ) {
        hf.feedback( response, 'n0err' );
      } else if( sql == 'error' ) {
        hf.feedback( response, 'sqlerr' );
      }else{        
        var sql = handler.sprintf( a );
        var pageN = parseInt(params['n']);
        sql += ' limit '+(count*pageN)+','+(count*(pageN+1))+';';
        dbs.exec(sql);
      }
    }
    var dbs = new db();
    db.handle = function(err, result) {
      if (err){
        hf.feedback( response, 'dberr' );
      } else {
        hf.feedback( response, result );
      }
    };
    hf.fetch( request );
    delete dbs;
    delete hf;
    delete a;
    delete sql;
  }
  this.insert = function insert(/*0:sql, ...*/ ) {
    var args = arguments;
    var a = new Array();
    var hf = new httpfetch();
    httpfetch.callback = function ( params ) { 
      a.push(args[0]);
      for( var i = 1; i < args.length; i++)
        a.push(params[args[i]]);
      var sql = handler.sprintf( a );
      if( sql == 'error' ) {
        hf.feedback( response, 'sqlerr' );
      }else {
        dbs.exec(sql);
      }
    }
    
    var dbs = new db();
    db.handle = function(err, result) {
      if (err){
        hf.feedback( response, 'dberr' );
      } else {
        hf.feedback( response, result );
      }
    };
    hf.fetch( request );
    delete dbs;
    delete hf;
    delete a;
    delete sql;
  }
}

handler.sprintf = function sprintf() {
  var format = arguments[0];
  var delimitor = '&';
  var i = 1;
  var b = 0;
  var e = format.indexOf(delimitor,b);
  var result = "";
  while( e >= 0 ) {
    if( arguments[i] == undefined ) 
      return 'error';
    result += format.substring(b,e) + arguments[i];
    b = e + 1;
    var e = format.indexOf(delimitor,b);
    i ++;
  }
  if ( result == "" )
    return format;
  return result + format.substring(b);
}


http.createServer(function (req, res) {        
　　    var path = url.parse(req.url).pathname;
        var count = 20;
        req.setEncoding('utf-8');
        if( path == '/favicon.ico' )
          return;
        console.log( ":"+path );
        var h = new handler(req,res);
        if( path == '/col' ) {
          h.select('SELECT id,name,good,bad,substr(date,1,11) as date from COMPANY');
        }
        if( path == '/cmtl' ) {
          h.select('SELECT * from COMMENTS as a,COMPANY as b, USER as c where a.COMPANY_ID=b.ID and a.IP_ID=c.ID');
        } 
        if( path == '/cmta' ) {
          h.insert( 'INSERT INTO　COMMENTS(COMPANY_ID,CONTENT,IP_ID)values(&,&,&)','cid','ctx','ip');
        }
        if( path == '/cmtf' ) {
          h.select('SELECT * from FOLLOWCOMMENTS WHERE COMMENTS_ID=& ','id');
        }
        if( path == '/coa' ) {
          httpfetch.callback = function ( params ) {
            if ( typeof params['name'] != undefined ) {           
              dbs.exec('INSERT INTO COMPANY(name,address)VALUES("'+ params['name']+'","'+params['addr']+'") ');
            }
          }
          var hf = new httpfetch();
          var dbs = new db();
          db.handle = function(err, rows, fields) {
            res.writeHead(200, {'Content-Type': 'text/html;charset="UTF-8"'});
            if (err){
              console.log("success failed!")
              res.write("var result='failed'");
              console.log("err:"+err+",rows:"+rows);
              throw err;
            } 
            console.log("success fetch!")
            res.write("var result='success'");
            res.end();
          };
          hf.fetch( req );
          delete dbs;
          delete hf;
        } 
        if( path == '/cmt' ) {         
          httpfetch.callback = function ( params ) {
            var a = params['a'];
            var b = params['b'];
            console.log('a b:'+a+';'+ b);
            if ( typeof a != undefined && typeof b != undefined ) { 
              dbs.exec('UPDATE COMPANY SET '+a+' = '+a+' + 1 WHERE name="'+ b+'"');
            }
          }
          var hf = new httpfetch();
          var dbs = new db();
          db.handle = function(err, rows, fields) {
            res.writeHead(200, {'Content-Type': 'text/html;charset="UTF-8"'});
            if (err){
              console.log("success failed!")
              res.write("var result='failed'");
              console.log("err:"+err+",rows:"+rows);
              throw err;
            } 
            console.log("success fetch!")
            res.write("var result='success'");
            res.end();
          };
          hf.fetch( req );
          delete dbs;
          delete hf;
        }
        delete h;
        console.log("---------------");        
}).listen(8888, "0.0.0.0");
  
console.log('access:http://localhost:8888');