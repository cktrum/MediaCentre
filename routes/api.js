var express = require('express'),
	youtube = require('../backend/youtube.js')

var router = express.Router()

/* GET /api/youtube/new
 * parameters: -
*/
router.get('/youtube/new', youtube.getNewVideos)

/*
 * GET /api/youtube/old
 * parameters: -
*/
router.get('/youtube/old', youtube.getOldVideos)

/*
 * POST /api/youtube/channel/new
 * parameters: channelName - String
*/
router.post('/youtube/channel/new', youtube.addChannel)

/*
 * DELETE /api/youtube/channel/delete
 * parameters: name - String
*/
router.delete('/youtube/channel/delete', youtube.removeChannel)

/*
 * POST /youtube/key to upsert youtube API key
 * parameters: key - String
*/
router.post('/youtube/key', youtube.saveKey)

module.exports = router