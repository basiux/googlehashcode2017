"use strict"
var isNode = (typeof module !== 'undefined' && module.exports)

if (isNode) var fileName = process.argv[2]

var timeStarted = now()
var timeLast = 0
var timeDelay = 0

var timeLimitWithoutPrinting = 10

if (isNode) {
    (function(){
        let fs = require('fs')
        fs.readFile(fileName, 'utf8', (err,data) => {
            if (err) {
                return console.log(err)
            }
            run(data)
        })
    })()
} else {
    const example = "5 2 4 3 100\n50 50 80 30 110\n1000 3\n0 100\n2 200\n1 300\n500 0\n3 0 1500\n0 1 1000\n4 0 500\n1 0 1000\n"
    const me_at_the_zoo = "100 10 100 10 100\n20 11 50 26 5 3 6 32 40 22 4 20 50 27 49 44 1 37 35 27 14 33 6 22 23 48 44 14 26 9 46 44 15 32 31 8 39 27 39 27 1 17 1 47 44 42 16 3 44 48 5 25 4 39 39 7 24 28 14 44 22 11 27 37 11 16 50 33 22 26 7 12 17 30 12 12 4 32 12 46 43 4 12 34 11 7 47 29 24 40 41 10 5 22 22 24 37 34 50 5\n1013 3\n0 170\n1 22\n2 224\n696 2\n0 7\n1 50\n1114 3\n1 202\n4 175\n5 2\n464 2\n1 24\n8 25\n522 5\n3 216\n5 155\n6 139\n7 208\n8 145\n321 4\n0 26\n2 70\n8 159\n9 92\n1288 2\n2 163\n9 153\n226 1\n7 86\n316 5\n4 236\n5 79\n6 9\n7 53\n8 67\n365 5\n2 225\n3 62\n5 141\n6 147\n9 66\n27 4 340\n13 8 249\n1 1 449\n24 4 279\n0 2 924\n8 4 862\n1 5 51\n0 9 837\n30 9 927\n0 8 167\n3 4 214\n0 4 59\n2 3 986\n7 2 785\n0 4 424\n16 9 996\n8 5 719\n89 1 297\n0 9 580\n19 5 748\n31 0 585\n2 5 853\n0 1 961\n8 0 186\n5 5 676\n81 2 120\n3 8 247\n16 5 620\n0 4 584\n8 5 935\n32 2 717\n8 2 396\n8 6 300\n34 3 752\n13 0 459\n4 9 997\n7 0 214\n13 2 934\n21 8 880\n0 3 158\n0 8 704\n1 6 988\n62 6 8\n1 8 300\n16 6 939\n7 1 116\n5 1 554\n17 2 605\n7 7 204\n0 6 264\n2 4 906\n16 8 93\n0 4 277\n99 0 772\n23 6 262\n1 7 552\n26 4 10\n1 0 884\n2 9 546\n0 8 583\n10 1 128\n3 3 899\n2 7 861\n1 8 211\n3 2 103\n74 7 885\n54 4 621\n0 1 930\n0 8 977\n30 8 882\n15 0 737\n0 3 931\n0 8 865\n44 8 267\n65 7 109\n4 8 859\n0 2 817\n0 4 306\n1 7 228\n26 0 194\n0 3 865\n10 9 280\n0 6 400\n5 9 537\n1 9 116\n2 9 179\n4 9 266\n46 1 435\n5 7 314\n4 6 512\n6 3 577\n10 2 709\n65 0 926\n82 5 720\n54 7 671\n16 3 70\n43 6 331\n10 3 849\n11 7 301\n1 3 409\n"
//    run(example)
    run(me_at_the_zoo)
}

function run (input) {
    const lines = input.split('\n').slice(0, -1) // remove the last element, which should be an empty one

	const config = lines[0].split(' ')
    print("config:", config)

    const numberVideos = config[0] // from 0 to V - 1
    const numberEndpoints = config[1] // from 0 to E - 1
    const numberRequestDescriptions = config[2]
    const numberCacheServers = config[3] // from 0 to C - 1
    const capacityCacheServer = Number(config[4])
    lines.shift()

    const videoSize = lines[0].split(' ')
	lines.shift()
    print("videoSize", isNode?numberVideos:videoSize)

    let cache = []
    for (let i = 0; i < numberCacheServers; i += 1) {
        cache[i] = {
            id: i,
            videoWeight: [], // used to calculate score based on every factor
        }
    	for (let j = 0; j < numberVideos; j += 1) {
	        cache[i].videoWeight[j] = {
            	id: j,
                value: 0, //( capacityCacheServer - Number(videoSize[j]) ) * 1000,
                videoSize: Number(videoSize[j]),
            }
            printIfDelay("processing cacheServers", cache[i].videoWeight[j])
        }
    }
    print("cacheServers", isNode?numberCacheServers:cache)

    let endpoint = []
    let step = 0
    let pointToPush
    let request = []
    lines.forEach(item => {
        item = item.split(' ')
        if (step >= 0 && item.length == 2) { // cache servers
            if (step === 0) {
            	pointToPush = {
                	centerLatency: Number(item[0]),
                    cache: []
                }
                step = Number(item[1])
            } else {
                step -= 1
                let cacheItem = item
            	pointToPush.cache.push({
                	id: Number(cacheItem[0]),
                    latency: Number(cacheItem[1])
                })
            }
            if (step === 0) {
                endpoint.push(pointToPush)
            }
        } else { // requests
            if (step === 0) {
                step = -1
                print("endpoint", isNode?endpoint.length:endpoint)
            }
            item = {
            	videoId: Number(item[0]),
                endpointId: Number(item[1]),
                weight: Number(item[2]) // number of requests
            }
        	request.push(item)
            let vSize = Number(videoSize[item.videoId])
            if (vSize <= capacityCacheServer) {
            	let point = endpoint[item.endpointId]
                //let videoSizeScore = ((capacityCacheServer + 1) - vSize) / capacityCacheServer
                point.cache.forEach(pointCache => {
                    let latencyScore = point.centerLatency - pointCache.latency
                    let requestScore = item.weight * latencyScore
                    //print(item.endpointId, pointCache, cache.length, pointCache.id)
                    let cacheValue = cache[pointCache.id].videoWeight[item.videoId].value
                    cacheValue += requestScore / (vSize / capacityCacheServer)
                	cache[pointCache.id].videoWeight[item.videoId] = {
                    	id: item.videoId,
                        value: cacheValue,
                        videoSize: vSize,
                    }
                    printIfDelay("processing request", item, pointCache)
                })
            }
            printIfDelay("processing request", item)
        }
    })
    print("request", isNode?"":request)

    print("cache", isNode?"":cache)

    let solution = []
    cache.forEach(item => {
        cache.forEach(compare => {
            if (compare.id === item.id) return
            if (item.value > compare.value) {
                // trying to figure out a way to consider other weights depending on video size
            }
        })

    	let solutionWeights = calculateWeights((a,b)=> a.value - b.value)

        //let solutionSmalls = calculateWeights((a,b)=> a.value * a.videoSize - b.value * b.videoSize)

        function calculateWeights (sortWeights) {
            let topWeights = item.videoWeight.sort(sortWeights).reverse()
            let sol = []
            let size = 0
            topWeights.forEach(vWe => {
            	let vSize = Number(videoSize[vWe.id])
                if (size + vSize <= capacityCacheServer) {
                	size += vSize
                    sol.push(vWe.id)
                }
            })
            return sol
        }

		solution.push(solutionWeights)
    })

    let solutionStr = solution.length + "\n" // at least have an idea
    print("solution", isNode?solutionStr:solution)

    solution.forEach((item, i) => {
    	solutionStr += i +' '+ item.join(" ") + "\n"
    })

    print(calculateScore(solution, endpoint, request))

	if (isNode) {
        (function(){
            let fs = require('fs')
            fileName = fileName.replace(".in","")+".out"
            fs.writeFile(fileName, solutionStr, err => {
                if(err) {
                    return console.log(err)
                }

                console.log("saved output to file "+fileName)
            })
        })()
    }
}

function print () {
    let time = timeSinceLastPrint()
    let timeElapsed = time[0]
	let args = Array.prototype.slice.call(arguments)
    if (isNode) args.push(" ")
    if (timeElapsed > 0) {
        args.push("#time:")
        args.push(timeElapsed.toFixed(3)+"s")
        let last = time[1]
        args.push("#diff:")
        args.push(last.toFixed(3)+"s")
    }
    timeLast = timeElapsed
    return console.log.apply(this, args)
}

function printIfDelay () {
    let time = timeSinceLastPrint()
    let timeElapsed = time[0]
    let delay = timeElapsed - timeDelay
    if (delay < timeLimitWithoutPrinting) return
    let args = Array.prototype.slice.call(arguments)
    if (isNode) args.push(" ")
    if (timeElapsed > 0) {
        args.push("#time:")
        args.push(timeElapsed.toFixed(0)+"s")
    }
    timeDelay = timeElapsed
    return console.log.apply(this, args)
}

function timeSinceLastPrint () {
    let timeElapsed = (now() - timeStarted) / 1000
    return [timeElapsed, timeElapsed - timeLast]
}

function now () {
    let result
    if (isNode) {
        let hrtime = process.hrtime() // nanoseconds
        result = hrtime[0] * 1000 + hrtime[1] / 1000000
    } else {
        result = performance.now() // miliseconds
    }
    return result
}

Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

function calculateScore (solution, endpoint, request) {
	let totalScore = 0
    let totalRequestsExpected = 0

//    var lines = solution.split('\n').slice(1, -1) // remove the last element, which should be an empty one, and the first, which is just the number of elements

//	lines.forEach(function(item){
//        item = item.split(' ')
    request.forEach(item => {
        let point = endpoint[item.endpointId]
        let latencyExpected = point.centerLatency
        totalRequestsExpected += item.weight
        let minimumLatency = latencyExpected
        point.cache.forEach(pointCache => {
            if (solution[pointCache.id].indexOf(item.videoId) > -1) {
                if (pointCache.latency < minimumLatency) {
                    minimumLatency = pointCache.latency
                }
            }
        })
        totalScore += (latencyExpected - minimumLatency) * item.weight
    })

    totalScore /= totalRequestsExpected

    return Math.floor(totalScore * 1000)
}
