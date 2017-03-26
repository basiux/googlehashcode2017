# google hash code 2017

## [team whatever works #1832](https://hashcode.withgoogle.com/hashcode_2017.html#1832)

I was trying to work on the practice challenge, the pizza, by my own before forming the team, all within a few days before the game started.

then the team was formed, but we couldn't effectively contribute with each other in any significant way. we talked a lot trying to come up with ways to work together, still we ended up working each one on their own and sharing results.

I somehow managed to finish the challenge 30 minutes before the end, but it was running on chrome console and too slow when trying to resolve the kittens, not to mention the input was too big to be converted. the whole problem was just with kittens. the rest of team was still struggling on coming up with anything so they switched to help resolving this. I quickly came up with the idea to use node, now I had a terminal hanging for several minutes and hoping it was running. it was! the result was bad as expected, and wouldn't make much difference in the ranking. by the time it did finish, the delivery gates were closed for 1 minute.

for the next few hours there was a new submitting system, but I was already almost done with emulating the evaluation. and for the next few days I've tried to improve the result without any success...

I did try again a lot later, without any significant improvement. couldn't focus on searching for a solution ready online, didn't know what to look for. the problem is figuring out neighbors. if there are enough small ones, the current "solutionRanks" work better, which calculates a ranking value based on each file size (in each cache server) along with its score. if there are more big files, maybe the "solutionWeights" is better, which just calculate the score for each file, in each cache server.

thinking on this test case, of a cache server trying to filter out which files to keep, helped me a great deal to get to this conclusion:

```
fileSize    score   rank
3           50      167
2           10      50
1           40      400
1           30      300
1           20      200
1           16      160
1           16      160
1           16      160
1           40      400
1           40      400
1           40      400
4           60      150
5           90      180
5           80      160
capacityCacheServer 10
```

in any case, I figure it's better to focus on the pizza issue next as to work on what matters: the neat mariox ai! :)
