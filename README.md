# QRCode.js
QRCode.js is javascript library for making QRCode. QRCode.js supports Cross-browser with HTML5 Canvas and table tag in DOM.
QRCode.js has no dependencies.

## Live demo

### Using Canvas & download as png file.

https://ryunosinfx.github.io/qrcodejs/index.html

### Using SVG & download as svg file.

https://ryunosinfx.github.io/qrcodejs/index-svg.html


## Basic Usages
```EJS
<div id="qrcode"></div>
<script type="module">
		import { QRCode } from "./qrcode.js"
		new QRCode(document.getElementById("qrcode"), "http://jindo.dev.naver.com/collie");
</script>
```

or with some options

```EJS
<div id="qrcode"></div>
<script type="module">
		import { QRCode } from "./qrcode.js"
		const qrcode = new QRCode(document.getElementById("qrcode"), {
			text: "http://jindo.dev.naver.com/collie",
			width: 128,
			height: 128,
			colorDark : "#000000",
			colorLight : "#ffffff",
			correctLevel : QRCode.CorrectLevel.H
		});
</script>
```

and you can use some methods

```
qrcode.clear(); // clear the code.
qrcode.makeCode("http://naver.com"); // make another code.
```

## Browser Compatibility
~~IE6~10,~~ Chrome, Firefox, Safari, Opera, Mobile Safari, Android, ~~Windows Mobile,~~ ETC.

It is ES module version.

## License
MIT License

## Contact
twitter @davidshimjs

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/davidshimjs/qrcodejs/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

Modified by ryunosinfx
