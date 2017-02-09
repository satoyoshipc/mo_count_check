/*
 * GET home page.
 */
exports.rep = function(req, res){
	res.render('rep', { title: req.query.customername,customerid: req.query.customerid,serverid: req.query.serverid });
};
