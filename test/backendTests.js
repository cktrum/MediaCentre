// To run the tests, execute 'mocha' from root of project

var supertest 	= require('supertest'),
	should 		= require('should'),
	chai    	= require('chai'),
	chaiAsPromised = require('chai-as-promised'),
	_ 			= require('lodash')

chai.use(chaiAsPromised)
var api = supertest.agent('http://localhost:3000/api')

var data = {
	channelID: null,
	channelName: null,
	firstVideo: null
}

describe('The youtube API allows:', function () {
	it('GET /api/youtube/channel to get channels matching a query', function (done) {
		api.get('/youtube/channel')
			.query({query: 'SpinninRec'})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.should.be.instanceOf(Array)
				res.body[0].should.have.properties('id', 'name')
				data.channelID = res.body[0].id
				data.channelName = res.body[0].name
				done()
			})
	})

	it('POST /api/youtube/channel/new for adding a new channel', function (done) {
		api.post('/youtube/channel/new')
			.send({id: data.channelID, name: data.channelName})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				done()
			})
	})

	it('GET /api/youtube/new for getting newly published videos', function (done) {
		api.get('/youtube/new')
			.query({limit: 20, offset: 0})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.should.have.property(data.channelName)
				res.body[data.channelName].should.be.instanceOf(Array)
				res.body[data.channelName].length.should.be.equal(20)
				done()
			})
	})

	it('GET /api/youtube/old for getting saved videos', function (done) {
		api.get('/youtube/old')
			.query({limit: 20, offset: 0})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.should.have.property(data.channelName)
				res.body[data.channelName].should.be.instanceOf(Array)
				res.body[data.channelName][0].should.have.properties(
					'_id', 
					'title', 
					'publishedAt', 
					'thumbnail', 
					'url',
					'channel',
					'channelName',
					'crawled',
					'seen'
				)
				res.body[data.channelName][0]['seen'].should.be.instanceOf(Boolean)
				res.body[data.channelName].length.should.be.equal(20)
				data.firstVideo = res.body[data.channelName][0]
				done()	
			})
	})

	it('GET /api/youtube/old for getting saved videos with pagination', function (done) {
		api.get('/youtube/old')
			.query({limit: 15, offset: 1})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.should.have.property(data.channelName)
				res.body[data.channelName].should.be.instanceOf(Array)
				res.body[data.channelName].length.should.be.equal(15)
				res.body[data.channelName].should.not.containEql(data.firstVideo)
				done()	
			})
	})

	it('GET /api/youtube/old for getting saved videos for a specific channel', function (done) {
		api.get('/youtube/old')
			.query({channelID: data.channelID, limit: 15, offset: 1})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				_.size(res.body).should.be.equal(1)
				res.body.should.have.property(data.channelName)
				res.body[data.channelName].should.be.instanceOf(Array)
				done()
			})
	})

	it('DELETE /api/youtube/channel/delete to delete a channel', function (done) {
		api.delete('/youtube/channel/delete')
			.query({id: data.channelID})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				api.get('/youtube/new')
					.expect(200)
					.end(function (err, res) {
						should.not.exist(err)
						res.body.should.not.have.property(data.channelID)
						done()
				})
			})
	})
	
})

var parameters = {
	author: 'Stieg Larsson',
	returnedBook: null
}

describe('The books API allows', function () {
	it('PUT /api/books/author to add a new author', function (done) {
		api.put('/books/author')
			.send({author: parameters.author})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				done()
			})
	})

	it('GET /api/books/author to retrieve all books of an author', function (done) {
		api.get('/books/author')
			.query({author: parameters.author})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.length.should.equal(0)
				done()
			})
	})

	it('GET /api/books/update to get newest updates on all saved authors', function (done) {
		this.timeout(8000)
		api.get('/books/update')
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				done()
			})
	})

	it('GET /api/books/author to retrieve all books of an author', function (done) {
		api.get('/books/author')
			.query({author: parameters.author})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.length.should.be.above(0)
				res.body[0].should.have.properties('_id', 'title', 'authors', 'language', 'preorder', 'pubDate', 'isbn', 'thumbnail', 'searchedAuthor') //'description'
				res.body[0].searchedAuthor.should.equal(parameters.author.toLowerCase())
				parameters.returnedBook = res.body[1]
				done()
			})
	})

	it('GET /api/books/author supports pagination', function (done) {
		api.get('/books/author')
			.query({author: parameters.author, limit: 10, offset: 1})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.length.should.equal(10)
				res.body[0].should.have.properties('_id', 'title', 'authors', 'language', 'preorder', 'pubDate', 'isbn', 'thumbnail', 'searchedAuthor') //'description'
				res.body[0].searchedAuthor.should.equal(parameters.author.toLowerCase())
				res.body[0].should.containEql(parameters.returnedBook)
				done()
			})
	})

	it('GET /api/books/all to retrieve all saved books', function (done) {
		api.get('/books/all')
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.should.have.properties(parameters.author.toLowerCase())
				res.body[parameters.author.toLowerCase()].length.should.be.above(0)
				res.body[parameters.author.toLowerCase()][0].should.have.properties('_id', 'title', 'authors', 'language', 'preorder', 'pubDate', 'isbn', 'thumbnail', 'searchedAuthor') //'description'
				res.body[parameters.author.toLowerCase()][0].searchedAuthor.should.equal(res.body[parameters.author.toLowerCase()][1].searchedAuthor)
				res.body[parameters.author.toLowerCase()][0].pubDate.should.be.above(res.body[parameters.author.toLowerCase()][1].pubDate)
				parameters.returnedBook = res.body[parameters.author.toLowerCase()][1]
				done()
			})
	})

	it('GET /api/books/all supports pagination', function (done) {
		api.get('/books/all')
			.query({limit: 10, offset: 1})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.should.have.properties(parameters.author.toLowerCase())
				res.body[parameters.author.toLowerCase()].length.should.equal(10)
				res.body[parameters.author.toLowerCase()][0].should.have.properties('_id', 'title', 'authors', 'language', 'preorder', 'pubDate', 'isbn', 'thumbnail', 'searchedAuthor') //'description'
				res.body[parameters.author.toLowerCase()][0].pubDate.should.be.above(res.body[parameters.author.toLowerCase()][1].pubDate)
				res.body[parameters.author.toLowerCase()][0].should.containEql(parameters.returnedBook)
				done()
			})
	})

	it('GET /api/books/all to get all books up for preordering', function (done) {
		api.get('/books/all')
			.query({preorder: true, published: false})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body[Object.keys(res.body)[0]][0].should.have.properties('_id', 'title', 'authors', 'language', 'preorder', 'pubDate', 'isbn', 'thumbnail') //'description'
				res.body[Object.keys(res.body)[0]][0].preorder.should.equal(true)
				done()
			})
	})

	it('DELETE /api/books/author to delete an author and all corresponding books', function (done) {
		api.delete('/books/author')
			.query({author: parameters.author})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				done()
			})
	})
})

var params = {
	id_user: null,
	id_query: null
}

describe('The Twitter API allows', function () {
	it('GET /api/twitter/search/user to search for a user given a search phrase', function (done) {
		api.get('/twitter/search/user')
			.query({username: 'bbcr1'})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.should.be.instanceOf(Array)
				res.body[0].should.have.properties('id', 'name', 'screen_name')
				res.body.should.containEql({id: 7111412, name: 'BBC Radio 1', screen_name: 'BBCR1'})
				done()
			})
	})
	it('PUT /api/twitter/add/user to add a user', function (done) {
		api.put('/twitter/add/user')
			.send({username: 'bbcr1'})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.should.be.instanceOf(Number)
				id_user = res.body
				done()
			})
	})

	it('PUT /api/twitter/add/query to add a query', function (done) {
		api.put('/twitter/add/query')
			.send({query: 'Joko Klaas since:2017-03-04'})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.should.be.instanceOf(Number)
				id_query = res.body
				done()
			})
	})

	it('GET /api/twitter/users to get all saved users', function (done) {
		api.get('/twitter/users')
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.should.be.instanceOf(Array)
				res.body[0].should.have.properties('id', 'query', 'type')
				res.body.should.matchAny({'id': id_user, 'query': 'from:bbcr1', 'type': 'user'})
				done()
			})
	})

	it('GET /api/twitter/topics to get all saved topic queries', function (done) {
		api.get('/twitter/topics')
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.should.be.instanceOf(Array)
				res.body[0].should.have.properties('id', 'query', 'type')
				done()
			})
	})

	it('GET /api/twitter/user to get tweets by a certain user', function (done) {
		api.get('/twitter/user')
			.query({id: id_user})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.should.have.property('statuses')
				res.body.statuses.should.be.instanceOf(Array)
				res.body.statuses[0].should.have.properties('id', 'text', 'user')
				res.body.statuses[0].user.should.have.properties('id', 'name', 'screen_name')
				res.body.statuses[0].user.name.should.equal('BBC Radio 1')
				done()
			})
	})

	it('GET /api/twitter/query to get tweets for a certain search query', function (done) {
		api.get('/twitter/query')
			.query({id: id_query})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.should.have.property('statuses')
				res.body.statuses.should.be.instanceOf(Array)
				res.body.statuses[0].should.have.properties('created_at', 'id', 'text', 'user')
				res.body.statuses.should.matchEach(function (item) {
					date = new Date(item.created_at)
					start_date = new Date("2017-03-04")
					date.should.be.aboveOrEqual(start_date)
				})
				done()
			})
	})

	it('DELETE /api/twitter/user to delete saved user', function (done) {
		api.delete('/twitter/user')
			.query({id: id_user})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				done()
			})
	})

	it('DELETE /api/twitter/topic to delete a saved topic', function (done) {
		api.delete('/twitter/topic')
			.query({id: id_query})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				done()
			})
	})
})