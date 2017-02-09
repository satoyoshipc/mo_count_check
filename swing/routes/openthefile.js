var path = require('path');
var deviceFileDir = 'C:\\module\\file';
var filename = 'eqptType.txt';
/*
 * GET home page.
 */
var fs = require('fs');
var http = require('http');

//機種名ファイルを開く
exports.text = function(req, res){

	fs.stat(deviceFileDir + '\\' + filename,function(e){
		if(e){
			console.error(filename + " File doesn't Exists!");
			res.setHeader('Content-Type', 'text/html charset=Shift-JIS');
			res.setEncoding= 'Shift-JIS';

			res.write("<HTML>");
			res.write(filename + " File doesn't Exists!" );
			res.write("<br><A href='/#jquery-ui-tabs-8' >戻る</A>" );
			res.write("</HTML>");
			res.end();
		}
		else{
			var file = fs.readFileSync(deviceFileDir + '\\' + filename);

			res.statusCode = 200;
			res.setHeader('Content-Type', 'text/csv charset=Shift-JIS');
			res.setEncoding= 'Shift-JIS';

			res.setHeader('Content-disposition', 'attachment; filename=' + filename );
			res.write(file );
			res.end();
		
		
		
		
		
		
		
		}
	});

}

