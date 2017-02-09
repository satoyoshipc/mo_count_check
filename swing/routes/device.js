var path = require('path');
var deviceFileDir = 'C:\\module\\file';
var filename = 'eqptType.txt';
/*
 * GET home page.
 */
var fs = require('fs');

exports.csv = function(req, res){

	var str= '';

	var d=new Date();
	var year  = d.getFullYear();
	var month = d.getMonth() + 1;
	var day   = d.getDate();
	
	try{
		str = fs.statSync(deviceFileDir + '\\' + filename).mtime.getTime();
		console.log(str);
		}
	catch(e){
		str = "NO FILE";
	}
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/csv charset=Shift-JIS');
	res.setEncoding= 'Shift-JIS';

	res.setHeader('Content-disposition', 'attachment; stamp=' + year + month +  day );
	res.write(filename + ',' + str.toString());

	res.end();

};
//機種名ファイルを開く
exports.openthefile = function(req, res){
	var str= '';	
	//ファイルの最終更新日時を取得
	try{
		//最終更新日時を取得(UNIXTIME)
		str = fs.statSync(deviceFileDir + '\\' + filename).mtime.getTime();
		
		}
	catch(e){
		str = "NO FILE";
		res.write(str );
		res.end();
	}
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain charset=Shift-JIS');
	res.setEncoding= 'Shift-JIS';

	res.setHeader('Content-disposition', 'attachment; filename=' + filename );
	res.write(filename );

	res.end();
	


}

