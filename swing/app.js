/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var rep = require('./routes/rep');
var download = require('./routes/download');

var device = require('./routes/device');
var openthefile = require('./routes/openthefile');

var http = require('http');
var path = require('path');
var fs = require('fs');
var mysql      = require('mysql');

var db;
//mysql接続
db = mysql.createPool({
					  host     : 'localhost',
					  user     : 'root',
					  password : 'actwatch',
					  database : 'swingdb'
					});



function keepalive() {
	db.getConnection(function(err,conn){
		if(err){console.log(err); callback(true);return;}
		conn.query('select 1', [], function(err, result) {
			var now = new Date();
			console.log(timestampConv(now) + " Select 1 ");
			if(err) return console.log(err);
			// Successul keepalive
		});
	});
}
//240分に1回
//setInterval(keepalive, 1000*240*60);

var app = express();

// all environments
app.set('port', process.env.PORT || 80);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/rep', rep.rep);
app.get('/download',download.csv);
app.get('/device',device.csv);
app.get('/openthefile',openthefile.text);

app.get('/data', function(req, res){
	
	var cal = req.query.cal;

	if( cal === "undefined" ){
		db.getConnection(function(err,conn){

			if(err){console.log(err);callback(true); return;}
			
			conn.query("select server_id,date,sum(mo_all) as mo_all,sum(mib_all_work) as mib_all_work,sum(mib_all_pend) as mib_all_pend ," + 
			"sum(trap_all_work) as trap_all_work,sum(trap_all_pend) as trap_all_pend,sum(dummy_all_work) as dummy_all_work,sum(dummy_all_pend) as dummy_all_pend," + 
			"sum(ping_work) as ping_work,sum(ping_pend) as ping_pend,sum(disconnect_inactive) as disconnect_inactive,sum(mib_audit_work) as mib_audit_work," + 
			"sum(mib_audit_pend) as mib_audit_pend ,sum(trap_audit_work) as trap_audit_work,sum(trap_audit_pend) as trap_audit_pend " + 
			"from capacity_propertytbl where `date` > CURRENT_TIMESTAMP() - INTERVAL 1 DAY group by (server_id)",[], function(err, rows){
				if (err) console.log(err);
				
				for (var i = 0;i < rows.length;i++) {
					rows[i].date = timestampConv( rows[i].date );
					rows[i]["server_name"] =  i + 1　+ "号機";
				}
				
				res.send(rows);
				//DBコネクションプールを閉じる			
				conn.release();
			});
		});

	}
	else{
		db.getConnection(function(err,conn){
			if(err){console.log(err);callback(true); return;}
			conn.query("select server_id,date,sum(mo_all) as mo_all,sum(mib_all_work) as mib_all_work,sum(mib_all_pend) as mib_all_pend ," + 
			"sum(trap_all_work) as trap_all_work,sum(trap_all_pend) as trap_all_pend,sum(dummy_all_work) as dummy_all_work,sum(dummy_all_pend) as dummy_all_pend," + 
			"sum(ping_work) as ping_work,sum(ping_pend) as ping_pend,sum(disconnect_inactive) as disconnect_inactive,sum(mib_audit_work) as mib_audit_work," + 
			"sum(mib_audit_pend) as mib_audit_pend ,sum(trap_audit_work) as trap_audit_work,sum(trap_audit_pend) as trap_audit_pend " + 
			"from capacity_propertytbl where `date` Between '" + cal + " 00:00:00" + "' and '" + cal + " 23:59:59'" + " group by (server_id)",[], function(err, rows){
			if (err) console.log(err);
			
			for (var i = 0;i < rows.length;i++) {
				rows[i].date = timestampConv( rows[i].date );
				rows[i]["server_name"] =  i + 1　+ "号機";
			}
			
			res.send(rows);
			//DBコネクションプールを閉じる			
			conn.release();
			
			});
		});
	}

});
//機種名一覧
app.get('/getDevFile', function(req, res){

	var spawn = require('child_process').spawn;
	var child = spawn('python',['C:\\module\\geteqptType.py']);
	
	child.stdin.end();
	
	child.stdout.on('data', function(data){
			console.log("stdout: " + data);
		});
	child.stderr.on('data', function(data){
			res.send(data);
		});

	child.on('exit', function(code){
			//res.send(code);
			res.send('');
		});

});
//top以外
app.get('/data1', function(req, res){
	var id = req.query.serverid;
	var cal = req.query.cal;
	if( cal === "undefined" ){
		db.getConnection(function(err,conn){
			if(err){console.log(err);callback(true); return;}
			conn.query("SELECT * FROM capacity_propertytbl where server_id = '" + id + "' and date > CURRENT_TIMESTAMP() - INTERVAL 1 DAY order by date desc",[], function(err, rows){
				if (err) console.log(err);
				
				for (var i = 0;i < rows.length;i++) {
					rows[i].customer_name =  rows[i].customer_name + "^/rep?serverid=" + id + "&customerid=" + rows[i].customer_id + "&customername=" + escape(rows[i].customer_name)  + "^_self";
					rows[i].date = timestampConv( rows[i].date );
				}
				res.send(rows);
				//DBコネクションプールを閉じる			
				conn.release();
			});
		});
	}
	else{
		db.getConnection(function(err,conn){
			if(err){console.log(err);callback(true); return;}
			conn.query("SELECT * FROM capacity_propertytbl where server_id = '" + id + "' and `date` Between '" + cal + " 00:00:00" + "' and '" + cal + " 23:59:59' order by date desc",[], function(err, rows){
				if (err) console.log(err);
				
				for (var i = 0;i < rows.length;i++) {
					rows[i].customer_name =  rows[i].customer_name + "^/rep?serverid=" + id + "&customerid=" + rows[i].customer_id + "&customername=" + escape(rows[i].customer_name)  + "^_self";
					rows[i].date = timestampConv( rows[i].date );
					//rows[i]["no"] = i + 1;
				}
				res.send(rows);
				conn.release();
			});
		});
	}
});

//詳細
app.get('/detail', function(req, res){
	var id = req.query.serverid;
	var customerid = req.query.customerid;
	db.getConnection(function(err,conn){
		if(err){console.log(err);callback(true); return;}
		conn.query("SELECT * FROM capacity_propertytbl where customer_id = '" + customerid + "' order by date desc",[], function(err, rows){	
				if (err) console.log(err);
				for (var i = 0; i < rows.length ;i++) {
					rows[i].date = timestampConv( rows[i].date );
					rows[i]["no"] = rows.length - i;
				}

				res.send(rows);
				conn.release();
			});	
		});	
});
app.get('/charts', function (req, res) {
	
	var customerid = req.query.customerid;
	db.getConnection(function(err,conn){
		if(err){console.log(err);callback(true); return;}
		conn.query("SELECT * FROM capacity_propertytbl where customer_id = '" + customerid + "'",[], function(err, rows){	
			if (err) console.log(err);
			for (var i = 0;i < rows.length;i++) {
				rows[i].date = timestampToUnixtime( rows[i].date );
			}
		
			if( err || !rows) console.log("No seeds found");
			  else 
			{

				res.send(rows);
				conn.release();
			}
	  });
	});
});
app.get('/bar', function (req, res) {
	
	var cal = req.query.cal;

	dataquery(cal,res);

});

function dataquery (cal,res){

	var resultdata = [];
	var serverid = 1;
	//1台目
	db.getConnection(function(err,conn){
		if(err){console.log(err);callback(true); return;}
		conn.query("select server_id,date(date) as date,sum(mo_all) as mo_all from swingdb.capacity_propertytbl where server_id = '1' and ( `date` > now() - INTERVAL 45 DAY) group by (date(date))",[], function(err, rows){

			if (err) console.log(err);
			
			for (var i = 0;i < rows.length;i++) {
				rows[i].date = timestampToUnixtime( rows[i].date );
			}
			
			if( err || !rows) console.log("bar graph data not found");
			  else {
				resultdata.push(rows);
			}
		
			//2台目
			conn.query("select server_id,date(date) as date,sum(mo_all) as mo_all from swingdb.capacity_propertytbl where server_id = '2' and ( `date` > now() - INTERVAL 45 DAY) group by (date(date))",[], function(err, rows){

				if (err) console.log(err);
				
				for (var i = 0;i < rows.length;i++) {
					rows[i].date = timestampToUnixtime( rows[i].date );
				}
				
				if( err || !rows) console.log("bar graph data not found");
				  else {
					resultdata.push(rows);
				}		
				//3台目
				conn.query("select server_id,date(date) as date,sum(mo_all) as mo_all from swingdb.capacity_propertytbl where server_id = '3' and ( `date` > now() - INTERVAL 45 DAY) group by (date(date))",[], function(err, rows){	

					if (err) console.log(err);
					
					for (var i = 0;i < rows.length;i++) {
						rows[i].date = timestampToUnixtime( rows[i].date );
					}
					
					if( err || !rows) console.log("bar graph data not found");
					  else {
						resultdata.push(rows);
					
					}
					
					//4台目
					conn.query("select server_id,date(date) as date,sum(mo_all) as mo_all from swingdb.capacity_propertytbl where server_id = '4' and ( `date` > now() - INTERVAL 45 DAY) group by (date(date))",[], function(err, rows){	

						if (err) console.log(err);
						
						for (var i = 0;i < rows.length;i++) {
							rows[i].date = timestampToUnixtime( rows[i].date );
						}
						
						if( err || !rows) console.log("bar graph data not found");
						  else {
							resultdata.push(rows);						
						}	
						
						//5台目
						conn.query("select server_id,date(date) as date,sum(mo_all) as mo_all from swingdb.capacity_propertytbl where server_id = '5' and ( `date` > now() - INTERVAL 45 DAY) group by (date(date))",[], function(err, rows){	

							if (err) console.log(err);
							
							for (var i = 0;i < rows.length;i++) {
								rows[i].date = timestampToUnixtime( rows[i].date );
							}
							
							if( err || !rows) console.log("bar graph data not found");
							  else {
								resultdata.push(rows);
							}
							
							//6台目
							conn.query("select server_id,date(date) as date,sum(mo_all) as mo_all from swingdb.capacity_propertytbl where server_id = '6' and ( `date` > now() - INTERVAL 45 DAY) group by (date(date))",[], function(err, rows){	

								if (err) console.log(err);
								
								for (var i = 0;i < rows.length;i++) {
									rows[i].date = timestampToUnixtime( rows[i].date );
								}
								
								if( err || !rows) console.log("bar graph data not found");
								  else {
								
									resultdata.push(rows);
								}

								//7台目
								conn.query("select server_id,date(date) as date,sum(mo_all) as mo_all from swingdb.capacity_propertytbl where server_id = '7' and ( `date` > now() - INTERVAL 45 DAY) group by (date(date))",[], function(err, rows){

									if (err) console.log(err);
									
									for (var i = 0;i < rows.length;i++) {
										rows[i].date = timestampToUnixtime( rows[i].date );
									}
									
									if( err || !rows) console.log("bar graph data not found");
									else {
									
										resultdata.push(rows);
										//console.log("999 " + resultdata.pop()[0].server_id);
										res.send(resultdata);
										conn.release();
									}
								});	
							});
						});
					});
				});
			});
		});
	});
}


function timestampConv(timestamp){

	var d = timestamp;
	var year  = d.getFullYear();
	var month = ( d.getMonth() + 1   < 10 ) ? '0' + String(d.getMonth() + 1) : d.getMonth() + 1;
	var day   = ( d.getDate()   < 10 ) ? '0' + d.getDate()   : d.getDate();
	var hour  = ( d.getHours()   < 10 ) ? '0' + d.getHours()   : d.getHours();
	var min   = ( d.getMinutes() < 10 ) ? '0' + d.getMinutes() : d.getMinutes();
	var sec   = ( d.getSeconds() < 10 ) ? '0' + d.getSeconds() : d.getSeconds();

	return year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec;
}
//UNIXTIMEに変換
function timestampToUnixtime(timestamp){

	return Date.parse(timestamp);
}
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
