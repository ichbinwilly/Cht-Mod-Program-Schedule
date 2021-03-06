# Cht Mod Program Schedule

The **Cht Mod Program Schedule** is a sample application created to show how to do web crawler periodically. The project is based on the [Express](https://expressjs.com/) framework and [Bootstrap](http://getbootstrap.com/) to build a simple app that is deployed to [AWS Elastic Beanstalk](http://aws.amazon.com/elasticbeanstalk/). And its original project is from [AWS Sample](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/nodejs-getstarted.html). Also I would recommend to follow the [Getting Started with Node.js on Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/nodejs-getstarted.html) to build up the system.

## Requirements:
* express
* cheerio
* node-cron

## Installation
Execute this command to install the project:
```js
npm install
```

## Run
Execute this command to run the project:
```js
node app
```
## Live Demo
 > [Live Demo on AWS Elastic Beanstalk](http://chtmod-env.sbfgd8xg3y.us-east-2.elasticbeanstalk.com/)
 Sorry, the live demo is no longer available :( (updates on 2018/12/02)

![screenshot2](https://cdn-images-1.medium.com/max/800/1*IYupOsr6YuIJZVjy6oqBzQ.png)

## Explain
We use the [request module](https://www.npmjs.com/package/request) to make http calls.
```js
request(url, (err, res, body) => {
 
 //
 //process here
 //
 
});
```
Put the result of web crawler into cheerio
```js
const $ = cheerio.load(body)
```
And finally we analysis and break down the DOM to fetch the data. The program information is wrapped in class wrapper.
So the first level is calss rowat. We also need to fetch the class rowat_gray which represents the information in highlighted grey row as well.
```js
$('.wrapper .rowat, .rowat_gray').each(function(i, elem) {
   tvshows.push(
    $(this).text().split('\n')
  )
})
```
update the latest program every hour
```js
cron.schedule('0 0 */1 * * *', function(){
                  // ↑execute on every hour (*/1 -> (0~24 hour by every one hour) 0 minute 0 second
});
```
## Updates
I'm going to revise this project into a Line bot which provides the program query service. The user can enter keywords and query the most recently programs which contains the keywords.
* Line bot
* Carousel
* Buttons
* TODO: add entertainment and news
