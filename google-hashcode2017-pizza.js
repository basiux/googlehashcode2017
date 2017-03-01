/*

for now this is mostly parts taken from mariox many files
it's also being adjusted to the pizza exercise

// */

const _ = require('./lodash.min') // after clonedeep on http://colintoh.com/blog/lodash-10-javascript-utility-functions-stop-rewriting

//*
ActualInputs = [];
ActualOutputs = [];
Inputs = ActualInputs.length;
Outputs = ActualOutputs.length;

Population = 300; // species
DeltaDisjoint = 2.0;
DeltaWeights = 0.4;
DeltaThreshold = 1.0;

StaleSpecies = 15;

MutateConnectionsChance = 0.25;
PerturbChance = 0.90;
CrossoverChance = 0.75;
LinkMutationChance = 2.0;
NodeMutationChance = 0.50;
BiasMutationChance = 0.40;
StepSize = 0.1;
DisableMutationChance = 0.4;
EnableMutationChance = 0.2;

TimeoutConstant = 20;
Timeout = 1//600 // seconds

// ok, not quite a toolbox yet, not even a singleton, but we'll get there (if needed) (from toolbox.js)

var pool;
var rightmost;
var markedCells;
var timeout;
var timeElapsed;

var score;
var goal;
var solution;

if ( isEmpty(pool) ) {
    initializePool();
}

// those are currently in the "global" scope, but only being used here (from main.js)
var fpsinterval = 0;
var mainLoopInterval = null;
var keepTime = null;

function pizza (str) {
    var lines = str.split('\n');
    var config = lines[0].split(' ');
    lines.shift();
    goal = config[0] * config[1];
    var minIngredients = config[2]; // per slice
    var maxSlice = config[3]; // cells size

    // like the mario screen, this should probably morph into a different screen as the game progress.
    // maybe just setting -1 to cells that are already taken would be enough
    ActualInputs = []
    lines.forEach(function(item){
        ActualInputs.push( item.replace(/M/g, 1).replace(/T/g, 0) )
    });

    // still need to figure out what the outputs need to be, and probably adjust the rest of neat around it
    // right now this is meaningless and just as a place holder
    ActualOutputs = [
        ' ',
        '0',
        '1',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9', // last command is being ignored, right now! :(
    ];

    Inputs = goal+1;
    Outputs = ActualOutputs.length;

    startMainLoop();
}

function startMainLoop () {
    mainLoopInterval = setInterval(asyncMainLoop, fpsinterval);
    keepTime = setInterval(function(){ timeElapsed += 1; }, 1000);
}

function logScore () {
    console.log(
        'score: '+ score,
        'goal: '+ goal,
        'time elapsed: '+ timeElapsed,
        'time limit: '+ Timeout,
        '\n'+ solution
    );
}

function clearMainLoop () {
    logScore();
    clearInterval(mainLoopInterval);
    clearInterval(keepTime);
}

// still no good error handling, sadly
/*window.onerror = function(msg, url, line, col, error) {
    // Note that col & error are new to the HTML 5 spec and may not be
    // supported in every browser.  It worked for me in Chrome.
    var extra = !col ? '' : '\ncolumn: ' + col;
    extra += !error ? '' : '\nerror: ' + error;

    // You can view the information in an alert to see things working like this:
    console.error("error :o " + msg + "\nurl: " + url + "\nline: " + line + extra);

    clearMainLoop();

    // TODO: Report this error via ajax so you can keep track
    //       of what pages have JS issues

    var suppressErrorAlert = true;
    // If you return true, then error alerts (like in older versions of
    // Internet Explorer) will be suppressed.
    return suppressErrorAlert;
};*/

function asyncMainLoop () { // infinite, async equivalent
    if (score >= goal) {
        console.log('goal reached! :)');
        clearMainLoop();
    }

    if (timeElapsed > Timeout) {
        console.log('time limit '+ Timeout +' reached! :(');
        clearMainLoop();
    }

//    try {
    aiMainLoop();
/*    } catch (e) {
        console.error('error :o '+ e);
        clearMainLoop();
    }*/
}

function aiMainLoop () {
    var species = pool.species[pool.currentSpecies];
    var genome = species.genomes[pool.currentGenome];

    if ( (pool.currentFrame % 5) === 0 ) {
        evaluateCurrent();
    }

    calculateNewInputs();
    if (markedCells > rightmost) {
        rightmost = markedCells;
        timeout = TimeoutConstant;
    }

    timeout = timeout - 1;


    var timeoutBonus = pool.currentFrame / 4;
    if (timeout + timeoutBonus <= 0) {
        var fitness = rightmost - pool.currentFrame / 2;
        if (fitness === 0) {
            fitness = -1;
        }
        genome.fitness = fitness;

        if (fitness > pool.maxFitness) {
            pool.maxFitness = fitness;
//            $form.find('input#maxFitness').val(Math.floor(pool.maxFitness));

//            writeFile( "autobackup.fitness." + fitness + "." + $form.find('input#saveLoadFile').val() );
//            writeFile("autobackup.pool");
        }

        console.log(
            "gen: " + pool.generation,
            "species: " + pool.currentSpecies,
            "genome: " + pool.currentGenome,
            "fitness: " + fitness
        );
        logScore();

        pool.currentSpecies = 0; // array bonds
        pool.currentGenome = 0; // array bonds
        while ( fitnessAlreadyMeasured() ) {
            nextGenome();
        }
        initializeRun();
    }

    var measured = 0;
    var total = 0;
    Object.keys(pool.species).forEach( function(sKey) { // in pairs
        var pairSpecies = pool.species[sKey];
        Object.keys(pairSpecies.genomes).forEach( function (gKey) { // in pairs
            var pairGenome = pairSpecies.genomes[gKey];
            total++;
            if (pairGenome.fitness !== 0) {
                measured++;
            }
        });
    });

/*
    $aigui.find('#banner #gen').text( pool.generation + ' species ' + pool.currentSpecies + ' genome ' + pool.currentGenome + ' (' + Math.floor(measured/total*100) + '%)' );
    $aigui.find('#banner #fitness').text( Math.floor(rightmost - (pool.currentFrame) / 2 - (timeout + timeoutBonus)*2/3) );
    $aigui.find('#banner #maxFitness').text( Math.floor(pool.maxFitness) );
// */

    pool.currentFrame++;
}

function sigmoid (x) {
    return 2/(1+Math.exp(-4.9*x))-1;
}

function newPool () {
    var pool = {};
    pool.species = [];
    pool.generation = 0;
    pool.innovation = Outputs - 1; // array bonds
    pool.currentSpecies = 0; // array bonds
    pool.currentGenome = 0; // array bonds
    pool.currentFrame = 0;
    pool.maxFitness = 0;
    pool.duration = 0;
    pool.gameState = null;
    pool.state = null;

    return pool;
}

function newSpecies () {
    var species = {};
    species.topFitness = 0;
    species.staleness = 0;
    species.genomes = [];
    species.averageFitness = 0;

    return species;
}

function newGenome () {
    var genome = {};
    genome.genes = [];
    genome.fitness = 0;
    genome.adjustedFitness = 0;
    genome.network = [];
    genome.maxneuron = 0;
    genome.globalRank = 0;
    genome.mutationRates = {};
    genome.mutationRates.connections = MutateConnectionsChance;
    genome.mutationRates.link = LinkMutationChance;
    genome.mutationRates.bias = BiasMutationChance;
    genome.mutationRates.node = NodeMutationChance;
    genome.mutationRates.enable = EnableMutationChance;
    genome.mutationRates.disable = DisableMutationChance;
    genome.mutationRates.step = StepSize;

    return genome;
}

function copyGenome (genome) {
    var genome2 = newGenome();
    //for (var g=0; g<genome.genes.length; g++) {
//            genome2.genes.push( copyGene(genome.genes[g]) ); // table.insert
    genome.genes.forEach( function (gene) {
        genome2.genes.push( copyGene(gene) ); // table.insert
    });
    genome2.maxneuron = genome.maxneuron;
    genome2.mutationRates.connections = genome.mutationRates.connections;
    genome2.mutationRates.link = genome.mutationRates.link;
    genome2.mutationRates.bias = genome.mutationRates.bias;
    genome2.mutationRates.node = genome.mutationRates.node;
    genome2.mutationRates.enable = genome.mutationRates.enable;
    genome2.mutationRates.disable = genome.mutationRates.disable;

    return genome2;
}

function basicGenome () {
    var genome = newGenome();
    //var innovation = 0; // array bonds - probably useless

    genome.maxneuron = Inputs - 1; // array bonds
    mutate(genome);

    return genome;
}

function newGene () {
    var gene = {};
    gene.into = 0;
    gene.out = 0;
    gene.weight = 0.0;
    gene.enabled = true;
    gene.innovation = 0;

    return gene;
}

function copyGene (gene) {
    var gene2 = newGene();
    gene2.into = gene.into;
    gene2.out = gene.out;
    gene2.weight = gene.weight;
    gene2.enabled = gene.enabled;
    gene2.innovation = gene.innovation;

    return gene2;
}

function newNeuron () {
    var neuron = {};
    neuron.incoming = [];
    neuron.value = 0.0;

    return neuron;
}

function generateNetwork (genome) {
    var network = {};
    network.inNeurons = [];
    network.outNeurons = [];

    for (var i=0; i<Inputs; i++) {
        network.inNeurons[i] = newNeuron();
    }
    for (var o=0; o<Outputs; o++) {
        network.outNeurons[o] = newNeuron();
    }

    genome.genes.sort(function (a, b) {
        return (a.out - b.out);
    })

    function checkGene (gene, neurons) {
        if (gene.enabled) {
            if ( isEmpty(neurons[gene.out]) ) {
                neurons[gene.out] = newNeuron();
            }
            var neuron = neurons[gene.out];
            neuron.incoming.push(gene); // table.insert
            if ( isEmpty(neurons[gene.into]) ) {
                neurons[gene.into] = newNeuron();
            }
        }
    }
    genome.genes.forEach( function(gene) {
        checkGene(gene, network.inNeurons);
        checkGene(gene, network.outNeurons);
    });

    genome.network = network;
}

function evaluateNetwork (network, inputs) {
    var outputs = {};

    inputs.push(1); // table.insert
    if (inputs.length != Inputs) {
        console.error("Incorrect number of neural network inputs: "+ inputs.length +" (expected "+ Inputs +")");
        return outputs;
    }

    for (var i=0; i<Inputs; i++) {
        network.inNeurons[i].value = inputs[i];
    }

    var forEachNeuron = function (neuron) { // in pairs
        var sum = 0;
        for (var j = 0; j<neuron.incoming.length; j++) {
            var incoming = neuron.incoming[j];
            var other = network.inNeurons[incoming.into];
            sum = sum + incoming.weight * other.value;
        }

        if (neuron.incoming.length > 0) {
            neuron.value = sigmoid(sum);
        }
    }
    network.inNeurons.forEach(forEachNeuron);
    network.outNeurons.forEach(forEachNeuron);

    for (var o=0; o<Outputs; o++) {
        var outputName = "KEY_" + ActualOutputs[o];
        if (network.outNeurons[o].value > 0) {
            outputs[outputName] = true;
        } else {
            outputs[outputName] = false;
        }
    }

    return outputs;
}

function crossover (g1, g2) {
    // Make sure g1 is the higher fitness genome
    if (g2.fitness > g1.fitness) {
            tempg = g1;
            g1 = g2;
            g2 = tempg;
    }

    var child = newGenome();

    var innovations2 = {};
    for (var i=0; i<g2.genes.length; i++) {
            var gene = g2.genes[i];
            innovations2[gene.innovation] = gene;
    }

    for (var i=0; i<g1.genes.length; i++) {
            var gene1 = g1.genes[i];
            var gene2 = innovations2[gene1.innovation];
            if ( !isEmpty(gene2) && mathRandom(2) == 1 && gene2.enabled) {
                    child.genes.push( copyGene(gene2) ); // table.insert
            } else {
                    child.genes.push( copyGene(gene1) ); // table.insert
            }
    }

    child.maxneuron = Math.max(g1.maxneuron,g2.maxneuron);

    for (var mutation in g1.mutationRates) { // in pairs
            var rate = g1.mutationRates[mutation];
            child.mutationRates[mutation] = rate;
    }

    return child;
}

function randomNeuron (genes, nonInput) {
    var neurons = [];
    if ( !nonInput ) {
            for (var i=0; i<Inputs; i++) {
                    neurons[i] = true;
            }
    }
    for (var o=0; o<Outputs; o++) {
            neurons[MaxNodes+o] = true;
    }
    for (var i=0; i<genes.length; i++) {
            if ( !nonInput || genes[i].into >= Inputs) {
                    neurons[genes[i].into] = true;
            }
            if ( !nonInput || genes[i].out >= Inputs) {
                    neurons[genes[i].out] = true;
            }
    }

    var count = 0;
    for (var _ in neurons) { // in pairs
            count = count + 1;
    }
    var n = mathRandom(1, count);

    for (var k in neurons) { // in pairs
            var v = neurons[k];
            n = n-1;
            if (n === 0) {
                    return k;
            }
    }

    return 0;
}

function containsLink (genes, link) {
    for (var i=0; i<genes.length; i++) {
            var gene = genes[i];
            if (gene.into == link.into && gene.out == link.out) {
                    return true;
            }
    }
}

function pointMutate (genome) {
    var step = genome.mutationRates["step"];

    for (var i=0; i<genome.genes.length; i++) {
            var gene = genome.genes[i];
            if (mathRandom() < PerturbChance) {
                    gene.weight = gene.weight + mathRandom() * step*2 - step;
            } else {
                    gene.weight = mathRandom()*4-2;
            }
    }
}

function linkMutate (genome, forceBias) {
    var neuron1 = randomNeuron(genome.genes, false);
    var neuron2 = randomNeuron(genome.genes, true);

    var newLink = newGene();
    if (neuron1 < Inputs && neuron2 < Inputs) { // array bonds
            // Both input nodes
            return;
    }
    if (neuron2 < Inputs) { // array bonds
            // Swap output and input
            var temp = neuron1;
            neuron1 = neuron2;
            neuron2 = temp;
    }

    newLink.into = neuron1;
    newLink.out = neuron2;
    if (forceBias) {
            newLink.into = Inputs - 1; // array bonds
    }

    if ( containsLink(genome.genes, newLink) ) {
            return;
    }
    newLink.innovation = ++pool.innovation;
    newLink.weight = mathRandom()*4-2;

    genome.genes.push(newLink); // table.insert
}

function nodeMutate (genome) {
    if (genome.genes.length === 0) {
            return;
    }

    genome.maxneuron++;

    var gene = genome.genes[mathRandom(1,genome.genes.length)-1];
    if ( !gene || !gene.enabled ) {
            return;
    }
    gene.enabled = false;

    var gene1 = copyGene(gene);
    gene1.out = genome.maxneuron;
    gene1.weight = 1.0;
    gene1.innovation = ++pool.innovation;
    gene1.enabled = true;
    genome.genes.push(gene1); // table.insert

    var gene2 = copyGene(gene);
    gene2.into = genome.maxneuron;
    gene2.innovation = ++pool.innovation;
    gene2.enabled = true;
    genome.genes.push(gene2); // table.insert
}

function enableDisableMutate (genome, enable) {
    var candidates = [];
    for (var _ in genome.genes) { // in pairs
            var gene = genome.genes[_];
            if (gene.enabled == !enable) {
                    candidates.push(gene); // table.insert
            }
    }

    if (candidates.length === 0) {
            return;
    }

    var gene = candidates[mathRandom(1,candidates.length)-1];
    gene.enabled = !gene.enabled;
}

function mutate (genome) {
    for (var mutation in genome.mutationRates) { // in pairs
            var rate = genome.mutationRates[mutation];
            if (mathRandom(1,2) == 1) {
                    genome.mutationRates[mutation] = 0.95*rate;
            } else {
                    genome.mutationRates[mutation] = 1.05263*rate;
            }
    }

    if (mathRandom() < genome.mutationRates["connections"]) {
            pointMutate(genome);
    }

    var p = genome.mutationRates["link"];
    while (p > 0) {
            if (mathRandom() < p) {
                    linkMutate(genome, false);
            }
            p--;
    }

    p = genome.mutationRates["bias"];
    while (p > 0) {
            if (mathRandom() < p) {
                    linkMutate(genome, true);
            }
            p--;
    }

    p = genome.mutationRates["node"];
    while (p > 0) {
            if (mathRandom() < p) {
                    nodeMutate(genome);
            }
            p--;
    }

    p = genome.mutationRates["enable"]
    while (p > 0) {
            if (mathRandom() < p) {
                    enableDisableMutate(genome, true);
            }
            p--;
    }

    p = genome.mutationRates["disable"]
    while (p > 0) {
            if (mathRandom() < p) {
                    enableDisableMutate(genome, false);
            }
            p--;
    }
}

function disjoint (genes1, genes2) {
    var i1 = [];
    for (var i = 0; i <genes1.length; i ++) {
            var gene = genes1[i];
            i1[gene.innovation] = true;
    }

    var i2 = [];
    for (var i = 0; i <genes2.length; i ++) {
            var gene = genes2[i];
            i2[gene.innovation] = true;
    }

    var disjointGenes = 0;
    for (var i = 0; i <genes1.length; i ++) {
            var gene = genes1[i];
            if (!i2[gene.innovation]) {
                    disjointGenes = disjointGenes+1;
            }
    }

    for (var i = 0; i <genes2.length; i ++) {
            var gene = genes2[i];
            if (!i1[gene.innovation]) {
                    disjointGenes = disjointGenes+1;
            }
    }

    var n = Math.max(genes1.length-1, genes2.length-1);

    return disjointGenes / n;
}

function weights (genes1, genes2) {
    var i2 = [];
    for (var i = 0; i <genes2.length; i ++) {
            var gene = genes2[i];
            i2[gene.innovation] = gene;
    }

    var sum = 0;
    var coincident = 0;
    for (var i = 0; i <genes1.length; i ++) {
            var gene = genes1[i];
            if ( !isEmpty(i2[gene.innovation]) ) {
                    var gene2 = i2[gene.innovation];
                    sum = sum + Math.abs(gene.weight - gene2.weight);
                    coincident++;
            }
    }

    return sum / coincident;
}

function sameSpecies (genome1, genome2) {
    var dd = DeltaDisjoint*disjoint(genome1.genes, genome2.genes);
    var dw = DeltaWeights*weights(genome1.genes, genome2.genes);
    return dd + dw < DeltaThreshold;
}

function rankGlobally () {
    var global = [];
    for (var s = 0; s <pool.species.length; s ++) {
            var species = pool.species[s];
            for (var g = 0; g <species.genomes.length; g ++) {
                    global.push(species.genomes[g]); // table.insert
            }
    }
    global.sort(function (a, b) {
            return (a.fitness - b.fitness); // from less to more fit
    })

    for (var g=0; g<global.length; g++) {
            global[g].globalRank = g;
    }
}

function calculateAverageFitness (species) {
    var total = 0;

    for (var g=0; g<species.genomes.length; g++) {
            var genome = species.genomes[g];
            total = total + genome.globalRank;
    }

    species.averageFitness = total / species.genomes.length;
}

function totalAverageFitness () {
    var total = 0;
    for (var s = 0; s <pool.species.length; s ++) {
            var species = pool.species[s];
            total = total + species.averageFitness;
    }

    return total;
}

function cullSpecies (cutToOne) {
    for (var s = 0; s <pool.species.length; s ++) {
            var species = pool.species[s];

            species.genomes.sort(function (a, b) {
                    return (b.fitness - a.fitness);
            })

            var remaining = Math.ceil(species.genomes.length/2);
            if (cutToOne) {
                    remaining = 1; // array bonds
            }
            while (species.genomes.length > remaining) {
                    species.genomes.pop();
            }
    }
}

function breedChild (species) {
    var child = {};
    if (mathRandom() < CrossoverChance) {
            g1 = species.genomes[mathRandom(1, species.genomes.length)-1];
            g2 = species.genomes[mathRandom(1, species.genomes.length)-1];
            child = crossover(g1, g2);
    } else {
            g = species.genomes[mathRandom(1, species.genomes.length)-1];
            child = copyGenome(g);
    }

    mutate(child);

    return child;
}

function removeStaleSpecies () {
    var survived = [];

    for (var s = 0; s <pool.species.length; s ++) {
            var species = pool.species[s];

            species.genomes.sort(function (a, b) {
                    return (b.fitness - a.fitness);
            })

            if (species.genomes[0].fitness > species.topFitness) { // array bonds
                    species.topFitness = species.genomes[0].fitness; // array bonds
                    species.staleness = 0;
            } else {
                    species.staleness++;
            }
            if (species.staleness < StaleSpecies || species.topFitness >= pool.maxFitness) {
                    survived.push(species); // table.insert
            }
    }

    pool.species = survived;
}

function removeWeakSpecies () {
    var survived = [];

    var sum = totalAverageFitness();
    for (var s = 0; s <pool.species.length; s ++) {
            var species = pool.species[s];
            var breed = Math.floor(species.averageFitness / sum * Population);
            if (breed >= 1) {
                    survived.push(species); // table.insert
            }
    }

    pool.species = survived;
}

function addToSpecies (child) {
    var foundSpecies = false;
    for (var s=0; s<pool.species.length; s++) {
            var species = pool.species[s];
            if ( !foundSpecies && sameSpecies(child, species.genomes[0]) ) { // array bonds
                    species.genomes.push(child); // table.insert
                    foundSpecies = true;
                    break; //for
            }
    }

    if (!foundSpecies) {
            var childSpecies = newSpecies();
            childSpecies.genomes.push(child); // table.insert
            pool.species.push(childSpecies); // table.insert
    }
}

function newGeneration () {
    cullSpecies(false); // Cull the bottom half of each species
    rankGlobally();
    removeStaleSpecies();
    rankGlobally();
    for (var s = 0; s<pool.species.length; s++) {
            var species = pool.species[s];
            calculateAverageFitness(species);
    }
    removeWeakSpecies();
    var sum = totalAverageFitness();
    var children = [];
    for (var s = 0; s<pool.species.length; s++) {
            var species = pool.species[s];
            var breed = Math.floor(species.averageFitness / sum * Population) - 1;
            for (var i=0; i<breed; i++) {
                    children.push( breedChild(species) ); // table.insert
            }
    }
    cullSpecies(true); // Cull all but the top member of each species
    while (children.length + pool.species.length <= Population) {
            var species = pool.species[mathRandom(1, pool.species.length)-1];
            children.push( breedChild(species) ); // table.insert
    }
    for (var c=0; c<children.length; c++) {
            var child = children[c];
            addToSpecies(child);
    }

    pool.generation++;

//    writeFile("autobackup.gen." + pool.generation + "." + $form.find('input#saveLoadFile').val());
//    writeFile("autobackup.pool");
}

function initializePool () {
    pool = newPool();

    for (var i=0; i<Population; i++) {
            var basic = basicGenome();
            addToSpecies(basic);
    }

    initializeRun();
}

function clearJoypad () {
/*    controller = {};
    for (var b = 0; b<ActualOutputs.length; b++) {
            controller["KEY_" + ActualOutputs[b]] = false;
    }*/
//    joypadSet(controller);
}

function initializeRun () {
    // review - something like savestate will be much needed
    //loadState(Filename);
    rightmost = 0;
    pool.currentFrame = 0;
    timeout = TimeoutConstant;
    clearJoypad();

    var species = pool.species[pool.currentSpecies];
    var genome = species.genomes[pool.currentGenome];
    generateNetwork(genome);
    evaluateCurrent();
}

function evaluateCurrent() {
    var species = pool.species[pool.currentSpecies];
    var genome = species.genomes[pool.currentGenome];

    inputs = ActualInputs.slice();
    var outputs = evaluateNetwork(genome.network, inputs);
/*
    inputs = getInputs();
    controller = evaluateNetwork(genome.network, inputs);

    if (controller["KEY_LEFT"] && controller["KEY_RIGHT"]) {
            controller["KEY_LEFT"] = false;
            controller["KEY_RIGHT"] = false;
    }
    if (controller["KEY_UP"] && controller["KEY_DOWN"]) {
            controller["KEY_UP"] = false;
            controller["KEY_DOWN"] = false;
    }
// */
}


function nextGenome () {
    pool.currentGenome++;
    if (pool.currentGenome >= pool.species[pool.currentSpecies].genomes.length) {
            pool.currentGenome = 0; // array bonds
            pool.currentSpecies++;
            if (pool.currentSpecies >= pool.species.length) {
                    newGeneration();
                    pool.currentSpecies = 0; // array bonds
            }
    }
}

function fitnessAlreadyMeasured () {
    var species = pool.species[pool.currentSpecies];
    var genome = species.genomes[pool.currentGenome];

    return genome.fitness !== 0;
}

function playTop () {
    var maxFitness = 0;
    var maxSpecies = 0;
    var maxGenome = 0;
    for (var s in pool.species) { // in pairs
        var species = pool.species[s];
        for (var g in species.genomes) { // in pairs
            var genome = species.genomes[g];
            if (genome.fitness > maxFitness) {
                maxFitness = genome.fitness;
                maxSpecies = s;
                maxGenome = g;
            }
        }
    }

    pool.currentSpecies = maxSpecies;
    pool.currentGenome = maxGenome;
    pool.maxFitness = maxFitness;
    $form.find('input#maxFitness').val(Math.floor(pool.maxFitness));
    initializeRun();
    pool.currentFrame++;
    return;
}

// adapted functions to work like lua script (from lua.js)

function mathRandom (min, max) {
    if ( isEmpty(min) ) {
        return Math.random();
    }
    if ( isEmpty(max) ) {
        max = min;
        min = 1;
    }
    return Math.floor(Math.random() * (max - min)) + min;
}

function isEmpty (foo) {
    return (foo == null); // should work for undefined as well
}

function getInputs () {
    var inputs = ActualInputs.slice();

/*        getPositions();

        var sprites = getSprites();

        var inputs = [];

        for (var dy=-BoxRadius*16; dy<=BoxRadius*16; dy+=16) {
                for (var dx=-BoxRadius*16; dx<=BoxRadius*16; dx+=16) {
                        inputs[inputs.length+0] = 0; // array bonds

                        tile = getTile(dx, dy);
                        if (tile == 1 && marioY+dy < 0x1B0) {
                                inputs[inputs.length-1] = 1; // array bonds
                        }

                        for (var i = 0; i<sprites.length; i++) { // array bonds
                                distx = Math.abs(sprites[i].x - (marioX+dx));
                                disty = Math.abs(sprites[i].y - (marioY+dy));
                                if (distx <= 8 && disty <= 8) {
                                        inputs[inputs.length-1] = -1; // array bonds
                                }
                        }
                }
        }*/

    return inputs;
}

function calculateNewInputs () {
    // grabs the current output and mix up with the inputs to see how many markedCells are there

    markedCells += 1; // dummy test
}
// */

var example = "3 5 1 6\nTTTTT\nTMMMT\nTTTTT\n";
var small = "6 7 1 5\nTMMMTTT\nMMMMTMM\nTTMTTMT\nTMMTMMM\nTTTTTTM\nTTTTTTM\n";

console.log( pizza(example) ); // 15
// console.log( pizza(small) ); // 42
