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
	author: 'Niefers Tri',
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