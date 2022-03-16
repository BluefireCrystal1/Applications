const { Client, Intents, Collection, MessageEmbed, GuildMember, MessageAttachment, Message, MessageActionRow, MessageButton } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS], partials: ["MESSAGE", "CHANNEL", "REACTION"] });
const fs = require('fs');
const mongoose = require('mongoose')
const appModel = require('./models/applicationSchema')
require('dotenv').config()
const discordModals = require('discord-modals');
discordModals(client);

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'apply') {
        if (interaction.member.permissions.has("ADMINISTRATOR")) {
            const e = new MessageEmbed()
                .setTitle("Error!")
                .setDescription("You already have admin!")
                .setColor("RED")
            interaction.reply({ embeds: [e], ephemeral: true })
        } else {
            userDB = await appModel.findOne({ appId: `BH-${interaction.member.id}` })
            if (userDB != null) {
                const e = new MessageEmbed()
                    .setTitle("LISTEN!")
                    .setDescription("You already have submitted this form.!")
                    .setColor("RED")
                return interaction.reply({ embeds: [e], ephemeral: true })
            }


            const { Modal, TextInputComponent, showModal } = require('discord-modals') // Modal class

            const modal = new Modal() // We create a Modal
                .setCustomId('app')
                .setTitle('Apply!')
                .addComponents([
                    new TextInputComponent()
                        .setCustomId('q1')
                        .setLabel('Q1: How are you going to handle the server?')
                        .setStyle('LONG')
                        .setMinLength(4)
                        .setMaxLength(600)
                        .setPlaceholder('Question 1 Answer here!')
                        .setRequired(true),
                    new TextInputComponent()
                        .setCustomId('q2')
                        .setLabel('Q2: What to do if someone spams?')
                        .setStyle('LONG')
                        .setMinLength(4)
                        .setMaxLength(600)
                        .setPlaceholder('Question 2 Answer here!')
                        .setRequired(true),
                    new TextInputComponent()
                        .setCustomId('q3')
                        .setLabel('Q3: What to do if someone abuses their mod?')
                        .setStyle('LONG')
                        .setMinLength(4)
                        .setMaxLength(600)
                        .setPlaceholder('Question 3 Answer here!')
                        .setRequired(true),
                    new TextInputComponent()
                        .setCustomId('q4')
                        .setLabel('Q4: Do you have experience?')
                        .setStyle('LONG')
                        .setMinLength(4)
                        .setMaxLength(600)
                        .setPlaceholder('Question 4 Answer here!')
                        .setRequired(true),
                    new TextInputComponent()
                        .setCustomId('q5')
                        .setLabel('Q5: Why do you want to be a staff?')
                        .setStyle('LONG')
                        .setMinLength(4)
                        .setMaxLength(600)
                        .setPlaceholder('Question 5 Answer here!')
                        .setRequired(true)
                ])


            showModal(modal, {
                client: client,
                interaction: interaction
            })
        }
    }
})

const { Formatters } = require('discord.js');

client.on('modalSubmit', async (modal) => {
    if (modal.customId === 'app') {
        const q1Response = modal.getTextInputValue('q1')
        const q2Response = modal.getTextInputValue('q2')
        const q3Response = modal.getTextInputValue('q3')
        const q4Response = modal.getTextInputValue('q4')
        const q5Response = modal.getTextInputValue('q5')
        const successEmbed = new MessageEmbed()
            .setTitle("Success!")
            .setDescription("Thanks for applying!") 
            .setColor("GREEN")
        modal.reply({ embeds: [successEmbed] })
        const modalMember = modal.member
        const embed = new MessageEmbed()
            .setAuthor({ name: modalMember.user.username, iconURL: modalMember.displayAvatarURL() })
            .setFields(
                { name: `Q1: How are you going to handle the server?`, value: Formatters.codeBlock('markdown', q1Response) },
                { name: `Q2: What are you going to do if someone spams?`, value: Formatters.codeBlock('markdown', q2Response) },
                { name: `Q3: What to do if someone abuses their mod?`, value: Formatters.codeBlock('markdown', q3Response) },
                { name: `Q4: Do you have experience?`, value: Formatters.codeBlock('markdown', q4Response) },
                { name: `Q5: Why do you want to be a staff?`, value: Formatters.codeBlock('markdown', q5Response) },
                { name: `Submitted by:`, value: `<@!${modalMember.id}>` }

            )
            .setColor('YELLOW')
            .setFooter({ text: `BH-${modalMember.id}` })
        await appModel.create({
            appId: `BH-${modalMember.id}`
        })
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('acceptApplication')
                    .setLabel("Accept")
                    .setStyle("SUCCESS"),
                new MessageButton()
                    .setCustomId('rejectApplication')
                    .setLabel("Reject")
                    .setStyle("DANGER")
            )
        const channel = modal.guild.channels.cache.get('952559127194910800')
        channel.send({ embeds: [embed], components: [row] })
    }
});
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === "acceptApplication") {
        if (interaction.message.embeds.length < 1) return interaction.deferUpdate();
        id = interaction.message.embeds[0].footer.text
        doc = await appModel.findOne({ appId: id })
        if (doc != undefined) {
            doc.pending = false
            doc.accepted = true
            await doc.save()
            embed = interaction.message.embeds[0]
            embed.color = "GREEN"
            interaction.message.edit({ embeds: [embed], components: [] })
            doc.deleteOne({ appId: id })
        }
    }
    if (interaction.customId === "rejectApplication") {
        if (interaction.message.embeds.length < 1) return interaction.deferUpdate();
        id = interaction.message.embeds[0].footer.text
        doc = await appModel.findOne({ appId: id })
        if (doc != null) {
            doc.pending = false
            doc.accepted = false
            await doc.save()
            embed = interaction.message.embeds[0]
            embed.color = "RED"
            interaction.message.edit({ embeds: [embed], components: [] })
            doc.deleteOne({ appId: id })
        }
    }
})

client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const commands = require(`./commands/${file}`);

    client.commands.set(commands.name, commands);
}

const prefix = "a$"

client.once('ready', async () => {
    mongoose.connect(process.env.mongoUrl,
        {
            keepAlive: true
        }).then(console.log("DB Connected!!"));
    console.log('Connected!')
    client.user.setActivity(`/apply`, { type: 'WATCHING' });

});
let collecting = false;
client.on('messageCreate', async message => {
    if (message.author === client.user) return;
});


client.login(process.env.TOKEN); 