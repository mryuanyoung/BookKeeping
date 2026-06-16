module.exports = {
	globDirectory: 'build',
	globPatterns: [
		'**/*.{json,ico,png,html,txt,css,js,woff,woff2}'
	],
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	swDest: 'build/static/js/sw.js'
};