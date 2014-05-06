A template express webapp using Origami components
===

Defaults
---

* Uses Hogan
* A 'static' folder for assets
* Hogan template for layout with partials header, head, footer, body
* Compression enbaled
* Cookie parser enabled
* Secure session cookies enabled
* Set CORS header to allow requests from all domains

To use
---

	git clone https://github.com/netaphor/templateWebApp.git
	npm install
	bower install
	grunt
	node server/app.js

Config options
---

Open `./webapp/config.js`
Add a values for `COOKIE_SECRET` and `COOKIE_AGE`