var path = require('path');
/*
 * GET home page.
 */
var fs = require('fs');
var mysql      = require('mysql');

var db = mysql.createPool({
  host     : 'localhost',
  user     : 'root',
  password : 'actwatch',
  database : 'swingdb'
});
exports.csv = function(req, res){
	var conv = '';
	var tmpcumstomer = '';
	var csvstr= '';
	var labels = req.query.labels;
	var quote = req.query.quote;
	var pageid = req.query.downloadid;
	var cal = req.query.cal;
	var fname = '';

	var d=new Date();
	var year  = d.getFullYear();
	var month = d.getMonth() + 1;
	var day   = d.getDate();
	
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/csv charset=Shift-JIS');
	res.setEncoding= 'Shift-JIS';

	
	//全体の合計
	if ( pageid == 0 ){
		if( cal === "undefined" || cal == ""){
			db.getConnection(function(err,conn){
				if(err){console.log(err); callback(true);return;}				
				conn.query("select server_id,sum(mo_all) as mo_all,sum(mib_all_work) as mib_all_work,sum(mib_all_pend) as mib_all_pend ," + 
					"sum(trap_all_work) as trap_all_work,sum(trap_all_pend) as trap_all_pend,sum(dummy_all_work) as dummy_all_work,sum(dummy_all_pend) as dummy_all_pend," + 
					"sum(ping_work) as ping_work,sum(ping_pend) as ping_pend,sum(disconnect_inactive) as disconnect_inactive,sum(mib_audit_work) as mib_audit_work," + 
					"sum(mib_audit_pend) as mib_audit_pend ,sum(trap_audit_work) as trap_audit_work,sum(trap_audit_pend) as trap_audit_pend " + 
					"from swingdb.capacity_propertytbl where `date` > CURRENT_TIMESTAMP() - INTERVAL 1 DAY group by (server_id)",[], function(err,results){
						//レスポンスの返信
						callbackquery(err,results);
						//コネクションの終了
						conn.release();

					});
					
					fname = "サマリ" + year + "-" + month + "-" + day + ".csv";
				
				});

		}
		else{
			//日時指定の場合
			db.getConnection(function(err,conn){
			if(err){console.log(err); callback(true);return;}
			
			conn.query("select server_id,sum(mo_all) as mo_all,sum(mib_all_work) as mib_all_work,sum(mib_all_pend) as mib_all_pend ," + 
				"sum(trap_all_work) as trap_all_work,sum(trap_all_pend) as trap_all_pend,sum(dummy_all_work) as dummy_all_work,sum(dummy_all_pend) as dummy_all_pend," + 
				"sum(ping_work) as ping_work,sum(ping_pend) as ping_pend,sum(disconnect_inactive) as disconnect_inactive,sum(mib_audit_work) as mib_audit_work," + 
				"sum(mib_audit_pend) as mib_audit_pend ,sum(trap_audit_work) as trap_audit_work,sum(trap_audit_pend) as trap_audit_pend " + 
				"from swingdb.capacity_propertytbl where `date` Between '" + cal + " 00:00:00" + "' and '" + cal + " 23:59:59'" + " group by (server_id)",[], function(err,results){

					fname = "サマリ" + cal + ".csv" ;


					callbackquery(err,results);
					conn.release();
				});

				
			});
		
		}		
			
		function callbackquery(err, rows){
			
			//項目名取得
			if (rows.length < 0 ) console.log("Data Nothing !");
			else{

				for (var i = 0;i < rows.length;i++) {
					
					//タイトルを書く
					if(i==0 && labels == "true"){

						csvstr = "server_id," + 
							"mo_all," +
							"mib_all_work,"+
							"mib_all_pend,"+ 
							"trap_all_work,"+
							"trap_all_pend,"+
							"ping_work,"+
							"ping_pend,"+
							"dummy_all_work,"+
							"dummy_all_pend,"+
							"disconnect_inactive,"+
							"mib_audit_work,"+
							"mib_audit_pend,"+
							"trap_audit_work,"+
							"trap_audit_pend" ;
							csvstr = csvstr + "\r\n";				
					}
					//ダブルクォーテーションでくくるか
					if ( quote == "true" ){

						csvstr = csvstr + '"' +  rows[i].server_id + '",' + 
							'"' + rows[i].mo_all + '",' +
							'"' + rows[i].mib_all_work + '",' +
							'"' + rows[i].mib_all_pend + '",' +
							'"' + rows[i].trap_all_work + '",' +
							'"' + rows[i].trap_all_pend + '",' +
							'"' + rows[i].ping_work + '",' +
							'"' + rows[i].ping_pend + '",' +
							'"' + rows[i].dummy_all_work + '",' +
							'"' + rows[i].dummy_all_pend + '",' +
							'"' + rows[i].disconnect_inactive + '",' +
							'"' + rows[i].mib_audit_work + '",' +
							'"' + rows[i].mib_audit_pend + '",' +
							'"' + rows[i].trap_audit_work + '",' +
							'"' + rows[i].trap_audit_pend + '"\r\n';	;
					}else{
						csvstr = csvstr + rows[i].server_id + "," + 
							rows[i].mo_all + "," +
							rows[i].mib_all_work + ","+
							rows[i].mib_all_pend + "," +
							rows[i].trap_all_work + "," +
							rows[i].trap_all_pend + "," +
							rows[i].ping_work + "," +
							rows[i].ping_pend + "," +
							rows[i].dummy_all_work + "," +
							rows[i].dummy_all_pend + "," +
							rows[i].disconnect_inactive + "," +
							rows[i].mib_audit_work + "," +
							rows[i].mib_audit_pend + "," +
							rows[i].trap_audit_work + "," +
							rows[i].trap_audit_pend + "\r\n";	;	
					}
				}
				res.setHeader('Content-disposition', 'attachment; filename=' + fname );
				res.write(csvstr);
			}
			res.end();
		};
	}
	//カスタマ毎のグラフ
	else if ( pageid >= 100 ){
		var customerid = req.query.customerid;

		if( cal == null ){
			db.getConnection(function(err,conn){
				conn.query("SELECT " +
							"customer_id," + 
							"date," + 
							"customer_name," +
							"mo_all," + 
							"mib_all_work," + 
							"mib_all_pend," + 
							"trap_all_work," + 
							"trap_all_pend," + 
							"ping_work, " + 
							"ping_pend," + 
							"dummy_all_work," +  
							"dummy_all_pend," + 
							"disconnect_inactive," + 
							"mib_audit_work," + 
							"mib_audit_pend," + 
							"trap_audit_work," + 
							"trap_audit_pend " + 
							"FROM swingdb.capacity_propertytbl where customer_id = " + customerid + " order by date DESC", function(err,results){
				callbackq(err,results);
				conn.release();
				});
				
				fname =  year + "-" + month + "-" + day + ".csv";
			});
		}
		else{
			// 日時指定の時
			db.getConnection(function(err,conn){
				db.query("SELECT " +
						"customer_id," + 
						"date," + 
						"customer_name," +
						"mo_all," + 
						"mib_all_work," + 
						"mib_all_pend," + 
						"trap_all_work," + 
						"trap_all_pend," + 
						"ping_work, " + 
						"ping_pend," + 
						"dummy_all_work," +  
						"dummy_all_pend," + 
						"disconnect_inactive," + 
						"mib_audit_work," + 
						"mib_audit_pend," + 
						"trap_audit_work," + 
						"trap_audit_pend " + 
						"FROM swingdb.capacity_propertytbl where `date` Between '" + cal + " 00:00:00" + "' and '" + cal + " 23:59:59' and customer_id = " + customerid + " order by date DESC", function(err,results){
				callbackq(err,results);
				conn.release();
				});
				
				fname = cal + ".csv";
			});
		}
		//カスタマ毎の出力の時のcallback
		function callbackq(err, rows){
			var customername = "";
			//項目名取得
			if (rows.length < 0 ) console.log("Data Nothing !");
			else{
				
				for (var i = 0;i < rows.length;i++) {
					
					//タイトルを書く
					if(i==0 && labels == "true"){

						csvstr = "customer_id," + 
							"date," + 
							"customer_name," + 
							"mo_all," +
							"mib_all_work,"+
							"mib_all_pend,"+ 
							"trap_all_work,"+
							"trap_all_pend,"+
							"ping_work,"+
							"ping_pend,"+
							"dummy_all_work,"+
							"dummy_all_pend,"+
							"disconnect_inactive,"+
							"mib_audit_work,"+
							"mib_audit_pend,"+
							"trap_audit_work,"+
							"trap_audit_pend" ;		
							csvstr = csvstr + "\r\n";				
					}

					//ダブルクォーテーションでくくるか
					if ( quote == "true" ){

						csvstr =  csvstr + '"' + rows[i].customer_id + '",' + 
							'"' + rows[i].date + '",' + 
							'"' + rows[i].customer_name + '",' + 
							'"' + rows[i].mo_all + '",' +
							'"' + rows[i].mib_all_work + '",' +
							'"' + rows[i].mib_all_pend + '",' +
							'"' + rows[i].trap_all_work + '",' +
							'"' + rows[i].trap_all_pend + '",' +
							'"' + rows[i].ping_work + '",' +
							'"' + rows[i].ping_pend + '",' +
							'"' + rows[i].dummy_all_work + '",' +
							'"' + rows[i].dummy_all_pend + '",' +
							'"' + rows[i].disconnect_inactive + '",' +
							'"' + rows[i].mib_audit_work + '",' +
							'"' + rows[i].mib_audit_pend + '",' +
							'"' + rows[i].trap_audit_work + '",' +
							'"' + rows[i].trap_audit_pend + '"\r\n';	
					}else{
						csvstr = csvstr + rows[i].customer_id + "," + 
							rows[i].date + "," + 
							rows[i].customer_name + "," + 
							rows[i].mo_all + "," +
							rows[i].mib_all_work + ","+
							rows[i].mib_all_pend + "," +
							rows[i].trap_all_work + "," +
							rows[i].trap_all_pend + "," +
							rows[i].ping_work + "," +
							rows[i].ping_pend + "," +
							rows[i].dummy_all_work + "," +
							rows[i].dummy_all_pend + "," +
							rows[i].disconnect_inactive + "," +
							rows[i].mib_audit_work + "," +
							rows[i].mib_audit_pend + "," +
							rows[i].trap_audit_work + "," +
							rows[i].trap_audit_pend + "\r\n";
							
					}
					customername = rows[i].customer_name;
				}
				
				res.setHeader('Content-disposition', 'attachment; filename='+ customername + fname );
				res.write(csvstr);
			}

			//セッションを切る
			res.end();
		};	
	}
	else{
		if( cal === "undefined" || cal == ""){
			//サーバごと
			db.query("SELECT * FROM capacity_propertytbl where server_id = '" + pageid + "' and date > CURRENT_TIMESTAMP() - INTERVAL 1 DAY order by date desc", callbackque);

			fname =  year + "-" + month + "-" + day + ".csv";
		}
		else{
			db.query("SELECT * FROM capacity_propertytbl where server_id = '" + pageid + "' and `date` Between '" + cal + " 00:00:00" + "' and '" + cal + " 23:59:59' order by date desc", callbackque);
			fname =  cal + ".csv";
		}
		function callbackque(err, rows){

			//項目名取得
			if (rows.length < 0 ) console.log("Data Nothing !");
			else{
				
				for (var i = 0;i < rows.length;i++) {
					
					//タイトルを書く
					if(i==0 && labels == "true"){

						csvstr = "customer_id," + 
							"date," + 
							"customer_name," + 
							"mo_all," +
							"mib_all_work,"+
							"mib_all_pend,"+ 
							"trap_all_work,"+
							"trap_all_pend,"+
							"ping_work,"+
							"ping_pend,"+
							"dummy_all_work,"+
							"dummy_all_pend,"+
							"disconnect_inactive,"+
							"mib_audit_work,"+
							"mib_audit_pend,"+
							"trap_audit_work,"+
							"trap_audit_pend" ;
							csvstr = csvstr + "\r\n";				
					}
					//ダブルクォーテーションでくくるか
					if ( quote == "true" ){
						csvstr =  csvstr + '"' + rows[i].customer_id + '",' + 
							'"' + rows[i].date + '",' + 
							'"' + rows[i].customer_name + '",' + 
							'"' + rows[i].mo_all + '",' +
							'"' + rows[i].mib_all_work + '",' +
							'"' + rows[i].mib_all_pend + '",' +
							'"' + rows[i].trap_all_work + '",' +
							'"' + rows[i].trap_all_pend + '",' +
							'"' + rows[i].ping_work + '",' +
							'"' + rows[i].ping_pend + '",' +
							'"' + rows[i].dummy_all_work + '",' +
							'"' + rows[i].dummy_all_pend + '",' +
							'"' + rows[i].disconnect_inactive + '",' +
							'"' + rows[i].mib_audit_work + '",' +
							'"' + rows[i].mib_audit_pend + '",' +
							'"' + rows[i].trap_audit_work + '",' +
							'"' + rows[i].trap_audit_pend + '"\r\n';	
					}else{
						csvstr = csvstr + rows[i].customer_id + "," + 
							rows[i].date + "," + 
							rows[i].customer_name + "," + 
							rows[i].mo_all + "," +
							rows[i].mib_all_work + ","+
							rows[i].mib_all_pend + "," +
							rows[i].trap_all_work + "," +
							rows[i].trap_all_pend + "," +
							rows[i].ping_work + "," +
							rows[i].ping_pend + "," +
							rows[i].dummy_all_work + "," +
							rows[i].dummy_all_pend + "," +
							rows[i].disconnect_inactive + "," +
							rows[i].mib_audit_work + "," +
							rows[i].mib_audit_pend + "," +
							rows[i].trap_audit_work + "," +
							rows[i].trap_audit_pend + "\r\n";
					}

				}
				res.setHeader('Content-disposition', 'attachment; filename=' + pageid + "号機"+  fname );
				res.write(csvstr);
			}

			res.end();
		};
	}
};


