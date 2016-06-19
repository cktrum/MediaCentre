var express 		= require('express'),
	youtube 		= require('../backend/youtube.js'),
	keyManagement	= require('../backend/keyManagement.js'),
	googleBooks 	= require('../backend/googleBooks.js')

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
 * GET /api/books/all
 * parameters:  limit		- Integer
 *				offset		- Integer
 *				preorder 	- Boolean
 *				published	- Boolean
 */
router.get('/books/all', googleBooks.getAllBooks)

/*
 * GET /api/books/author
 * parameters: 	author 		- String
 *				limit 		- Integer
 *				offset		- Integer
 *				preorder	- Boolean
 *				published	- Boolean
 */
router.get('/books/author', googleBooks.getByAuthor)

/* GET /api/books/update */
router.get('/books/update', googleBooks.refresh)

/* PUT /api/books/author
 * parameters: author 	- String
 */
router.put('/books/author', googleBooks.addNewAuthor)

/* DELETE /api/books/author
 * parameters: author 	- String
 */
router.delete('/books/author', googleBooks.deleteAuthorAndAllBooks)

/*
 * POST /key to upsert API key
 * parameters: 	source - String
 				key - String
*/
router.post('/key', keyManagement.saveKey)

module.exports = router