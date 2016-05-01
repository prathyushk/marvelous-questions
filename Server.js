var express = require("express");
var bodyParser = require("body-parser");
var distFinder = require("./public/js/levenshtein");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var privkey = System.getenv("PRIV_KEY");
var md5 = require('md5');
var app = express();
var router = express.Router();
var path = __dirname + '/views/';
var pubkey = "70a96fc75f1557c73820b896ec806902";
var help = "Sorry, I couldn't understand your question.<br> Please try rephrasing or try one of these questions: <br>'Who is Iron Man?'<br>'What Comics was Hulk in?'<br>'Show me a picture of spider-man'<br>'Who was in the infinity wars?'<br>'Who wrote the unbeatable squirrel girl?'";

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/static', express.static('public'));

process.on('uncaughtException', function(ex) {console.log(ex);});

app.post('/processq', function(req, res) {
	var toParse = req.body.question;
	var msftget = "https://api.projectoxford.ai/luis/v1/application?id=1207bd94-2b1e-49b6-a9f8-7bb18b367aa8&subscription-key=1aced98869eb4596948bc2d3daafff1e&q="+encodeURIComponent(toParse);
	makeXMLHttpRequest(msftget,function(){
	    var resp = JSON.parse(this.responseText);
	    console.log(resp);
	    if(resp["intents"][0]["intent"] == "CoWCh"){
		if(resp["entities"].length > 0 && resp["entities"][0].type == "CharacterName"){
		    getCharacter(resp["entities"][0].entity,3,function(character){
				if(character["name"] != ""){
				    var comics = character["comics"]["items"];
				    if(comics.length == 0){
					res.send("Sorry, no comics were found to contain "+character["name"]);
					return;
				    }
				    var str = "Some of the comics " + character["name"] + " was in: <br>";
				    for(var c = 0,l=comics.length;c<l;c++){
					str += "<a href='javascript:void(0);' onclick='showComic("+'"'+comics[c]["name"]+'"'+");'>"+comics[c]["name"]+"</a><br>";
				    }
				    res.send(str);
				}
				else
				    res.send("Sorry, I couldn't find the character " + resp["entities"][0].entity);
			    });
		}
		else
		    res.send(help);
	    }
	    else if(resp["intents"][0]["intent"] == "ChICo"){
		if(resp["entities"].length > 0 && resp["entities"][0].type == "Comic"){
		    getComic(resp["entities"][0].entity,5,function(comic){
			    if(comic["title"] != ""){
				var characters = comic["characters"]["items"];
				var str = "Some characters that were in " + comic["title"] + ": <br>";
				for(var c = 0,l=characters.length;c<l;c++){
				    str += "<a href='javascript:void(0);' onclick='showCharacter("+'"'+characters[c]["name"]+'"'+");'>"+characters[c]["name"] + '</a><br>';
				}
				res.send(str);
			    }
			    else
				res.send("Sorry, I couldn't find the comic " +resp["entities"][0].entity);
			});
		}	
		else
		    res.send(help);
	    }
	    else if(resp["intents"][0]["intent"] == "ChIEv"){
		if(resp["entities"].length > 0 && resp["entities"][0].type == "Event"){
		    getEvent(resp["entities"][0].entity,function(event){
			    if(event["title"] != ""){
				var characters = event["characters"]["items"];
				var str = event["description"]+"<br><br>Some characters that were involved in " + event["title"] + ": <br>";
				for(var c = 0,l=characters.length;c<l;c++){
                                    str += "<a href='javascript:void(0);' onclick='showCharacter("+'"'+characters[c]["name"]+'"'+");'>"+characters[c]["name"] + '</a><br>';
				}
                                res.send(str);
			    }
			    else
				res.send("Sorry, I couldn't find the event " + resp["entities"][0].entity);
			});
		}
		else
		    res.send(help);
	    }
	    else if(resp["intents"][0]["intent"] == "EvWCh"){
		if(resp["entities"].length > 0 && resp["entities"][0].type == "CharacterName"){
		    getCharacter(resp["entities"][0].entity,3,function(character){
			    if(character["name"] != ""){
				var events = character["events"]["items"];
				var str = "Some events that " + character["name"] + " was involved in: <br>";
				for(var c=0,l=events.length;c<l;c++){
				    str += "<a href='javascript:void(0);' onclick='showEvent("+'"'+events[c]["name"]+'"'+");'>"+events[c]["name"] + '</a><br>';
				}
				res.send(str);
			    }
			    else
				res.send("Sorry, I couldn't find the character " + resp["entities"][0].entity);
			});
		}
		else
		    res.send(help);
	    }
	    else if(resp["intents"][0]["intent"] == "CoBCr"){
		if(resp["entities"].length > 0 && resp["entities"][0].type == "Creator"){
		    getCreator(resp["entities"][0].entity,5,function(creator){
			    if(creator["fullName"] != ""){
				var comics = creator["comics"]["items"];
				var str = "Some comics that " + creator["fullName"] + " wrote: <br>";
				for(var c =0,l=comics.length;c<l;c++){
				    str += "<a href='javascript:void(0);' onclick='showComic("+'"'+comics[c]["name"]+'"'+");'>"+comics[c]["name"]+"</a><br>";
				}
				res.send(str);
			    }
			    else
				res.send("Sorry, I couldn't find the creator " + resp["entities"][0].entity);
			});
		}
		else
		    res.send(help);
	    }
	    else if(resp["intents"][0]["intent"] == "WhCh"){
		if(resp["entities"].length > 0 && resp["entities"][0].type == "CharacterName"){
		    getCharacter(resp["entities"][0].entity,3,function(character){
			    if(character["name"] != ""){
				if(character["description"] == ""){
				    var comics = character["comics"]["items"];
				    if(comics.length == 0){
					res.send("Sorry, no comics were found to contain this character");
					return;
				    }
				    var str = "<div class='row'><div style='padding-right:0;' class='col-md-3'><img style='width:100%; ' src='"+character["thumbnail"]["path"]+"/portrait_medium."+character["thumbnail"]["extension"]+"'></div><div class='col-md-9'><a href='"+character["urls"][0]["url"]+"' target='_blank'><h4>"+character["name"]+"</h4></a>"+ "Sorry, I don't have a description for " +character["name"] +"<br>But, here are some of the comics " + character["name"] + " was in: <br>";
				    for(var c = 0,l=comics.length;c<l;c++){
					str += "<a href='javascript:void(0);' onclick='showComic("+'"'+comics[c]["name"]+'"'+");'>"+comics[c]["name"]+"</a><br>";
				    }
				    res.send(str+"</div></div>");
				}
				else
				    res.send("<div class='row'><div style='padding-right:0;' class='col-md-3'><img style='width:100%; ' src='"+character["thumbnail"]["path"]+"/portrait_medium."+character["thumbnail"]["extension"]+"'></div><div class='col-md-9'><a href='"+character["urls"][0]["url"]+"' target='_blank'><h4>"+character["name"]+"</h4></a>"+character["description"]+"</div></div>");
			    }
			    else
				res.send("Sorry, I couldn't find the character " + resp["entities"][0].entity);
			});
		}
		else
		    res.send(help);
	    }
	    else if(resp["intents"][0]["intent"] == "CrBCo"){
		if(resp["entities"].length > 0 && (resp["entities"][0].type == "Comic" || resp["entities"][0].type == "CharacterName")){
		    getComic(resp["entities"][0].entity,5,function(comic){
			    if(comic["title"] != ""){
				var creators = comic["creators"]["items"];
				var str = "<div class='row'><div style='padding-right:0;' class='col-md-5'><img style='width:100%;' src='"+comic["thumbnail"]["path"]+"/portrait_large."+comic["thumbnail"]["extension"]+"'></div><div class='col-md-7'><a href='"+comic["urls"][0]["url"]+"' target='_blank'><h4>"+comic["title"]+"</h4></a>The creator(s): <br>";
				for(var c=0,l=creators.length;c<l;c++){
				    str += "<a href='javascript:void(0);' onclick='showCreator("+'"'+creators[c]["name"]+'"'+");'>"+creators[c]["name"] + '</a><br>';
				}
				res.send(str+"</div></div>");
			    }
			    else
				res.send("Sorry, I couldn't find the comic " +resp["entities"][0].entity);
			});
		}
		else
		    res.send(help);
	    }
	    else
		res.send(help);
	    });
    });

router.use(function (req,res,next) {
	console.log("/" + req.method);
	next();
    });

router.get("/",function(req,res){
	res.sendFile(path + "index.html");
    });

app.use("/",router);

app.use("*",function(req,res){
	res.sendFile(path + "404.html");
    });

app.listen(3000,function(){
	console.log("Live at Port 3000");
    });

function getCreator(name,consideredChars,callback){
    if(name.length < consideredChars)
	consideredChars = name.length;
    makeMarvelRequest("http://gateway.marvel.com:80/v1/public/creators?orderBy=firstName&nameStartsWith="+name.substr(0,consideredChars)+"&limit=100",function(){
	    var creators = JSON.parse(this.responseText)["data"]["results"];
	    var closest = getClosestCreator(name,creators);
	    if(closest["fullName"] == "" && consideredChars > 1)
		getCreator(name,consideredChars-1,callback);
	    else
		callback(closest);
	});
}

function getCharacter(name,consideredChars,callback){
    if(name.length < consideredChars)
	consideredChars = name.length;
    makeMarvelRequest("http://gateway.marvel.com:80/v1/public/characters?orderBy=name&nameStartsWith="+name.substr(0,consideredChars)+"&limit=100",function(){
	    var chars = JSON.parse(this.responseText)["data"]["results"];
	    var closestChar = getClosestCharacter(name,chars);
	    if(closestChar["name"] == "" && consideredChars > 1)
		getCharacter(name,consideredChars-1,callback);
	    else
		callback(closestChar);
	});
}

function getComic(name,consideredChars,callback){
    if(name.length < consideredChars)
        consideredChars = name.length;
    makeMarvelRequest("http://gateway.marvel.com:80/v1/public/comics?orderBy=title&titleStartsWith="+name.substr(0,consideredChars)+"&limit=100",function(){
            var comics = JSON.parse(this.responseText)["data"]["results"];
	    var closest = getClosestComic(name,comics);
	    if(closest["title"] == "" && consideredChars > 1)
		getComic(name,consideredChars-1,callback);
	    else
		callback(closest);
        });
}

function getEvent(name,callback){
    makeMarvelRequest("http://gateway.marvel.com:80/v1/public/events?orderBy=name&nameStartsWith="+name.charAt(0)+"&limit=100",function(){
	    var events = JSON.parse(this.responseText)["data"]["results"];
	    callback(getClosestEvent(name,events));
	});
}

function makeXMLHttpRequest(url,callback){
    var xhttp = new XMLHttpRequest();
    xhttp.onload = callback;
    xhttp.open("GET",url,true);
    xhttp.send();
}

function makeMarvelRequest(url,callback){
    var xhttp = new XMLHttpRequest();
    xhttp.onload = callback;
    var ts = Date.now();
    if(url.indexOf("?") != -1)
	url += "&";
    url += "ts="+ts+"&apikey="+pubkey+"&hash="+md5(ts+privkey+pubkey);
    xhttp.open("GET",url,true);
    xhttp.send();
}

function getClosestEvent(name,events)
{
    var mindist = 99999;
    var minevent = events[0];
    var hasP = false;
    if(name.indexOf("(") != -1)
	hasP = true;
    for(var i = 0, len=events.length; i < len; i++){
	var dist;
	var checkName = events[i]["title"];
	if(!hasP){
	    var Pind = checkName.indexOf("(");
	    if(Pind != -1)
		checkName = checkName.substring(0,Pind).trim();
	    dist = distFinder.getEditDistance(name,checkName);
	}
	else
	    dist = distFinder.getEditDistance(name,events[i]["name"]);
	if(dist < mindist){
	    mindist = dist;
	    minevent = events[i];
	}
    }
    if(mindist > 10)
	return {"title":""};
    return minevent;
}

function getClosestComic(name,comics){
    var mindist = 99999;
    var mincomic = comics[0];
    var hasP = false;
    if(name.indexOf("(") != -1)
	hasP = true;
    for(var i = 0, len=comics.length; i < len; i++){
	var dist;
	var checkName = comics[i]["title"];
	if(!hasP){
	    var Pind = checkName.indexOf("(");
	    if(Pind != -1)
		checkName = checkName.substring(0,Pind).trim();
	    dist = distFinder.getEditDistance(name,checkName);
	}
	else
	    dist = distFinder.getEditDistance(name,comics[i]["title"]);
	if(dist < mindist){
	    mindist = dist;
	    mincomic = comics[i];
	}
    }
    if(mindist > 10)
	return {"title":""};
    return mincomic;
}

function getClosestCreator(name,creators){
    var mindist = 99999;
    var mincreator = creators[0];
    var hasP = false;
    if(name.indexOf("(") != -1)
	hasP = true;
    for(var i = 0, len=creators.length; i < len; i++){
	var dist;
	var checkName = creators[i]["fullName"];
	if(!hasP){
	    var Pind = checkName.indexOf("(");
	    if(Pind != -1)
		checkName = checkName.substring(0,Pind).trim();
	    dist = distFinder.getEditDistance(name,checkName);
	}
	else
	    dist = distFinder.getEditDistance(name,creators[i]["fullName"]);
	if(dist < mindist){
	    mindist = dist;
	    mincharacter = creators[i];
	}
    }
    if(mindist > 10)
	return {"fullName":""};
    return mincharacter;
}

function getClosestCharacter(name,characters){
    var mindist = 99999;
    var mincharacter = characters[0];
    var hasP = false;
    if(name.indexOf("(") != -1)
	hasP = true;
    for(var i = 0, len=characters.length; i < len; i++){
	var dist;
	var checkName = characters[i]["name"];
	if(!hasP){
	    var Pind = checkName.indexOf("(");
	    if(Pind != -1)
		checkName = checkName.substring(0,Pind).trim();
	    dist = distFinder.getEditDistance(name,checkName);
	}
	else
	    dist = distFinder.getEditDistance(name,characters[i]["name"]);
	if(dist < mindist){
	    mindist = dist;
	    mincharacter = characters[i];
	}
    }
    if(mindist > 10)
	return {"name":""};
    return mincharacter;
}