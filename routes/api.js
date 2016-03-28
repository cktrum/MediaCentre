var express = require('express'),
	youtube = require('../backend/youtube.js')

var router = express.Router()

/* GET /api/youtube/new
 * parameters: 	limit	- Integer
 * 				offset 	- Integer
*/
router.get('/youtube/new', youtube.getNewVideos)

/*
 * GET /api/youtube/old
 * parameters: 	limit		- Integer
 * 				offset 		- Integer
 *				channelID	- String (optional)
*/
router.get('/youtube/old', youtube.getOldVideos)

router.get('/youtube/channel', youtube.searchChannel)

/*
 * POST /api/youtube/channel/new
 * parameters: 	id 		- String
 * 				name 	- String
*/
router.post('/youtube/channel/new', youtube.addChannel)

/*
 * DELETE /api/youtube/channel/delete
 * parameters: id - String
*/
router.delete('/youtube/channel/delete', youtube.removeChannel)

/*
 * POST /youtube/key to upsert youtube API key
 * parameters: key - String
*/
router.post('/youtube/key', youtube.saveKey)

module.exports = router