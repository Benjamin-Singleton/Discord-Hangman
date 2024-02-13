const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const randomWords = require("random-words");
const alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]


module.exports = {
    cooldown: 60,
    data: new SlashCommandBuilder()
        .setName('hangman')
            .setDescription('Starts a game of hangman'),
        /**
         * @param {Object} param0
         * @param {import('discord.js').ChatInputCommandInteraction} param0.interaction 
         */
        async execute(interaction) {
            await interaction.deferReply();
            
            let guessWord = randomWords({ exactly: 1 }).pop();
            console.log(guessWord)
            
            let game = {
                gallow: initaliseGallow(),
                word: guessWord,
                lives: 6,
                progress: setProgressHyphens(guessWord),
                misses: [],
            };
            
            const collector = interaction.channel.createMessageCollector({ 
                filter: (message) => message.author.id != 1205189379140882464 && message.mentions.has('1205189379140882464'),
                time: 900_000 
            })
            
            let finished = false;
            let gameEmbed = constructEmbed(game, "", 1);
            await interaction.editReply({ embeds:[gameEmbed], fetchReply: true })




            collector.on('collect', (message) => {
                // If guess is in current misses
                if (game.misses.includes(message.content.toLowerCase())) {                              
                    message.reply("This letter has already been guessed, please try another letter.")


                } else if (game.progress.includes(message.content.toLowerCase())) {
                    message.reply("This letter has already been guessed correctly, please try another letter.")

                // If guess is in alphabet array
                // and not in current misses
                } else if (alphabet.includes(message.content.toLowerCase()) && !(game.misses.includes(message.content.toLowerCase()))) {    
                    gameEmbed = constructEmbed(game, message, 0)                                                                            
                    message.channel.send({ embeds: [gameEmbed], fetchReply: true})

                // If guess is correct word
                } else if (message.content.toLowerCase() == game.word) {                                            
                    finished = true;
                    message.reply(`Correct word guessed! Congratulations ${message.author.username}, you win!`)
                    collector.stop()
                } else if ((!(alphabet.includes(message.content.toLowerCase())) && message.content.toLowerCase() != game.word) && message.content.length < game.word.length) {
                    message.reply(`This word is shorter than the correct word, try guessing a word ${game.word.length} letters long`)
                }
                // If guess isn't in alphabet array
                // and not the correct word
                else if (!(alphabet.includes(message.content.toLowerCase())) && message.content.toLowerCase() != game.word) {   
                    game.lives -= 1;                                                                                                               
                    const gameEmbed = new EmbedBuilder()
                    .setTitle('Hangman')
                    .setDescription(`${displayGallow(game.lives, game.gallow)}`)
                    .setAuthor({ name: 'hangmanbot' })
                    .addFields({
                        name: `${livesToHeartEmojis(game.lives).join(' ')}`,
                        value: `Misses: ${game.misses}`
                    }, {
                        name: `=====================`,
                        value: `Progress: ${game.progress.join(' ')}`
                    })
                    message.channel.send({ embeds: [gameEmbed], fetchReply: true })
                    message.reply("Incorrect word guessed.");
                    
                } 

                if (game.lives === 0) {
                    collector.stop()
                    interaction.channel.send(`Game Over: Out of lives! The word was: ${game.word}`);
                }

                if (getProgressHyphens(game.progress) == 0) {
                    finished = true;
                    collector.stop()
                    interaction.channel.send(`Progress complete! the word was: ${game.word}`);
                } 
            })

            collector.on('end', () => {
                if (game.lives === 0) {
                    console.log("Game ended due to lives");
                } else if (!(finished)) {
                    interaction.channel.send("Game Over: Time ran out")
                }
            })
        }
}

function initaliseGallow() {
    const gallow = [
        ["+","-","-","-","-","-","-","-","-"],
        ["|","/","ㅤ","ㅤ","ㅤ","|"],
        ["|","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ"],
        ["|","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ"],
        ["|","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ"],    
        ["|","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ"],    
        ["|","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ"],
        ["|","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ","ㅤ"],
        ["=","=","=","=","=","=","=","=","=","=","=","="]
    ];
    return gallow;
}

function constructEmbed(game, message, initial) {
    // For initial embed
    if (initial == 1) { 
        const gameEmbed = new EmbedBuilder()
        .setTitle('Hangman')
        .setDescription(`${displayGallow(game.lives, game.gallow)}`)
        .setAuthor({ name: 'hangmanbot' })
        .addFields({
            name: `${livesToHeartEmojis(game.lives).join(' ')}`,
            value: `Incorrect guesses: ${game.misses}`
        }, {
            name: `=====================`,
            value: `Progress: ${game.progress.join(' ')}`
        })
        return gameEmbed;
    // If guess letter is in game word, and the alphabet includes it (so that partial word guesses wont be picked up, 
    // e.g. guessing 'be' when the word is 'believe') add correct letter to progress
    } else if (game.word.includes(message.content.toLowerCase()) && alphabet.includes(message.content.toLowerCase())) {
        game.progress = correctLetterGuess(game.word, game.progress, message.content.toLowerCase())
        const gameEmbed = new EmbedBuilder()
        .setTitle('Hangman')
        .setDescription(`${displayGallow(game.lives, game.gallow)}`)
        .setAuthor({ name: 'hangmanbot' })
        .addFields({
            name: `${livesToHeartEmojis(game.lives).join(' ')}`,
            value: `Misses: ${game.misses}`
        }, {
            name: `=====================`,
            value: `Progress: ${game.progress.join(' ')}`
        })
        return gameEmbed;
    // If guess letter is not in the word, but is in the alphabet, to check to see if an incorrect guess has been made
    } else if (!game.word.includes(message.content.toLowerCase()) && alphabet.includes(message.content.toLowerCase())) {
        game.misses, game.lives = incorrectLetterGuess(game.misses, game.lives, message.content.toLowerCase())
        const gameEmbed = new EmbedBuilder()
        .setTitle('Hangman')
        .setDescription(`${displayGallow(game.lives, game.gallow)}`)
        .setAuthor({ name: 'hangmanbot' })
        .addFields({
            name: `${livesToHeartEmojis(game.lives).join(' ')}`,
            value: `Misses: ${game.misses}`
        }, {
            name: `=====================`,
            value: `Progress: ${game.progress.join(' ')}`
        })
        return gameEmbed;
    }
}

function displayGallow(lives, gallow) {
    gallow = livesToHangedMan(lives, gallow);
    console.log
    const gallowStr = gallow.map(row => row.join('')).join('\n');
    return gallowStr;
}

function correctLetterGuess(word, progress, letter) {
    for (i in word) {
        if (word.charAt(i) == letter) {
            progress[i] = letter;
        }
    }
    return progress;
}

function incorrectLetterGuess(misses, lives, letter) {
    lives -= 1;
    misses.push(letter);
    return misses, lives;
}

function setProgressHyphens(word) {
    let hyphens = []
    for (i in word) {
        hyphens.push("-");
    }
    return hyphens;
}

function getProgressHyphens(progress) {
    let hyphens = 0;
    for (i in progress) {
        if (progress[i] == "-") {
            hyphens += 1
        }
    }
    return hyphens;
}

function livesToHeartEmojis(currentLives) {
    let heartArray = [];
    for (let i = 0; i < currentLives; i++) {
        heartArray[i] = '❤️';
    }
    for (let j = currentLives; j < 6; j++) {
        heartArray[j] = '🖤';
    }
    return heartArray;
}

function livesToHangedMan(currentLives, gallow) {
    switch(currentLives) {
        case 6:
            return gallow;
        case 5:
            gallow[2][4] = "🥲";
            return gallow;
        case 4:
            gallow[3][4] = "/";
            return gallow;
        case 3:
            gallow[3][5] = "|";
            return gallow;
        case 2:
            gallow[3][6] = "\\\\";
            return gallow;
        case 1:
            gallow[4][4] = "/";
            return gallow;
        case 0:
            gallow[4][5] = "\\\\";
        default:
            return gallow;
    }
}


