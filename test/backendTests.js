var supertest 	= require('supertest'),
	should 		= require('should'),
	chai    = require('chai'),
	chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
var api = supertest.agent('http://localhost:3000/api')

var data = {
	newChannel: 'bbcradio1'
}

describe('The youtube API allows:', function () {
	it('POST /api/youtube/channel/new for adding a new channel', function (done) {
		api.post('/youtube/channel/new')
			.send({channelName: data.newChannel})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				done()
			})
	})

	it('GET /api/youtube/new for getting newly published videos', function (done) {
		api.get('/youtube/new')
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.should.have.property(data.newChannel)
				res.body[data.newChannel].should.be.instanceOf(Array)
				done()
			})
	})

	it('GET /api/youtube/old for getting saved videos', function (done) {
		api.get('/youtube/old')
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				res.body.should.have.property(data.newChannel)
				res.body[data.newChannel].should.be.instanceOf(Array)
				res.body[data.newChannel][0].should.have.properties(
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
				res.body[data.newChannel][0]['seen'].should.be.instanceOf(Boolean)
				done()	
			})
	})

	it('DELETE /api/youtube/channel/delete to delete a channel', function (done) {
		api.delete('/youtube/channel/delete')
			.query({name: data.newChannel})
			.expect(200)
			.end(function (err, res) {
				should.not.exist(err)
				api.get('/youtube/new')
					.expect(200)
					.end(function (err, res) {
						should.not.exist(err)
						res.body.should.not.have.property(data.newChannel)
						done()
				})
			})
	})
})