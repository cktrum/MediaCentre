var express 		= require('express'),
	youtube 		= require('../backend/youtube.js'),
	keyManagement	= require('../backend/keyManagement.js'),
	googleBooks 	= require('../backend/googleBooks.js'),
	twitter 		= require('../backend/twitter.js')

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
 * DELETE /api/youtube/channel/delete to delete a youtube channel
 * parameters: id - String
*/
router.delete('/youtube/channel/delete', youtube.removeChannel)

/*
 * GET /api/books/all to get all books for all saved authors
 * parameters:  limit		- Integer
 *				offset		- Integer
 *				preorder 	- Boolean
 *				published	- Boolean
 */
router.get('/books/all', googleBooks.getAllBooks)

/*
 * GET /api/books/author to get all books for an author
 * parameters: 	author 		- String
 *				limit 		- Integer
 *				offset		- Integer
 *				preorder	- Boolean
 *				published	- Boolean
 */
router.get('/books/author', googleBooks.getByAuthor)

/* GET /api/books/update to pull books for all saved books */
router.get('/books/update', googleBooks.refresh)

/* PUT /api/books/author to add a new author
 * parameters: author 	- String
 */
router.put('/books/author', googleBooks.addNewAuthor)

/* DELETE /api/books/author to delete an author and all its books
 * parameters: author 	- String
 */
router.delete('/books/author', googleBooks.deleteAuthorAndAllBooks)

router.get('/twitter/auth/initiate', twitter.requestToken)
router.get('/twitter/auth/authenticate', twitter.authCallback)

router.get('/twitter/search/user', twitter.searchUser)
/*
 * PUT /api/twitter/add to add a new search query
 * parameters: username - String
 */
router.put('/twitter/add/user', twitter.addUser)
router.put('/twitter/add/query', twitter.addQuery)
/*
 * GET /api/twitter/search/tweets get tweets for a particular query
 * parameters: 	id - Number
 */
router.get('/twitter/user', twitter.searchTweetsForUser)

router.get('/twitter/query', twitter.searchTweetsForQuery)

/*
 * GET /api/twitter/users to get all saved users
 */
router.get('/twitter/users', twitter.getUsers)
/*
 * GET /api/twitter/topics to get all saved topics
 */
router.get('/twitter/topics', twitter.getTopics)

/*
 * DELETE /api/twitter/user to delete a saved user
 * parameters: id - Number
 */
router.delete('/twitter/user', twitter.removeUser)
router.delete('/twitter/topic', twitter.removeTopic)

/*
 * POST /key to upsert API key
 * parameters: 	source - String
 				key - String
*/
router.post('/key', keyManagement.saveKey)

/* GET /keys to get all saved keys */
router.get('/keys', keyManagement.getKeys)

module.exports = router