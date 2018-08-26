const express = require('express');
const app = express();
const fs = require('fs');
const request = require('request');
const mkdirp = require('mkdirp');

const url = "http://c.tile.openstreetmap.org"

/* 取到 zoom = 16 為止 */
const TAIWAN_LIMIT_ZOOM = 16

/* 起始點，開始往下抓取拼圖 */
const TAIWAN_INIT_ZOOM = 6
const TAIWAN_INIT_X = 53
const TAIWAN_INIT_Y = 27

/* 開始點，若時間太長無法一次抓取完畢或是斷線，輸入前一次最後的(z, x, y) 即可繼續 */
// const TAIWAN_START_ZOOM = 15
// const TAIWAN_START_X = 27489
// const TAIWAN_START_Y = 13897

const TAIWAN_START_ZOOM = 6
const TAIWAN_START_X = 53
const TAIWAN_START_Y = 27

app.get('/', function (req, res) {
  return res.status(200).send('OSM offline image crawler ready to serve');
});

app.get('/GET/TaiwanImage', (req, res) => {
	getTaiwanOfflineImage(TAIWAN_START_ZOOM, TAIWAN_START_X, TAIWAN_START_Y, res)
})

function getTaiwanOfflineImage(zoom , x, y, res){
	let reqUrl = `${url}/${zoom}/${x}/${y}.png`

	if(!fs.existsSync(`./taiwan/${zoom}/${x}`)){
		mkdirp(`./taiwan/${zoom}/${x}`)
	}

	request
		.get(reqUrl)
		.on('response', response => {
			const image = fs.createWriteStream(`./taiwan/${zoom}/${x}/${y}.png`)
			let imageStream = response.pipe(image)

			imageStream.on('finish', () => {

				console.log(`save ${zoom}/${x}/${y}.png okay`)

				const END = Math.pow(2, zoom - TAIWAN_INIT_ZOOM)
				const END_X = TAIWAN_INIT_X * END + END - 1
				const END_Y = TAIWAN_INIT_Y * END + END - 1
				const NEXT_POINT = Math.pow(2, zoom - TAIWAN_INIT_ZOOM)

				/* init */
				if(zoom == TAIWAN_INIT_ZOOM && x == TAIWAN_INIT_X && y == TAIWAN_INIT_Y){
					getTaiwanOfflineImage(zoom + 1, x * 2, y * 2, res)
				}
				/* end */
				else if(zoom == TAIWAN_LIMIT_ZOOM && x == x + END && y == y + END){
					res.status(200).send(`save taiwan offline image successful`)
				}
				/* add y */
				else if(y != END_Y){
					getTaiwanOfflineImage(zoom, x, y + 1, res)
				}
				/* add x, y is end */
				else if(x != END_X && y == END_Y){
					getTaiwanOfflineImage(zoom, x + 1, TAIWAN_INIT_Y * NEXT_POINT, res)
				}
				/* add zoom, x and y are end */
				else if(zoom != TAIWAN_LIMIT_ZOOM && x == END_X && y == END_Y){
					getTaiwanOfflineImage(zoom + 1, TAIWAN_INIT_X * NEXT_POINT * 2, TAIWAN_INIT_Y * NEXT_POINT * 2, res)
				}
			})
		})
}

app.listen(process.env.PORT || 3000, function () {
  console.log("connect successful");
});