exports.get500 = (req, res, next) => {
	res.status(500).render('500', {
		pageTitle: 'Error',
		path: '/500',
		isAuthenticated: req.session.isLoggedIn
	});
};

exports.get404 = (req, res, next) => {
	res.status(404).render('error', {
		pageTitle: 'Page Not Found',
		path: '/error',
		isAuthenticated: req.session.isLoggedIn
	});
};
