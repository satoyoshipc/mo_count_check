function DownloadJSON2CSV(objArray)
{
   var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;

   var str = '';

   for (var i = 0; i < array.length; i++) {
	   var line = '';

	   for (var index in array[i]) {
			line += array[i][index] + ',';
	   }

	   // Here is an example where you would wrap the values in double quotes
	   // for (var index in array[i]) {
	   //    line += '"' + array[i][index] + '",';
	   // }

	   line.slice(0,line.Length-1); 

	   str += line + '\r\n';
   }
   // Might want to change this output
   window.open( "data:text/csv;charset=utf-8," + escape(str))
}



//downloadを行う
function download(pid,customerid){
	var quote = document.getElementById('quote'+ pid).checked;
	var csvtitle =document.getElementById('labels'+ pid).checked;
	var date =document.getElementById('datepicker'+ pid).value;
	location.href='/download?downloadid=' + pid + '&quote=' + quote + '&labels=' + csvtitle + '&customerid=' + customerid + '&cal=' + date.split('/').join('-');
}
